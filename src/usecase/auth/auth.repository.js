import prisma from '../../prisma/client.js';

export const AuthRepository = {
    findByEmail: (email) =>
        prisma.user.findUnique({ where: { email } }),

    createUser: (data) =>
        prisma.user.create({ data }),

    updateRefreshToken: (userId, refreshToken) =>
        prisma.user.update({
            where: { id: userId },
            data: { refreshToken },
        }),
};
