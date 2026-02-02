import type { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import prisma from '../prisma.js';

export const userController = {
    // List all users (excluding passwords)
    getUsers: async (req: Request, res: Response) => {
        try {
            const users = await prisma.user.findMany({
                select: {
                    id: true,
                    username: true,
                    name: true,
                    role: true,
                    createdAt: true
                },
                orderBy: { createdAt: 'desc' }
            });
            res.json(users);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Failed to fetch users' });
        }
    },

    // Create a new user
    createUser: async (req: Request, res: Response) => {
        try {
            const { username, password, name, role } = req.body;

            if (!username || !password || !name || !role) {
                return res.status(400).json({ error: 'All fields are required' });
            }

            // Check if username exists
            const existing = await prisma.user.findUnique({ where: { username } });
            if (existing) {
                return res.status(400).json({ error: 'Username already taken' });
            }

            const hashedPassword = await bcrypt.hash(password, 10);

            const user = await prisma.user.create({
                data: {
                    username,
                    password: hashedPassword,
                    name,
                    role
                }
            });

            res.status(201).json({ message: 'User created successfully', user: { id: user.id, username: user.username } });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Failed to create user' });
        }
    },

    // Update user (Name/Role)
    updateUser: async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const { name, role, password } = req.body;

            const updateData: any = {};
            if (name) updateData.name = name;
            if (role) updateData.role = role;
            if (password) {
                updateData.password = await bcrypt.hash(password, 10);
            }

            await prisma.user.update({
                where: { id: Number(id) },
                data: updateData
            });

            res.json({ message: 'User updated successfully' });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Failed to update user' });
        }
    },

    // Delete user
    deleteUser: async (req: Request, res: Response) => {
        try {
            const { id } = req.params;

            // Fetch user first
            const targetUser = await prisma.user.findUnique({ where: { id: Number(id) } });

            if (!targetUser) {
                return res.status(404).json({ error: 'User not found' });
            }

            // CRITICAL: Prevent SUPERADMIN deletion
            if (targetUser.role === 'SUPERADMIN') {
                return res.status(403).json({ error: 'Cannot delete SUPERADMIN user.' });
            }

            // Prevent deleting self
            // @ts-ignore
            if (req.user?.id === Number(id)) {
                return res.status(400).json({ error: 'Cannot delete your own account' });
            }

            await prisma.user.delete({
                where: { id: Number(id) }
            });

            res.json({ message: 'User deleted successfully' });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Failed to delete user' });
        }
    }
};
