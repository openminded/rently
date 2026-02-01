
import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';

import { API_BASE_URL } from '../../config/api';

const API_Base = `${API_BASE_URL}/finance`;

const formatCurrency = (val: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val);

export default function FinanceIncome() {
    const { token } = useAuth();
    const { t } = useLanguage();
    const [transactions, setTransactions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const [startDate, setStartDate] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState(new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0]);

    useEffect(() => {
        fetchIncome();
    }, [startDate, endDate]);

    const fetchIncome = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_Base}/income?startDate=${startDate}&endDate=${endDate}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            setTransactions(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden animate-fade-in">
            <div className="p-4 border-b border-gray-100 flex flex-wrap items-center gap-4 bg-gray-50">
                <h3 className="font-bold text-gray-700">{t('finance.incomeHistory')}</h3>
                <div className="ml-auto flex items-center gap-2">
                    <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="text-sm border rounded px-2 py-1" />
                    <span>-</span>
                    <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="text-sm border rounded px-2 py-1" />
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-gray-600">
                    <thead className="bg-gray-50 text-gray-900 font-semibold border-b border-gray-200">
                        <tr>
                            <th className="px-4 py-3">{t('finance.table.transactionId')}</th>
                            <th className="px-4 py-3">{t('finance.table.date')}</th>
                            <th className="px-4 py-3">{t('finance.table.customer')}</th>
                            <th className="px-4 py-3">{t('finance.table.type')}</th>
                            <th className="px-4 py-3 text-right">{t('finance.table.totalBill')}</th>
                            <th className="px-4 py-3 text-right">{t('finance.table.paid')}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {loading ? (
                            <tr><td colSpan={6} className="text-center py-8">{t('common.loading')}</td></tr>
                        ) : transactions.length === 0 ? (
                            <tr><td colSpan={6} className="text-center py-8 text-gray-400">{t('finance.noIncome')}</td></tr>
                        ) : (
                            transactions.map((trx) => (
                                <tr key={trx.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-3 font-mono text-xs text-indigo-600">#{trx.id}</td>
                                    <td className="px-4 py-3">{new Date(trx.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
                                    <td className="px-4 py-3 font-medium text-gray-900">{trx.customer.name}</td>
                                    <td className="px-4 py-3">
                                        <span className={`text-xs px-2 py-0.5 rounded-full ${trx.type === 'BOOKING' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                            {trx.type}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-right text-gray-400">{formatCurrency(trx.totalAmount)}</td>
                                    <td className="px-4 py-3 text-right font-bold text-emerald-600">{formatCurrency(trx.paidAmount)}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
