
import type { Request, Response } from 'express';
import prisma from '../prisma.js';

export const financeController = {
    // 1. Get Summary (Income, Expense, Profit)
    getSummary: async (req: Request, res: Response) => {
        try {
            const { startDate, endDate } = req.query;

            if (!startDate || !endDate) {
                return res.status(400).json({ error: 'Start date and end date are required' });
            }

            const start = new Date(startDate as string);
            const end = new Date(endDate as string);
            end.setHours(23, 59, 59, 999); // Include the whole end day

            // @ts-ignore
            const businessId = req.user?.businessId;

            // Calculate Income (Total Paid Amount from Transactions)
            const incomeAgg = await prisma.transaction.aggregate({
                _sum: {
                    paidAmount: true
                },
                where: {
                    businessId,
                    createdAt: {
                        gte: start,
                        lte: end
                    },
                    status: { not: 'CANCELLED' }
                }
            });

            // Calculate Expenses (Total Amount from Expense Table)
            const expenseAgg = await prisma.expense.aggregate({
                _sum: {
                    amount: true
                },
                where: {
                    businessId,
                    date: {
                        gte: start,
                        lte: end
                    }
                }
            });

            const income = incomeAgg._sum.paidAmount || 0;
            const expense = expenseAgg._sum.amount || 0;
            const profit = income - expense;

            res.json({
                income,
                expense,
                profit
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Failed to fetch finance summary' });
        }
    },

    // 2. Get Income Details (List of Transactions)
    getIncome: async (req: Request, res: Response) => {
        try {
            const { startDate, endDate } = req.query;
            // @ts-ignore
            const businessId = req.user?.businessId;
            const where: any = {
                businessId,
                status: { not: 'CANCELLED' }
            };

            if (startDate && endDate) {
                const start = new Date(startDate as string);
                const end = new Date(endDate as string);
                end.setHours(23, 59, 59, 999);
                where.createdAt = { gte: start, lte: end };
            }

            const transactions = await prisma.transaction.findMany({
                where,
                select: {
                    id: true,
                    createdAt: true,
                    customer: { select: { name: true } },
                    totalAmount: true,
                    paidAmount: true,
                    paymentStatus: true,
                    type: true
                },
                orderBy: { createdAt: 'desc' }
            });

            res.json(transactions);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Failed to fetch income data' });
        }
    },

    // 3. Get Expense Details
    getExpenses: async (req: Request, res: Response) => {
        try {
            const { startDate, endDate } = req.query;
            // @ts-ignore
            const businessId = req.user?.businessId;
            const where: any = { businessId };

            if (startDate && endDate) {
                const start = new Date(startDate as string);
                const end = new Date(endDate as string);
                end.setHours(23, 59, 59, 999);
                where.date = { gte: start, lte: end };
            }

            const expenses = await prisma.expense.findMany({
                where,
                include: {
                    category: true,
                    createdBy: { select: { name: true } }
                },
                orderBy: { date: 'desc' }
            });

            res.json(expenses);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Failed to fetch expenses' });
        }
    },

    // 4. Create Manual Expense
    createExpense: async (req: Request, res: Response) => {
        try {
            const { description, amount, categoryId, date } = req.body;
            const userId = (req as any).user?.id;

            if (!description || !amount || !categoryId) {
                return res.status(400).json({ error: 'Description, amount, and category are required' });
            }

            const expense = await prisma.expense.create({
                data: {
                    // @ts-ignore
                    businessId: req.user?.businessId,
                    type: 'MANUAL',
                    description,
                    amount: parseFloat(amount),
                    categoryId: parseInt(categoryId),
                    date: date ? new Date(date) : new Date(),
                    createdById: userId
                }
            });

            res.status(201).json(expense);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Failed to create expense' });
        }
    },

    // 5. Manage Expense Categories
    getCategories: async (req: Request, res: Response) => {
        try {
            // @ts-ignore
            const businessId = req.user?.businessId;
            const categories = await prisma.expenseCategory.findMany({
                where: { businessId }
            });
            res.json(categories);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Failed to fetch expense categories' });
        }
    },

    createCategory: async (req: Request, res: Response) => {
        try {
            const { name } = req.body;
            if (!name) return res.status(400).json({ error: 'Name is required' });

            // @ts-ignore
            const businessId = req.user?.businessId;
            const category = await prisma.expenseCategory.create({
                data: { name, businessId }
            });
            res.status(201).json(category);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Failed to create category' });
        }
    },

    deleteCategory: async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            // @ts-ignore
            const businessId = req.user?.businessId;

            // Verify ownership
            const existing = await prisma.expenseCategory.findFirst({
                where: { id: parseInt((id as string) || '0'), businessId }
            });
            if (!existing) return res.status(404).json({ error: 'Category not found' });

            await prisma.expenseCategory.delete({
                where: { id: parseInt((id as string) || '0') }
            });
            res.json({ message: 'Category deleted' });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Failed to delete category' });
        }
    },

    // 6. Get Summary By Category (For Charts)
    getSummaryByCategory: async (req: Request, res: Response) => {
        try {
            const { startDate, endDate } = req.query;

            if (!startDate || !endDate) {
                return res.status(400).json({ error: 'Start date and end date are required' });
            }

            const start = new Date(startDate as string);
            const end = new Date(endDate as string);
            end.setHours(23, 59, 59, 999);

            // @ts-ignore
            const businessId = req.user?.businessId;

            const byCategory = await prisma.expense.groupBy({
                by: ['categoryId'],
                _sum: {
                    amount: true
                },
                where: {
                    businessId,
                    date: {
                        gte: start,
                        lte: end
                    }
                }
            });

            // Need to join with category names manually or via separate query since groupBy doesn't support relation include directly nicely
            // Let's fetch categories mapping
            const categories = await prisma.expenseCategory.findMany({ where: { businessId } });
            const categoryMap = categories.reduce((acc: any, cat) => {
                acc[cat.id] = cat.name;
                return acc;
            }, {});

            const result = byCategory.map(item => ({
                name: categoryMap[item.categoryId || 0] || 'Uncategorized',
                value: item._sum.amount || 0
            })).sort((a, b) => b.value - a.value); // Sort highest first

            res.json(result);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Failed to fetch category summary' });
        }
    }
};
