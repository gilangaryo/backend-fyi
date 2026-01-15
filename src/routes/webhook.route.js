import { Router } from "express";
import express from "express";
import {
    handlePaymentCompletedWebhook,
    handlePaymentExpiredWebhook,
} from "../usecase/webhook/webhook.controller.js";
import { midtransWebhook } from "../usecase/webhook/midtrans.webhook.js";

const router = Router();

router.post("/", (req, res) => {
    console.log("⚠️ Received webhook");
    res.status(200).json({ success: true, message: "Webhook received" });
});

router.post("/midtrans", midtransWebhook);

router.post(
    "/completed",
    express.raw({ type: "application/json" }),
    handlePaymentCompletedWebhook
);

router.post(
    "/expired",
    express.raw({ type: "application/json" }),
    handlePaymentExpiredWebhook
);
router.post(
    "/capture",
    express.raw({ type: "application/json" }),
    (req, res) => {
        console.log("⚠️ Received payment.capture webhook");
        res.status(200).json({ success: true, message: "Capture " });
    }
);

export default router;
