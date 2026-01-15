import crypto from "crypto";
import prisma from "../../prisma/client.js";

export async function midtransWebhook(req, res) {
    try {
        const payload = req.body;

        const {
            order_id,
            transaction_status,
            status_code,
            gross_amount,
            signature_key,
        } = payload;

        // 🔐 VERIFY SIGNATURE
        const serverKey = process.env.MIDTRANS_SERVER_KEY;
        const hash = crypto
            .createHash("sha512")
            .update(order_id + status_code + gross_amount + serverKey)
            .digest("hex");

        if (hash !== signature_key) {
            console.error("❌ Invalid Midtrans signature");
            return res.status(403).json({ message: "Invalid signature" });
        }

        console.log("✅ Midtrans webhook verified:", transaction_status);

        // 🔎 Find payment
        const payment = await prisma.payment.findFirst({
            where: { referenceId: order_id },
            include: { order: true },
        });

        if (!payment) {
            console.error("❌ Payment not found:", order_id);
            return res.status(404).json({ message: "Payment not found" });
        }

        // ================= STATUS HANDLING =================

        if (
            transaction_status === "settlement" ||
            transaction_status === "capture"
        ) {
            const order = payment.order;

            await prisma.$transaction(async (tx) => {
                // 1️⃣ Update payment
                await tx.payment.update({
                    where: { id: payment.id },
                    data: { status: "PAID" },
                });

                // 2️⃣ Update order
                await tx.order.update({
                    where: { id: order.id },
                    data: { status: "NEW" },
                });

                // 3️⃣ Log status
                await tx.orderStatusLog.create({
                    data: {
                        orderId: order.id,
                        status: "NEW",
                    },
                });

                // 4️⃣ 🔥 DECREMENT STOCK (INI YANG HILANG)
                const items = await tx.orderItem.findMany({
                    where: { orderId: order.id },
                });

                for (const item of items) {
                    if (item.variantId) {
                        await tx.productVariant.update({
                            where: { id: item.variantId },
                            data: { stock: { decrement: item.quantity } },
                        });
                    }

                    if (item.productId) {
                        await tx.product.update({
                            where: { id: item.productId },
                            data: { stock: { decrement: item.quantity } },
                        });
                    }
                }
            });
        }

        // ❌ PAYMENT FAILED
        if (
            transaction_status === "expire" ||
            transaction_status === "cancel" ||
            transaction_status === "deny"
        ) {
            await prisma.payment.update({
                where: { id: payment.id },
                data: { status: "FAILED" },
            });

            await prisma.order.update({
                where: { id: payment.orderId },
                data: { status: "EXPIRED" },
            });
        }

        return res.status(200).json({ received: true });
    } catch (error) {
        console.error("❌ Midtrans webhook error:", error);
        return res.status(500).json({ message: "Webhook error" });
    }
}
