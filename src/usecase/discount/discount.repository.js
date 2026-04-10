import prisma from "../../prisma/client.js";

const discountInclude = {
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
                    collectionId: true,
                },
            },
        },
    },
    _count: {
        select: { orders: true },
    },
};

function buildCreateTargetRelations(data) {
    const payload = {};

    if (data.collectionIds !== undefined) {
        payload.collectionTargets = {
            create: (data.collectionIds || []).map((collectionId) => ({
                collectionId,
            })),
        };
    }

    if (data.productIds !== undefined) {
        payload.productTargets = {
            create: (data.productIds || []).map((productId) => ({
                productId,
            })),
        };
    }

    return payload;
}

function buildUpdateTargetRelations(data) {
    const payload = {};

    if (data.collectionIds !== undefined) {
        payload.collectionTargets = {
            deleteMany: {},
            create: (data.collectionIds || []).map((collectionId) => ({
                collectionId,
            })),
        };
    }

    if (data.productIds !== undefined) {
        payload.productTargets = {
            deleteMany: {},
            create: (data.productIds || []).map((productId) => ({
                productId,
            })),
        };
    }

    return payload;
}

export const discountRepository = {
    async findAll() {
        return prisma.discount.findMany({
            orderBy: { createdAt: "desc" },
            include: discountInclude,
        });
    },

    async findById(id) {
        return prisma.discount.findUnique({
            where: { id },
            include: discountInclude,
        });
    },

    async findByCode(code) {
        return prisma.discount.findUnique({
            where: { code: code.toUpperCase() },
            include: discountInclude,
        });
    },

    async create(data) {
        return prisma.discount.create({
            data: {
                title: data.title,
                code: data.code.toUpperCase(),
                kind: data.kind,
                type: data.type,
                value: data.value,
                startsAt: data.startsAt ? new Date(data.startsAt) : null,
                expiresAt: new Date(data.expiresAt),
                priority: data.priority ?? 100,
                minimumOrderAmount: data.minimumOrderAmount || null,
                minimumQty: data.minimumQty ?? null,
                combinableWith: data.combinableWith || null,
                autoApply: data.autoApply ?? false,
                status: data.status ?? true,
                ...buildCreateTargetRelations(data),
            },
            include: discountInclude,
        });
    },

    async update(id, data) {
        const updateData = {};

        if (data.title !== undefined) updateData.title = data.title;
        if (data.code !== undefined) updateData.code = data.code.toUpperCase();
        if (data.kind !== undefined) updateData.kind = data.kind;
        if (data.type !== undefined) updateData.type = data.type;
        if (data.value !== undefined) updateData.value = data.value;
        if (data.startsAt !== undefined)
            updateData.startsAt = data.startsAt
                ? new Date(data.startsAt)
                : null;
        if (data.expiresAt !== undefined)
            updateData.expiresAt = new Date(data.expiresAt);
        if (data.minimumOrderAmount !== undefined)
            updateData.minimumOrderAmount = data.minimumOrderAmount;
        if (data.minimumQty !== undefined)
            updateData.minimumQty = data.minimumQty;
        if (data.priority !== undefined) updateData.priority = data.priority;
        if (data.combinableWith !== undefined)
            updateData.combinableWith = data.combinableWith;
        if (data.autoApply !== undefined) updateData.autoApply = data.autoApply;
        if (data.status !== undefined) updateData.status = data.status;

        Object.assign(updateData, buildUpdateTargetRelations(data));

        return prisma.discount.update({
            where: { id },
            data: updateData,
            include: discountInclude,
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

        const existing = await prisma.discount.findUnique({
            where: { code: code.toUpperCase() },
        });
        if (existing && existing.id !== excludeId) {
            return true;
        }
        return false;
    },

    async updateStatus(id, status) {
        return prisma.discount.update({
            where: { id },
            data: { status },
            include: discountInclude,
        });
    },
};
