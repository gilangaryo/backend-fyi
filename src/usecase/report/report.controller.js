import { reportService } from "./report.service.js";
import PDFDocument from "pdfkit";

export const reportController = {
    async getSalesReport(req, res, next) {
        try {
            const { period, startDate, endDate } = req.query;

            const report = await reportService.getSalesReport(
                period || "last30days",
                startDate,
                endDate
            );

            res.json({
                success: true,
                data: report,
            });
        } catch (err) {
            next(err);
        }
    },

    async getOrderStatistics(req, res, next) {
        try {
            const { period, startDate, endDate } = req.query;

            const statistics = await reportService.getOrderStatistics(
                period || "last30days",
                startDate,
                endDate
            );

            res.json({
                success: true,
                data: statistics,
            });
        } catch (err) {
            next(err);
        }
    },

    async downloadSalesReportPDF(req, res, next) {
        try {
            const { period, startDate, endDate } = req.query;

            const report = await reportService.getSalesReport(
                period || "last30days",
                startDate,
                endDate
            );

            // Create PDF
            const doc = new PDFDocument({ margin: 50, size: "A4" });

            // Set response headers
            res.setHeader("Content-Type", "application/pdf");
            res.setHeader(
                "Content-Disposition",
                `attachment; filename=sales-report-${new Date().toISOString().split("T")[0]}.pdf`
            );

            doc.pipe(res);

            // Color palette
            const colors = {
                primary: "#00ADF0",
                secondary: "#0A7594",
                dark: "#1a1a2e",
                gray: "#6b7280",
                lightGray: "#f3f4f6",
                white: "#ffffff",
                success: "#10b981",
                danger: "#ef4444",
                warning: "#f59e0b",
            };

            const pageWidth = doc.page.width - 100; // 50 margin each side

            // Helper functions
            const formatCurrency = (amount) => {
                return new Intl.NumberFormat("id-ID", {
                    style: "currency",
                    currency: "IDR",
                    minimumFractionDigits: 0,
                }).format(amount || 0);
            };

            const drawLine = (y, color = colors.lightGray) => {
                doc.strokeColor(color)
                    .lineWidth(1)
                    .moveTo(50, y)
                    .lineTo(50 + pageWidth, y)
                    .stroke();
            };

            // ==================== HEADER ====================
            // Header background
            doc.rect(0, 0, doc.page.width, 120).fill(colors.primary);

            // Company name
            doc.fillColor(colors.white)
                .fontSize(28)
                .font("Helvetica-Bold")
                .text("FYI Couture", 50, 35, { align: "center" });

            // Report title
            doc.fillColor(colors.white)
                .fontSize(14)
                .font("Helvetica")
                .text("Sales Summary Report", 50, 70, { align: "center" });

            // Period info
            const startDateFormatted = new Date(
                report.period.start
            ).toLocaleDateString("id-ID", {
                day: "numeric",
                month: "long",
                year: "numeric",
            });
            const endDateFormatted = new Date(
                report.period.end
            ).toLocaleDateString("id-ID", {
                day: "numeric",
                month: "long",
                year: "numeric",
            });

            doc.fillColor(colors.white)
                .fontSize(11)
                .text(`${startDateFormatted} - ${endDateFormatted}`, 50, 92, {
                    align: "center",
                });

            // ==================== SUMMARY CARDS ====================
            const cardY = 145;
            const cardWidth = (pageWidth - 20) / 3;
            const cardHeight = 70;

            const summaryCards = [
                {
                    label: "Total Orders",
                    value: report.totalOrders || "0",
                    color: colors.primary,
                },
                {
                    label: "Net Sales",
                    value: formatCurrency(report.netSales),
                    color: colors.secondary,
                },
                {
                    label: "Total Collected",
                    value: formatCurrency(report.totalCollected),
                    color: colors.success,
                },
            ];

            summaryCards.forEach((card, index) => {
                const x = 50 + index * (cardWidth + 10);

                // Card background
                doc.roundedRect(x, cardY, cardWidth, cardHeight, 8).fill(
                    colors.lightGray
                );

                // Card accent line
                doc.rect(x, cardY, 4, cardHeight).fill(card.color);

                // Card content
                doc.fillColor(colors.gray)
                    .fontSize(10)
                    .font("Helvetica")
                    .text(card.label, x + 15, cardY + 15, {
                        width: cardWidth - 20,
                    });

                doc.fillColor(colors.dark)
                    .fontSize(14)
                    .font("Helvetica-Bold")
                    .text(card.value, x + 15, cardY + 35, {
                        width: cardWidth - 20,
                    });
            });

            // ==================== SALES BREAKDOWN TABLE ====================
            const tableY = cardY + cardHeight + 40;

            // Section title
            doc.fillColor(colors.secondary)
                .fontSize(14)
                .font("Helvetica-Bold")
                .text("Sales Breakdown", 50, tableY);

            const tableStartY = tableY + 25;
            const colWidths = [pageWidth * 0.6, pageWidth * 0.4];
            const rowHeight = 35;

            // Table header
            doc.rect(50, tableStartY, pageWidth, rowHeight).fill(
                colors.primary
            );

            doc.fillColor(colors.white)
                .fontSize(11)
                .font("Helvetica-Bold")
                .text("Description", 60, tableStartY + 12)
                .text("Amount", 50 + colWidths[0] + 10, tableStartY + 12);

            // Table rows
            const tableData = [
                {
                    label: "Gross Sales",
                    value: formatCurrency(report.grossSales),
                    type: "normal",
                },
                {
                    label: "Discount",
                    value: `- ${formatCurrency(report.discount)}`,
                    type: "deduction",
                },
                {
                    label: "Refunds",
                    value: `- ${formatCurrency(report.refunds || 0)}`,
                    type: "deduction",
                },
                {
                    label: "Net Sales",
                    value: formatCurrency(report.netSales),
                    type: "subtotal",
                },
            ];

            tableData.forEach((row, index) => {
                const y = tableStartY + rowHeight + index * rowHeight;
                const isEven = index % 2 === 0;

                // Row background
                if (row.type === "subtotal") {
                    doc.rect(50, y, pageWidth, rowHeight).fill(
                        colors.secondary
                    );
                } else {
                    doc.rect(50, y, pageWidth, rowHeight).fill(
                        isEven ? colors.white : colors.lightGray
                    );
                }

                // Row content
                const textColor =
                    row.type === "subtotal" ? colors.white : colors.dark;
                const valueColor =
                    row.type === "deduction"
                        ? colors.danger
                        : row.type === "subtotal"
                          ? colors.white
                          : colors.dark;

                doc.fillColor(textColor)
                    .fontSize(11)
                    .font(
                        row.type === "subtotal" ? "Helvetica-Bold" : "Helvetica"
                    )
                    .text(row.label, 60, y + 12);

                doc.fillColor(valueColor)
                    .fontSize(11)
                    .font(
                        row.type === "subtotal" ? "Helvetica-Bold" : "Helvetica"
                    )
                    .text(row.value, 50 + colWidths[0] + 10, y + 12);
            });

            // ==================== EXPENSES TABLE ====================
            const expenseY =
                tableStartY + rowHeight + tableData.length * rowHeight + 30;

            // Section title
            doc.fillColor(colors.secondary)
                .fontSize(14)
                .font("Helvetica-Bold")
                .text("Expenses", 50, expenseY);

            const expenseTableY = expenseY + 25;

            // Expense table header
            doc.rect(50, expenseTableY, pageWidth, rowHeight).fill(
                colors.primary
            );

            doc.fillColor(colors.white)
                .fontSize(11)
                .font("Helvetica-Bold")
                .text("Description", 60, expenseTableY + 12)
                .text("Amount", 50 + colWidths[0] + 10, expenseTableY + 12);

            // Expense rows
            const expenseData = [
                {
                    label: "Courier Service",
                    value: formatCurrency(
                        report.expense || report.courierService || 0
                    ),
                },
                {
                    label: "Total Expenses",
                    value: formatCurrency(
                        report.expense ||
                            report.totalExpenses ||
                            report.expense ||
                            report.courierService ||
                            0
                    ),
                    type: "subtotal",
                },
            ];

            expenseData.forEach((row, index) => {
                const y = expenseTableY + rowHeight + index * rowHeight;
                const isEven = index % 2 === 0;

                // Row background
                if (row.type === "subtotal") {
                    doc.rect(50, y, pageWidth, rowHeight).fill(
                        colors.secondary
                    );
                } else {
                    doc.rect(50, y, pageWidth, rowHeight).fill(
                        isEven ? colors.white : colors.lightGray
                    );
                }

                // Row content
                const textColor =
                    row.type === "subtotal" ? colors.white : colors.dark;

                doc.fillColor(textColor)
                    .fontSize(11)
                    .font(
                        row.type === "subtotal" ? "Helvetica-Bold" : "Helvetica"
                    )
                    .text(row.label, 60, y + 12);

                const valueColor =
                    row.type === "subtotal" ? colors.white : colors.danger;

                doc.fillColor(valueColor)
                    .fontSize(11)
                    .font(
                        row.type === "subtotal" ? "Helvetica-Bold" : "Helvetica"
                    )
                    .text(row.value, 50 + colWidths[0] + 10, y + 12);
            });

            // ==================== TOTAL COLLECTED BOX ====================
            const totalBoxY =
                expenseTableY + rowHeight + expenseData.length * rowHeight + 30;

            // Total box background
            doc.roundedRect(50, totalBoxY, pageWidth, 80, 8).fill(
                colors.primary
            );

            // Net Profit calculation
            const totalExpenses =
                report.expenses?.total ||
                report.totalExpenses ||
                report.expenses?.courierService ||
                report.courierService ||
                0;
            const netProfit = (report.totalCollected || 0) - totalExpenses;

            doc.fillColor(colors.white)
                .fontSize(11)
                .font("Helvetica")
                .text("Total Collected", 70, totalBoxY + 12);

            doc.fillColor(colors.white)
                .fontSize(20)
                .font("Helvetica-Bold")
                .text(
                    formatCurrency(report.totalCollected),
                    70,
                    totalBoxY + 28
                );

            // Divider line
            doc.strokeColor("rgba(255,255,255,0.3)")
                .lineWidth(1)
                .moveTo(70, totalBoxY + 55)
                .lineTo(pageWidth + 30, totalBoxY + 55)
                .stroke();

            doc.fillColor(colors.white)
                .fontSize(10)
                .font("Helvetica")
                .text(
                    `Net Profit (after expenses): ${formatCurrency(netProfit)}`,
                    70,
                    totalBoxY + 62
                );

            // ==================== PAYMENT METHODS (if available) ====================
            let currentY = totalBoxY + 110;

            if (report.paymentMethods && report.paymentMethods.length > 0) {
                doc.fillColor(colors.secondary)
                    .fontSize(14)
                    .font("Helvetica-Bold")
                    .text("Payment Methods", 50, currentY);

                const paymentTableY = currentY + 25;

                // Payment table header
                doc.rect(50, paymentTableY, pageWidth, rowHeight).fill(
                    colors.secondary
                );

                doc.fillColor(colors.white)
                    .fontSize(11)
                    .font("Helvetica-Bold")
                    .text("Method", 60, paymentTableY + 12)
                    .text(
                        "Transactions",
                        50 + pageWidth * 0.4,
                        paymentTableY + 12
                    )
                    .text("Amount", 50 + pageWidth * 0.7, paymentTableY + 12);

                report.paymentMethods.forEach((method, index) => {
                    const y = paymentTableY + rowHeight + index * rowHeight;
                    const isEven = index % 2 === 0;

                    doc.rect(50, y, pageWidth, rowHeight).fill(
                        isEven ? colors.white : colors.lightGray
                    );

                    doc.fillColor(colors.dark)
                        .fontSize(11)
                        .font("Helvetica")
                        .text(method.name, 60, y + 12)
                        .text(
                            method.count.toString(),
                            50 + pageWidth * 0.4,
                            y + 12
                        )
                        .text(
                            formatCurrency(method.amount),
                            50 + pageWidth * 0.7,
                            y + 12
                        );
                });

                currentY =
                    paymentTableY +
                    rowHeight +
                    report.paymentMethods.length * rowHeight +
                    20;
            }

            // ==================== FOOTER ====================
            const footerY = doc.page.height - 80;

            drawLine(footerY, colors.lightGray);

            doc.fillColor(colors.gray)
                .fontSize(9)
                .font("Helvetica")
                .text(
                    `Generated on: ${new Date().toLocaleString("en", {
                        dateStyle: "full",
                        timeStyle: "short",
                    })}`,
                    50,
                    footerY + 15,
                    { align: "center" }
                );

            doc.end();
        } catch (err) {
            next(err);
        }
    },
};
