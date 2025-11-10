import express from 'express';
import { userController } from '../usecase/user/user.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { requireAdmin } from '../middleware/requireAdmin.js';

const router = express.Router();

// Employee management routes (Used by Admin in Role Tab)
router.get('/employees', requireAuth, requireAdmin, userController.getAllEmployees);
router.post('/employees', requireAuth, requireAdmin, userController.createEmployee);
router.delete('/employees/:id', requireAuth, requireAdmin, userController.deleteEmployee);

// General user management routes (Optional - for future use)
router.get('/', requireAuth, requireAdmin, userController.getAll);
router.post('/', requireAuth, requireAdmin, userController.create);
router.patch('/:id/role', requireAuth, requireAdmin, userController.updateRole);
router.delete('/:id', requireAuth, requireAdmin, userController.delete);

export default router;