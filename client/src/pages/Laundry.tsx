import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { DataTable } from '../components/common/DataTable';
import { Package2, Send, CheckCircle2 } from 'lucide-react';

import { API_BASE_URL } from '../config/api';

const API_URL = API_BASE_URL;

export default function Laundry() {
    const { token } = useAuth();
    const { t } = useLanguage();
    const [activeTab, setActiveTab] = useState<'in-progress' | 'complete'>('in-progress');
    const [batches, setBatches] = useState<any[]>([]);
    const [waitingItems, setWaitingItems] = useState<any[]>([]);
    const [partners, setPartners] = useState<any[]>([]);
    const [showSendModal, setShowSendModal] = useState(false);
    const [selectedItems, setSelectedItems] = useState<number[]>([]);
    const [batchForm, setBatchForm] = useState({
        partnerId: '',
        expense: '',
        note: ''
    });

    useEffect(() => {
        if (!token) return;
        fetchData();
    }, [token, activeTab]);

    const fetchData = async () => {
        try {
            const headers = { 'Authorization': `Bearer ${token}` };

            if (activeTab === 'in-progress') {
                // Fetch waiting items and in-progress batches
                const [waitingRes, batchesRes, partnersRes] = await Promise.all([
                    fetch(`${API_URL}/laundry?status=WAITING`, { headers }),
                    fetch(`${API_URL}/laundry/batches?status=IN_PROGRESS`, { headers }),
                    fetch(`${API_URL}/laundry-partners`, { headers })
                ]);

                if (waitingRes.ok) setWaitingItems(await waitingRes.json());
                if (batchesRes.ok) setBatches(await batchesRes.json());
                if (partnersRes.ok) setPartners(await partnersRes.json());
            } else {
                // Fetch completed batches
                const res = await fetch(`${API_URL}/laundry/batches?status=COMPLETED`, { headers });
                if (res.ok) setBatches(await res.json());
            }
        } catch (error) {
            console.error('Failed to fetch laundry data:', error);
        }
    };

    const handleSendToLaundry = async () => {
        if (!batchForm.partnerId || selectedItems.length === 0) {
            alert(t('laundry.alert.selectItems'));
            return;
        }

        try {
            const res = await fetch(`${API_URL}/laundry/batches`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    partnerId: parseInt(batchForm.partnerId),
                    logIds: selectedItems,
                    expense: parseFloat(batchForm.expense) || 0,
                    note: batchForm.note
                })
            });

            if (res.ok) {
                alert(t('laundry.alert.sendSuccess'));
                setShowSendModal(false);
                setSelectedItems([]);
                setBatchForm({ partnerId: '', expense: '', note: '' });
                fetchData();
            } else {
                alert(t('laundry.alert.sendError'));
            }
        } catch (error) {
            console.error('Failed to send to laundry:', error);
            alert(t('laundry.alert.sendError'));
        }
    };

    const [showCompleteModal, setShowCompleteModal] = useState(false);
    const [completingBatch, setCompletingBatch] = useState<any>(null);
    const [completionItems, setCompletionItems] = useState<Record<number, { status: string, note: string, selected: boolean }>>({});

    const handleOpenCompleteModal = (batch: any) => {
        setCompletingBatch(batch);
        // Initialize all items as selected and status AVAILABLE
        const initialItems: any = {};
        batch.logs.forEach((log: any) => {
            initialItems[log.id] = { status: 'AVAILABLE', note: '', selected: true };
        });
        setCompletionItems(initialItems);
        setShowCompleteModal(true);
    };

    const handleConfirmComplete = async () => {
        if (!completingBatch) return;

        // Filter selected items
        const itemsToProcess = Object.entries(completionItems)
            .filter(([_, data]) => data.selected)
            .map(([logId, data]) => ({
                logId: parseInt(logId),
                status: data.status === 'AVAILABLE' ? 'AVAILABLE' : 'NOT_READY',
                note: data.note
            }));

        if (itemsToProcess.length === 0) {
            alert(t('laundry.alert.noItems'));
            return;
        }

        try {
            const res = await fetch(`${API_URL}/laundry/batches/${completingBatch.id}/complete`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ items: itemsToProcess })
            });

            if (res.ok) {
                alert(t('laundry.alert.completeSuccess'));
                setShowCompleteModal(false);
                setCompletingBatch(null);
                fetchData();
            } else {
                alert(t('laundry.alert.completeError'));
            }
        } catch (error) {
            console.error('Failed to complete batch:', error);
            alert(t('laundry.alert.completeError'));
        }
    };

    const toggleSelectAll = () => {
        if (selectedItems.length === waitingItems.length) {
            setSelectedItems([]);
        } else {
            setSelectedItems(waitingItems.map(item => item.id));
        }
    };

    const toggleSelectItem = (id: number) => {
        if (selectedItems.includes(id)) {
            setSelectedItems(selectedItems.filter(item => item !== id));
        } else {
            setSelectedItems([...selectedItems, id]);
        }
    };

    const waitingColumns = [
        {
            header: (
                <input
                    type="checkbox"
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    checked={waitingItems.length > 0 && selectedItems.length === waitingItems.length}
                    onChange={toggleSelectAll}
                />
            ),
            accessorKey: 'selection',
            cell: (item: any) => (
                <input
                    type="checkbox"
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    checked={selectedItems.includes(item.id)}
                    onChange={() => toggleSelectItem(item.id)}
                />
            )
        },
        { header: t('laundry.table.logId'), accessorKey: 'id' },
        {
            header: t('inventory.table.item'),
            accessorKey: 'itemInstance',
            cell: (item: any) => `${item.itemInstance.itemVariant.item.name} - ${item.itemInstance.itemVariant.size.name} ${item.itemInstance.itemVariant.color.name}`
        },
        { header: t('laundry.table.sku'), accessorKey: 'itemInstance.sku', cell: (item: any) => item.itemInstance.sku },
        {
            header: t('laundry.table.added'),
            accessorKey: 'createdAt',
            cell: (item: any) => new Date(item.createdAt).toLocaleDateString()
        }
    ];

    const batchColumns = [
        { header: t('laundry.table.batchId'), accessorKey: 'id' },
        { header: t('laundry.modal.complete.partner'), accessorKey: 'partner.name', cell: (batch: any) => batch.partner.name },
        {
            header: t('laundry.table.items'),
            accessorKey: 'logs',
            cell: (batch: any) => `${batch.logs.length} ${t('laundry.table.items')}`
        },
        {
            header: t('laundry.table.expense'),
            accessorKey: 'expense',
            cell: (batch: any) => `Rp ${batch.expense.toLocaleString()}`
        },
        {
            header: t('laundry.table.sentDate'),
            accessorKey: 'sentDate',
            cell: (batch: any) => new Date(batch.sentDate).toLocaleDateString()
        },
        ...(activeTab === 'complete' ? [{
            header: t('laundry.table.completedDate'),
            accessorKey: 'completedDate',
            cell: (batch: any) => batch.completedDate ? new Date(batch.completedDate).toLocaleDateString() : '-'
        }] : []),
        { header: t('invoice.table.note'), accessorKey: 'note', cell: (batch: any) => batch.note || '-' }
    ];

    return (
        <div className="p-8">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">{t('laundry.title')}</h1>
                <p className="text-gray-600">{t('laundry.subtitle')}</p>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-6 border-b border-gray-200">
                <button
                    onClick={() => setActiveTab('in-progress')}
                    className={`px-4 py-2 font-medium transition-colors ${activeTab === 'in-progress'
                        ? 'text-blue-600 border-b-2 border-blue-600'
                        : 'text-gray-500 hover:text-gray-700'
                        }`}
                >
                    <div className="flex items-center gap-2">
                        <Package2 size={18} />
                        {t('laundry.tab.inProgress')}
                    </div>
                </button>
                <button
                    onClick={() => setActiveTab('complete')}
                    className={`px-4 py-2 font-medium transition-colors ${activeTab === 'complete'
                        ? 'text-green-600 border-b-2 border-green-600'
                        : 'text-gray-500 hover:text-gray-700'
                        }`}
                >
                    <div className="flex items-center gap-2">
                        <CheckCircle2 size={18} />
                        {t('laundry.tab.complete')}
                    </div>
                </button>
            </div>

            {/* In Progress Tab */}
            {activeTab === 'in-progress' && (
                <div className="space-y-6">
                    {/* Waiting Items */}
                    <div className="bg-white rounded-lg shadow">
                        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                            <h2 className="font-semibold text-gray-900">{t('laundry.waiting')} ({waitingItems.length})</h2>
                            {waitingItems.length > 0 && (
                                <button
                                    onClick={() => setShowSendModal(true)}
                                    disabled={selectedItems.length === 0}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-white ${selectedItems.length === 0
                                        ? 'bg-gray-300 cursor-not-allowed'
                                        : 'bg-blue-600 hover:bg-blue-700'
                                        }`}
                                >
                                    <Send size={18} />
                                    {t('laundry.action.sendSelected', { count: selectedItems.length })}
                                </button>
                            )}
                        </div>
                        <DataTable
                            data={waitingItems}
                            columns={waitingColumns}
                            searchKeys={['itemInstance.sku', 'itemInstance.itemVariant.item.name']}
                            noCard={true}
                        />
                    </div>

                    {/* In Progress Batches */}
                    <div className="bg-white rounded-lg shadow">
                        <div className="p-4 border-b border-gray-200">
                            <h2 className="font-semibold text-gray-900">{t('laundry.activeBatches')} ({batches.length})</h2>
                        </div>
                        <DataTable
                            data={batches}
                            columns={batchColumns}
                            searchKeys={['partner.name', 'note']}
                            noCard={true}
                            actions={(batch: any) => (
                                <button
                                    onClick={() => handleOpenCompleteModal(batch)}
                                    className="text-green-600 hover:text-green-700 font-medium"
                                >
                                    {t('laundry.action.markComplete')}
                                </button>
                            )}
                        />
                    </div>
                </div>
            )}

            {/* Complete Tab */}
            {activeTab === 'complete' && (
                <div className="bg-white rounded-lg shadow">
                    <div className="p-4 border-b border-gray-200">
                        <h2 className="font-semibold text-gray-900">{t('laundry.completedBatches')} ({batches.length})</h2>
                    </div>
                    <DataTable
                        data={batches}
                        columns={batchColumns}
                        searchKeys={['partner.name', 'note']}
                        noCard={true}
                    />
                </div>
            )}

            {/* Complete Batch Modal */}
            {showCompleteModal && completingBatch && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
                    <div className="bg-white rounded-lg p-6 w-full max-w-4xl my-8">
                        <h3 className="text-lg font-semibold mb-2">{t('laundry.modal.complete.title', { id: completingBatch.id })}</h3>
                        <p className="text-sm text-gray-600 mb-4">{t('laundry.modal.complete.partner')}: {completingBatch.partner.name} | {t('laundry.modal.complete.sent')}: {new Date(completingBatch.sentDate).toLocaleDateString()}</p>

                        <div className="border rounded-lg overflow-hidden mb-4">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50 border-b">
                                    <tr>
                                        <th className="px-4 py-2 text-left w-10">
                                            <input
                                                type="checkbox"
                                                checked={Object.values(completionItems).every(i => i.selected)}
                                                onChange={(e) => {
                                                    const allSelected = e.target.checked;
                                                    setCompletionItems(prev => {
                                                        const next = { ...prev };
                                                        Object.keys(next).forEach(key => next[parseInt(key)].selected = allSelected);
                                                        return next;
                                                    });
                                                }}
                                            />
                                        </th>
                                        <th className="px-4 py-2 text-left">{t('inventory.table.item')}</th>
                                        <th className="px-4 py-2 text-left">{t('laundry.table.sku')}</th>
                                        <th className="px-4 py-2 text-left">{t('laundry.modal.complete.statusResult')}</th>
                                        <th className="px-4 py-2 text-left">{t('invoice.table.note')}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {completingBatch.logs.filter((log: any) => log.status !== 'COMPLETED').map((log: any) => {
                                        const itemState = completionItems[log.id] || { status: 'AVAILABLE', note: '', selected: true };
                                        return (
                                            <tr key={log.id} className={!itemState.selected ? 'opacity-50' : ''}>
                                                <td className="px-4 py-2">
                                                    <input
                                                        type="checkbox"
                                                        checked={itemState.selected}
                                                        onChange={(e) => {
                                                            setCompletionItems(prev => ({
                                                                ...prev,
                                                                [log.id]: { ...prev[log.id], selected: e.target.checked }
                                                            }));
                                                        }}
                                                    />
                                                </td>
                                                <td className="px-4 py-2">
                                                    {log.itemInstance.itemVariant.item.name} - {log.itemInstance.itemVariant.size.name} {log.itemInstance.itemVariant.color.name}
                                                </td>
                                                <td className="px-4 py-2">{log.itemInstance.sku}</td>
                                                <td className="px-4 py-2">
                                                    <select
                                                        value={itemState.status}
                                                        onChange={(e) => setCompletionItems(prev => ({
                                                            ...prev,
                                                            [log.id]: { ...prev[log.id], status: e.target.value }
                                                        }))}
                                                        disabled={!itemState.selected}
                                                        className={`border rounded px-2 py-1 w-full ${itemState.status === 'NOT_READY' ? 'text-red-600 border-red-300 bg-red-50' : 'text-green-600 border-green-300'}`}
                                                    >
                                                        <option value="AVAILABLE">✅ {t('laundry.modal.complete.ready')}</option>
                                                        <option value="NOT_READY">❌ {t('laundry.modal.complete.notReady')}</option>
                                                    </select>
                                                </td>
                                                <td className="px-4 py-2">
                                                    <input
                                                        type="text"
                                                        placeholder={t('invoice.table.note') + "..."}
                                                        value={itemState.note}
                                                        onChange={(e) => setCompletionItems(prev => ({
                                                            ...prev,
                                                            [log.id]: { ...prev[log.id], note: e.target.value }
                                                        }))}
                                                        disabled={!itemState.selected}
                                                        className="border rounded px-2 py-1 w-full"
                                                    />
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                            {completingBatch.logs.every((l: any) => l.status === 'COMPLETED') && (
                                <div className="p-4 text-center text-gray-500">All items in this batch are already completed.</div>
                            )}
                        </div>

                        <div className="flex gap-2 justify-end">
                            <button
                                onClick={() => setShowCompleteModal(false)}
                                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                            >
                                {t('common.cancel')}
                            </button>
                            <button
                                onClick={handleConfirmComplete}
                                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                            >
                                {t('laundry.modal.complete.confirm')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Send to Laundry Modal */}
            {showSendModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <h3 className="text-lg font-semibold mb-4">{t('laundry.modal.send.title')}</h3>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    {t('laundry.modal.send.partner')} *
                                </label>
                                <select
                                    value={batchForm.partnerId}
                                    onChange={(e) => setBatchForm({ ...batchForm, partnerId: e.target.value })}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                    required
                                >
                                    <option value="">{t('common.select')} {t('laundry.modal.complete.partner')}</option>
                                    {partners.map(p => (
                                        <option key={p.id} value={p.id}>{p.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    {t('laundry.modal.send.expense')}
                                </label>
                                <input
                                    type="number"
                                    value={batchForm.expense}
                                    onChange={(e) => setBatchForm({ ...batchForm, expense: e.target.value })}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                    placeholder="0"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    {t('invoice.table.note')}
                                </label>
                                <textarea
                                    value={batchForm.note}
                                    onChange={(e) => setBatchForm({ ...batchForm, note: e.target.value })}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                    rows={3}
                                    placeholder={t('laundry.modal.send.notePlaceholder')}
                                />
                            </div>

                            <div className="text-sm text-gray-600">
                                {t('laundry.modal.send.sendingCount', { count: selectedItems.length })}
                            </div>
                        </div>

                        <div className="flex gap-2 mt-6">
                            <button
                                onClick={() => setShowSendModal(false)}
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                            >
                                {t('common.cancel')}
                            </button>
                            <button
                                onClick={handleSendToLaundry}
                                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                            >
                                {t('pos.process.immediate').split('&')[0].trim()}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
