import { AuthService } from './auth.service.js';

export async function registerUser(req, res, next) {
    try {
        const { name, email, password } = req.body;
        const { user, token } = await AuthService.register({ name, email, password });

        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
        });

        res.json({
            success: true,
            user: { id: user.id, email: user.email, role: user.role },
            token,
        });
    } catch (err) {
        next(err);
    }
}

export async function loginUser(req, res, next) {
    try {
        const { email, password } = req.body;
        const { user, token } = await AuthService.login({ email, password });

        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
        });

        res.json({
            success: true,
            user: {
                id: user.id,
                email: user.email,
                role: user.role
            },
            token,
        });
    } catch (err) {
        // next(err);
        res.status(400).json({ success: false, message: err.message });
    }
}

export async function logoutUser(req, res) {
    res.clearCookie('token');
    res.json({ success: true, message: 'Logged out' });
}

export async function getMe(req, res, next) {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized'
            });
        }

        res.json({
            success: true,
            user: {
                id: req.user.id,
                email: req.user.email,
                role: req.user.role,
            },
        });
    } catch (err) {
        next(err);
    }
}
