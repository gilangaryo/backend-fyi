import * as PaymentService from "./payment.service.js";

export const getPaymentSession = async (req, res) => {
    try {
        const { referenceId } = req.params;

        const result = await PaymentService.getPaymentSession(referenceId);

        res.json({
            success: true,
            data: result,
        });
    } catch (err) {
        console.error("❌ Error getPaymentSession:", err);
        res.status(500).json({
            success: false,
            message: err.message,
        });
    }
};
