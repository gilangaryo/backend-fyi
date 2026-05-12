import slugify from "slugify";
import {
    findAllProducts,
    findProductById,
    findProductBySlug,
    insertProduct,
    updateProductData,
    deleteProductData,
    findSuggestedProducts,
    findSaleProducts,
} from "./product.repository.js";
import { attachProductPricing } from "../../lib/promo-engine/promo-engine.js";

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

function normalizeMeasurementFieldsInput(fields = []) {
    if (!Array.isArray(fields)) {
        throw new Error("measurementFields must be an array");
    }

    const seen = new Set();

    return fields
        .map((field, index) => {
            const name = toMeasurementKey(field?.name);
            if (!name) {
                throw new Error("Measurement field name is required");
            }

            if (seen.has(name)) {
                throw new Error(`Duplicate measurement field key: ${name}`);
            }

            seen.add(name);

            return {
                name,
                displayName:
                    typeof field?.displayName === "string" &&
                    field.displayName.trim().length > 0
                        ? field.displayName.trim()
                        : name
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
            };
        })
        .sort((a, b) => a.position - b.position);
}

function normalizeVariantMeasurementMap(rawMeasurements, allowedKeys = null) {
    const normalized = {};

    const assign = (key, value) => {
        const normalizedKey = toMeasurementKey(key);
        if (!normalizedKey) return;

        if (allowedKeys && !allowedKeys.has(normalizedKey)) {
            throw new Error(`Unknown measurement field key: ${normalizedKey}`);
        }

        const normalizedValue = toNullableString(value);
        if (!normalizedValue) return;

        normalized[normalizedKey] = normalizedValue;
    };

    if (Array.isArray(rawMeasurements)) {
        for (const item of rawMeasurements) {
            const key =
                item?.fieldName ||
                item?.name ||
                item?.field?.name ||
                item?.fieldId;
            assign(key, item?.value);
        }

        return normalized;
    }

    if (rawMeasurements && typeof rawMeasurements === "object") {
        Object.entries(rawMeasurements).forEach(([key, value]) => {
            assign(key, value);
        });
    }

    return normalized;
}

function normalizeVariantInput(variant, allowedMeasurementKeys = null) {
    const normalizedMeasurements = normalizeVariantMeasurementMap(
        variant?.measurements,
        allowedMeasurementKeys,
    );

    return {
        ...variant,
        measurements: normalizedMeasurements,
    };
}

function getProductMeasurementFields(product) {
    if (Array.isArray(product?.measurementFields)) {
        const mapped = product.measurementFields.map((field, index) => ({
            id: field.id,
            productId: field.productId,
            name: field.name,
            displayName: field.displayName || field.name,
            unit: field.unit,
            position: Number.isFinite(Number(field.position))
                ? Number(field.position)
                : index,
            createdAt: field.createdAt,
            updatedAt: field.updatedAt,
        }));

        if (mapped.length > 0) {
            return mapped.sort((a, b) => a.position - b.position);
        }
    }

    return [];
}

function transformVariantMeasurements(variant, fields) {
    return (
        Array.isArray(variant.measurements)
            ? variant.measurements.map((measurement) => ({
                  id: measurement.id,
                  fieldId: measurement.fieldId,
                  value: measurement.value,
                  createdAt: measurement.createdAt,
                  updatedAt: measurement.updatedAt,
                  field: measurement.field
                      ? {
                            id: measurement.field.id,
                            name: measurement.field.name,
                            displayName:
                                measurement.field.displayName ||
                                measurement.field.name,
                            unit: measurement.field.unit,
                            position: measurement.field.position,
                        }
                      : undefined,
              }))
            : []
    ).sort((a, b) => {
        const posA = Number(a.field?.position ?? 9999);
        const posB = Number(b.field?.position ?? 9999);
        return posA - posB;
    });
}

function transformProductResponse(product) {
    if (!product) return product;

    const measurementFields = getProductMeasurementFields(product);

    return {
        ...product,
        measurementFields,
        variants: Array.isArray(product.variants)
            ? product.variants.map((variant) => {
                  const {
                      bust,
                      waist,
                      length,
                      sleeve,
                      height,
                      ...restVariant
                  } = variant;

                  return {
                      ...restVariant,
                      measurements: transformVariantMeasurements(
                          variant,
                          measurementFields,
                      ),
                  };
              })
            : [],
    };
}

function isSlugUniqueConstraintError(error) {
    return (
        error?.code === "P2002" &&
        Array.isArray(error?.meta?.target) &&
        error.meta.target.includes("slug")
    );
}

// get all
export async function getAllProducts({
    statusFilter,
    search,
    skip,
    limit,
    sortBy,
    sortOrder,
    collectionSlugs = [],
    categorySlugs = [],
    kainNames = [],
}) {
    const result = await findAllProducts(
        statusFilter,
        search,
        skip,
        limit,
        sortBy,
        sortOrder,
        collectionSlugs,
        categorySlugs,
        kainNames,
    );

    return {
        ...result,
        products: await attachProductPricing(result.products),
    };
}

export async function getSuggestedProducts(statusFilter, limit) {
    const products = await findSuggestedProducts(statusFilter, limit);
    return attachProductPricing(products);
}

export async function getSaleProducts({ skip, limit }) {
    return findSaleProducts({ skip, limit });
}

// get by id
export async function getProduct(id) {
    const product = await findProductById(id);
    if (!product) throw new Error("Product not found");
    const [enriched] = await attachProductPricing([product]);
    return transformProductResponse(enriched);
}

// get by slug
export async function getProductSlug(slug) {
    const product = await findProductBySlug(slug);
    if (!product) throw new Error("Product not found");
    const [enriched] = await attachProductPricing([product]);
    return transformProductResponse(enriched);
}

// create
export async function createProduct(data) {
    const {
        title,
        description,
        details,
        delivery,
        price,
        stock,
        sku,
        imageUrl,
        categoryId,
        collectionId,
        images,
        variants,
        measurementFields,
        status,
        kainId,
        modelHeight,
        modelWeight,
    } = data;

    if (!title || title.trim().length < 3)
        throw new Error("Title is required and must be at least 3 characters");

    if (!price || isNaN(price))
        throw new Error("Price is required and must be a valid number");

    // Generate unique slug
    let slug = slugify(title, { lower: true, strict: true });
    let existing = await findProductBySlug(slug);
    let counter = 1;

    // If slug exists, append counter until we find a unique one
    while (existing) {
        slug = `${slugify(title, { lower: true, strict: true })}-${counter}`;
        existing = await findProductBySlug(slug);
        counter++;
    }

    const normalizedMeasurementFields =
        measurementFields !== undefined
            ? normalizeMeasurementFieldsInput(measurementFields)
            : undefined;

    const allowedMeasurementKeys = normalizedMeasurementFields
        ? new Set(normalizedMeasurementFields.map((field) => field.name))
        : null;

    const normalizedVariants = Array.isArray(variants)
        ? variants.map((variant) =>
              normalizeVariantInput(variant, allowedMeasurementKeys),
          )
        : variants;

    const totalStock = Array.isArray(normalizedVariants)
        ? normalizedVariants.reduce((sum, v) => sum + (Number(v.stock) || 0), 0)
        : 0;

    const created = await insertProduct({
        title: title.trim(),
        slug,
        description: description,
        details: details ?? null,
        delivery: delivery ?? null,
        price,
        stock: totalStock,
        sku: sku ?? null,
        imageUrl: imageUrl,
        categoryId: categoryId,
        collectionId: collectionId,
        status: status ?? true,
        images: images ? { create: images } : undefined,
        variants: normalizedVariants
            ? { create: normalizedVariants }
            : undefined,
        measurementFields: normalizedMeasurementFields,
        kainId,
        modelHeight: modelHeight ?? null,
        modelWeight: modelWeight ?? null,
    });

    return transformProductResponse(created);
}

// update
export async function updateProduct(id, data) {
    const {
        title,
        description,
        details,
        delivery,
        price,
        sku,
        imageUrl,
        categoryId,
        collectionId,
        images,
        variants,
        measurementFields,
        status,
        kainId,
        modelHeight,
        modelWeight,
    } = data;

    const existing = await findProductById(id);
    if (!existing) throw new Error("Product not found");

    const updateData = {};

    if (title) {
        if (title.trim().length < 3)
            throw new Error("Title must be at least 3 characters");
        updateData.title = title.trim();

        // Generate unique slug if title is changed
        let newSlug = slugify(title, { lower: true, strict: true });

        // Only check for duplicates if slug is different from current
        if (newSlug !== existing.slug) {
            let slugExists = await findProductBySlug(newSlug);
            let counter = 1;

            // If slug exists, append counter until we find a unique one
            while (slugExists) {
                newSlug = `${slugify(title, { lower: true, strict: true })}-${counter}`;
                slugExists = await findProductBySlug(newSlug);
                counter++;
            }
        }

        updateData.slug = newSlug;
    }

    if (description !== undefined) updateData.description = description;
    if (details !== undefined) updateData.details = details;
    if (delivery !== undefined) updateData.delivery = delivery;

    if (price !== undefined) {
        const parsed = Number(price);
        if (isNaN(parsed)) throw new Error("Price must be a valid number");
        updateData.price = parsed;
    }

    if (sku !== undefined) updateData.sku = sku;
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl;
    if (categoryId !== undefined) updateData.categoryId = categoryId;
    if (collectionId !== undefined) updateData.collectionId = collectionId;
    if (status !== undefined) updateData.status = status;

    if (kainId !== undefined) updateData.kainId = kainId;

    if (modelHeight !== undefined) updateData.modelHeight = modelHeight;
    if (modelWeight !== undefined) updateData.modelWeight = modelWeight;

    const normalizedMeasurementFields =
        measurementFields !== undefined
            ? normalizeMeasurementFieldsInput(measurementFields)
            : undefined;

    const allowedMeasurementKeys = normalizedMeasurementFields
        ? new Set(normalizedMeasurementFields.map((field) => field.name))
        : null;

    const normalizedVariants = Array.isArray(variants)
        ? variants.map((variant) =>
              normalizeVariantInput(variant, allowedMeasurementKeys),
          )
        : variants;

    const totalStock =
        Array.isArray(normalizedVariants) && normalizedVariants.length > 0
            ? normalizedVariants.reduce(
                  (sum, v) => sum + (Number(v.stock) || 0),
                  0,
              )
            : existing.variants.reduce((sum, v) => sum + (v.stock || 0), 0);

    updateData.stock = totalStock;

    const relationalData = {
        images,
        variants: normalizedVariants,
        measurementFields: normalizedMeasurementFields,
    };

    try {
        const updated = await updateProductData(id, updateData, relationalData);
        return transformProductResponse(updated);
    } catch (error) {
        if (updateData.slug && isSlugUniqueConstraintError(error)) {
            updateData.slug = `${updateData.slug}-${id}`;
            const retried = await updateProductData(
                id,
                updateData,
                relationalData,
            );
            return retried;
        }
        throw error;
    }
}

// delete
export async function removeProduct(id) {
    return deleteProductData(id);
}
