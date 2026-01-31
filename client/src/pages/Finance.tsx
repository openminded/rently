
import { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { DollarSign, TrendingUp, TrendingDown, Settings, Plus } from 'lucide-react';
import FinanceSummary from './finance/FinanceSummary';
import FinanceIncome from './finance/FinanceIncome';
import FinanceExpense from './finance/FinanceExpense';
import FinanceCategories from './finance/FinanceCategories';

export default function Finance() {
    const { t } = useLanguage();
    const [activeTab, setActiveTab] = useState('summary'); // summary, income, expense, categories

    const TabButton = ({ id, label, icon: Icon }: any) => (
        <button
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === id
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                }`}
        >
            <Icon size={16} />
            {label}
        </button>
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Keuangan</h2>
                    <p className="text-gray-500">Laporan pemasukan, pengeluaran, dan profit bersih.</p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <TabButton id="summary" label="Ringkasan" icon={DollarSign} />
                    <TabButton id="income" label="Pemasukan" icon={TrendingUp} />
                    <TabButton id="expense" label="Pengeluaran" icon={TrendingDown} />
                    <TabButton id="categories" label="Kategori" icon={Settings} />
                </div>
            </div>

            <div className="min-h-[500px]">
                {activeTab === 'summary' && <FinanceSummary />}
                {activeTab === 'income' && <FinanceIncome />}
                {activeTab === 'expense' && <FinanceExpense />}
                {activeTab === 'categories' && <FinanceCategories />}
            </div>
        </div>
    );
}
