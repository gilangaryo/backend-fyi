import prisma from '../../prisma/client.js';

// ambil semua kategori
export async function findAllCategories() {
    return prisma.category.findMany({
        orderBy: { createdAt: 'desc' },
    });
}

// ambil kategori by id
export async function findCategoryById(id) {
    return prisma.category.findUnique({ where: { id } });
}

// ambil kategori by slug
export async function findCategoryBySlug(slug) {
    return prisma.category.findUnique({ where: { slug } });
}

// buat kategori baru
export async function insertCategory(data) {
    return prisma.category.create({ data });
}

// update kategori
export async function updateCategoryData(id, data) {
    return prisma.category.update({
        where: { id },
        data,
    });
}

// hapus kategori
export async function deleteCategoryData(id) {
    return prisma.category.delete({ where: { id } });
}
