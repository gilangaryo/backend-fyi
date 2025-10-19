import prisma from '../../prisma/client.js';

export const settingRepository = {
    async findAll() {
        return prisma.setting.findMany({
            orderBy: { createdAt: 'desc' },
        })
    },

    async findByKey(key) {
        return prisma.setting.findUnique({ where: { key } })
    },

    async upsert(key, data) {
        return prisma.setting.upsert({
            where: { key },
            update: data,
            create: { key, ...data },
        })
    },

    async deleteByKey(key) {
        return prisma.setting.delete({ where: { key } })
    },
}
