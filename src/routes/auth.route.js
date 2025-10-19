import { Router } from 'express';
import {
    registerUser,
    loginUser,
    logoutUser,
    getMe,
} from '../usecase/auth/auth.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { requireAdmin } from '../middleware/requireAdmin.js';
const router = Router();

// auth routes
router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/logout', logoutUser);
router.get('/me', requireAuth, getMe);

// route admin
router.get('/admin/dashboard', requireAdmin, (req, res) => {
    res.json({ message: `Welcome Admin ${req.user.email}` });
});


export default router;
