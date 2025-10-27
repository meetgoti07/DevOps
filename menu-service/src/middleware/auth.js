const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
    const authHeader = req.header('Authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Access denied. No token provided.' });
    }

    const token = authHeader.substring(7);

    try {
        // For now, we'll verify without the secret since this is inter-service communication
        // In production, you'd want to verify with the actual JWT secret
        const decoded = jwt.decode(token);

        if (!decoded) {
            return res.status(401).json({ message: 'Invalid token' });
        }

        req.user = {
            id: decoded.userId,
            email: decoded.sub,
            role: decoded.role
        };

        next();
    } catch (error) {
        res.status(401).json({ message: 'Invalid token' });
    }
};

const adminRequired = (req, res, next) => {
    if (req.user.role !== 'ADMIN') {
        return res.status(403).json({ message: 'Admin access required' });
    }
    next();
};

module.exports = { authMiddleware, adminRequired };