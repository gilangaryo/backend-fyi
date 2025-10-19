export function requireUser(req, res, next) {
    if (!req.user) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    if (req.user.role !== 'USER') {
        return res.status(403).json({ success: false, message: 'Forbidden: user only' });
    }

    next();
}
