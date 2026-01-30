import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-change-me';

export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) return res.status(401).json({ error: 'Access denied. No token provided.' });

    jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
        if (err) return res.status(403).json({ error: 'Invalid token.' });
        // @ts-ignore
        req.user = user;
        next();
    });
};

export const authorizeRole = (roles: string[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        // @ts-ignore
        const userRole = req.user?.role;
        if (!roles.includes(userRole)) {
            return res.status(403).json({ error: 'Access denied. Insufficient permissions.' });
        }
        next();
    };
};
