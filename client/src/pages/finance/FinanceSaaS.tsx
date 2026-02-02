
import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { TrendingUp, User, ShoppingBag, Filter } from 'lucide-react';
import { format } from 'date-fns';
import { API_BASE_URL } from '../../config/api';

interface SaaSFeeLog {
    id: number;
    transactionId: number;
    amount: number;
    calculationDetails: string;
    chargedTo: string;
    createdAt: string;
    transaction: {
        id: number;
        pickupDate: string;
        customer: { name: string };
        status: string;
    }
}

interface Summary {
    totalRevenue: number;
    breakdown: {
        CUSTOMER: number;
        MERCHANT: number;
    }
}

export default function FinanceSaaS() {
    const { token } = useAuth();
    const [logs, setLogs] = useState<SaaSFeeLog[]>([]);
    const [summary, setSummary] = useState<Summary>({ totalRevenue: 0, breakdown: { CUSTOMER: 0, MERCHANT: 0 } });
    const [loading, setLoading] = useState(true);

    // Filters
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    useEffect(() => {
        if (token) fetchHistory();
    }, [startDate, endDate, token]);

    const fetchHistory = async () => {
        setLoading(true);
        try {
            const query = new URLSearchParams();
            if (startDate) query.append('startDate', startDate);
            if (endDate) query.append('endDate', endDate);

            const res = await fetch(`${API_BASE_URL}/saas/history?${query.toString()}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setLogs(data.logs);
                setSummary(data.summary);
            }
        } catch (error) {
            console.error('Failed to fetch history', error);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val);
    };

    return (
        <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex items-center gap-3 mb-2 text-gray-500">
                        <TrendingUp size={20} className="text-green-500" />
                        <span className="font-medium">Total SaaS Fees</span>
                    </div>
                    <p className="text-3xl font-bold text-gray-900">{formatCurrency(summary.totalRevenue)}</p>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex items-center gap-3 mb-2 text-gray-500">
                        <User size={20} className="text-blue-500" />
                        <span className="font-medium">From Customer</span>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{formatCurrency(summary.breakdown.CUSTOMER)}</p>
                    <p className="text-xs text-gray-400 mt-1">Included in Admin Fee</p>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex items-center gap-3 mb-2 text-gray-500">
                        <ShoppingBag size={20} className="text-purple-500" />
                        <span className="font-medium">From Merchant</span>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{formatCurrency(summary.breakdown.MERCHANT)}</p>
                    <p className="text-xs text-gray-400 mt-1">Provider Billable to Owner</p>
                </div>
            </div>

            {/* Filter */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex gap-4 items-end">
                <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">Start Date</label>
                    <input
                        type="date"
                        value={startDate}
                        onChange={e => setStartDate(e.target.value)}
                        className="p-2 border rounded-lg text-sm"
                    />
                </div>
                <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">End Date</label>
                    <input
                        type="date"
                        value={endDate}
                        onChange={e => setEndDate(e.target.value)}
                        className="p-2 border rounded-lg text-sm"
                    />
                </div>
                <button
                    onClick={() => { setStartDate(''); setEndDate(''); }}
                    className="p-2 text-gray-500 hover:text-gray-700 text-sm underline"
                >
                    Clear Lookback
                </button>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-50 text-gray-600 text-xs uppercase font-bold tracking-wider">
                        <tr>
                            <th className="p-4 border-b">ID</th>
                            <th className="p-4 border-b">Tanggal</th>
                            <th className="p-4 border-b">Customer</th>
                            <th className="p-4 border-b">Rincian</th>
                            <th className="p-4 border-b">Dibebankan</th>
                            <th className="p-4 border-b text-right">Nominal</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-sm">
                        {loading ? (
                            <tr><td colSpan={6} className="p-8 text-center text-gray-400">Loading...</td></tr>
                        ) : logs.length === 0 ? (
                            <tr><td colSpan={6} className="p-8 text-center text-gray-400">No records found.</td></tr>
                        ) : (
                            logs.map(log => (
                                <tr key={log.id} className="hover:bg-gray-50">
                                    <td className="p-4 font-mono text-xs">#{log.transactionId}</td>
                                    <td className="p-4 text-gray-600">
                                        {format(new Date(log.createdAt), 'dd MMM yyyy HH:mm')}
                                    </td>
                                    <td className="p-4 font-medium">{log.transaction.customer.name}</td>
                                    <td className="p-4 text-gray-500">{log.calculationDetails}</td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded text-xs font-bold ${log.chargedTo === 'CUSTOMER' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                                            }`}>
                                            {log.chargedTo}
                                        </span>
                                    </td>
                                    <td className="p-4 text-right font-mono font-bold">
                                        {formatCurrency(log.amount)}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
