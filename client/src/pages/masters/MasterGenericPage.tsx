import React, { useState, useEffect } from 'react';
import { Plus, Search, Trash2, X, Save } from 'lucide-react';
import Table from '../../components/Table';

const API_BASE = 'http://localhost:3000/api/masters';

interface Field {
    name: string;
    label: string;
    type?: string; // text, number, color
    required?: boolean;
}

interface MasterGenericProps {
    title: string;
    description: string;
    endpoint: string;
    columns: any[];
    fields: Field[];
}

export default function MasterGenericPage({ title, description, endpoint, columns, fields }: MasterGenericProps) {
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [selectedIds, setSelectedIds] = useState<number[]>([]);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentItem, setCurrentItem] = useState<any>(null);

    useEffect(() => {
        fetchData();
    }, [endpoint]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE}/${endpoint}`);
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
        const payload: any = {};

        fields.forEach(f => {
            let value = formData.get(f.name);
            if (f.type === 'number') {
                payload[f.name] = Number(value);
            } else {
                payload[f.name] = value;
            }
        });

        try {
            const url = currentItem
                ? `${API_BASE}/${endpoint}/${currentItem.id}`
                : `${API_BASE}/${endpoint}`;

            const method = currentItem ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!res.ok) throw new Error('Failed to save');

            setIsModalOpen(false);
            fetchData();
        } catch (e) {
            console.error(e);
            alert('Failed to save item');
        }
    };

    const handleDelete = async (item: any) => {
        if (!confirm(`Delete ${item.name || 'item'}?`)) return;
        try {
            await fetch(`${API_BASE}/${endpoint}/${item.id}`, { method: 'DELETE' });
            fetchData();
        } catch (e) { console.error(e); }
    };

    const handleDeleteSelected = async () => {
        if (!confirm(`Delete ${selectedIds.length} items?`)) return;
        // Sequential for simplicity, ideally Promise.all
        for (const id of selectedIds) {
            await fetch(`${API_BASE}/${endpoint}/${id}`, { method: 'DELETE' });
        }
        setSelectedIds([]);
        fetchData();
    };

    const filteredData = data.filter(d =>
        Object.values(d).some(val =>
            String(val).toLowerCase().includes(search.toLowerCase())
        )
    );

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
                    <Plus size={18} /> Add New
                </button>
            </div>

            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder={`Search ${title}...`}
                        className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 outline-none focus:border-blue-500 transition-colors"
                    />
                </div>
                {selectedIds.length > 0 && (
                    <button onClick={handleDeleteSelected} className="flex items-center gap-2 text-red-600 bg-red-50 px-4 py-2 rounded-lg hover:bg-red-100 transition-colors">
                        <Trash2 size={18} /> Delete ({selectedIds.length})
                    </button>
                )}
            </div>

            {loading ? (
                <div className="text-center py-10 text-gray-400">Loading...</div>
            ) : (
                <Table
                    data={filteredData}
                    columns={columns}
                    onEdit={(item) => { setCurrentItem(item); setIsModalOpen(true); }}
                    onDelete={handleDelete}
                    onSelectionChange={setSelectedIds}
                />
            )}

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md animate-in fade-in zoom-in duration-200">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold">{currentItem ? 'Edit Item' : 'New Item'}</h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-900"><X size={20} /></button>
                        </div>
                        <form onSubmit={handleSave} className="space-y-4">
                            {fields.map(f => (
                                <div key={f.name}>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">{f.label}</label>
                                    <input
                                        name={f.name}
                                        type={f.type || 'text'}
                                        defaultValue={currentItem ? currentItem[f.name] : ''}
                                        className="w-full p-2 border border-gray-300 rounded-lg outline-none focus:border-blue-500 disabled:bg-gray-100"
                                        required={f.required}
                                        step={f.type === 'number' ? "0.01" : undefined}
                                    />
                                </div>
                            ))}
                            <div className="flex justify-end gap-3 pt-4">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
                                <button type="submit" className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 flex items-center gap-2">
                                    <Save size={16} /> {currentItem ? 'Update' : 'Create'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
