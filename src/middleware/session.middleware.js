// src/middleware/session.middleware.js
import jwt from 'jsonwebtoken';

export function sessionMiddleware(req, res, next) {
    try {
        const token =
            req.cookies?.token ||
            req.headers['authorization']?.replace('Bearer ', '');

        if (!token) {
            req.user = null;
            return next();
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        console.warn('⚠️ Invalid or expired token');
        req.user = null;
        next();
    }
}
