import { reportService } from './report.service.js';
import PDFDocument from 'pdfkit';

export const reportController = {
    async getSalesReport(req, res, next) {
        try {
            const { period, startDate, endDate } = req.query;

            const report = await reportService.getSalesReport(
                period || 'last30days',
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
                period || 'last30days',
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
                period || 'last30days',
                startDate,
                endDate
            );

            // Create PDF
            const doc = new PDFDocument({ margin: 50 });

            // Set response headers
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader(
                'Content-Disposition',
                `attachment; filename=sales-report-${new Date().toISOString().split('T')[0]}.pdf`
            );

            doc.pipe(res);

            doc.fontSize(20).text('Sales Summary Report', { align: 'center' });
            doc.moveDown();

            const startDateFormatted = new Date(report.period.start).toLocaleDateString('id-ID');
            const endDateFormatted = new Date(report.period.end).toLocaleDateString('id-ID');

            doc.fontSize(12).text(`Period: ${startDateFormatted} - ${endDateFormatted}`, {
                align: 'center',
            });
            doc.moveDown(2);

            const formatCurrency = (amount) => {
                return new Intl.NumberFormat('id-ID', {
                    style: 'currency',
                    currency: 'IDR',
                    minimumFractionDigits: 0,
                }).format(amount);
            };

            doc.fontSize(14).text('Sales Breakdown:', { underline: true });
            doc.moveDown();

            doc.fontSize(12);
            doc.text(`Gross Sales: ${formatCurrency(report.grossSales)}`);
            doc.text(`Discount: (${formatCurrency(report.discount)})`);
            doc.text(`Refunds: (${report.refunds})`);
            doc.moveDown();

            doc.fontSize(14).text(`NET SALES: ${formatCurrency(report.netSales)}`, { bold: true });
            doc.moveDown(2);

            doc.fontSize(12);
            doc.text(`Expense: ${formatCurrency(report.expense)}`);
            doc.text(`Operational: ${formatCurrency(report.operational)}`);
            doc.text(`TAX: ${formatCurrency(report.tax)}`);
            doc.moveDown(2);

            doc.fontSize(16).text(`Total Collected: ${formatCurrency(report.totalCollected)}`, {
                bold: true,
                underline: true,
            });

            // Footer
            doc.moveDown(3);
            doc.fontSize(10).text(`Generated on: ${new Date().toLocaleString('id-ID')}`, {
                align: 'center',
            });

            doc.end();
        } catch (err) {
            next(err);
        }
    },
};