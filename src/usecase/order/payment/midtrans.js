import midtransClient from "midtrans-client";

export async function createMidtransPayment({ order, basket, user, amount }) {
    const snap = new midtransClient.Snap({
        isProduction: process.env.MIDTRANS_IS_PRODUCTION === "true",
        serverKey: process.env.MIDTRANS_SERVER_KEY,
    });

    const transaction = {
        transaction_details: {
            order_id: `FYI-${Date.now()}`,
            gross_amount: Math.round(amount),
        },
        item_details: [
            ...basket.map((b) => ({
                id: b.variantId,
                price: Math.round(b.product.price),
                quantity: b.quantity,
                name: b.product.title.substring(0, 50),
            })),
            {
                id: "shipping",
                price: 0,
                quantity: 1,
                name: "Shipping (FREE)",
            },
        ],
        customer_details: {
            first_name: user.name,
            email: user.email,
            phone: user.phone,
        },
        callbacks: {
            finish: `${process.env.FRONTEND_URL}/success?order_id=${order.id}`,
        },
    };

    const transactionRes = await snap.createTransaction(transaction);

    return {
        provider: "midtrans",
        referenceId: transaction.transaction_details.order_id,
        paymentId: transactionRes.token,
        paymentUrl: transactionRes.redirect_url,
        expiredAt: null,
    };
}
