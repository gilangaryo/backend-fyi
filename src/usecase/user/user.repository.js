import prisma from '../../prisma/client.js';

export const userRepository = {
    async findAll() {
        return prisma.user.findMany({
            orderBy: { createdAt: 'desc' },
        });
    },

    async findByRole(role) {
        return prisma.user.findMany({
            where: { role },
            orderBy: { createdAt: 'desc' },
        });
    },

    async findById(id) {
        return prisma.user.findUnique({
            where: { id },
        });
    },

    async findByEmail(email) {
        return prisma.user.findUnique({
            where: { email },
        });
    },

    async create(data) {
        return prisma.user.create({
            data: {
                name: data.name,
                email: data.email,
                password: data.password,
                role: data.role,
            },
        });
    },

    async updateRole(id, role) {
        return prisma.user.update({
            where: { id },
            data: { role },
        });
    },

    async delete(id) {
        return prisma.user.delete({
            where: { id },
        });
    },
};