import express from 'express';
import { reportController } from '../usecase/report/report.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { requireAdmin } from '../middleware/requireAdmin.js';

const router = express.Router();

router.get('/sales', requireAuth, requireAdmin, reportController.getSalesReport);
router.get('/sales/pdf', requireAuth, requireAdmin, reportController.downloadSalesReportPDF);
router.get('/statistics', requireAuth, requireAdmin, reportController.getOrderStatistics);

export default router;