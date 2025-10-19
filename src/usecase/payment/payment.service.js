import * as PaymentRepository from "./payment.repository.js";
import prisma from "../../prisma/client.js";


export const getPaymentSession = async (order_id) => {
    if (!order_id) throw new Error("order_id is required");
    console.log("🟢 Fetching payment for order:", order_id);

    const orderData = await prisma.order.findUnique({
        where: { id: order_id },
        select: { id: true, xenditPaymentId: true, status: true },
    });

    if (!orderData?.xenditPaymentId) {
        throw new Error("No Xendit session found for this order");
    }

    const session_id = orderData.xenditPaymentId;

    const session = await PaymentRepository.fetchXenditSession(session_id);
    if (!session) throw new Error("Payment session not found");
    console.log("session", session);

    let payment = null;
    if (session.payment_id) {
        payment = await PaymentRepository.fetchXenditPayment(session.payment_id);
    }

    const order = await prisma.order.findFirst({
        where: { referenceId: session.reference_id },
        include: {
            user: { select: { name: true, email: true, phone: true } },
            items: {
                include: {
                    product: {
                        select: {
                            id: true,
                            title: true,
                            imageUrl: true,
                            price: true,
                            category: { select: { title: true } },
                        },
                    },
                },
            },
        },
    });

    // if (payment?.status === "SUCCEEDED" && order?.status !== "PAID") {
    //     await prisma.order.update({
    //         where: { id: order.id },
    //         data: { status: "NEW" },
    //     });
    // }

    return {
        session: {
            id: session.payment_session_id,
            status: session.status,
            amount: session.amount,
            payment_id: session.payment_id,
            success_return_url: session.success_return_url,
            created: session.created,
            updated: session.updated,
        },
        payment: payment
            ? {
                id: payment.payment_id,
                status: payment.status,
                method: payment.payment_method || payment.type,
                channel: payment.channel_code,
                paid_at:
                    payment.captures?.[0]?.capture_timestamp ||
                    payment.updated ||
                    null,
                captures: payment.captures || [],
            }
            : null,
        order,
    };
};
