import prisma from '../../prisma/client.js'

export async function findPaymentByXenditId(paymentRequestId) {
    return prisma.payment.findFirst({
        where: { paymentRequestId },
    })
}
export async function findPaymentByReferenceId(referenceId) {
    return prisma.payment.findFirst({
        where: { referenceId: referenceId },
    })
}

export async function updatePaymentStatusByXenditId(payment_session_id, status) {
    return prisma.payment.updateMany({
        where: { paymentRequestId: payment_session_id },
        data: { status },
    })
}
