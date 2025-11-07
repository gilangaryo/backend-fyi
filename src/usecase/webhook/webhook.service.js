import {
    updatePaymentStatusByXenditId,
    findPaymentByXenditId,
    findPaymentByReferenceId
} from './webhook.repository.js'

import { sendEmail } from '../../lib/mailer.js'
import { paymentSuccessTemplate } from '../../lib/templates/paymentSuccess.js'
// import { adminPaymentTemplate } from '../../lib/templates/adminPayment.js'

import prisma from '../../prisma/client.js'

export async function processPaymentCompleted(payload, token) {
    verifyWebhookToken(token)

    const session = payload.data
    const payment_session_id = session.payment_session_id
    const status = 'COMPLETED'

    if (!payment_session_id) throw new Error('Missing payment_session_id in webhook')

    const existing = await findPaymentByXenditId(payment_session_id)
    if (!existing) throw new Error('Payment not found for this webhook')

    await updatePaymentStatusByXenditId(payment_session_id, 'PAID')

    //  Update order status
    const order = await prisma.order.update({
        where: { id: existing.orderId },
        data: { status: 'NEW' },
        include: {
            user: true,
            items: {
                include: {
                    product: true,
                    variant: true,
                },
            },
        },
    });

    await Promise.all(
        order.items.map(async (item) => {
            if (item.variantId) {
                await prisma.productVariant.update({
                    where: { id: item.variantId },
                    data: { stock: { decrement: item.quantity } },
                });
                await prisma.product.update({
                    where: { id: item.productId },
                    data: { stock: { decrement: item.quantity } },
                });
            } else {
                await prisma.product.update({
                    where: { id: item.productId },
                    data: { stock: { decrement: item.quantity } },
                });
            }
        })
    );

    // Kirim email ke user
    await sendEmail({
        to: order.user.email,
        subject: `Pembayaran Berhasil — Order #${order.id}`,
        html: paymentSuccessTemplate(order, existing),
    })

    // Kirim email ke admin
    // await sendEmail({
    //     to: process.env.ADMIN_EMAIL || 'owner@fyi.com',
    //     subject: `Payment received for Order #${order.id}`,
    //     html: adminPaymentTemplate(order, existing),
    // })

    return { referenceId: existing.referenceId, status }
}

export async function processPaymentExpired(payload, token) {
    verifyWebhookToken(token)

    const reference_id = payload.data.reference_id
    const existing = await findPaymentByReferenceId(reference_id)

    if (!existing) throw new Error('Payment not found for this webhook')

    await updatePaymentStatusByXenditId(existing.paymentRequestId, 'EXPIRED')

    await prisma.order.update({
        where: { id: existing.orderId },
        data: { status: 'CANCELLED' },
    })

    return { referenceId: existing.referenceId, status: 'EXPIRED' }
}

function verifyWebhookToken(token) {
    const expected = process.env.XENDIT_WEBHOOK_TOKEN
    if (expected && token !== expected) throw new Error('Invalid webhook token')
}
