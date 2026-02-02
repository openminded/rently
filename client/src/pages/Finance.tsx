
import { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { DollarSign, TrendingUp, TrendingDown, Settings, Plus } from 'lucide-react';
import FinanceSummary from './finance/FinanceSummary';
import FinanceIncome from './finance/FinanceIncome';
import FinanceExpense from './finance/FinanceExpense';
import FinanceCategories from './finance/FinanceCategories';
import FinanceSaaS from './finance/FinanceSaaS';

import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config/api';

export default function Finance() {
    const { t } = useLanguage();
    const { token } = useAuth();
    const [activeTab, setActiveTab] = useState('summary'); // summary, income, expense, categories
    const [saasEnabled, setSaasEnabled] = useState(false);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const res = await fetch(`${API_BASE_URL}/settings`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setSaasEnabled(data.SAAS_FEE_CHARGED_TO && data.SAAS_FEE_CHARGED_TO !== 'NONE');
                }
            } catch (error) {
                console.error("Failed to fetch settings", error);
            }
        };
        if (token) fetchSettings();
    }, [token]);

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
                    <h2 className="text-2xl font-bold text-gray-900">{t('menu.finance')}</h2>
                    <p className="text-gray-500">{t('finance.subtitle')}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <TabButton id="summary" label={t('finance.summary')} icon={DollarSign} />
                    <TabButton id="income" label={t('finance.income')} icon={TrendingUp} />
                    <TabButton id="expense" label={t('finance.expense')} icon={TrendingDown} />
                    {saasEnabled && <TabButton id="saas" label={t('finance.saasBill')} icon={DollarSign} />}
                    <TabButton id="categories" label={t('finance.category')} icon={Settings} />
                </div>
            </div>

            <div className="min-h-[500px]">
                {activeTab === 'summary' && <FinanceSummary />}
                {activeTab === 'income' && <FinanceIncome />}
                {activeTab === 'expense' && <FinanceExpense />}
                {activeTab === 'saas' && saasEnabled && <FinanceSaaS />}
                {activeTab === 'categories' && <FinanceCategories />}
            </div>
        </div>
    );
}
