import express from "express";
import { previewPromotions } from "../lib/promo-engine/promo-engine.js";

const router = express.Router();

router.post("/validate", async (req, res) => {
    try {
        const { items, code, codes, discountId, discountIds } = req.body;

        const preview = await previewPromotions({
            items,
            codes: [code, ...(codes || [])].filter(Boolean),
            ids: [discountId, ...(discountIds || [])].filter(Boolean),
        });

        return res.json({
            success: preview.valid,
            invalid: preview.invalid,
            pricing: preview.pricing,
        });
    } catch (err) {
        console.error("❌ Error validating cart:", err);
        return res.status(500).json({
            success: false,
            message: err.message || "Error validating cart",
        });
    }
});

export default router;
