import { Router } from 'express';
import {
    handleGetCategories,
    handleGetCategoryById,
    handleGetCategoryBySlug,
    handleCreateCategory,
    handleUpdateCategory,
    handleDeleteCategory,
} from '../usecase/categories/category.controller.js';

import { requireAuth } from '../middleware/auth.middleware.js';
import { requireAdmin } from '../middleware/requireAdmin.js';

const router = Router();

// 👤 Public
router.get('/', handleGetCategories);
router.get('/:id', handleGetCategoryById);
router.get('/slug/:slug', handleGetCategoryBySlug);

// 🔒 Admin Only
router.post('/', requireAuth, requireAdmin, handleCreateCategory);
router.put('/:id', requireAuth, requireAdmin, handleUpdateCategory);
router.delete('/:id', requireAuth, requireAdmin, handleDeleteCategory);

export default router;
