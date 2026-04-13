import midtransClient from "midtrans-client";

const CART_LEVEL_PROMOTION_KINDS = [
    "MINIMUM_PURCHASE_DISCOUNT",
    "MINIMUM_QTY_DISCOUNT",
];

function isCartLevelPromotion(promotion) {
    return CART_LEVEL_PROMOTION_KINDS.includes(promotion?.kind);
}

function buildMidtransItemDetails({ basket, promotions }) {
    return [
        ...basket.map((item) => ({
            id: item.variantId,
            price: Math.round(
                item.effectiveUnitPrice ??
                    item.baseUnitPrice ??
                    item.product.price,
            ),
            quantity: item.quantity,
            name: item.product.title.substring(0, 50),
        })),
        ...(promotions || [])
            .filter(
                (promotion) =>
                    Number(promotion.amount) > 0 &&
                    isCartLevelPromotion(promotion),
            )
            .map((promotion) => ({
                id: `promo-${promotion.code || promotion.id}`.substring(0, 50),
                price: -Math.round(promotion.amount),
                quantity: 1,
                name: `Diskon: ${promotion.title || promotion.code || promotion.id}`.substring(
                    0,
                    50,
                ),
            })),
        {
            id: "shipping",
            price: 0,
            quantity: 1,
            name: "Shipping (FREE)",
        },
    ];
}

function calculateGrossAmount(itemDetails) {
    return itemDetails.reduce(
        (sum, item) => sum + Math.round(item.price) * item.quantity,
        0,
    );
}

export async function createMidtransPayment({
    order,
    basket,
    user,
    promotions,
}) {
    const snap = new midtransClient.Snap({
        isProduction: process.env.MIDTRANS_IS_PRODUCTION === "true",
        serverKey: process.env.MIDTRANS_SERVER_KEY,
    });

    const itemDetails = buildMidtransItemDetails({
        basket,
        promotions,
    });
    const grossAmount = calculateGrossAmount(itemDetails);

    if (grossAmount <= 0) {
        throw new Error("Invalid payable amount for Midtrans transaction");
    }

    const transaction = {
        transaction_details: {
            order_id: `FYI-${Date.now()}`,
            gross_amount: grossAmount,
        },
        item_details: itemDetails,
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
