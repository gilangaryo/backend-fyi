import { discountRepository } from "./discount.repository.js";
import prisma from "../../prisma/client.js";
import {
    previewPromotions,
    buildBasketFromVariants,
    evaluatePromotions,
} from "../../lib/promo-engine/promo-engine.js";

const DISCOUNT_KINDS = [
    "COLLECTION_DISCOUNT",
    "SPECIFIC_PRODUCT_DISCOUNT",
    "MINIMUM_PURCHASE_DISCOUNT",
    "MINIMUM_QTY_DISCOUNT",
];

function normalizeArray(value) {
    if (!value) return [];
    if (Array.isArray(value)) return value.filter(Boolean);
    return [value].filter(Boolean);
}

function normalizePayload(payload = {}) {
    return {
        ...payload,
        title: payload.title?.trim(),
        code: payload.code?.trim().toUpperCase(),
        kind: payload.kind || "MINIMUM_PURCHASE_DISCOUNT",
        collectionIds: normalizeArray(payload.collectionIds),
        productIds: normalizeArray(payload.productIds),
        combinableWith: normalizeArray(payload.combinableWith),
        priority:
            payload.priority !== undefined
                ? Number(payload.priority)
                : undefined,
        minimumOrderAmount:
            payload.minimumOrderAmount !== undefined &&
            payload.minimumOrderAmount !== null
                ? Number(payload.minimumOrderAmount)
                : undefined,
        minimumQty:
            payload.minimumQty !== undefined && payload.minimumQty !== null
                ? Number(payload.minimumQty)
                : undefined,
        value:
            payload.value !== undefined && payload.value !== null
                ? Number(payload.value)
                : payload.value,
    };
}

async function assertTargetsExist(model, ids, label) {
    if (ids.length === 0) return;
    const count = await prisma[model].count({
        where: { id: { in: ids } },
    });
    if (count !== ids.length) {
        throw new Error(`Some ${label} targets were not found`);
    }
}

async function validatePromoPayload(payload, existing = null) {
    const normalized = normalizePayload(payload);

    if (
        !normalized.title ||
        !normalized.code ||
        !normalized.type ||
        !normalized.expiresAt
    ) {
        throw new Error(
            "Missing required fields: title, code, type, expiresAt",
        );
    }

    if (!DISCOUNT_KINDS.includes(normalized.kind)) {
        throw new Error("Invalid promotion kind");
    }

    if (!["PERCENT", "VALUE"].includes(normalized.type)) {
        throw new Error("Invalid discount type. Must be PERCENT or VALUE");
    }

    if (normalized.value === undefined || Number.isNaN(normalized.value)) {
        throw new Error("Value is required and must be numeric");
    }

    if (
        normalized.type === "PERCENT" &&
        (normalized.value < 0 || normalized.value > 100)
    ) {
        throw new Error("Percentage value must be between 0 and 100");
    }

    if (normalized.value <= 0) {
        throw new Error("Value must be greater than 0");
    }

    if (
        normalized.priority !== undefined &&
        Number.isNaN(normalized.priority)
    ) {
        throw new Error("Priority must be numeric");
    }

    const startsAt = normalized.startsAt ? new Date(normalized.startsAt) : null;
    const expiresAt = new Date(normalized.expiresAt);

    if (Number.isNaN(expiresAt.getTime())) {
        throw new Error("Expiration date is invalid");
    }

    if (!existing && expiresAt <= new Date()) {
        throw new Error("Expiration date must be in the future");
    }

    if (startsAt && Number.isNaN(startsAt.getTime())) {
        throw new Error("Start date is invalid");
    }

    if (startsAt && startsAt >= expiresAt) {
        throw new Error("Start date must be earlier than expiration date");
    }

    if (
        normalized.kind === "COLLECTION_DISCOUNT" &&
        normalized.collectionIds.length === 0
    ) {
        throw new Error(
            "Collection discount requires at least one collection target",
        );
    }

    if (
        normalized.kind === "SPECIFIC_PRODUCT_DISCOUNT" &&
        normalized.productIds.length === 0
    ) {
        throw new Error(
            "Specific product discount requires at least one product target",
        );
    }

    if (
        normalized.kind === "MINIMUM_PURCHASE_DISCOUNT" &&
        (!normalized.minimumOrderAmount || normalized.minimumOrderAmount <= 0)
    ) {
        throw new Error(
            "Minimum purchase discount requires minimumOrderAmount",
        );
    }

    if (
        normalized.kind === "MINIMUM_QTY_DISCOUNT" &&
        (!normalized.minimumQty || normalized.minimumQty <= 0)
    ) {
        throw new Error("Minimum quantity discount requires minimumQty");
    }

    const invalidCombinables = normalized.combinableWith.filter(
        (kind) => !DISCOUNT_KINDS.includes(kind),
    );
    if (invalidCombinables.length > 0) {
        throw new Error("Invalid combinableWith promotion kind");
    }

    await Promise.all([
        assertTargetsExist(
            "collection",
            normalized.collectionIds,
            "collection",
        ),
        assertTargetsExist("product", normalized.productIds, "product"),
    ]);

    return normalized;
}

export const discountService = {
    async getAllDiscounts() {
        return await discountRepository.findAll();
    },

    async getDiscountById(id) {
        const discount = await discountRepository.findById(id);
        if (!discount) throw new Error("Discount not found");
        return discount;
    },

    async getDiscountByCode(code) {
        const discount = await discountRepository.findByCode(code);
        if (!discount) throw new Error("Discount code not found");
        return discount;
    },

    async createDiscount(payload) {
        const normalized = await validatePromoPayload(payload);

        const codeExists = await discountRepository.checkCodeExists(
            normalized.code,
        );
        if (codeExists) {
            throw new Error("Discount code already exists");
        }

        return await discountRepository.create(normalized);
    },

    async updateDiscount(id, payload) {
        const existing = await discountRepository.findById(id);
        if (!existing) throw new Error("Discount not found");

        const mergedPayload = {
            ...existing,
            ...payload,
            collectionIds:
                payload.collectionIds !== undefined
                    ? payload.collectionIds
                    : existing.collectionTargets.map(
                          (target) => target.collectionId,
                      ),
            productIds:
                payload.productIds !== undefined
                    ? payload.productIds
                    : existing.productTargets.map((target) => target.productId),
            combinableWith:
                payload.combinableWith !== undefined
                    ? payload.combinableWith
                    : existing.combinableWith,
        };

        const normalized = await validatePromoPayload(mergedPayload, existing);

        if (normalized.code) {
            const codeExists = await discountRepository.checkCodeExists(
                normalized.code,
                id,
            );
            if (codeExists) {
                throw new Error("Discount code already exists");
            }
        }

        return await discountRepository.update(id, normalized);
    },

    async deleteDiscount(id) {
        const discount = await discountRepository.findById(id);
        if (!discount) throw new Error("Discount not found");

        // Check if discount is being used in any orders
        if (discount._count && discount._count.orders > 0) {
            throw new Error(
                "Cannot delete discount that has been used in orders",
            );
        }

        return await discountRepository.delete(id);
    },

    async validateDiscount({
        code,
        codes = [],
        ids = [],
        items = [],
        autoApply = false,
    }) {
        const requestedCodes = [
            ...normalizeArray(codes),
            ...normalizeArray(code),
        ];

        const result = await previewPromotions({
            items,
            codes: requestedCodes,
            ids,
            autoApply,
        });

        if (!result.valid) {
            return {
                valid: false,
                message: "Cart contains invalid items",
                ...result,
            };
        }

        if (
            (requestedCodes.length > 0 || ids.length > 0) &&
            result.pricing.promotions.applied.length === 0
        ) {
            const rejection = result.pricing.promotions.rejected[0];
            return {
                valid: false,
                message: rejection?.reason || "No eligible promotion found",
                ...result,
            };
        }

        return {
            valid: true,
            message: "Promotion preview generated successfully",
            ...result,
        };
    },

    async availableForCart({ items = [] }) {
        if (!items?.length) throw new Error("Missing required field: items");

        const dbVariants = await prisma.productVariant.findMany({
            where: { id: { in: items.map((item) => item.variantId) } },
            include: {
                product: {
                    select: {
                        id: true,
                        title: true,
                        slug: true,
                        imageUrl: true,
                        price: true,
                        status: true,
                        collectionId: true,
                    },
                },
            },
        });

        const basket = buildBasketFromVariants(items, dbVariants);
        const now = new Date();
        const promotions = await prisma.discount.findMany({
            where: {
                status: true,
                OR: [{ startsAt: null }, { startsAt: { lte: now } }],
                expiresAt: { gte: now },
            },
            include: {
                collectionTargets: {
                    include: {
                        collection: {
                            select: {
                                id: true,
                                title: true,
                                slug: true,
                            },
                        },
                    },
                },
                productTargets: {
                    include: {
                        product: {
                            select: {
                                id: true,
                                title: true,
                                slug: true,
                                price: true,
                                collectionId: true,
                            },
                        },
                    },
                },
            },
            orderBy: [{ priority: "asc" }, { createdAt: "desc" }],
        });
        const result = evaluatePromotions({ basket, promotions });

        // Return ALL eligible promotions (not just the applied ones)
        return result.promotions.eligible;
    },

    async applyDiscount(id) {
        return await discountRepository.incrementUsedCount(id);
    },

    async updateStatus(id, status) {
        const discount = await discountRepository.findById(id);
        if (!discount) throw new Error("Discount not found");

        return await discountRepository.updateStatus(id, status);
    },
};
