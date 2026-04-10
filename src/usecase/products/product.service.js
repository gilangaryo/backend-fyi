import slugify from "slugify";
import {
    findAllProducts,
    findProductById,
    findProductBySlug,
    insertProduct,
    updateProductData,
    deleteProductData,
    findSuggestedProducts,
} from "./product.repository.js";
import { attachProductPricing } from "../../lib/promo-engine/promo-engine.js";

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

// get by id
export async function getProduct(id) {
    const product = await findProductById(id);
    if (!product) throw new Error("Product not found");
    const [enriched] = await attachProductPricing([product]);
    return enriched;
}

// get by slug
export async function getProductSlug(slug) {
    const product = await findProductBySlug(slug);
    if (!product) throw new Error("Product not found");
    const [enriched] = await attachProductPricing([product]);
    return enriched;
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
        status,
        kainId,
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

    const totalStock = Array.isArray(variants)
        ? variants.reduce((sum, v) => sum + (Number(v.stock) || 0), 0)
        : 0;

    return insertProduct({
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
        variants: variants ? { create: variants } : undefined,
        kainId,
    });
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
        status,
        kainId,
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

    const totalStock =
        Array.isArray(variants) && variants.length > 0
            ? variants.reduce((sum, v) => sum + (Number(v.stock) || 0), 0)
            : existing.variants.reduce((sum, v) => sum + (v.stock || 0), 0);

    updateData.stock = totalStock;

    const relationalData = { images, variants };

    try {
        const updated = await updateProductData(id, updateData, relationalData);
        return updated;
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
