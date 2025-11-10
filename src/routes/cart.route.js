import express from 'express';
import prisma from '../prisma/client.js'

const router = express.Router();

router.post("/validate", async (req, res) => {
    try {
        const { items } = req.body;
        console.log(items);
        if (!items?.length)
            return res
                .status(400)
                .json({ success: false, message: "Empty cart" });

        const variants = await prisma.productVariant.findMany({
            where: { id: { in: items.map((i) => i.variantId) } },
            select: {
                id: true,
                stock: true,
                size: true,
                product: {
                    select: { id: true, title: true, status: true },
                },
            },
        });

        const check = await prisma.productVariant.findUnique({
            where: { id: '9fe57015-5073-45f6-81b2-146884d66c13' },
        });
        console.log(check);
        console.log("variantttttt", variants);


        const invalid = [];

        for (const item of items) {

            const variant = variants.find((v) => v.id === item.variantId);

            if (!variant) {
                invalid.push({
                    variantId: item.variantId,
                    productName: "Variant not found",
                    reason: "VARIANT_NOT_FOUND",
                });
                continue;
            }

            if (!variant.product?.status) {
                invalid.push({
                    variantId: item.variantId,
                    productName: variant.product?.title || "Product inactive",
                    reason: "PRODUCT_INACTIVE",
                });
                continue;
            }

            // Kasus 3: stok tidak cukup
            if (variant.stock < item.quantity) {
                invalid.push({
                    variantId: item.variantId,
                    productName: `${variant.product?.title || "Product"} (${variant.size || "-"
                        }) Out of stock`,
                    reason: "OUT_OF_STOCK",
                });
            }
        }

        return res.json({
            success: true,
            invalid,
        });
    } catch (err) {
        console.error("❌ Error validating cart:", err);
        return res.status(500).json({
            success: false,
            message: "Error validating cart",
        });
    }
});



export default router;