import { createXenditPayment } from "./xendit.js";
import { createMidtransPayment } from "./midtrans.js";

export async function createPayment({
    provider,
    order,
    basket,
    user,
    amount,
    discount,
    shippingCost,
}) {
    switch (provider) {
        case "midtrans":
            return createMidtransPayment({
                order,
                basket,
                user,
                amount,
                shippingCost,
            });

        case "xendit":
        default:
            return createXenditPayment({
                order,
                basket,
                user,
                amount,
                discount,
                shippingCost,
            });
    }
}
