import prisma from '../../prisma/client.js';

export const discountRepository = {
    async findAll() {
        return prisma.discount.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                _count: {
                    select: { orders: true }
                }
            }
        });
    },

    async findById(id) {
        return prisma.discount.findUnique({
            where: { id },
            include: {
                _count: {
                    select: { orders: true }
                }
            }
        });
    },

    async findByCode(code) {
        return prisma.discount.findUnique({
            where: { code: code.toUpperCase() },
        });
    },

    async create(data) {
        return prisma.discount.create({
            data: {
                title: data.title,
                code: data.code.toUpperCase(),
                type: data.type,
                value: data.value,
                expiresAt: new Date(data.expiresAt),
                minimumOrderAmount: data.minimumOrderAmount || null,
            },
        });
    },

    async update(id, data) {
        const updateData = {};

        if (data.title !== undefined) updateData.title = data.title;
        if (data.code !== undefined) updateData.code = data.code.toUpperCase();
        if (data.type !== undefined) updateData.type = data.type;
        if (data.value !== undefined) updateData.value = data.value;
        if (data.expiresAt !== undefined) updateData.expiresAt = new Date(data.expiresAt);
        if (data.minimumOrderAmount !== undefined) updateData.minimumOrderAmount = data.minimumOrderAmount;

        return prisma.discount.update({
            where: { id },
            data: updateData,
        });
    },

    async delete(id) {
        return prisma.discount.delete({
            where: { id },
        });
    },

    async incrementUsedCount(id) {
        return prisma.discount.update({
            where: { id },
            data: {
                usedCount: {
                    increment: 1,
                },
            },
        });
    },

    async checkCodeExists(code, excludeId = null) {
        const where = { code: code.toUpperCase() };
        if (excludeId) {
            where.id = { not: excludeId };
        }

        const existing = await prisma.discount.findUnique({ where: { code: code.toUpperCase() } });
        if (existing && existing.id !== excludeId) {
            return true;
        }
        return false;
    },

    async updateStatus(id, status) {
        return prisma.discount.update({
            where: { id },
            data: { status },
        });
    }

};