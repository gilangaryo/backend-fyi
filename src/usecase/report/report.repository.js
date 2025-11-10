import prisma from '../../prisma/client.js';

export const reportRepository = {
    async getOrdersByDateRange(startDate, endDate, statuses) {
        return prisma.order.findMany({
            where: {
                createdAt: {
                    gte: startDate,
                    lte: endDate,
                },
                status: {
                    in: statuses,
                },
            },
            include: {
                discount: true,
            },
        });
    },

    async getRefundedOrdersCount(startDate, endDate) {
        return prisma.order.count({
            where: {
                createdAt: {
                    gte: startDate,
                    lte: endDate,
                },
                status: {
                    in: ['CANCELLED', 'RETURNED', 'REFUNDED'],
                },
            },
        });
    },

    async getOrderStatistics(startDate, endDate) {
        const orders = await prisma.order.findMany({
            where: {
                createdAt: {
                    gte: startDate,
                    lte: endDate,
                },
            },
            include: {
                discount: true,
            },
        });

        return orders;
    },

    async getTotalOrdersByStatus(status, startDate, endDate) {
        return prisma.order.count({
            where: {
                status,
                createdAt: {
                    gte: startDate,
                    lte: endDate,
                },
            },
        });
    },

    async getRevenueByDateRange(startDate, endDate, statuses) {
        const result = await prisma.order.aggregate({
            where: {
                createdAt: {
                    gte: startDate,
                    lte: endDate,
                },
                status: {
                    in: statuses,
                },
            },
            _sum: {
                total: true, // Sesuai schema: field `total`, bukan `totalAmount`
            },
        });

        return result._sum.total || 0;
    },
};