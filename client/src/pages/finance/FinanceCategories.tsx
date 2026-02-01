
import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { Plus, Trash2 } from 'lucide-react';

import { API_BASE_URL } from '../../config/api';

const API_Base = `${API_BASE_URL}/finance`;

export default function FinanceCategories() {
    const { token } = useAuth();
    const { t } = useLanguage();
    const [categories, setCategories] = useState<any[]>([]);
    const [newName, setNewName] = useState('');

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            const res = await fetch(`${API_Base}/categories`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            setCategories(data);
        } catch (error) {
            console.error(error);
        }
    };

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch(`${API_Base}/categories`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ name: newName })
            });
            if (res.ok) {
                setNewName('');
                fetchCategories();
                alert(t('finance.categoryAdded'));
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm(t('finance.confirmDeleteCategory'))) return;
        try {
            const res = await fetch(`${API_Base}/categories/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) fetchCategories();
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-fade-in">
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <h3 className="font-bold text-gray-900 mb-4">{t('finance.categoriesTitle')}</h3>
                <div className="space-y-2">
                    {categories.map((cat) => (
                        <div key={cat.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors group">
                            <span className="font-medium text-gray-700">{cat.name}</span>
                            {cat.name !== 'Laundry' && (
                                <button onClick={() => handleDelete(cat.id)} className="text-gray-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Trash2 size={16} />
                                </button>
                            )}
                        </div>
                    ))}
                    {categories.length === 0 && <p className="text-gray-400 text-sm">{t('finance.noCategories')}</p>}
                </div>
            </div>

            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm h-fit">
                <h3 className="font-bold text-gray-900 mb-4">{t('finance.addCategoryTitle')}</h3>
                <form onSubmit={handleAdd} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('finance.categoryName')}</label>
                        <input
                            type="text"
                            required
                            placeholder={t('finance.categoryPlaceholder')}
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                    </div>
                    <button type="submit" className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg font-bold hover:bg-black transition-colors">
                        <Plus size={16} /> {t('common.add')}
                    </button>
                    <p className="text-xs text-gray-500 mt-2">
                        *{t('finance.cannotDeleteLaundry')}
                    </p>
                </form>
            </div>
        </div>
    );
}
