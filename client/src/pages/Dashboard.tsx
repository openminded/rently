import { useState, useEffect } from 'react';
import { TrendingUp, Users, ShoppingBag, AlertCircle, Calendar, Package, Activity } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

const API_Base = 'http://localhost:3000/api/dashboard';

const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val);
};

const StatCard = ({ title, value, label, icon: Icon, color }: any) => (
    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between">
            <div>
                <p className="text-sm font-medium text-gray-500">{title}</p>
                <h3 className="text-2xl font-bold text-gray-900 mt-2">{value}</h3>
                <p className="text-xs text-gray-400 mt-1">{label}</p>
            </div>
            <div className={`p-3 rounded-xl ${color}`}>
                <Icon size={20} className="text-white" />
            </div>
        </div>
    </div>
);

export default function Dashboard() {
    const { token } = useAuth();
    const { t } = useLanguage();

    // Default Date Range: Last 30 Days
    const [startDate, setStartDate] = useState(new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

    const [summary, setSummary] = useState<any>(null);
    const [charts, setCharts] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const [activeShortcut, setActiveShortcut] = useState<string>('last30');

    useEffect(() => {
        if (token) {
            fetchData();
        }
    }, [startDate, endDate, token]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const headers = { 'Authorization': `Bearer ${token}` };
            const [sumRes, chartRes] = await Promise.all([
                fetch(`${API_Base}/summary?startDate=${startDate}&endDate=${endDate}`, { headers }),
                fetch(`${API_Base}/charts?startDate=${startDate}&endDate=${endDate}`, { headers })
            ]);

            const sumData = await sumRes.json();
            const chartData = await chartRes.json();

            setSummary(sumData);
            setCharts(chartData);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleShortcut = (type: string) => {
        const today = new Date();
        let start = new Date();
        let end = new Date();

        setActiveShortcut(type);

        switch (type) {
            case 'thisMonth':
                start = new Date(today.getFullYear(), today.getMonth(), 1);
                break;
            case 'lastMonth':
                start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
                end = new Date(today.getFullYear(), today.getMonth(), 0);
                break;
            case 'last3Months':
                start = new Date(today.getFullYear(), today.getMonth() - 3, today.getDate());
                break;
            case 'ytd':
                start = new Date(today.getFullYear(), 0, 1);
                break;
            default: // last30
                start = new Date(today.setDate(today.getDate() - 30));
                end = new Date();
                break;
        }

        setStartDate(start.toISOString().split('T')[0]);
        setEndDate(end.toISOString().split('T')[0]);
    };

    if (loading && !summary) return <div className="p-8 text-center text-gray-500">Loading Dashboard...</div>;

    const ShortcutBtn = ({ id, label }: { id: string, label: string }) => (
        <button
            onClick={() => handleShortcut(id)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${activeShortcut === id
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100'
                : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                }`}
        >
            {label}
        </button>
    );

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header & Date Filter */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">{t('dashboard.title')}</h2>
                    <p className="text-gray-500">{t('dashboard.subtitle')}</p>
                </div>

                <div className="hidden md:flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    {/* Shortcuts */}
                    <div className="flex flex-wrap items-center gap-2 bg-white p-1 rounded-xl border border-gray-100 shadow-sm">
                        <ShortcutBtn id="thisMonth" label={t('dashboard.filter.thisMonth')} />
                        <ShortcutBtn id="lastMonth" label={t('dashboard.filter.lastMonth')} />
                        <ShortcutBtn id="last3Months" label={t('dashboard.filter.last3Months')} />
                        <ShortcutBtn id="ytd" label={t('dashboard.filter.ytd')} />
                    </div>

                    {/* Custom Range */}
                    <div className="flex items-center gap-2 bg-white p-1.5 rounded-xl border border-gray-200 shadow-sm">
                        <Calendar size={16} className="text-gray-400 ml-2" />
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => {
                                setStartDate(e.target.value);
                                setActiveShortcut('custom');
                            }}
                            className="p-1 outline-none text-xs text-gray-700 font-bold bg-transparent"
                        />
                        <span className="text-gray-300">/</span>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => {
                                setEndDate(e.target.value);
                                setActiveShortcut('custom');
                            }}
                            className="p-1 outline-none text-xs text-gray-700 font-bold bg-transparent"
                        />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title={t('dashboard.stat.revenue')}
                    value={summary ? formatCurrency(summary.revenue) : '-'}
                    label={t('dashboard.stat.revenue.desc').replace('{start}', startDate).replace('{end}', endDate)}
                    icon={TrendingUp}
                    color="bg-emerald-500"
                />
                <StatCard
                    title={t('dashboard.stat.activeRentals')}
                    value={summary ? summary.activeRentals : '-'}
                    label={t('dashboard.stat.activeRentals.desc')}
                    icon={ShoppingBag}
                    color="bg-blue-500"
                />
                <StatCard
                    title={t('dashboard.stat.newCustomers')}
                    value={summary ? summary.newCustomers : '-'}
                    label={t('dashboard.stat.newCustomers.desc')}
                    icon={Users}
                    color="bg-violet-500"
                />
                <StatCard
                    title={t('dashboard.stat.overdue')}
                    value={summary ? summary.lateReturns : '-'}
                    label={t('dashboard.stat.overdue.desc')}
                    icon={AlertCircle}
                    color="bg-rose-500"
                />
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Revenue Chart */}
                <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm min-h-[400px]">
                    <h3 className="font-bold text-gray-900 mb-6">{t('dashboard.chart.revenue')}</h3>
                    {charts?.revenueTrend && (
                        <div className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={charts.revenueTrend}>
                                    <defs>
                                        <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.1} />
                                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                    <XAxis
                                        dataKey="date"
                                        tickFormatter={(str) => new Date(str).toLocaleDateString()}
                                        tick={{ fontSize: 12, fill: '#9ca3af' }}
                                        axisLine={false}
                                        tickLine={false}
                                    />
                                    <YAxis
                                        tickFormatter={(val) => `Rp ${(val / 1000000).toFixed(1)}M`}
                                        tick={{ fontSize: 12, fill: '#9ca3af' }}
                                        axisLine={false}
                                        tickLine={false}
                                    />
                                    <Tooltip
                                        formatter={(val: any) => formatCurrency(val)}
                                        labelFormatter={(label) => new Date(label).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="revenue"
                                        stroke="#10b981"
                                        strokeWidth={3}
                                        fillOpacity={1}
                                        fill="url(#colorRev)"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </div>

                {/* Top Items */}
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm min-h-[400px]">
                    <h3 className="font-bold text-gray-900 mb-6">{t('dashboard.chart.topItems')}</h3>
                    {charts?.topItems && charts.topItems.length > 0 ? (
                        <div className="space-y-4">
                            {charts.topItems.map((item: any, i: number) => (
                                <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm">
                                            {i + 1}
                                        </div>
                                        <span className="font-medium text-gray-700 text-sm truncate max-w-[150px]">{item.name}</span>
                                    </div>
                                    <span className="text-sm font-bold text-gray-900">{item.count} <span className="text-xs text-gray-400 font-normal">Rentals</span></span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center text-gray-400 py-10">No rental data in this period</div>
                    )}
                </div>
            </div>

            {/* Inventory Monitoring Section */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h3 className="text-lg font-bold text-gray-900">{t('dashboard.inventory.title')}</h3>
                        <p className="text-sm text-gray-500 mt-1">{t('dashboard.inventory.desc')}</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* Fact Card 1: Stock Health */}
                    <div className="p-4 bg-emerald-50 rounded-2xl flex items-center gap-4">
                        <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center text-white shrink-0 shadow-lg shadow-emerald-200">
                            <Activity size={24} />
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">{t('dashboard.inventory.available')}</p>
                            <h4 className="text-xl font-black text-gray-900 mt-0.5">{summary?.inventory?.availableUnits ?? '-'} <span className="text-xs font-normal text-gray-400">/ {summary?.inventory?.totalUnits ?? '-'}</span></h4>
                        </div>
                    </div>

                    {/* Fact Card 2: In Maintenance */}
                    <div className="p-4 bg-orange-50 rounded-2xl flex items-center gap-4">
                        <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center text-white shrink-0 shadow-lg shadow-orange-200">
                            <Package size={24} />
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-orange-600 uppercase tracking-wider">{t('dashboard.inventory.maintenance')}</p>
                            <h4 className="text-xl font-black text-gray-900 mt-0.5">{summary?.inventory?.maintenanceUnits ?? '-'} <span className="text-xs font-normal text-gray-400">Units</span></h4>
                        </div>
                    </div>

                    {/* Fact Card 3: Currently Rented */}
                    <div className="p-4 bg-blue-50 rounded-2xl flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center text-white shrink-0 shadow-lg shadow-blue-200">
                            <ShoppingBag size={24} />
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider">{t('dashboard.inventory.rented')}</p>
                            <h4 className="text-xl font-black text-gray-900 mt-0.5">{summary?.inventory?.rentedUnits ?? '-'} <span className="text-xs font-normal text-gray-400">Units</span></h4>
                        </div>
                    </div>

                    {/* Fact Card 4: Out of Stock */}
                    <div className="p-4 bg-rose-50 rounded-2xl flex items-center gap-4">
                        <div className="w-12 h-12 bg-rose-500 rounded-xl flex items-center justify-center text-white shrink-0 shadow-lg shadow-rose-200">
                            <AlertCircle size={24} />
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-rose-600 uppercase tracking-wider">{t('dashboard.inventory.outOfStock')}</p>
                            <h4 className="text-xl font-black text-gray-900 mt-0.5">{summary?.inventory?.outOfStockItems ?? '-'} <span className="text-xs font-normal text-gray-400">Items</span></h4>
                        </div>
                    </div>
                </div>

                {/* Status Breakdown Visualization */}
                {summary?.inventory && (
                    <div className="mt-8 pt-8 border-t border-gray-50 flex flex-col md:flex-row items-center gap-8">
                        <div className="w-full md:w-1/3">
                            <div className="h-[200px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={[
                                                { name: 'Available', value: summary.inventory.availableUnits, color: '#10b981' },
                                                { name: 'Rented', value: summary.inventory.rentedUnits, color: '#3b82f6' },
                                                { name: 'Maintenance', value: summary.inventory.maintenanceUnits, color: '#f59e0b' },
                                            ]}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={80}
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            <Cell fill="#10b981" />
                                            <Cell fill="#3b82f6" />
                                            <Cell fill="#f59e0b" />
                                        </Pie>
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                        <div className="flex-1 w-full">
                            <h4 className="text-md font-bold text-gray-800 mb-4">{t('dashboard.inventory.health')}</h4>
                            <div className="w-full bg-gray-100 h-4 rounded-full overflow-hidden mb-2">
                                <div
                                    className="h-full bg-emerald-500 rounded-full transition-all duration-1000"
                                    style={{ width: `${summary.inventory.availabilityRate}%` }}
                                ></div>
                            </div>
                            <div className="flex justify-between text-xs font-bold">
                                <span className="text-emerald-600">{summary.inventory.availabilityRate.toFixed(1)}% {t('dashboard.inventory.available')}</span>
                                <span className="text-gray-400">100% Target</span>
                            </div>
                            <p className="text-sm text-gray-500 mt-4 leading-relaxed">
                                {summary.inventory.availabilityRate > 80
                                    ? "Stok Anda dalam kondisi sangat sehat. Sebagian besar item siap disewa."
                                    : summary.inventory.availabilityRate > 50
                                        ? "Ketersediaan stok cukup baik, namun perhatikan item dalam perawatan."
                                        : "Peringatan: Ketersediaan stok rendah. Segera layani item dalam laundry atau tambah stok baru."
                                }
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {/* Cashier Performance Chart (Visible to Admin/Owner) */}
            {charts?.cashierPerformance && charts.cashierPerformance.length > 0 && (
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                    <h3 className="font-bold text-gray-900 mb-6">{t('dashboard.chart.cashier')}</h3>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={charts.cashierPerformance}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                <XAxis
                                    dataKey="name"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 12, fill: '#6b7280' }}
                                />
                                <YAxis
                                    tickFormatter={(val) => `Rp ${(val / 1000000).toFixed(1)}M`}
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 12, fill: '#9ca3af' }}
                                />
                                <Tooltip
                                    formatter={(val: any) => formatCurrency(val)}
                                    cursor={{ fill: '#f9fafb' }}
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                                <Bar dataKey="revenue" fill="#8b5cf6" radius={[4, 4, 0, 0]} barSize={40} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}

            {/* Recent Table */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="font-bold text-gray-900">{t('dashboard.recentTx')}</h3>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            <tr>
                                <th className="px-4 py-3 rounded-l-lg">{t('dashboard.table.id')}</th>
                                <th className="px-4 py-3">{t('dashboard.table.customer')}</th>
                                <th className="px-4 py-3">{t('dashboard.table.date')}</th>
                                <th className="px-4 py-3">{t('dashboard.table.status')}</th>
                                <th className="px-4 py-3 text-right rounded-r-lg">{t('dashboard.table.total')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {summary?.recentTransactions?.map((tx: any) => (
                                <tr key={tx.id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-4 py-3 font-medium text-gray-900">#{tx.id}</td>
                                    <td className="px-4 py-3 text-gray-700">{tx.customer.name}</td>
                                    <td className="px-4 py-3 text-gray-500 text-sm">{new Date(tx.createdAt).toLocaleDateString()}</td>
                                    <td className="px-4 py-3">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium 
                                            ${tx.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                                                tx.status === 'RENTED' ? 'bg-blue-100 text-blue-700' :
                                                    tx.status === 'BOOKED' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'}`}>
                                            {tx.status}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-right font-bold text-gray-900">{formatCurrency(tx.totalAmount)}</td>
                                </tr>
                            ))}
                            {(!summary?.recentTransactions || summary.recentTransactions.length === 0) && (
                                <tr>
                                    <td colSpan={5} className="text-center py-6 text-gray-400">No recent transactions</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
