import * as PaymentRepository from "./payment.repository.js";
import prisma from "../../prisma/client.js";

const UUID_REGEX =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isUuid(value) {
    return UUID_REGEX.test(value);
}

const paymentInclude = {
    order: {
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
                        },
                    },
                },
            },
        },
    },
};

async function findPaymentByReferenceOrOrderId(referenceId) {
    let payment = await prisma.payment.findUnique({
        where: { referenceId },
        include: paymentInclude,
    });

    if (!payment && isUuid(referenceId)) {
        payment = await prisma.payment.findFirst({
            where: { orderId: referenceId },
            orderBy: { createdAt: "desc" },
            include: paymentInclude,
        });
    }

    return payment;
}

function buildNormalizedResponse(payment, extra = {}) {
    const amount = Number(payment.amount);

    return {
        provider: payment.provider?.toLowerCase() || "unknown",
        payment: {
            status: payment.status,
            referenceId: payment.referenceId,
            paymentUrl: payment.paymentLinkUrl,
            expiredAt: payment.expiredAt,
            amount,
        },
        order: payment.order,
        session: {
            status: payment.status,
            amount,
        },
        ...extra,
    };
}

export const getPaymentSession = async (referenceId) => {
    if (!referenceId) throw new Error("referenceId is required");

    console.log("🟢 Fetching payment for reference:", referenceId);

    const payment = await findPaymentByReferenceOrOrderId(referenceId);

    if (!payment) {
        throw new Error("Payment not found");
    }

    if (payment.provider === "MIDTRANS") {
        return buildNormalizedResponse(payment);
    }

    if (payment.provider === "XENDIT") {
        const session = await PaymentRepository.fetchXenditSession(
            payment.paymentRequestId,
        );

        let paymentDetail = null;
        if (session.payment_id) {
            paymentDetail = await PaymentRepository.fetchXenditPayment(
                session.payment_id,
            );
        }

        return buildNormalizedResponse(payment, {
            xenditSession: session,
            xenditPayment: paymentDetail,
        });
    }

    throw new Error("Unsupported payment provider");
};
