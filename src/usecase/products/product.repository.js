import prisma from "../../prisma/client.js";

function toMeasurementKey(value) {
    if (typeof value !== "string") return "";

    return value
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "_")
        .replace(/^_+|_+$/g, "");
}

function toNullableString(value) {
    if (typeof value !== "string") return null;
    const normalized = value.trim();
    return normalized.length > 0 ? normalized : null;
}

function normalizeMeasurementFields(measurementFields) {
    const normalized = [];
    const seen = new Set();

    if (Array.isArray(measurementFields) && measurementFields.length > 0) {
        measurementFields.forEach((field, index) => {
            const key = toMeasurementKey(field?.name);
            if (!key || seen.has(key)) return;

            seen.add(key);
            normalized.push({
                name: key,
                displayName:
                    typeof field?.displayName === "string" &&
                    field.displayName.trim().length > 0
                        ? field.displayName.trim()
                        : key
                              .split("_")
                              .map(
                                  (part) =>
                                      part.charAt(0).toUpperCase() +
                                      part.slice(1),
                              )
                              .join(" "),
                unit: toNullableString(field?.unit),
                position:
                    Number.isFinite(Number(field?.position)) &&
                    Number(field.position) >= 0
                        ? Number(field.position)
                        : index,
            });
        });

        return normalized;
    }

    return normalized;
}

function getVariantMeasurementEntries(variant = {}) {
    const valueMap = new Map();

    const pushValue = (key, value) => {
        const normalizedValue = toNullableString(value);
        if (!normalizedValue) return;

        if (typeof key === "string" && key.trim().length > 0) {
            valueMap.set(key, normalizedValue);
        }
    };

    if (Array.isArray(variant.measurements)) {
        for (const measurement of variant.measurements) {
            const key =
                measurement?.fieldId ||
                measurement?.fieldName ||
                measurement?.name ||
                measurement?.field?.name;
            pushValue(key, measurement?.value);
        }
    } else if (
        variant.measurements &&
        typeof variant.measurements === "object"
    ) {
        Object.entries(variant.measurements).forEach(([key, value]) => {
            pushValue(key, value);
        });
    }

    return [...valueMap.entries()].map(([key, value]) => ({ key, value }));
}

async function syncMeasurementFields(
    tx,
    productId,
    measurementFields,
    shouldPrune,
) {
    const normalizedFields = normalizeMeasurementFields(measurementFields);

    if (normalizedFields.length === 0) {
        return tx.measurementField.findMany({
            where: { productId },
            orderBy: { position: "asc" },
        });
    }

    if (shouldPrune) {
        await tx.measurementField.deleteMany({
            where: {
                productId,
                name: {
                    notIn: normalizedFields.map((field) => field.name),
                },
            },
        });
    }

    for (const field of normalizedFields) {
        await tx.measurementField.upsert({
            where: {
                productId_name: {
                    productId,
                    name: field.name,
                },
            },
            update: {
                displayName: field.displayName,
                unit: field.unit,
                position: field.position,
            },
            create: {
                productId,
                name: field.name,
                displayName: field.displayName,
                unit: field.unit,
                position: field.position,
            },
        });
    }

    return tx.measurementField.findMany({
        where: { productId },
        orderBy: { position: "asc" },
    });
}

async function syncVariantMeasurements(tx, variantId, variant, fieldList) {
    if (!Array.isArray(fieldList) || fieldList.length === 0) {
        return;
    }

    const fieldByName = new Map(
        fieldList.map((field) => [field.name, field.id]),
    );
    const fieldById = new Map(fieldList.map((field) => [field.id, field.id]));
    const allFieldIds = fieldList.map((field) => field.id);

    const entries = getVariantMeasurementEntries(variant);
    const mappedEntries = [];

    for (const entry of entries) {
        let fieldId = fieldById.get(entry.key);
        if (!fieldId) {
            fieldId = fieldByName.get(toMeasurementKey(entry.key));
        }

        if (!fieldId) continue;

        mappedEntries.push({
            fieldId,
            value: entry.value,
        });
    }

    await tx.productVariantMeasurement.deleteMany({
        where: {
            variantId,
            fieldId: { in: allFieldIds },
        },
    });

    if (mappedEntries.length > 0) {
        await tx.productVariantMeasurement.createMany({
            data: mappedEntries.map((entry) => ({
                variantId,
                fieldId: entry.fieldId,
                value: entry.value,
            })),
            skipDuplicates: true,
        });
    }
}

// ambil semua produk
export async function findAllProducts(
    statusFilter,
    search,
    skip = 0,
    limit = 12,
    sortBy = "createdAt",
    sortOrder = "desc",
    collectionSlugs = [],
    categorySlugs = [],
    kainNames = [],
) {
    const whereClause = {
        ...(statusFilter !== undefined ? { status: statusFilter } : {}),
        ...(search
            ? {
                  OR: [
                      { title: { contains: search } },
                      { slug: { contains: search } },
                      { description: { contains: search } },
                  ],
              }
            : {}),
        ...(collectionSlugs.length > 0
            ? { collection: { slug: { in: collectionSlugs } } }
            : {}),
        ...(categorySlugs.length > 0
            ? { category: { slug: { in: categorySlugs } } }
            : {}),
        ...(kainNames.length > 0 ? { kain: { name: { in: kainNames } } } : {}),
    };

    // ✅ Determine orderBy based on sortBy parameter
    let orderBy = {};

    if (sortBy === "stock") {
        orderBy = { stock: sortOrder === "desc" ? "desc" : "asc" };
    } else if (sortBy === "price") {
        orderBy = { price: sortOrder === "desc" ? "desc" : "asc" };
    } else if (sortBy === "title") {
        orderBy = { title: sortOrder === "desc" ? "desc" : "asc" };
    } else if (sortBy === "createdAt") {
        orderBy = { createdAt: sortOrder === "desc" ? "desc" : "asc" };
    } else {
        // Default: newest first
        orderBy = { createdAt: "desc" };
    }

    const [total, products] = await prisma.$transaction([
        prisma.product.count({ where: whereClause }),
        prisma.product.findMany({
            where: whereClause,
            skip,
            take: limit,
            orderBy, // ✅ Apply dynamic orderBy
            include: {
                variants: true,
                images: true,
                category: true,
                collection: true,
                kain: true,
            },
        }),
    ]);

    return { products, total };
}

export async function findSuggestedProducts(statusFilter, limit) {
    const totalCount = await prisma.product.count({
        where: statusFilter !== undefined ? { status: statusFilter } : {},
    });

    if (totalCount === 0) return [];

    const randomOffset = Math.max(
        0,
        Math.floor(Math.random() * Math.max(totalCount - limit, 0)),
    );

    const products = await prisma.product.findMany({
        where: statusFilter !== undefined ? { status: statusFilter } : {},
        skip: randomOffset,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
            images: {
                select: {
                    id: true,
                    imageUrl: true,
                    isPrimary: true,
                    isSecondary: true,
                }, // ✅ Added isSecondary
            },
            category: {
                select: { id: true, title: true, slug: true },
            },
            collection: {
                select: { id: true, title: true, slug: true },
            },
        },
    });

    if (products.length < limit && totalCount > limit) {
        const extra = await prisma.product.findMany({
            where: statusFilter !== undefined ? { status: statusFilter } : {},
            take: limit - products.length,
            orderBy: { createdAt: "desc" },
            include: {
                images: {
                    select: {
                        id: true,
                        imageUrl: true,
                        isPrimary: true,
                        isSecondary: true,
                    }, // ✅ Added isSecondary
                },
                category: {
                    select: { id: true, title: true, slug: true },
                },
                collection: {
                    select: { id: true, title: true, slug: true },
                },
            },
        });
        return [...products, ...extra];
    }

    return products;
}

// ambil produk by id
export async function findProductById(id) {
    return prisma.product.findUnique({
        where: { id },
        include: {
            measurementFields: {
                orderBy: { position: "asc" },
            },
            variants: {
                include: {
                    measurements: {
                        include: {
                            field: true,
                        },
                    },
                },
            },
            images: true,
            category: true,
            collection: true,
            kain: true,
        },
    });
}

// ambil produk by slug
export async function findProductBySlug(slug) {
    return prisma.product.findUnique({
        where: { slug },
        include: {
            measurementFields: {
                orderBy: { position: "asc" },
            },
            variants: {
                include: {
                    measurements: {
                        include: {
                            field: true,
                        },
                    },
                },
            },
            images: true,
            category: true,
            collection: true,
            kain: true,
        },
    });
}

// buat produk baru
export async function insertProduct(data) {
    const { variants, measurementFields, ...restData } = data;

    return prisma.$transaction(async (tx) => {
        const created = await tx.product.create({
            data: {
                ...restData,
                variants,
            },
            include: {
                variants: true,
            },
        });

        const fields = await syncMeasurementFields(
            tx,
            created.id,
            measurementFields,
            false,
        );

        const sourceVariants = Array.isArray(variants?.create)
            ? variants.create
            : [];

        for (let i = 0; i < created.variants.length; i++) {
            await syncVariantMeasurements(
                tx,
                created.variants[i].id,
                sourceVariants[i] || {},
                fields,
            );
        }

        return tx.product.findUnique({
            where: { id: created.id },
            include: {
                measurementFields: {
                    orderBy: { position: "asc" },
                },
                images: true,
                variants: {
                    include: {
                        measurements: {
                            include: {
                                field: true,
                            },
                        },
                    },
                },
                category: true,
                collection: true,
                kain: true,
            },
        });
    });
}

// update produk
export async function updateProductData(id, data, relationalData = {}) {
    const { images, variants, measurementFields } = relationalData;

    return prisma.$transaction(async (tx) => {
        await tx.product.update({
            where: { id },
            data,
        });

        const fields = await syncMeasurementFields(
            tx,
            id,
            measurementFields,
            measurementFields !== undefined,
        );

        if (images !== undefined) {
            await tx.productImage.deleteMany({ where: { productId: id } });
            if (images.length > 0) {
                await tx.productImage.createMany({
                    data: images.map((img) => ({
                        productId: id,
                        imageUrl: img.imageUrl,
                        isPrimary: img.isPrimary || false,
                        isSecondary: img.isSecondary || false, // ✅ Added isSecondary
                    })),
                });

                const primaryImg = images.find((i) => i.isPrimary);
                if (primaryImg) {
                    await tx.product.update({
                        where: { id },
                        data: { imageUrl: primaryImg.imageUrl },
                    });
                }
            }
        }

        if (variants !== undefined) {
            const existingVariants = await tx.productVariant.findMany({
                where: { productId: id },
                select: { id: true },
            });

            const existingIds = existingVariants.map((v) => v.id);
            const incomingIds = variants.filter((v) => v.id).map((v) => v.id);

            const toDelete = existingIds.filter(
                (id) => !incomingIds.includes(id),
            );
            if (toDelete.length > 0) {
                await tx.productVariant.deleteMany({
                    where: { id: { in: toDelete } },
                });
            }

            for (const v of variants) {
                if (v.id && existingIds.includes(v.id)) {
                    await tx.productVariant.update({
                        where: { id: v.id },
                        data: {
                            size: v.size,
                            color: v.color,
                            stock: v.stock,
                            sku: v.sku,
                        },
                    });

                    await syncVariantMeasurements(tx, v.id, v, fields);
                } else {
                    // create new
                    const createdVariant = await tx.productVariant.create({
                        data: {
                            productId: id,
                            size: v.size || null,
                            color: v.color || null,
                            stock: v.stock ?? 0,
                            sku: v.sku || null,
                        },
                    });

                    await syncVariantMeasurements(
                        tx,
                        createdVariant.id,
                        v,
                        fields,
                    );
                }
            }
        }

        return tx.product.findUnique({
            where: { id },
            include: {
                measurementFields: {
                    orderBy: { position: "asc" },
                },
                images: true,
                variants: {
                    include: {
                        measurements: {
                            include: {
                                field: true,
                            },
                        },
                    },
                },
                category: true,
                collection: true,
                kain: true,
            },
        });
    });
}

// hapus produk
export async function deleteProductData(id) {
    return prisma.product.delete({ where: { id } });
}

export async function findSaleProducts({ skip = 0, limit = 12 } = {}) {
    const now = new Date();

    const activeDiscounts = await prisma.discount.findMany({
        where: {
            status: true,
            deletedAt: null,
            kind: { in: ["SPECIFIC_PRODUCT_DISCOUNT", "COLLECTION_DISCOUNT"] },
            OR: [{ startsAt: null }, { startsAt: { lte: now } }],
            expiresAt: { gte: now },
        },
        include: {
            productTargets: { select: { productId: true } },
            collectionTargets: { select: { collectionId: true } },
        },
    });

    const productIdSet = new Set();
    const discountByProductId = new Map();

    for (const discount of activeDiscounts) {
        for (const t of discount.productTargets) {
            productIdSet.add(t.productId);
            if (!discountByProductId.has(t.productId)) {
                discountByProductId.set(t.productId, discount);
            }
        }

        if (discount.collectionTargets.length > 0) {
            const collectionIds = discount.collectionTargets.map(
                (t) => t.collectionId,
            );
            const productsInCollections = await prisma.product.findMany({
                where: { collectionId: { in: collectionIds }, status: true },
                select: { id: true },
            });
            for (const p of productsInCollections) {
                productIdSet.add(p.id);
                if (!discountByProductId.has(p.id)) {
                    discountByProductId.set(p.id, discount);
                }
            }
        }
    }

    if (productIdSet.size === 0) return { products: [], total: 0 };

    const total = await prisma.product.count({
        where: { id: { in: [...productIdSet] }, status: true },
    });

    const products = await prisma.product.findMany({
        where: { id: { in: [...productIdSet] }, status: true },
        include: {
            variants: true,
            images: true,
            category: true,
            collection: true,
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
    });

    const mappedProducts = products.map((product) => {
        const discount = discountByProductId.get(product.id);
        const basePrice = Number(product.price);
        let discountedPrice = basePrice;

        if (discount.type === "PERCENT") {
            discountedPrice = basePrice * (1 - Number(discount.value) / 100);
        } else {
            discountedPrice = basePrice - Number(discount.value);
        }
        discountedPrice = Math.max(0, Math.round(discountedPrice));

        return {
            ...product,
            price: discountedPrice,
            priceBeforeDiscount: basePrice,
            discountPercent:
                discount.type === "PERCENT"
                    ? Number(discount.value)
                    : Math.round((1 - discountedPrice / basePrice) * 100),
        };
    });

    return { products: mappedProducts, total };
}
