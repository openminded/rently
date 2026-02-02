import { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2 } from 'lucide-react';
import { DataTable, type Column } from '../../components/common/DataTable';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';

import { API_BASE_URL } from '../../config/api';

const API_URL = `${API_BASE_URL}/users`;

export default function UserManagement() {
    const { token, hasRole } = useAuth();
    const { t } = useLanguage();
    const [users, setUsers] = useState<any[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentItem, setCurrentItem] = useState<any>(null);

    // Access Control
    if (!hasRole(['SUPERADMIN', 'OWNER', 'SUPERVISOR'])) {
        return <div className="p-8 text-center text-red-500">{t('common.error')}</div>;
    }

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const res = await fetch(API_URL, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            // FILTER OUT SUPERADMIN
            setUsers(Array.isArray(data) ? data.filter((u: any) => u.role !== 'SUPERADMIN') : []);
        } catch (error) {
            console.error(error);
        }
    };

    const handleSave = async (e: any) => {
        e.preventDefault();
        const formData = new FormData(e.target as HTMLFormElement);
        const payload: any = {};

        formData.forEach((value, key) => payload[key] = value);

        try {
            const url = currentItem ? `${API_URL}/${currentItem.id}` : API_URL;
            const method = currentItem ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || t('common.error'));
            }

            setIsModalOpen(false);
            fetchUsers();
            alert(currentItem ? t('users.alert.updated') : t('users.alert.created'));
        } catch (error: any) {
            alert(error.message);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm(t('users.alert.confirmDelete'))) return;
        try {
            const res = await fetch(`${API_URL}/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error);
            }
            fetchUsers();
        } catch (error: any) {
            alert(error.message);
        }
    };

    const columns: Column<any>[] = [
        { header: t('common.name'), accessorKey: 'name', sortable: true, className: 'font-medium text-gray-900' },
        { header: t('auth.username'), accessorKey: 'username', sortable: true },
        {
            header: t('users.modal.role'),
            accessorKey: 'role',
            sortable: true,
            cell: (row) => (
                <span className={`px-2 py-1 rounded-full text-xs font-medium 
                    ${row.role === 'OWNER' ? 'bg-blue-100 text-blue-700' :
                        row.role === 'SUPERVISOR' ? 'bg-orange-100 text-orange-700' :
                            'bg-green-100 text-green-700'}`}>
                    {row.role}
                </span>
            )
        },
        {
            header: t('history.table.date'),
            accessorKey: 'createdAt',
            sortable: true,
            cell: (row) => new Date(row.createdAt).toLocaleDateString()
        }
    ];

    const actions = (row: any) => (
        <div className="flex justify-end gap-2">
            <button
                onClick={() => { setCurrentItem(row); setIsModalOpen(true); }}
                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                title={t('common.editItem')}
            >
                <Edit2 size={16} />
            </button>
            <button
                onClick={() => handleDelete(row.id)}
                className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                title={t('common.delete')}
            >
                <Trash2 size={16} />
            </button>
        </div>
    );

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">{t('users.title')}</h1>
                    <p className="text-gray-500">{t('users.subtitle')}</p>
                </div>
                <button
                    onClick={() => { setCurrentItem(null); setIsModalOpen(true); }}
                    className="bg-gray-900 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-gray-800 transition-colors"
                >
                    <Plus size={18} /> {t('users.action.addUser')}
                </button>
            </div>

            <DataTable
                data={users}
                columns={columns}
                searchKeys={['name', 'username', 'role']}
                actions={actions}
            />

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
                        <h3 className="text-xl font-bold mb-4">{currentItem ? t('common.editItem') : t('common.newItem')}</h3>
                        <form onSubmit={handleSave} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">{t('users.modal.fullName')}</label>
                                <input type="text" name="name" defaultValue={currentItem?.name} required className="w-full p-2 border rounded-lg" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">{t('auth.username')}</label>
                                <input type="text" name="username" defaultValue={currentItem?.username} required disabled={!!currentItem} className="w-full p-2 border rounded-lg disabled:bg-gray-100" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">{t('users.modal.role')}</label>
                                <select name="role" defaultValue={currentItem?.role || 'KASIR'} className="w-full p-2 border rounded-lg">
                                    <option value="KASIR">KASIR</option>
                                    <option value="SUPERVISOR">SUPERVISOR</option>
                                    <option value="OWNER">OWNER</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    {currentItem ? t('users.modal.resetPassword') : t('users.modal.password')}
                                </label>
                                <input
                                    type="password"
                                    name="password"
                                    required={!currentItem}
                                    placeholder={currentItem ? t('users.modal.passwordHint') : ""}
                                    className="w-full p-2 border rounded-lg"
                                />
                            </div>
                            <div className="flex justify-end gap-3 mt-6">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">{t('common.cancel')}</button>
                                <button type="submit" className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800">{t('common.save')}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
