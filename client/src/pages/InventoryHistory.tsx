import React, { useEffect, useState } from 'react';
import { Package, ClipboardList, Info } from 'lucide-react';
import { DataTable, type Column } from '../components/common/DataTable';
import { useAuth } from '../context/AuthContext';

const API_URL = 'http://localhost:3000/api';

export default function InventoryHistory() {
    const { token } = useAuth();
    const [resumeData, setResumeData] = useState([]);
    const [historyData, setHistoryData] = useState([]);
    const [loading, setLoading] = useState(true);

    // History Filters
    const [dateRange, setDateRange] = useState({ start: '', end: '' });

    const fetchData = async () => {
        setLoading(true);
        try {
            const headers = { 'Authorization': `Bearer ${token}` };
            const [resumeRes, historyRes] = await Promise.all([
                fetch(`${API_URL}/items/resume`, { headers }),
                fetch(`${API_URL}/items/history`, { headers })
            ]);

            if (resumeRes.ok) setResumeData(await resumeRes.json());
            if (historyRes.ok) setHistoryData(await historyRes.json());
        } catch (error) {
            console.error("Failed to fetch history data", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (token) {
            fetchData();
        }
    }, [token]);

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString('id-ID', {
            dateStyle: 'medium',
            timeStyle: 'short'
        });
    };

    // Columns for Resume
    const resumeColumns: Column<any>[] = [
        { header: 'Product Name', accessorKey: 'itemName', sortable: true, className: 'font-medium text-gray-900' },
        {
            header: 'Variant',
            accessorKey: 'size',
            cell: (item) => <span className="text-gray-500">{item.size} - {item.color}</span>
        },
        { header: 'Total', accessorKey: 'total', sortable: true, className: 'text-center font-bold' },
        { header: 'Available', accessorKey: 'available', sortable: true, className: 'text-center text-green-700 font-bold bg-green-50' },
        { header: 'Rented', accessorKey: 'rented', sortable: true, className: 'text-center text-blue-700 font-bold bg-blue-50' },
        { header: 'Laundry', accessorKey: 'laundry', sortable: true, className: 'text-center text-purple-700 font-bold bg-purple-50' },
        { header: 'Not Ready', accessorKey: 'notReady', sortable: true, className: 'text-center text-red-700 font-bold bg-red-50' },
    ];

    // Columns for History
    const historyColumns: Column<any>[] = [
        {
            header: 'Type',
            accessorKey: 'type',
            cell: (log) => (
                <span className={`text-xs font-bold px-2 py-0.5 rounded ${log.type === 'STOCK_ADDED' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                    {log.type === 'STOCK_ADDED' ? 'Stock Update' : 'Transaction'}
                </span>
            )
        },
        {
            header: 'Date',
            accessorKey: 'date',
            sortable: true,
            cell: (log) => <span className="text-xs text-gray-500 font-mono">{formatDate(log.date)}</span>
        },
        { header: 'Description', accessorKey: 'description', className: 'font-medium text-gray-800' },
        { header: 'Status', accessorKey: 'status', className: 'text-xs text-gray-500' }
    ];

    // Filter History Data by Date
    const filteredHistory = historyData.filter((log: any) => {
        if (!dateRange.start && !dateRange.end) return true;
        const logDate = new Date(log.date);

        if (dateRange.start && logDate < new Date(dateRange.start)) return false;
        if (dateRange.end) {
            const endDate = new Date(dateRange.end);
            endDate.setHours(23, 59, 59, 999);
            if (logDate > endDate) return false;
        }
        return true;
    });

    return (
        <div className="p-6 space-y-8">
            <h1 className="text-2xl font-bold flex items-center gap-2">
                <ClipboardList /> Inventory History & Status
            </h1>

            {/* Resume Section */}
            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <h2 className="font-bold text-lg text-gray-800 flex items-center gap-2">
                        <Package size={20} /> Product Status Resume
                    </h2>
                    <button onClick={fetchData} className="text-xs text-blue-600 font-bold hover:underline">Refresh Data</button>
                </div>
                <DataTable
                    data={resumeData}
                    columns={resumeColumns}
                    searchKeys={['itemName', 'size', 'color']}
                />
            </div>

            {/* History Log Section */}
            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <h2 className="font-bold text-lg text-gray-800 flex items-center gap-2">
                        <Info size={20} /> Recent Activity Log
                    </h2>
                </div>
                <DataTable
                    data={filteredHistory}
                    columns={historyColumns}
                    searchKeys={['description', 'type', 'status']}
                    filterSlot={
                        <div className="flex gap-2">
                            <input
                                type="date"
                                className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none"
                                value={dateRange.start}
                                onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                            />
                            <span className="self-center text-gray-400">-</span>
                            <input
                                type="date"
                                className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none"
                                value={dateRange.end}
                                onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                            />
                        </div>
                    }
                />
            </div>
        </div>
    );
}
