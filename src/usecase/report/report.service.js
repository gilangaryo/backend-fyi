import { reportRepository } from "./report.repository.js";

const getDateRange = (period, startDate, endDate) => {
    const now = new Date();
    let start, end;

    if (period === "custom" && startDate && endDate) {
        start = new Date(startDate);
        end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
    } else {
        switch (period) {
            case "today":
                start = new Date(now.setHours(0, 0, 0, 0));
                end = new Date(now.setHours(23, 59, 59, 999));
                break;
            case "last7days":
                start = new Date(now.setDate(now.getDate() - 7));
                start.setHours(0, 0, 0, 0);
                end = new Date();
                break;
            case "last30days":
                start = new Date(now.setDate(now.getDate() - 30));
                start.setHours(0, 0, 0, 0);
                end = new Date();
                break;
            case "thisMonth":
                start = new Date(now.getFullYear(), now.getMonth(), 1);
                end = new Date();
                break;
            case "lastMonth":
                start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                end = new Date(
                    now.getFullYear(),
                    now.getMonth(),
                    0,
                    23,
                    59,
                    59,
                    999,
                );
                break;
            default:
                start = new Date(now.setDate(now.getDate() - 30));
                end = new Date();
        }
    }

    return { start, end };
};

export const reportService = {
    async getSalesReport(period, startDate, endDate) {
        const { start, end } = getDateRange(period, startDate, endDate);

        // Status yang dianggap sebagai penjualan valid (bukan DRAFT, CANCELLED, dll)
        const validSalesStatuses = ["NEW", "PACKED", "SHIPPED", "DELIVERED"];

        // Get all orders in date range
        const orders = await reportRepository.getOrdersByDateRange(
            start,
            end,
            validSalesStatuses,
        );

        // Calculate gross sales (total dari semua order)
        const grossSales = orders.reduce(
            (sum, order) => sum + parseFloat(order.total),
            0,
        );

        // Calculate total discounts yang sudah diaplikasikan
        const discount = orders.reduce((sum, order) => {
            if (order.discountTotal) {
                return sum + parseFloat(order.discountTotal);
            }

            if (order.discountId && order.discount) {
                // Hitung discount amount berdasarkan type
                let discountAmount = 0;
                const orderSubTotal = parseFloat(order.subTotal);

                if (order.discount.type === "PERCENT") {
                    discountAmount =
                        (orderSubTotal * parseFloat(order.discount.value)) /
                        100;
                } else if (order.discount.type === "VALUE") {
                    discountAmount = parseFloat(order.discount.value);
                }
                return sum + discountAmount;
            }
            return sum;
        }, 0);

        // Get refunded/cancelled orders
        const refunds = await reportRepository.getRefundedOrdersCount(
            start,
            end,
        );
        const shippingCosts = await reportRepository.getShippingCostOrdersCount(
            start,
            end,
        );

        // Calculate net sales (gross - discount)
        const netSales = grossSales - discount;

        // calculate expense (total ongkir)
        const expense = Math.round(
            shippingCosts.reduce(
                (sum, order) => sum + parseFloat(order.shippingCost),
                0,
            ),
        );

        const totalCollected = netSales - expense;

        return {
            grossSales: Math.round(grossSales),
            discount: Math.round(discount),
            refunds,
            netSales: Math.round(netSales),
            expense: Math.round(expense),
            totalCollected: Math.round(totalCollected),
            period: {
                start: start.toISOString(),
                end: end.toISOString(),
            },
        };
    },

    async getOrderStatistics(period, startDate, endDate) {
        const { start, end } = getDateRange(period, startDate, endDate);

        const orders = await reportRepository.getOrderStatistics(start, end);

        const statistics = {
            totalOrders: orders.length,
            draft: orders.filter((o) => o.status === "DRAFT").length,
            new: orders.filter((o) => o.status === "NEW").length,
            packed: orders.filter((o) => o.status === "PACKED").length,
            shipped: orders.filter((o) => o.status === "SHIPPED").length,
            delivered: orders.filter((o) => o.status === "DELIVERED").length,
            cancelled: orders.filter((o) => o.status === "CANCELLED").length,
            returned: orders.filter((o) => o.status === "RETURNED").length,
            refunded: orders.filter((o) => o.status === "REFUNDED").length,
            expired: orders.filter((o) => o.status === "EXPIRED").length,
        };

        return statistics;
    },

    getDateRange,
};
