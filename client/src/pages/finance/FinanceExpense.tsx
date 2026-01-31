
import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { Plus, Trash2 } from 'lucide-react';

const API_Base = 'http://localhost:3000/api/finance';

const formatCurrency = (val: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val);

export default function FinanceExpense() {
    const { token } = useAuth();
    const { t } = useLanguage();
    const [expenses, setExpenses] = useState<any[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Form State
    const [showModal, setShowModal] = useState(false);
    const [newExpense, setNewExpense] = useState({
        description: '',
        amount: '',
        categoryId: '',
        date: new Date().toISOString().split('T')[0]
    });

    const [startDate, setStartDate] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState(new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0]);

    useEffect(() => {
        fetchData();
        fetchCategories();
    }, [startDate, endDate]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_Base}/expenses?startDate=${startDate}&endDate=${endDate}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            setExpenses(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const fetchCategories = async () => {
        try {
            const res = await fetch(`${API_Base}/categories`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            setCategories(data);
            if (data.length > 0) setNewExpense(prev => ({ ...prev, categoryId: data[0].id }));
        } catch (error) {
            console.error(error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch(`${API_Base}/expenses`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(newExpense)
            });

            if (res.ok) {
                setShowModal(false);
                setNewExpense({ description: '', amount: '', categoryId: categories[0]?.id || '', date: new Date().toISOString().split('T')[0] });
                fetchData();
            } else {
                alert('Gagal menyimpan pengeluaran');
            }
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div className="space-y-4 animate-fade-in">
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-wrap items-center gap-4">
                <h3 className="font-bold text-gray-700">{t('finance.expenseHistory')}</h3>

                <div className="flex items-center gap-2">
                    <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="text-sm border rounded px-2 py-1" />
                    <span>-</span>
                    <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="text-sm border rounded px-2 py-1" />
                </div>

                <div className="ml-auto">
                    <button
                        onClick={() => setShowModal(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-rose-600 text-white rounded-lg text-sm font-bold hover:bg-rose-700 transition-colors shadow-sm shadow-rose-200"
                    >
                        <Plus size={16} /> {t('finance.recordExpense')}
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-gray-600">
                        <thead className="bg-gray-50 text-gray-900 font-semibold border-b border-gray-200">
                            <tr>
                                <th className="px-4 py-3">{t('finance.table.date')}</th>
                                <th className="px-4 py-3">{t('finance.table.description')}</th>
                                <th className="px-4 py-3">{t('finance.table.category')}</th>
                                <th className="px-4 py-3">{t('finance.table.type')}</th>
                                <th className="px-4 py-3">{t('finance.table.by')}</th>
                                <th className="px-4 py-3 text-right">{t('finance.table.amount')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr><td colSpan={6} className="text-center py-8">{t('common.loading')}</td></tr>
                            ) : expenses.length === 0 ? (
                                <tr><td colSpan={6} className="text-center py-8 text-gray-400">{t('finance.noExpenses')}</td></tr>
                            ) : (
                                expenses.map((exp) => (
                                    <tr key={exp.id} className="hover:bg-gray-50">
                                        <td className="px-4 py-3">{new Date(exp.date).toLocaleDateString()}</td>
                                        <td className="px-4 py-3 whitespace-pre-wrap max-w-xs">{exp.description}</td>
                                        <td className="px-4 py-3">
                                            <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
                                                {exp.category?.name || '-'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            {exp.type === 'LAUNDRY' ? (
                                                <span className="text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full text-xs font-semibold">Laundry</span>
                                            ) : (
                                                <span className="text-gray-500 text-xs">Manual</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-xs">{exp.createdBy?.name || 'System'}</td>
                                        <td className="px-4 py-3 text-right font-bold text-rose-600">{formatCurrency(exp.amount)}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal Manual Input */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-fade-in">
                    <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden">
                        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <h3 className="font-bold text-gray-900">{t('finance.newExpenseTitle')}</h3>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">&times;</button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">{t('finance.date')}</label>
                                <input
                                    type="date"
                                    required
                                    value={newExpense.date}
                                    onChange={e => setNewExpense({ ...newExpense, date: e.target.value })}
                                    className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">{t('finance.category')}</label>
                                <select
                                    required
                                    value={newExpense.categoryId}
                                    onChange={e => setNewExpense({ ...newExpense, categoryId: e.target.value })}
                                    className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                                >
                                    <option value="" disabled>{t('common.select')}</option>
                                    {categories.map(cat => (
                                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">{t('finance.description')}</label>
                                <textarea
                                    required
                                    placeholder={t('finance.expensePlaceholder')}
                                    value={newExpense.description}
                                    onChange={e => setNewExpense({ ...newExpense, description: e.target.value })}
                                    className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 outline-none h-20"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">{t('finance.amount')} (Rp)</label>
                                <input
                                    type="number"
                                    min="0"
                                    required
                                    placeholder="0"
                                    value={newExpense.amount}
                                    onChange={e => setNewExpense({ ...newExpense, amount: e.target.value })}
                                    className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-gray-900"
                                />
                            </div>

                            <div className="pt-4 flex gap-3">
                                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">{t('common.cancel')}</button>
                                <button type="submit" className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium">{t('common.save')}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
