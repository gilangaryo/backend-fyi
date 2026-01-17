import prisma from "../../prisma/client.js";
import dayjs from "dayjs";

const getDateRange = (period) => {
    const now = dayjs();

    switch (period) {
        case "today":
            return {
                start: now.startOf("day").toDate(),
                end: now.endOf("day").toDate(),
                prevStart: now.subtract(1, "day").startOf("day").toDate(),
                prevEnd: now.subtract(1, "day").endOf("day").toDate(),
            };
        case "yesterday":
            return {
                start: now.subtract(1, "day").startOf("day").toDate(),
                end: now.subtract(1, "day").endOf("day").toDate(),
                prevStart: now.subtract(2, "day").startOf("day").toDate(),
                prevEnd: now.subtract(2, "day").endOf("day").toDate(),
            };
        case "this_week":
            return {
                start: now.startOf("week").toDate(),
                end: now.toDate(),
                prevStart: now.subtract(1, "week").startOf("week").toDate(),
                prevEnd: now.subtract(1, "week").endOf("week").toDate(),
            };
        case "last_week":
            return {
                start: now.subtract(1, "week").startOf("week").toDate(),
                end: now.subtract(1, "week").endOf("week").toDate(),
                prevStart: now.subtract(2, "week").startOf("week").toDate(),
                prevEnd: now.subtract(2, "week").endOf("week").toDate(),
            };
        case "last_60_days":
            return {
                start: now.subtract(60, "day").toDate(),
                end: now.toDate(),
                prevStart: now.subtract(120, "day").toDate(),
                prevEnd: now.subtract(60, "day").toDate(),
            };
        case "last_30_days":
        default:
            return {
                start: now.subtract(30, "day").toDate(),
                end: now.toDate(),
                prevStart: now.subtract(60, "day").toDate(),
                prevEnd: now.subtract(30, "day").toDate(),
            };
    }
};

export const getDashboardSummary = async (req, res) => {
    try {
        const { period = "last_30_days" } = req.query;
        const dateRange = getDateRange(period);

        const [currentOrders, prevOrders] = await Promise.all([
            prisma.order.findMany({
                where: {
                    createdAt: {
                        gte: dateRange.start,
                        lte: dateRange.end,
                    },
                    status: { not: "DRAFT" },
                },
                select: { total: true },
            }),
            prisma.order.findMany({
                where: {
                    createdAt: {
                        gte: dateRange.prevStart,
                        lte: dateRange.prevEnd,
                    },
                    status: { not: "DRAFT" },
                },
                select: { total: true },
            }),
        ]);

        const currentTotal = currentOrders.reduce(
            (a, b) => a + Number(b.total),
            0
        );
        const prevTotal = prevOrders.reduce((a, b) => a + Number(b.total), 0);

        const calcChange = (curr, prev) => {
            if (prev === 0) return curr > 0 ? 100 : 0;
            const diff = ((curr - prev) / prev) * 100;
            return Number(diff.toFixed(1));
        };

        res.json({
            success: true,
            data: {
                totalOrders: currentOrders.length,
                totalRevenue: currentTotal,
                totalProducts: await prisma.product.count(),
                orderChange: calcChange(
                    currentOrders.length,
                    prevOrders.length
                ),
                revenueChange: calcChange(currentTotal, prevTotal),
                productChange: 0,
            },
        });
    } catch (err) {
        console.error("❌ Dashboard Summary Error:", err);
        res.status(500).json({ success: false, message: err.message });
    }
};
