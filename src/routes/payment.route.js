import express from "express";
import * as PaymentController from "../usecase/payment/payment.controller.js";

const router = express.Router();

// ✅ GET /api/payments/session/:session_id
router.get("/session/:session_id", PaymentController.getPaymentSession);

export default router;
