import { discountService } from "./discount.service.js";

export const discountController = {
    async getAll(req, res, next) {
        try {
            const discounts = await discountService.getAllDiscounts();
            res.json({
                success: true,
                data: discounts,
            });
        } catch (err) {
            next(err);
        }
    },

    async getById(req, res, next) {
        try {
            const { id } = req.params;
            const discount = await discountService.getDiscountById(id);
            res.json({
                success: true,
                data: discount,
            });
        } catch (err) {
            next(err);
        }
    },

    async getByCode(req, res, next) {
        try {
            const { code } = req.params;
            const discount = await discountService.getDiscountByCode(code);
            res.json({
                success: true,
                data: discount,
            });
        } catch (err) {
            next(err);
        }
    },

    async create(req, res, next) {
        try {
            const discount = await discountService.createDiscount(req.body);
            res.status(201).json({
                success: true,
                message: "Discount created successfully",
                data: discount,
            });
        } catch (err) {
            next(err);
        }
    },

    async update(req, res, next) {
        try {
            const { id } = req.params;
            const discount = await discountService.updateDiscount(id, req.body);
            res.json({
                success: true,
                message: "Discount updated successfully",
                data: discount,
            });
        } catch (err) {
            next(err);
        }
    },

    async delete(req, res, next) {
        try {
            const { id } = req.params;
            await discountService.deleteDiscount(id);
            res.json({
                success: true,
                message: "Discount archived successfully",
            });
        } catch (err) {
            next(err);
        }
    },

    async available(req, res, next) {
        try {
            const { items } = req.body;

            if (!items?.length) {
                return res.status(400).json({
                    success: false,
                    message: "Missing required field: items",
                });
            }

            const eligible = await discountService.availableForCart({ items });
            res.json({ success: true, data: eligible });
        } catch (err) {
            next(err);
        }
    },

    async validate(req, res, next) {
        try {
            const { code, codes, discountId, discountIds, items, autoApply } =
                req.body;

            if (!items?.length) {
                return res.status(400).json({
                    success: false,
                    message: "Missing required field: items",
                });
            }

            const result = await discountService.validateDiscount({
                code,
                codes,
                ids: [discountId, ...(discountIds || [])].filter(Boolean),
                items,
                autoApply: Boolean(autoApply),
            });

            if (!result.valid) {
                return res.status(400).json({
                    success: false,
                    message: result.message,
                    data: {
                        invalid: result.invalid || [],
                        pricing: result.pricing || null,
                    },
                });
            }

            res.json({
                success: true,
                message: result.message,
                data: result.pricing,
            });
        } catch (err) {
            next(err);
        }
    },

    async updateStatus(req, res, next) {
        try {
            const { id } = req.params;
            const { status } = req.body;

            const updated = await discountService.updateStatus(id, status);

            res.json({
                success: true,
                message: "Status updated successfully",
                data: updated,
            });
        } catch (err) {
            next(err);
        }
    },
};
