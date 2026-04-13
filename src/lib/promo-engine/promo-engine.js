import prisma from "../../prisma/client.js";

const ITEM_LEVEL_KINDS = ["SPECIFIC_PRODUCT_DISCOUNT", "COLLECTION_DISCOUNT"];

const CART_LEVEL_KINDS = ["MINIMUM_PURCHASE_DISCOUNT", "MINIMUM_QTY_DISCOUNT"];

const defaultDiscountInclude = {
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
};

function createError(message, statusCode = 400) {
    const error = new Error(message);
    error.statusCode = statusCode;
    return error;
}

function asArray(value) {
    if (!value) return [];
    if (Array.isArray(value)) return value.filter(Boolean);
    return [value].filter(Boolean);
}

function parseCombinableWith(value) {
    if (!value) return [];
    if (Array.isArray(value)) return value.filter(Boolean);
    if (typeof value === "string") {
        try {
            const parsed = JSON.parse(value);
            return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
        } catch {
            return [];
        }
    }
    return [];
}

function toNumber(value) {
    return Number(value || 0);
}

function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

function roundCurrency(value) {
    return Math.round((value + Number.EPSILON) * 100) / 100;
}

function calculateDeductionAmount(type, value, baseAmount) {
    const normalizedBase = roundCurrency(baseAmount);
    if (normalizedBase <= 0) return 0;

    if (type === "PERCENT") {
        return roundCurrency((normalizedBase * toNumber(value)) / 100);
    }

    return roundCurrency(clamp(toNumber(value), 0, normalizedBase));
}

function comparePromotionPriority(left, right) {
    const leftPriority = left?.priority ?? 100;
    const rightPriority = right?.priority ?? 100;

    if (leftPriority !== rightPriority) {
        return leftPriority - rightPriority;
    }

    const leftCreatedAt = new Date(left?.createdAt || 0).getTime();
    const rightCreatedAt = new Date(right?.createdAt || 0).getTime();

    return leftCreatedAt - rightCreatedAt;
}

function comparePromotionCandidates(left, right) {
    const priorityDiff = comparePromotionPriority(
        left?.promotion,
        right?.promotion,
    );
    if (priorityDiff !== 0) {
        return priorityDiff;
    }

    if (right.previewAmount !== left.previewAmount) {
        return right.previewAmount - left.previewAmount;
    }

    return String(left.promotion?.id || "").localeCompare(
        String(right.promotion?.id || ""),
    );
}

function compareTopLevelCandidates(left, right) {
    if (right.previewAmount !== left.previewAmount) {
        return right.previewAmount - left.previewAmount;
    }

    const priorityDiff = comparePromotionPriority(
        left?.promotion,
        right?.promotion,
    );
    if (priorityDiff !== 0) {
        return priorityDiff;
    }

    return String(left.promotion?.id || "").localeCompare(
        String(right.promotion?.id || ""),
    );
}

function formatPromotionSnapshot(discount) {
    return {
        id: discount.id,
        code: discount.code,
        title: discount.title,
        kind: discount.kind,
        type: discount.type,
        value: toNumber(discount.value),
        priority: discount.priority,
        minimumOrderAmount:
            discount.minimumOrderAmount !== null &&
            discount.minimumOrderAmount !== undefined
                ? toNumber(discount.minimumOrderAmount)
                : null,
        minimumQty: discount.minimumQty ?? null,
        combinableWith: parseCombinableWith(discount.combinableWith),
        autoApply: Boolean(discount.autoApply),
        startsAt: discount.startsAt,
        expiresAt: discount.expiresAt,
        targets: {
            collections: (discount.collectionTargets || []).map((target) => ({
                id: target.collection.id,
                title: target.collection.title,
                slug: target.collection.slug,
            })),
            products: (discount.productTargets || []).map((target) => ({
                id: target.product.id,
                title: target.product.title,
                slug: target.product.slug,
                collectionId: target.product.collectionId,
            })),
        },
    };
}

function cloneBasket(basket) {
    return basket.map((item) => ({
        ...item,
        product: item.product ? { ...item.product } : null,
        adjustments: [...(item.adjustments || [])],
    }));
}

function isPromotionActive(discount, now = new Date()) {
    if (!discount?.status) return false;
    if (discount.startsAt && new Date(discount.startsAt) > now) return false;
    if (discount.expiresAt && new Date(discount.expiresAt) < now) return false;
    return true;
}

function getItemLevelEligibleItems(items, discount) {
    if (discount.kind === "SPECIFIC_PRODUCT_DISCOUNT") {
        const targetedProductIds = new Set(
            (discount.productTargets || []).map((target) => target.productId),
        );

        return items.filter((item) => targetedProductIds.has(item.productId));
    }

    if (discount.kind === "COLLECTION_DISCOUNT") {
        const targetedCollectionIds = new Set(
            (discount.collectionTargets || []).map(
                (target) => target.collectionId,
            ),
        );

        return items.filter(
            (item) =>
                item.collectionId &&
                targetedCollectionIds.has(item.collectionId),
        );
    }

    return [];
}

function applyItemLevelPromotion(items, discount, stage) {
    const eligibleItems = getItemLevelEligibleItems(items, discount);

    if (eligibleItems.length === 0) {
        return {
            applied: false,
            amount: 0,
            reason: "No eligible items found",
        };
    }

    let totalAmount = 0;
    const affectedItems = [];

    for (const item of eligibleItems) {
        const unitDeduction = calculateDeductionAmount(
            discount.type,
            discount.value,
            item.effectiveUnitPrice,
        );

        if (unitDeduction <= 0) {
            continue;
        }

        const previousUnitPrice = item.effectiveUnitPrice;
        const nextUnitPrice = roundCurrency(
            clamp(previousUnitPrice - unitDeduction, 0, previousUnitPrice),
        );
        const lineDeduction = roundCurrency(
            (previousUnitPrice - nextUnitPrice) * item.quantity,
        );

        item.effectiveUnitPrice = nextUnitPrice;
        item.effectiveLineSubtotal = roundCurrency(
            nextUnitPrice * item.quantity,
        );
        item.adjustments.push({
            stage,
            promotionId: discount.id,
            code: discount.code,
            title: discount.title,
            kind: discount.kind,
            amount: lineDeduction,
            unitAmount: roundCurrency(previousUnitPrice - nextUnitPrice),
        });

        totalAmount += lineDeduction;
        affectedItems.push({
            variantId: item.variantId,
            productId: item.productId,
            quantity: item.quantity,
            amount: lineDeduction,
        });
    }

    if (totalAmount <= 0) {
        return {
            applied: false,
            amount: 0,
            reason: "Eligible items produced zero deduction",
        };
    }

    return {
        applied: true,
        amount: roundCurrency(totalAmount),
        affectedItems,
    };
}

function isMutuallyCombinable(candidate, appliedPromotion) {
    const candidateRules = new Set(
        parseCombinableWith(candidate.combinableWith),
    );
    const appliedRules = new Set(
        appliedPromotion.combinableWith ||
            parseCombinableWith(appliedPromotion.raw?.combinableWith),
    );

    return (
        candidateRules.has(appliedPromotion.kind) &&
        appliedRules.has(candidate.kind)
    );
}

function buildAppliedPromotion(discount, amount, extra = {}) {
    return {
        ...formatPromotionSnapshot(discount),
        amount: roundCurrency(amount),
        ...extra,
        raw: discount,
    };
}

function sanitizeAppliedPromotions(appliedPromotions) {
    return appliedPromotions.map(({ raw, ...promotion }) => promotion);
}

export async function loadPromotions({
    codes = [],
    ids = [],
    autoApply = false,
} = {}) {
    const normalizedCodes = [
        ...new Set(asArray(codes).map((code) => code.toUpperCase())),
    ];
    const normalizedIds = [...new Set(asArray(ids))];

    const conditions = [
        normalizedCodes.length > 0
            ? { code: { in: normalizedCodes } }
            : undefined,
        normalizedIds.length > 0 ? { id: { in: normalizedIds } } : undefined,
        autoApply ? { autoApply: true, status: true } : undefined,
    ].filter(Boolean);

    if (conditions.length === 0) {
        return [];
    }

    return prisma.discount.findMany({
        where: {
            deletedAt: null,
            OR: conditions,
        },
        include: defaultDiscountInclude,
    });
}

export async function getActiveProductPromotions(productIds = []) {
    const normalizedProductIds = [...new Set(asArray(productIds))];
    if (normalizedProductIds.length === 0) {
        return [];
    }

    const now = new Date();

    return prisma.discount.findMany({
        where: {
            status: true,
            deletedAt: null,
            kind: "SPECIFIC_PRODUCT_DISCOUNT",
            OR: [{ startsAt: null }, { startsAt: { lte: now } }],
            expiresAt: { gte: now },
            productTargets: {
                some: {
                    productId: { in: normalizedProductIds },
                },
            },
        },
        include: defaultDiscountInclude,
        orderBy: [{ priority: "asc" }, { createdAt: "desc" }],
    });
}

export function buildBasketFromVariants(items, dbVariants) {
    return items.map((item) => {
        const variant = dbVariants.find((value) => value.id === item.variantId);
        if (!variant) {
            throw createError(`Variant ${item.variantId} tidak ditemukan`, 404);
        }

        if (variant.stock < item.quantity) {
            throw createError(
                `${variant.product.title} (${variant.size || "-"}) stok habis`,
            );
        }

        const baseUnitPrice = roundCurrency(toNumber(variant.product.price));

        return {
            variantId: variant.id,
            productId: variant.product.id,
            collectionId: variant.product.collectionId || null,
            quantity: item.quantity,
            baseUnitPrice,
            effectiveUnitPrice: baseUnitPrice,
            baseLineSubtotal: roundCurrency(baseUnitPrice * item.quantity),
            effectiveLineSubtotal: roundCurrency(baseUnitPrice * item.quantity),
            adjustments: [],
            product: {
                id: variant.product.id,
                title: variant.product.title,
                slug: variant.product.slug,
                imageUrl: variant.product.imageUrl,
                collectionId: variant.product.collectionId || null,
            },
        };
    });
}

export function evaluatePromotions({
    basket,
    promotions = [],
    now = new Date(),
}) {
    const items = cloneBasket(basket);
    const eligible = [];
    const applied = [];
    const rejected = [];
    const dedupe = new Set();

    const activePromotions = promotions
        .filter(Boolean)
        .filter((promotion) => {
            if (dedupe.has(promotion.id)) return false;
            dedupe.add(promotion.id);
            return true;
        })
        .sort(comparePromotionPriority);

    const itemPromotions = activePromotions.filter((promotion) =>
        ITEM_LEVEL_KINDS.includes(promotion.kind),
    );

    // Phase 1 – SPECIFIC_PRODUCT_DISCOUNT: best one applied first.
    const specificProductCandidates = [];
    for (const promotion of itemPromotions.filter(
        (p) => p.kind === "SPECIFIC_PRODUCT_DISCOUNT",
    )) {
        const snapshot = formatPromotionSnapshot(promotion);
        if (!isPromotionActive(promotion, now)) {
            rejected.push({ ...snapshot, reason: "Promotion is inactive" });
            continue;
        }
        eligible.push(snapshot);
        const previewItems = cloneBasket(items);
        const result = applyItemLevelPromotion(
            previewItems,
            promotion,
            "specific_product_discount",
        );
        if (!result.applied) {
            rejected.push({ ...snapshot, reason: result.reason });
            continue;
        }
        specificProductCandidates.push({
            promotion,
            snapshot,
            stage: "specific_product_discount",
            previewAmount: result.amount,
            affectedItems: result.affectedItems,
        });
    }

    const selectedSpecificPromotion = specificProductCandidates
        .sort(compareTopLevelCandidates)
        .at(0);

    if (selectedSpecificPromotion) {
        const selectedResult = applyItemLevelPromotion(
            items,
            selectedSpecificPromotion.promotion,
            "specific_product_discount",
        );
        if (selectedResult.applied) {
            applied.push(
                buildAppliedPromotion(
                    selectedSpecificPromotion.promotion,
                    selectedResult.amount,
                    {
                        stage: selectedSpecificPromotion.stage,
                        affectedItems: selectedResult.affectedItems,
                    },
                ),
            );
        }
        for (const candidate of specificProductCandidates) {
            if (
                candidate.promotion.id !==
                selectedSpecificPromotion.promotion.id
            ) {
                rejected.push({
                    ...candidate.snapshot,
                    reason: "Conflicts with the selected specific product promotion",
                });
            }
        }
    }

    // Phase 2 – COLLECTION_DISCOUNT: applied on top of Phase 1 adjusted basket.
    const collectionCandidates = [];
    for (const promotion of itemPromotions.filter(
        (p) => p.kind === "COLLECTION_DISCOUNT",
    )) {
        const snapshot = formatPromotionSnapshot(promotion);
        if (!isPromotionActive(promotion, now)) {
            rejected.push({ ...snapshot, reason: "Promotion is inactive" });
            continue;
        }
        eligible.push(snapshot);
        const previewItems = cloneBasket(items); // already has Phase 1 applied
        const result = applyItemLevelPromotion(
            previewItems,
            promotion,
            "collection_discount",
        );
        if (!result.applied) {
            rejected.push({ ...snapshot, reason: result.reason });
            continue;
        }
        collectionCandidates.push({
            promotion,
            snapshot,
            stage: "collection_discount",
            previewAmount: result.amount,
            affectedItems: result.affectedItems,
        });
    }

    const selectedCollectionPromotion = collectionCandidates
        .sort(compareTopLevelCandidates)
        .at(0);

    if (selectedCollectionPromotion) {
        const selectedResult = applyItemLevelPromotion(
            items,
            selectedCollectionPromotion.promotion,
            "collection_discount",
        );
        if (selectedResult.applied) {
            applied.push(
                buildAppliedPromotion(
                    selectedCollectionPromotion.promotion,
                    selectedResult.amount,
                    {
                        stage: selectedCollectionPromotion.stage,
                        affectedItems: selectedResult.affectedItems,
                    },
                ),
            );
        }
        for (const candidate of collectionCandidates) {
            if (
                candidate.promotion.id !==
                selectedCollectionPromotion.promotion.id
            ) {
                rejected.push({
                    ...candidate.snapshot,
                    reason: "Conflicts with the selected collection promotion",
                });
            }
        }
    }

    const subtotalAfterProductDiscounts = roundCurrency(
        items.reduce((sum, item) => {
            const specificDiscountAmount = item.adjustments
                .filter(
                    (adjustment) =>
                        adjustment.kind === "SPECIFIC_PRODUCT_DISCOUNT",
                )
                .reduce(
                    (subtotal, adjustment) => subtotal + adjustment.amount,
                    0,
                );

            return sum + (item.baseLineSubtotal - specificDiscountAmount);
        }, 0),
    );

    const subtotalAfterCollectionDiscounts = roundCurrency(
        items.reduce((sum, item) => sum + item.effectiveLineSubtotal, 0),
    );
    const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);

    const cartPromotions = activePromotions
        .filter((promotion) => CART_LEVEL_KINDS.includes(promotion.kind))
        .map((promotion) => {
            const snapshot = formatPromotionSnapshot(promotion);

            if (!isPromotionActive(promotion, now)) {
                rejected.push({ ...snapshot, reason: "Promotion is inactive" });
                return null;
            }

            const currentSubtotal = subtotalAfterCollectionDiscounts;
            if (
                promotion.kind === "MINIMUM_PURCHASE_DISCOUNT" &&
                (!promotion.minimumOrderAmount ||
                    currentSubtotal < toNumber(promotion.minimumOrderAmount))
            ) {
                rejected.push({
                    ...snapshot,
                    reason: "Minimum purchase amount not reached",
                });
                return null;
            }

            if (
                promotion.kind === "MINIMUM_QTY_DISCOUNT" &&
                (!promotion.minimumQty || totalQuantity < promotion.minimumQty)
            ) {
                rejected.push({
                    ...snapshot,
                    reason: "Minimum quantity not reached",
                });
                return null;
            }

            const amount = calculateDeductionAmount(
                promotion.type,
                promotion.value,
                currentSubtotal,
            );

            if (amount <= 0) {
                rejected.push({
                    ...snapshot,
                    reason: "Promotion amount is zero",
                });
                return null;
            }

            eligible.push(snapshot);
            return {
                promotion,
                snapshot,
                previewAmount: amount,
            };
        })
        .filter(Boolean)
        .sort(comparePromotionCandidates);

    const selectedCartPromotions = [];
    for (const candidate of cartPromotions) {
        const conflicts = selectedCartPromotions.filter(
            (appliedPromotion) =>
                !isMutuallyCombinable(candidate.promotion, appliedPromotion),
        );

        if (conflicts.length > 0) {
            rejected.push({
                ...candidate.snapshot,
                reason: "Conflicts with a higher value non-combinable promotion",
            });
            continue;
        }

        selectedCartPromotions.push(
            buildAppliedPromotion(
                candidate.promotion,
                candidate.previewAmount,
                {
                    stage: "cart_discount_preview",
                },
            ),
        );
    }

    let runningSubtotal = subtotalAfterCollectionDiscounts;
    for (const promotion of selectedCartPromotions.sort(
        comparePromotionPriority,
    )) {
        const amount = calculateDeductionAmount(
            promotion.type,
            promotion.value,
            runningSubtotal,
        );
        runningSubtotal = roundCurrency(
            clamp(runningSubtotal - amount, 0, runningSubtotal),
        );
        promotion.stage = "cart_discount";
        promotion.amount = roundCurrency(amount);
        applied.push(promotion);
    }

    const totalDiscount = roundCurrency(
        applied.reduce((sum, promotion) => sum + promotion.amount, 0),
    );
    const payableSubtotal = roundCurrency(runningSubtotal);
    const baseSubtotal = roundCurrency(
        items.reduce((sum, item) => sum + item.baseLineSubtotal, 0),
    );

    return {
        valid: applied.length > 0,
        currency: "IDR",
        items: items.map((item) => ({
            variantId: item.variantId,
            productId: item.productId,
            collectionId: item.collectionId,
            quantity: item.quantity,
            baseUnitPrice: item.baseUnitPrice,
            effectiveUnitPrice: item.effectiveUnitPrice,
            baseLineSubtotal: item.baseLineSubtotal,
            effectiveLineSubtotal: item.effectiveLineSubtotal,
            product: item.product,
            adjustments: item.adjustments,
        })),
        promotions: {
            eligible,
            applied: sanitizeAppliedPromotions(applied),
            rejected,
        },
        summary: {
            baseSubtotal,
            subtotalAfterProductDiscounts,
            subtotalAfterCollectionDiscounts,
            subtotalBeforeCartDiscounts: subtotalAfterCollectionDiscounts,
            totalQuantity,
            totalDiscount,
            payableSubtotal,
        },
    };
}

export async function previewPromotions({
    items,
    codes = [],
    ids = [],
    autoApply = false,
}) {
    if (!items?.length) {
        throw createError("Empty cart");
    }

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

    const invalid = [];
    for (const item of items) {
        const variant = dbVariants.find((value) => value.id === item.variantId);

        if (!variant) {
            invalid.push({
                variantId: item.variantId,
                reason: "VARIANT_NOT_FOUND",
                productName: "Variant not found",
            });
            continue;
        }

        if (!variant.product?.status) {
            invalid.push({
                variantId: item.variantId,
                reason: "PRODUCT_INACTIVE",
                productName: variant.product.title,
            });
            continue;
        }

        if (variant.stock < item.quantity) {
            invalid.push({
                variantId: item.variantId,
                reason: "OUT_OF_STOCK",
                productName: `${variant.product.title} (${variant.size || "-"})`,
            });
        }
    }

    if (invalid.length > 0) {
        return {
            valid: false,
            invalid,
            pricing: null,
        };
    }

    const basket = buildBasketFromVariants(items, dbVariants);
    const promotions = await loadPromotions({ codes, ids, autoApply });

    // Always inject active specific-product discounts for products in the basket,
    // regardless of autoApply flag or whether the user selected them.
    const productIds = [...new Set(dbVariants.map((v) => v.product.id))];
    const specificProductPromos = await getActiveProductPromotions(productIds);
    const existingIds = new Set(promotions.map((p) => p.id));
    const mergedPromotions = [
        ...promotions,
        ...specificProductPromos.filter((p) => !existingIds.has(p.id)),
    ];

    const pricing = evaluatePromotions({
        basket,
        promotions: mergedPromotions,
    });

    return {
        valid: true,
        invalid: [],
        pricing,
    };
}

export async function attachProductPricing(products) {
    const normalizedProducts = asArray(products);
    if (normalizedProducts.length === 0) {
        return normalizedProducts;
    }

    const promotions = await getActiveProductPromotions(
        normalizedProducts.map((product) => product.id),
    );

    return normalizedProducts.map((product) => {
        const productPromotions = promotions.filter((promotion) =>
            (promotion.productTargets || []).some(
                (target) => target.productId === product.id,
            ),
        );

        if (productPromotions.length === 0) {
            return {
                ...product,
                pricing: {
                    basePrice: toNumber(product.price),
                    finalPrice: toNumber(product.price),
                    discountAmount: 0,
                    appliedPromotions: [],
                },
            };
        }

        const basket = [
            {
                variantId: `${product.id}-preview`,
                productId: product.id,
                collectionId:
                    product.collectionId || product.collection?.id || null,
                quantity: 1,
                baseUnitPrice: toNumber(product.price),
                effectiveUnitPrice: toNumber(product.price),
                baseLineSubtotal: toNumber(product.price),
                effectiveLineSubtotal: toNumber(product.price),
                product: {
                    id: product.id,
                    title: product.title,
                    slug: product.slug,
                    imageUrl: product.imageUrl,
                    collectionId:
                        product.collectionId || product.collection?.id || null,
                },
                adjustments: [],
            },
        ];

        const pricing = evaluatePromotions({
            basket,
            promotions: productPromotions,
        });

        return {
            ...product,
            pricing: {
                basePrice: toNumber(product.price),
                finalPrice: pricing.summary.payableSubtotal,
                discountAmount: pricing.summary.totalDiscount,
                appliedPromotions: pricing.promotions.applied,
            },
        };
    });
}
