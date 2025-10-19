import * as PaymentService from "./payment.service.js";

export const getPaymentSession = async (req, res) => {
    try {
        const { order_id } = req.params;
        const result = await PaymentService.getPaymentSession(order_id);

        res.status(200).json({
            success: true,
            message: "Payment session fetched successfully",
            data: result,
        });
    } catch (err) {
        console.error("❌ Error getPaymentSession:", err);
        res.status(500).json({
            success: false,
            message: err.message || "Internal server error",
        });
    }
};
