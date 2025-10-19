import prisma from "../../prisma/client.js";
import dayjs from "dayjs";

export const getDashboardSummary = async (req, res) => {
    try {
        const now = dayjs();
        const startThisPeriod = now.subtract(30, "day").toDate();
        const startPrevPeriod = now.subtract(60, "day").toDate();

        const [currentOrders, prevOrders] = await Promise.all([
            prisma.order.findMany({
                where: { createdAt: { gte: startThisPeriod } },
                select: { total: true },
            }),
            prisma.order.findMany({
                where: { createdAt: { gte: startPrevPeriod, lt: startThisPeriod } },
                select: { total: true },
            }),
        ]);

        const currentTotal = currentOrders.reduce((a, b) => a + Number(b.total), 0);
        const prevTotal = prevOrders.reduce((a, b) => a + Number(b.total), 0);

        const calcChange = (curr, prev) => {
            if (prev === 0) return 100;
            const diff = ((curr - prev) / prev) * 100;
            return Number(diff.toFixed(1));
        };

        res.json({
            success: true,
            data: {
                totalOrders: currentOrders.length,
                totalRevenue: currentTotal,
                totalProducts: await prisma.product.count(),
                orderChange: calcChange(currentOrders.length, prevOrders.length),
                revenueChange: calcChange(currentTotal, prevTotal),
                productChange: 0,
            },
        });
    } catch (err) {
        console.error("❌ Dashboard Summary Error:", err);
        res.status(500).json({ success: false, message: err.message });
    }
};
