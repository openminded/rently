import type { Request, Response } from 'express';
import prisma from '../prisma.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { businessService } from '../services/businessService.js';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-change-me';

export const authController = {
    login: async (req: Request, res: Response) => {
        try {
            const { username, password } = req.body;

            const user = await prisma.user.findUnique({
                where: { username },
                include: { business: { select: { slug: true, name: true, id: true } } }
            });

            if (!user) {
                return res.status(401).json({ error: 'Invalid username or password' });
            }

            const validPassword = await bcrypt.compare(password, user.password);
            if (!validPassword) {
                return res.status(401).json({ error: 'Invalid username or password' });
            }

            const token = jwt.sign(
                {
                    id: user.id,
                    username: user.username,
                    role: user.role,
                    name: user.name,
                    businessId: user.businessId
                },
                JWT_SECRET,
                { expiresIn: '1d' } // 1 day session
            );

            res.json({
                token,
                user: {
                    id: user.id,
                    username: user.username,
                    role: user.role,
                    name: user.name,
                    businessId: user.businessId,
                    business: user.business
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
    },

    register: async (req: Request, res: Response) => {
        try {
            const { businessName, address, phone, ownerName, username, password } = req.body;

            // Validation
            if (!businessName || !ownerName || !username || !password) {
                return res.status(400).json({ error: 'Missing required fields' });
            }

            const result = await businessService.registerBusiness({
                businessName,
                address,
                phone,
                ownerName,
                username,
                password
            });

            res.status(201).json(result);
        } catch (error: any) {
            console.error("Registration Error:", error);
            if (error.message === 'Username already taken') {
                return res.status(400).json({ error: 'Username already taken' });
            }
            res.status(500).json({ error: 'Registration failed' });
        }
    }
};
