import { useState, useEffect } from 'react';
import { TrendingUp, Users, ShoppingBag, AlertCircle, Calendar } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

import { useAuth } from '../context/AuthContext';

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
    // Default Date Range: Last 30 Days
    const [startDate, setStartDate] = useState(new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

    const [summary, setSummary] = useState<any>(null);
    const [charts, setCharts] = useState<any>(null);
    const [loading, setLoading] = useState(true);

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

    if (loading && !summary) return <div className="p-8 text-center text-gray-500">Loading Dashboard...</div>;

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header & Date Filter */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Owner Dashboard</h2>
                    <p className="text-gray-500">Overview of your business performance.</p>
                </div>
                <div className="flex items-center gap-2 bg-white p-2 rounded-lg border border-gray-200 shadow-sm">
                    <Calendar size={18} className="text-gray-500 ml-2" />
                    <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="p-1 outline-none text-sm text-gray-700 font-medium"
                    />
                    <span className="text-gray-400">-</span>
                    <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="p-1 outline-none text-sm text-gray-700 font-medium"
                    />
                </div>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Total Revenue"
                    value={summary ? formatCurrency(summary.revenue) : '-'}
                    label={`Income from ${startDate} to ${endDate}`}
                    icon={TrendingUp}
                    color="bg-emerald-500"
                />
                <StatCard
                    title="Active Rentals"
                    value={summary ? summary.activeRentals : '-'}
                    label="Currently Rented / Waiting Pickup"
                    icon={ShoppingBag}
                    color="bg-blue-500"
                />
                <StatCard
                    title="New Customers"
                    value={summary ? summary.newCustomers : '-'}
                    label="Registered in selected period"
                    icon={Users}
                    color="bg-violet-500"
                />
                <StatCard
                    title="Overdue Returns"
                    value={summary ? summary.lateReturns : '-'}
                    label="Items late for return"
                    icon={AlertCircle}
                    color="bg-rose-500"
                />
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Revenue Chart */}
                <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm min-h-[400px]">
                    <h3 className="font-bold text-gray-900 mb-6">Revenue Trend</h3>
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
                    <h3 className="font-bold text-gray-900 mb-6">Top Rented Items</h3>
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

            {/* Cashier Performance Chart (Visible to Admin/Owner) */}
            {charts?.cashierPerformance && charts.cashierPerformance.length > 0 && (
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                    <h3 className="font-bold text-gray-900 mb-6">Revenue by Cashier</h3>
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
                    <h3 className="font-bold text-gray-900">Recent Transactions</h3>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            <tr>
                                <th className="px-4 py-3 rounded-l-lg">ID</th>
                                <th className="px-4 py-3">Customer</th>
                                <th className="px-4 py-3">Date</th>
                                <th className="px-4 py-3">Status</th>
                                <th className="px-4 py-3 text-right rounded-r-lg">Total</th>
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
