import express from 'express';
import { discountController } from '../usecase/discount/discount.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { requireAdmin } from '../middleware/requireAdmin.js';

const router = express.Router();

// Public routes
router.post('/validate', discountController.validate);

// Admin routes
router.get('/', requireAuth, requireAdmin, discountController.getAll);
router.get('/:id', requireAuth, requireAdmin, discountController.getById);
router.post('/', requireAuth, requireAdmin, discountController.create);
router.put('/:id', requireAuth, requireAdmin, discountController.update);
router.patch("/:id/status", requireAuth, requireAdmin, discountController.updateStatus);

router.delete('/:id', requireAuth, requireAdmin, discountController.delete);

export default router;