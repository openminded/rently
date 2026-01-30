import type { Request, Response } from 'express';
import prisma from '../prisma.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-change-me';

export const authController = {
    login: async (req: Request, res: Response) => {
        try {
            const { username, password } = req.body;

            const user = await prisma.user.findUnique({
                where: { username }
            });

            if (!user) {
                return res.status(401).json({ error: 'Invalid username or password' });
            }

            const validPassword = await bcrypt.compare(password, user.password);
            if (!validPassword) {
                return res.status(401).json({ error: 'Invalid username or password' });
            }

            const token = jwt.sign(
                { id: user.id, username: user.username, role: user.role, name: user.name },
                JWT_SECRET,
                { expiresIn: '1d' } // 1 day session
            );

            res.json({
                token,
                user: {
                    id: user.id,
                    username: user.username,
                    role: user.role,
                    name: user.name
                }
            });

        } catch (error) {
            console.error("Login Error:", error);
            res.status(500).json({ error: 'Login failed' });
        }
    },

    // Get Current User Profile (optional verification)
    me: async (req: Request, res: Response) => {
        // @ts-ignore
        const user = req.user;
        if (!user) return res.status(401).json({ error: 'Not authenticated' });
        res.json(user);
    }
};
