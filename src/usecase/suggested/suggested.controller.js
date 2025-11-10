import prisma from "../../prisma/client.js";

export const SuggestedController = {
    async getAll(req, res) {
        try {
            const data = await prisma.suggestedProduct.findMany({
                where: { isActive: true },
                include: {
                    product: {
                        include: { images: true },
                    },
                },

                orderBy: { position: "asc" },
            });
            res.json({ status: "success", data });
        } catch (err) {
            console.error("❌ Get suggested error:", err);
            res.status(500).json({ message: err.message });
        }
    },

    async create(req, res) {
        try {
            const { productId } = req.body;

            const count = await prisma.suggestedProduct.count();
            if (count >= 4) {
                return res.status(400).json({ message: "Max 4 suggested products allowed" });
            }

            const exists = await prisma.suggestedProduct.findFirst({ where: { productId } });
            if (exists)
                return res.status(400).json({ message: "Product already suggested" });

            const item = await prisma.suggestedProduct.create({
                data: {
                    productId,
                    position: count + 1,
                    isActive: true,
                },
            });

            res.status(201).json({ status: "success", data: item });
        } catch (err) {
            res.status(400).json({ message: err.message });
        }
    },


    async remove(req, res) {
        try {
            const id = req.params.id;
            await prisma.suggestedProduct.delete({ where: { id } });

            const all = await prisma.suggestedProduct.findMany({
                orderBy: { position: "asc" },
            });
            for (let i = 0; i < all.length; i++) {
                await prisma.suggestedProduct.update({
                    where: { id: all[i].id },
                    data: { position: i + 1 },
                });
            }

            res.json({ status: "success", message: "Deleted and reordered" });
        } catch (err) {
            console.error("❌ Delete suggested error:", err);
            res.status(404).json({ message: err.message });
        }
    },

    async reorder(req, res) {
        const { items } = req.body;
        if (!items || !Array.isArray(items)) {
            return res.status(400).json({ message: "Invalid payload" });
        }

        try {
            const updates = await Promise.all(
                items.map((item) =>
                    prisma.suggestedProduct.update({
                        where: { id: item.id },
                        data: { position: item.position },
                    })
                )
            );

            res.json({
                status: "success",
                message: "Reorder saved",
                updated: updates.length,
            });
        } catch (err) {
            console.error("❌ Reorder error:", err);
            res.status(500).json({ message: err.message });
        }
    },
};
