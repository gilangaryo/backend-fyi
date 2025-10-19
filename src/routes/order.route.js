import express from "express";
import * as OrderController from "../usecase/order/order.controller.js";
import * as PaymentController from "../usecase/payment/payment.controller.js";

const router = express.Router();


router.post("/", OrderController.createOrder);
router.get("/", OrderController.getAllOrders);
router.get("/:id", OrderController.getOrderById);
router.get("/session/:order_id", PaymentController.getPaymentSession);

export default router;

