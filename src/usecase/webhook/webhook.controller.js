import {
    processPaymentCompleted,
    processPaymentExpired,
} from "./webhook.service.js";

export async function handlePaymentCompletedWebhook(req, res) {
    try {
        const rawBody = req.body;
        const signature = req.headers["x-callback-token"];
        console.log(rawBody, signature);

        if (rawBody.event === "payment_session.completed") {
            const result = await processPaymentCompleted(rawBody, signature);

            return res.status(200).json({
                success: true,
                message: "Completed processed",
                result,
            });
        } else {
            return res.status(200).json({
                success: true,
                message: `Event ${rawBody.event} 
                skipped`,
            });
        }
    } catch (err) {
        console.error("❌ Error processing completed webhook:", err.message);
        res.status(500).json({ success: false, message: err.message });
    }
}

export async function handlePaymentExpiredWebhook(req, res) {
    try {
        const rawBody = req.body;
        const signature = req.headers["x-callback-token"];
        const result = await processPaymentExpired(rawBody, signature);
        res.status(200).json({
            success: true,
            message: "Expired webhook processed",
            result,
        });
    } catch (err) {
        console.error("❌ Error processing expired webhook:", err.message);
        res.status(500).json({ success: false, message: err.message });
    }
}
