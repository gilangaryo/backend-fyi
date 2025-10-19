import slugify from 'slugify'
import { Prisma } from '@prisma/client'
import {
    findAllProducts,
    findProductById,
    findProductBySlug,
    insertProduct,
    updateProductData,
    deleteProductData,
    findSuggestedProducts
} from './product.repository.js'

// get all
export async function getAllProducts(statusFilter) {
    return findAllProducts(statusFilter)
}
export async function getSuggestedProducts(statusFilter, limit) {
    return findSuggestedProducts(statusFilter, limit)
}

// get by id
export async function getProduct(id) {
    const product = await findProductById(id)
    if (!product) throw new Error('Product not found')
    return product
}

// get by slug
export async function getProductSlug(slug) {
    const product = await findProductBySlug(slug)
    if (!product) throw new Error('Product not found')
    return product
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
    } = data

    if (!title || title.trim().length < 3)
        throw new Error('Title is required and must be at least 3 characters')

    if (!price || isNaN(price))
        throw new Error('Price is required and must be a valid number')

    const slug = slugify(title, { lower: true, strict: true })
    const existing = await findProductBySlug(slug)
    if (existing) throw new Error('Product with this title already exists')

    return insertProduct({
        title: title.trim(),
        slug,
        description: description,
        details: details ?? null,
        delivery: delivery ?? null,
        price,
        stock: stock ?? 0,
        sku: sku ?? null,
        imageUrl: imageUrl,
        categoryId: categoryId,
        collectionId: collectionId,
        status: status ?? true,
        images: images ? { create: images } : undefined,
        variants: variants ? { create: variants } : undefined,
    })
}

// update
export async function updateProduct(id, data) {
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
    } = data;

    const existing = await findProductById(id);
    if (!existing) throw new Error('Product not found');

    const updateData = {};

    if (title) {
        if (title.trim().length < 3) throw new Error('Title must be at least 3 characters');
        updateData.title = title.trim();
        updateData.slug = slugify(title, { lower: true, strict: true });
    }
    if (description !== undefined) updateData.description = description;
    if (details !== undefined) updateData.details = details;
    if (delivery !== undefined) updateData.delivery = delivery;
    if (price !== undefined) {
        const parsed = Number(price);
        if (isNaN(parsed)) throw new Error('Price must be a valid number');
        updateData.price = parsed;
    }
    if (stock !== undefined) updateData.stock = stock;
    if (sku !== undefined) updateData.sku = sku;
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl;
    if (categoryId !== undefined) updateData.categoryId = categoryId;
    if (collectionId !== undefined) updateData.collectionId = collectionId;
    if (status !== undefined) updateData.status = status;

    const relationalData = { images, variants };

    return updateProductData(id, updateData, relationalData);
}


// delete
export async function removeProduct(id) {
    return deleteProductData(id)
}
