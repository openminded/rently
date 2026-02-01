import jwt from 'jsonwebtoken';
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-change-me';
export const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
    if (!token)
        return res.status(401).json({ error: 'Access denied. No token provided.' });
    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err)
            return res.status(403).json({ error: 'Invalid token.' });
        // @ts-ignore
        req.user = user;
        next();
    });
};
export const authorizeRole = (roles) => {
    return (req, res, next) => {
        // @ts-ignore
        const userRole = req.user?.role;
        if (!userRole || !roles.includes(userRole)) {
            return res.status(403).json({ error: 'Access denied. Insufficient permissions.' });
        }
        next();
    };
};
//# sourceMappingURL=authMiddleware.js.map