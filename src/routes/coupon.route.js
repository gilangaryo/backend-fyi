import { Router } from 'express';
import {
    handleGetCoupons,
    handleGetCouponById,
    handleGetCouponByCode,
    handleCreateCoupon,
    handleUpdateCoupon,
    handleDeleteCoupon,
} from '../usecase/coupons/coupon.controller.js';

import { requireAuth } from '../middleware/auth.middleware.js';
import { requireAdmin } from '../middleware/requireAdmin.js';

const router = Router();

// 👤 Public (apply coupon by code)
router.get('/code/:code', handleGetCouponByCode);

// 🔒 Admin Only
router.get('/', requireAuth, requireAdmin, handleGetCoupons);
router.get('/:id', requireAuth, requireAdmin, handleGetCouponById);
router.post('/', requireAuth, requireAdmin, handleCreateCoupon);
router.put('/:id', requireAuth, requireAdmin, handleUpdateCoupon);
router.delete('/:id', requireAuth, requireAdmin, handleDeleteCoupon);

export default router;
