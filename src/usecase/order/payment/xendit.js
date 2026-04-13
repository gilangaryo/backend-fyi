import fetch from "node-fetch";
import { v4 as uuid } from "uuid";

const CART_LEVEL_PROMOTION_KINDS = [
    "MINIMUM_PURCHASE_DISCOUNT",
    "MINIMUM_QTY_DISCOUNT",
];

function isCartLevelPromotion(promotion) {
    return CART_LEVEL_PROMOTION_KINDS.includes(promotion?.kind);
}

export async function createXenditPayment({
    order,
    basket,
    user,
    amount,
    promotions,
    shippingCost,
}) {
    const paymentRef = `order_${order.id}`;

    const items = basket.map((b) => ({
        type: "PHYSICAL_PRODUCT",
        reference_id: b.variantId,
        name: b.product.title,
        net_unit_amount: Number(
            b.effectiveUnitPrice ?? b.baseUnitPrice ?? b.product.price,
        ),
        quantity: b.quantity,
    }));

    for (const promotion of promotions || []) {
        if (promotion.amount <= 0) continue;
        if (!isCartLevelPromotion(promotion)) continue;

        items.push({
            type: "FEE",
            reference_id: `discount_${promotion.code}`,
            name: `Discount ${promotion.code}`,
            net_unit_amount: -promotion.amount,
            quantity: 1,
        });
    }

    const payload = {
        reference_id: paymentRef,
        session_type: "PAY",
        mode: "PAYMENT_LINK",
        amount,
        currency: "IDR",
        country: "ID",
        items,
        customer: {
            reference_id: uuid(),
            type: "INDIVIDUAL",
            email: user.email,
            mobile_number: user.phone,
            individual_detail: { given_names: user.name },
        },
        success_return_url: `${process.env.FRONTEND_URL}/success?order_id=${order.id}`,
        cancel_return_url: `${process.env.FRONTEND_URL}/cancel`,
    };

    const res = await fetch("https://api.xendit.co/sessions", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization:
                "Basic " +
                Buffer.from(process.env.XENDIT_SECRET_KEY + ":").toString(
                    "base64",
                ),
        },
        body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message);

    return {
        provider: "xendit",
        referenceId: paymentRef,
        paymentId: data.payment_session_id,
        paymentUrl: data.payment_link_url,
        expiredAt: data.expires_at,
    };
}
