import type { Request, Response } from 'express';
import prisma from '../prisma.js';

export const dashboardController = {
    getSummary: async (req: Request, res: Response) => {
        try {
            const { startDate, endDate } = req.query;

            // @ts-ignore
            const businessId = req.user?.businessId;

            // Build Date Filter
            const dateFilter: any = {};
            if (startDate && endDate) {
                const start = new Date(startDate as string);
                start.setHours(0, 0, 0, 0);

                const end = new Date(endDate as string);
                end.setHours(23, 59, 59, 999);

                dateFilter.createdAt = {
                    gte: start,
                    lte: end
                };
            }

            // 1. Total Revenue (Paid Amount + Fines)
            // Note: Fines are in Fine table, paidAmount in Transaction.
            // Ideally we sum payments.
            const payments = await prisma.payment.aggregate({
                _sum: { amount: true },
                where: {
                    businessId,
                    date: dateFilter.createdAt // Payment date matches filter
                }
            });

            // 2. Active Rentals (Status RENTED or WAITING_PICKUP)
            // Snapshot metric, usually ignores date range, or shows current state.
            // User requested "monitoring", so current state is best for "Active".
            // Or "Rentals created in range". Let's do Current Active for the card.
            const activeRentals = await prisma.transaction.count({
                where: {
                    businessId,
                    status: { in: ['RENTED', 'WAITING_PICKUP'] }
                }
            });

            // 3. New Customers (in range)
            const newCustomers = await prisma.customer.count({
                where: { ...dateFilter, businessId }
            });

            // 4. Returns Overdue (Current Snapshot)
            const lateReturns = await prisma.transaction.count({
                where: {
                    businessId,
                    status: 'RENTED',
                    returnPlanDate: { lt: new Date() }
                }
            });

            // 5. Recent Transactions (Limit 5)
            const recentTransactions = await prisma.transaction.findMany({
                take: 5,
                orderBy: { createdAt: 'desc' },
                include: { customer: true },
                where: { ...dateFilter, businessId }
            });

            // 6. Inventory Monitoring Stats
            const itemFilter = { itemVariant: { item: { businessId } } };
            const [totalUnits, availableUnits, maintenanceUnits, rentedUnits] = await Promise.all([
                prisma.itemInstance.count({ where: itemFilter }),
                prisma.itemInstance.count({ where: { status: 'AVAILABLE', ...itemFilter } }),
                prisma.itemInstance.count({ where: { status: { in: ['IN_LAUNDRY', 'NOT_READY'] }, ...itemFilter } }),
                prisma.itemInstance.count({ where: { status: 'RENTED', ...itemFilter } })
            ]);

            // Out of stock items (Items where no variant has any AVAILABLE instance)
            // Simplified: Items where ALL instances are NOT AVAILABLE
            const allItems = await prisma.item.findMany({
                where: { businessId },
                include: {
                    variants: {
                        include: {
                            instances: {
                                select: { status: true }
                            }
                        }
                    }
                }
            });

            const outOfStockItems = allItems.filter(item => {
                const instances = item.variants.flatMap(v => v.instances);
                if (instances.length === 0) return true; // No stock at all
                return !instances.some(i => i.status === 'AVAILABLE');
            }).length;

            // 7. Referral Commission Stats
            const commissions = await prisma.commissionLog.aggregate({
                _sum: { amount: true },
                where: {
                    ...dateFilter,
                    referralCode: { businessId }
                }
            });

            const pendingCommissions = await prisma.commissionLog.aggregate({
                _sum: { amount: true },
                where: {
                    ...dateFilter,
                    status: 'PENDING',
                    referralCode: { businessId }
                }
            });

            res.json({
                revenue: payments._sum.amount || 0,
                activeRentals,
                newCustomers,
                lateReturns,
                recentTransactions,
                inventory: {
                    totalUnits,
                    availableUnits,
                    maintenanceUnits,
                    rentedUnits,
                    outOfStockItems,
                    availabilityRate: totalUnits > 0 ? (availableUnits / totalUnits) * 100 : 0
                },
                referral: {
                    totalCommissions: commissions._sum.amount || 0,
                    pendingCommissions: pendingCommissions._sum.amount || 0
                }
            });

        } catch (error) {
            console.error("Dashboard Summary Error:", error);
            res.status(500).json({ error: 'Failed to fetch summary' });
        }
    },

    getCharts: async (req: Request, res: Response) => {
        try {
            const { startDate, endDate } = req.query;
            // @ts-ignore
            const user = req.user;

            if (!startDate || !endDate) return res.status(400).json({ error: 'Date range required' });

            const start = new Date(startDate as string);
            start.setHours(0, 0, 0, 0);

            const end = new Date(endDate as string);
            end.setHours(23, 59, 59, 999);

            const isKasir = user?.role === 'KASIR';
            const userFilter = isKasir ? { userId: user.id } : {};
            const businessId = user?.businessId;

            // Revenue Trend (Group by Date)
            const payments = await prisma.payment.findMany({
                where: {
                    businessId,
                    date: { gte: start, lte: end },
                    transaction: userFilter
                },
                select: { date: true, amount: true }
            });

            const revenueMap = new Map<string, number>();
            payments.forEach(p => {
                const day = p.date.toISOString().split('T')[0] as string;
                revenueMap.set(day, (revenueMap.get(day) || 0) + p.amount);
            });

            // Fill missing days
            const chartData = [];
            for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
                const dayStr = d.toISOString().split('T')[0] as string;
                chartData.push({
                    date: dayStr,
                    revenue: revenueMap.get(dayStr) || 0
                });
            }

            // Top Items (Most Rented)
            const txItems = await prisma.transactionItem.findMany({
                where: {
                    transaction: {
                        businessId,
                        createdAt: { gte: start, lte: end },
                        ...userFilter
                    }
                },
                include: {
                    itemInstance: {
                        include: {
                            itemVariant: {
                                include: { item: true }
                            }
                        }
                    }
                }
            });

            const itemCounts = new Map<string, number>();
            txItems.forEach(t => {
                const itemName = t.itemInstance.itemVariant.item.name;
                itemCounts.set(itemName, (itemCounts.get(itemName) || 0) + 1);
            });

            const topItems = Array.from(itemCounts.entries())
                .map(([name, count]) => ({ name, count }))
                .sort((a, b) => b.count - a.count)
                .slice(0, 5);

            // Cashier Performance (Only if not Kasir)
            let cashierPerformance: any[] = [];
            if (!isKasir) {
                const allPayments = await prisma.payment.findMany({
                    where: {
                        businessId,
                        date: { gte: start, lte: end }
                    },
                    include: {
                        transaction: {
                            include: { user: true }
                        }
                    }
                });

                const cashierMap = new Map<string, number>();
                allPayments.forEach(p => {
                    const name = p.transaction?.user?.name || 'Unknown/System';
                    cashierMap.set(name, (cashierMap.get(name) || 0) + p.amount);
                });

                cashierPerformance = Array.from(cashierMap.entries())
                    .map(([name, revenue]) => ({ name, revenue }))
                    .sort((a, b) => b.revenue - a.revenue);
            }

            // Commission Trend
            const commissionLogs = await prisma.commissionLog.findMany({
                where: {
                    createdAt: { gte: start, lte: end },
                    referralCode: { businessId }
                },
                select: { createdAt: true, amount: true }
            });

            const commissionMap = new Map<string, number>();
            commissionLogs.forEach(c => {
                const day = c.createdAt.toISOString().split('T')[0] as string;
                commissionMap.set(day, (commissionMap.get(day) || 0) + c.amount);
            });

            // Add commission to trend data
            const trendWithComms = chartData.map(d => ({
                ...d,
                commission: commissionMap.get(d.date) || 0
            }));

            res.json({
                revenueTrend: trendWithComms,
                topItems,
                cashierPerformance
            });

        } catch (error) {
            console.error("Dashboard Chart Error:", error);
            res.status(500).json({ error: 'Failed to fetch charts' });
        }
    }
};
