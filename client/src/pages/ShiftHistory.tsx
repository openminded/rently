import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { DataTable, type Column } from '../components/common/DataTable';
import { API_URL } from '../config/api';
import { format } from 'date-fns';
import { Lock, Unlock, AlertCircle, CheckCircle2 } from 'lucide-react';
import { clsx } from 'clsx';

export default function ShiftHistory() {
    const { token, hasRole } = useAuth();
    const { t } = useLanguage();
    const [shifts, setShifts] = useState<any[]>([]);
    const [statusFilter, setStatusFilter] = useState<string>('');
    const [cashierFilter, setCashierFilter] = useState<string>('');
    const [cashiers, setCashiers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchCashiers = async () => {
        const canView = hasRole(['SUPERADMIN', 'OWNER', 'SUPERVISOR']);
        if (!canView) return;
        try {
            const res = await fetch(`${API_URL}/users`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setCashiers(data.filter((u: any) => u.role === 'KASIR' || u.role === 'SUPERVISOR'));
            }
        } catch (error) {
            console.error('Failed to fetch cashiers:', error);
        }
    };

    const fetchHistory = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (statusFilter) params.append('status', statusFilter);
            if (cashierFilter) params.append('userId', cashierFilter);

            const res = await fetch(`${API_URL}/shifts/history?${params.toString()}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            setShifts(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Failed to fetch shift history:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (token) {
            fetchHistory();
            fetchCashiers();
        }
    }, [token, statusFilter, cashierFilter]);

    const columns: Column<any>[] = [
        {
            header: 'Status',
            accessorKey: 'status',
            cell: (row) => (
                <span className={clsx(
                    "px-2 py-1 rounded-full text-xs font-bold",
                    row.status === 'OPEN' ? "bg-green-100 text-green-700 animate-pulse" : "bg-gray-100 text-gray-700"
                )}>
                    {row.status === 'OPEN' ? '🟢 AKTIF' : '⚫ CLOSED'}
                </span>
            )
        },
        {
            header: 'Kasir',
            accessorKey: 'user.name',
            sortable: true,
            className: 'font-bold',
            cell: (row) => (
                <div className="flex flex-col">
                    <span className="font-bold text-gray-900">{row.user.name}</span>
                    <span className="text-xs text-gray-500">@{row.user.username}</span>
                </div>
            )
        },
        // ... (rest of columns remain similar, just shifting indices)
        {
            header: 'Mulai',
            accessorKey: 'startTime',
            sortable: true,
            cell: (row) => format(new Date(row.startTime), 'dd MMM yyyy, HH:mm')
        },
        {
            header: 'Selesai',
            accessorKey: 'endTime',
            sortable: true,
            cell: (row) => row.endTime ? format(new Date(row.endTime), 'dd MMM yyyy, HH:mm') : '-'
        },
        {
            header: 'Modal',
            accessorKey: 'startCash',
            cell: (row) => `Rp ${row.startCash.toLocaleString()}`
        },
        {
            header: 'Ekspektasi',
            accessorKey: 'expectedCash',
            cell: (row) => `Rp ${row.expectedCash.toLocaleString()}`
        },
        {
            header: 'Aktual',
            accessorKey: 'actualCash',
            cell: (row) => row.actualCash !== null ? `Rp ${row.actualCash.toLocaleString()}` : '-'
        },
        {
            header: 'Selisih',
            accessorKey: 'variance',
            sortable: true,
            cell: (row) => {
                if (row.status === 'OPEN') return <span className="text-gray-400 text-xs">-</span>;
                const val = row.variance ?? 0;
                if (row.variance === null && row.status !== 'OPEN') return '-';
                return (
                    <span className={clsx(
                        "px-2 py-1 rounded-full text-xs font-bold",
                        val === 0 ? "bg-green-100 text-green-700" :
                            val > 0 ? "bg-blue-100 text-blue-700" : "bg-red-100 text-red-700"
                    )}>
                        {val >= 0 ? "+" : ""}{val.toLocaleString()}
                    </span>
                );
            }
        },
        {
            header: 'Notes',
            accessorKey: 'notes',
            className: 'text-xs italic text-gray-500'
        }
    ];

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Riwayat Shift & Rekonsiliasi</h1>
                    <p className="text-gray-500 text-sm">Audit pergerakan kas per periode kerja staff.</p>
                </div>
                <div className="flex gap-3">
                    {cashiers && cashiers.length > 0 && (
                        <select
                            value={cashierFilter}
                            onChange={(e) => setCashierFilter(e.target.value)}
                            className="bg-white border border-gray-200 text-gray-700 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block p-2.5"
                        >
                            <option value="">Semua Kasir</option>
                            {cashiers.map((cashier: any) => (
                                <option key={cashier.id} value={cashier.id}>
                                    👤 {cashier.name}
                                </option>
                            ))}
                        </select>
                    )}

                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="bg-white border border-gray-200 text-gray-700 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block p-2.5"
                    >
                        <option value="">Semua Status</option>
                        <option value="OPEN">🟢 Shift Aktif</option>
                        <option value="CLOSED">⚫ Shift Selesai</option>
                    </select>

                    <div className="bg-white p-2.5 rounded-lg shadow-sm border border-gray-100 flex items-center gap-2">
                        <CheckCircle2 size={18} className="text-green-500" />
                        <div>
                            <p className="text-[10px] text-gray-400 uppercase font-black">Balanced</p>
                            <p className="text-sm font-bold leading-none">{shifts.filter(s => s.status === 'CLOSED' && s.variance === 0).length}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-2">
                {loading ? (
                    <div className="flex justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
                    </div>
                ) : (
                    <DataTable
                        columns={columns}
                        data={shifts}
                        searchKeys={['user.name', 'notes']}
                    />
                )}
            </div>
        </div>
    );
}
