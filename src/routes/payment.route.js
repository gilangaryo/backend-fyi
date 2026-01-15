import express from "express";
import * as PaymentController from "../usecase/payment/payment.controller.js";

const router = express.Router();

// ✅ GET /api/payments/session/:referenceId
router.get("/session/:referenceId", PaymentController.getPaymentSession);
export default router;
