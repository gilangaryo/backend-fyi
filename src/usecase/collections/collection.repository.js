import prisma from '../../prisma/client.js';

// ambil semua collection
export async function findAllCollections(status = undefined) {
    return prisma.collection.findMany({
        where: { status },
        orderBy: { createdAt: 'desc' },
        include: {
            products: {
                include: {
                    images: {
                        select: { imageUrl: true, isPrimary: true },
                    },
                },
            },
        },
    });
}


// ambil collection by id
export async function findCollectionById(id) {
    return prisma.collection.findUnique({
        where: { id },
        include: { products: true },
    });
}

// ambil collection by slug
export async function findCollectionBySlug(slug) {
    return prisma.collection.findUnique({
        where: { slug },
        include: { products: true },
    });
}

// buat collection baru
export async function insertCollection(data) {
    return prisma.collection.create({ data });
}

// update collection
export async function updateCollectionData(id, data) {
    return prisma.collection.update({
        where: { id },
        data,
    });
}

// hapus collection
export async function deleteCollectionData(id) {
    return prisma.collection.delete({
        where: { id },
    });
}


export async function updateCollectionStatusData(id, status) {
    return prisma.collection.update({
        where: { id },
        data: { status },
    });
}
