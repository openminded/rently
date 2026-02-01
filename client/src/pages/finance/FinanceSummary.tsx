
import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { TrendingUp, TrendingDown, DollarSign, Calendar, PieChart as PieChartIcon } from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
    PieChart, Pie, Legend
} from 'recharts';

import { API_BASE_URL } from '../../config/api';

const API_Base = `${API_BASE_URL}/finance`;

const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val);
};

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#6366f1'];

export default function FinanceSummary() {
    const { token } = useAuth();
    const { t } = useLanguage();
    const [summary, setSummary] = useState<any>(null);
    const [categoryData, setCategoryData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Default: This Month
    const [startDate, setStartDate] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState(new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0]);

    useEffect(() => {
        fetchData();
    }, [startDate, endDate]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [summaryRes, catRes] = await Promise.all([
                fetch(`${API_Base}/summary?startDate=${startDate}&endDate=${endDate}`, { headers: { 'Authorization': `Bearer ${token}` } }),
                fetch(`${API_Base}/summary-by-category?startDate=${startDate}&endDate=${endDate}`, { headers: { 'Authorization': `Bearer ${token}` } })
            ]);

            const summaryData = await summaryRes.json();
            const catData = await catRes.json();

            setSummary(summaryData);
            setCategoryData(catData);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    if (loading && !summary) return <div className="p-8 text-center text-gray-500">{t('common.loading')}</div>;

    const summaryChartData = [
        { name: t('finance.income'), value: summary?.income || 0, color: '#10b981' },
        { name: t('finance.expense'), value: summary?.expense || 0, color: '#ef4444' },
    ];

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Filter Bar */}
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-wrap items-center gap-4">
                <Calendar size={18} className="text-gray-400" />
                <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">{t('finance.fromDate')}</span>
                    <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="border border-gray-300 rounded px-2 py-1 text-sm bg-gray-50 outline-none focus:border-indigo-500"
                    />
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">{t('finance.toDate')}</span>
                    <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="border border-gray-300 rounded px-2 py-1 text-sm bg-gray-50 outline-none focus:border-indigo-500"
                    />
                </div>
                <button
                    onClick={fetchData}
                    className="ml-auto px-4 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg text-sm font-medium hover:bg-indigo-100 transition-colors"
                >
                    {t('finance.refresh')}
                </button>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden group">
                    <div className="absolute right-0 top-0 w-24 h-24 bg-emerald-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                    <div className="flex items-center gap-4 mb-2 relative z-10">
                        <div className="p-3 bg-emerald-100 text-emerald-600 rounded-xl">
                            <TrendingUp size={24} />
                        </div>
                        <p className="text-gray-500 font-medium text-sm uppercase tracking-wider">{t('finance.totalIncome')}</p>
                    </div>
                    <h3 className="text-2xl font-black text-emerald-600 relative z-10">{formatCurrency(summary?.income || 0)}</h3>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden group">
                    <div className="absolute right-0 top-0 w-24 h-24 bg-rose-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                    <div className="flex items-center gap-4 mb-2 relative z-10">
                        <div className="p-3 bg-rose-100 text-rose-600 rounded-xl">
                            <TrendingDown size={24} />
                        </div>
                        <p className="text-gray-500 font-medium text-sm uppercase tracking-wider">{t('finance.totalExpense')}</p>
                    </div>
                    <h3 className="text-2xl font-black text-rose-600 relative z-10">{formatCurrency(summary?.expense || 0)}</h3>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden group">
                    <div className="absolute right-0 top-0 w-24 h-24 bg-indigo-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                    <div className="flex items-center gap-4 mb-2 relative z-10">
                        <div className="p-3 bg-indigo-100 text-indigo-600 rounded-xl">
                            <DollarSign size={24} />
                        </div>
                        <p className="text-gray-500 font-medium text-sm uppercase tracking-wider">{t('finance.totalProfit')}</p>
                    </div>
                    <h3 className={`text-2xl font-black relative z-10 ${(summary?.profit || 0) >= 0 ? 'text-indigo-600' : 'text-rose-600'}`}>
                        {formatCurrency(summary?.profit || 0)}
                    </h3>
                </div>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Income vs Expense Bar Chart */}
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm min-h-[400px]">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="font-bold text-gray-900">{t('finance.chart.pnl')}</h3>
                    </div>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={summaryChartData} layout="vertical" barSize={40}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e5e7eb" />
                                <XAxis type="number" hide />
                                <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 12, fontWeight: 600, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                                <Tooltip
                                    formatter={(val: any) => formatCurrency(val)}
                                    cursor={{ fill: 'transparent' }}
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                                <Bar dataKey="value" radius={[0, 8, 8, 0]} animationDuration={1000}>
                                    {summaryChartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Expense Breakdown Pie Chart */}
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm min-h-[400px]">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="font-bold text-gray-900">{t('finance.chart.expenseComposition')}</h3>
                        <PieChartIcon size={18} className="text-gray-400" />
                    </div>
                    {categoryData.length > 0 ? (
                        <div className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={categoryData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={100}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {categoryData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        formatter={(val: any) => formatCurrency(val)}
                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    />
                                    <Legend
                                        layout="vertical"
                                        verticalAlign="middle"
                                        align="right"
                                        wrapperStyle={{ fontSize: '12px' }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div className="h-[300px] flex items-center justify-center text-gray-400 text-sm">
                            {t('finance.noExpenses')}
                        </div>
                    )}
                </div>

            </div>

            {/* Top Spending Categories List */}
            {categoryData.length > 0 && (
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                    <h3 className="font-bold text-gray-900 mb-4">{t('finance.table.expenseByCategory')}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {categoryData.map((cat, idx) => (
                            <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <div className="flex items-center gap-3">
                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></div>
                                    <span className="text-sm font-medium text-gray-700">{cat.name || t('finance.uncategorized')}</span>
                                </div>
                                <span className="text-sm font-bold text-gray-900">{formatCurrency(cat.value)}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
