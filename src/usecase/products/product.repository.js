import prisma from '../../prisma/client.js';

// ambil semua produk
export async function findAllProducts(statusFilter, search, skip = 0, limit = 12) {
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
    }

    const [total, products] = await prisma.$transaction([
        prisma.product.count({ where: whereClause }),
        prisma.product.findMany({
            where: whereClause,
            skip,
            take: limit,
            orderBy: { createdAt: 'desc' },
            include: {
                variants: true,
                images: true,
                category: true,
                collection: true,
                kain: true,
            },
        }),
    ])

    return { products, total }
}


export async function findSuggestedProducts(statusFilter, limit) {
    const totalCount = await prisma.product.count({
        where: statusFilter !== undefined ? { status: statusFilter } : {},
    })

    if (totalCount === 0) return []

    const randomOffset = Math.max(0, Math.floor(Math.random() * Math.max(totalCount - limit, 0)))

    const products = await prisma.product.findMany({
        where: statusFilter !== undefined ? { status: statusFilter } : {},
        skip: randomOffset,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
            images: {
                select: { id: true, imageUrl: true, isPrimary: true },
            },
            category: {
                select: { id: true, title: true, slug: true },
            },
            collection: {
                select: { id: true, title: true, slug: true },
            },
        },
    })

    if (products.length < limit && totalCount > limit) {
        const extra = await prisma.product.findMany({
            where: statusFilter !== undefined ? { status: statusFilter } : {},
            take: limit - products.length,
            orderBy: { createdAt: "desc" },
            include: {
                images: {
                    select: { id: true, imageUrl: true, isPrimary: true },
                },
                category: {
                    select: { id: true, title: true, slug: true },
                },
                collection: {
                    select: { id: true, title: true, slug: true },
                },
            },
        })
        return [...products, ...extra]
    }

    return products
}

// ambil produk by id
export async function findProductById(id) {
    return prisma.product.findUnique({
        where: { id },
        include: {
            variants: true,
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
            variants: true,
            images: true,
            category: true,
            collection: true,
        },
    });
}

// buat produk baru
export async function insertProduct(data) {
    return prisma.product.create({
        data,
        include: { images: true, variants: true },
    });
}

// update produk
export async function updateProductData(id, data, relationalData = {}) {
    const { images, variants } = relationalData;

    return prisma.$transaction(async (tx) => {
        const updated = await tx.product.update({
            where: { id },
            data,
            include: { images: true, variants: true },
        });

        if (images !== undefined) {
            await tx.productImage.deleteMany({ where: { productId: id } });
            if (images.length > 0) {
                await tx.productImage.createMany({
                    data: images.map((img) => ({
                        productId: id,
                        imageUrl: img.imageUrl,
                        isPrimary: img.isPrimary || false,
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
            await tx.productVariant.deleteMany({ where: { productId: id } });
            const cleanVariants = variants.filter(v => v.size?.trim() !== "");

            if (cleanVariants.length > 0) {
                await tx.productVariant.createMany({
                    data: cleanVariants.map((v) => ({
                        productId: id,
                        size: v.size || null,
                        color: v.color || null,
                        stock: v.stock ?? 0,
                        sku: v.sku || null,
                        bust: v.bust || null,
                        waist: v.waist || null,
                        length: v.length || null,
                        sleeve: v.sleeve || null,
                        height: v.height || null,
                    })),
                });
            }

        }


        return tx.product.findUnique({
            where: { id },
            include: {
                images: true,
                variants: true,
                category: true,
                collection: true,
            },
        });
    });
}
// hapus produk
export async function deleteProductData(id) {
    return prisma.product.delete({ where: { id } });
}
