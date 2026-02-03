import React, { useState, useEffect } from 'react';
import { Plus, Trash2, X, Save, Edit2 } from 'lucide-react';
import { DataTable, type Column } from '../../components/common/DataTable';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';

import { API_BASE_URL } from '../../config/api';

const API_BASE = `${API_BASE_URL}/masters`;

interface Field {
    name: string;
    label: string;
    type?: string; // text, number, color, select
    required?: boolean;
    options?: { value: string; label: string }[];
}

interface MasterGenericProps {
    title: string;
    description: string;
    endpoint: string;
    columns: any[];
    fields: Field[];
}

export default function MasterGenericPage({ title, description, endpoint, columns, fields }: MasterGenericProps) {
    const { hasRole, token } = useAuth();
    const { t } = useLanguage();
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedIds, setSelectedIds] = useState<number[]>([]);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentItem, setCurrentItem] = useState<any>(null);

    useEffect(() => {
        if (token) {
            fetchData();
        }
    }, [endpoint, token]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE}/${endpoint}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const json = await res.json();
            setData(Array.isArray(json) ? json : []);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        const formData = new FormData(e.target as HTMLFormElement);

        // Check if we need to send as FormData (Multipart) or JSON
        const hasFile = fields.some(f => f.type === 'file');

        try {
            const url = currentItem
                ? `${API_BASE}/${endpoint}/${currentItem.id}`
                : `${API_BASE}/${endpoint}`;

            const method = currentItem ? 'PUT' : 'POST';

            let body: any;
            let headers: any = {
                'Authorization': `Bearer ${token}`
            };

            if (hasFile && !currentItem) {
                // For Create with File, send FormData directly
                body = formData;
                // Content-Type header should NOT be set manually for FormData
            } else {
                // JSON Mode (Default or Edit)
                const payload: any = {};
                fields.forEach(f => {
                    if (f.type === 'file') return; // Skip file in JSON payload
                    let value = formData.get(f.name);
                    if (f.type === 'number') {
                        payload[f.name] = Number(value);
                    } else {
                        payload[f.name] = value;
                    }
                });
                body = JSON.stringify(payload);
                headers['Content-Type'] = 'application/json';
            }

            const res = await fetch(url, {
                method,
                headers,
                body
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Failed to save');
            }

            setIsModalOpen(false);
            fetchData();
        } catch (e: any) {
            console.error(e);
            alert(e.message || 'Failed to save item');
        }
    };

    const handleDelete = async (item: any) => {
        if (!confirm(t('common.confirmDelete'))) return;
        try {
            await fetch(`${API_BASE}/${endpoint}/${item.id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            fetchData();
        } catch (e) { console.error(e); }
    };

    const handleDeleteSelected = async () => {
        if (!confirm(t('common.confirmDelete'))) return;
        // Sequential for simplicity, ideally Promise.all
        for (const id of selectedIds) {
            await fetch(`${API_BASE}/${endpoint}/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
        }
        setSelectedIds([]);
        fetchData();
    };

    // Construct Columns
    const dtColumns: Column<any>[] = [
        {
            accessorKey: 'select',
            className: "w-10",
            header: (
                <input
                    type="checkbox"
                    checked={data.length > 0 && selectedIds.length === data.length}
                    onChange={(e) => {
                        if (e.target.checked) setSelectedIds(data.map(d => d.id));
                        else setSelectedIds([]);
                    }}
                    className="rounded border-gray-300"
                />
            ),
            cell: (row) => (
                <input
                    type="checkbox"
                    checked={selectedIds.includes(row.id)}
                    onChange={(e) => {
                        if (e.target.checked) setSelectedIds([...selectedIds, row.id]);
                        else setSelectedIds(selectedIds.filter(id => id !== row.id));
                    }}
                    className="rounded border-gray-300"
                />
            )
        },
        ...columns.map(col => ({
            header: col.label,
            accessorKey: col.key,
            sortable: true,
            cell: col.render
        }))
    ];

    const actions = (row: any) => (
        <div className="flex items-center justify-end gap-2">
            <button
                onClick={(e) => { e.stopPropagation(); setCurrentItem(row); setIsModalOpen(true); }}
                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
            >
                <Edit2 size={16} />
            </button>
            {hasRole(['SUPERADMIN', 'OWNER', 'SUPERVISOR']) && (
                <button
                    onClick={(e) => { e.stopPropagation(); handleDelete(row); }}
                    className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                >
                    <Trash2 size={16} />
                </button>
            )}
        </div>
    );

    const searchKeys = columns.map(c => c.key);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
                    <p className="text-gray-500">{description}</p>
                </div>
                <button
                    onClick={() => { setCurrentItem(null); setIsModalOpen(true); }}
                    className="bg-gray-900 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-gray-800 transition-colors"
                >
                    <Plus size={18} /> {t('common.add')}
                </button>
            </div>

            {loading ? (
                <div className="text-center py-10 text-gray-400">{t('common.loading')}</div>
            ) : (
                <DataTable
                    data={data}
                    columns={dtColumns}
                    searchKeys={searchKeys}
                    actions={actions}
                    filterSlot={
                        selectedIds.length > 0 && hasRole(['SUPERADMIN', 'OWNER', 'SUPERVISOR']) ? (
                            <button
                                onClick={handleDeleteSelected}
                                className="flex items-center gap-2 text-red-600 bg-red-50 px-3 py-2 rounded-lg hover:bg-red-100 transition-colors text-sm font-medium"
                            >
                                <Trash2 size={16} /> {t('common.delete')} ({selectedIds.length})
                            </button>
                        ) : null
                    }
                />
            )}

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md animate-in fade-in zoom-in duration-200">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold">{currentItem ? t('common.editItem') : t('common.newItem')}</h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-900"><X size={20} /></button>
                        </div>
                        <form onSubmit={handleSave} className="space-y-4">
                            {fields.map(f => (
                                <div key={f.name}>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">{f.label}</label>
                                    {f.type === 'file' ? (
                                        <input
                                            name={f.name}
                                            type="file"
                                            accept="image/*"
                                            className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                            required={f.required && !currentItem} // Required only on create
                                        />
                                    ) : f.type === 'select' ? (
                                        <select
                                            name={f.name}
                                            defaultValue={currentItem ? currentItem[f.name] : ''}
                                            className="w-full p-2 border border-gray-300 rounded-lg outline-none focus:border-blue-500"
                                            required={f.required}
                                        >
                                            <option value="" disabled>{t('common.select' as any)}</option>
                                            {f.options?.map(opt => (
                                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                                            ))}
                                        </select>
                                    ) : (
                                        <input
                                            name={f.name}
                                            type={f.type || 'text'}
                                            defaultValue={currentItem ? currentItem[f.name] : ''}
                                            className="w-full p-2 border border-gray-300 rounded-lg outline-none focus:border-blue-500 disabled:bg-gray-100"
                                            required={f.required}
                                            step={f.type === 'number' ? "0.01" : undefined}
                                        />
                                    )}
                                </div>
                            ))}
                            <div className="flex justify-end gap-3 pt-4">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">{t('common.cancel')}</button>
                                <button type="submit" className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 flex items-center gap-2">
                                    <Save size={16} /> {currentItem ? t('common.update') : t('common.create')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
