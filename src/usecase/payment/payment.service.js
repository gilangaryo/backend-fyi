import * as PaymentRepository from "./payment.repository.js";
import prisma from "../../prisma/client.js";

export const getPaymentSession = async (referenceId) => {
    if (!referenceId) throw new Error("referenceId is required");

    console.log("🟢 Fetching payment for reference:", referenceId);

    const payment = await prisma.payment.findUnique({
        where: { referenceId },
        include: {
            order: {
                include: {
                    user: { select: { name: true, email: true, phone: true } },
                    items: {
                        include: {
                            product: {
                                select: {
                                    title: true,
                                    imageUrl: true,
                                    price: true,
                                },
                            },
                        },
                    },
                },
            },
        },
    });

    if (!payment) {
        throw new Error("Payment not found");
    }

    // ================= MIDTRANS =================
    if (payment.provider === "MIDTRANS") {
        return {
            provider: "midtrans",
            payment: {
                referenceId: payment.referenceId,
                status: payment.status,
                paymentUrl: payment.paymentLinkUrl,
            },
            order: payment.order,
        };
    }

    // ================= XENDIT =================
    if (payment.provider === "XENDIT") {
        const session = await fetchXenditSession(payment.paymentRequestId);

        let paymentDetail = null;
        if (session.payment_id) {
            paymentDetail = await fetchXenditPayment(session.payment_id);
        }

        return {
            provider: "xendit",
            session,
            payment: paymentDetail,
            order: payment.order,
        };
    }

    throw new Error("Unsupported payment provider");
};
