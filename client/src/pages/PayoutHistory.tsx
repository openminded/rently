import { useState, useEffect } from 'react';
import { Plus, Search, MessageSquare, Database, ChevronDown, Check, X, Filter, Printer, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { API_BASE_URL } from '../config/api';
const API_REFERRAL = `${API_BASE_URL}/referrals`;
import { format } from 'date-fns';
import { DataTable } from '../components/common/DataTable';
import clsx from 'clsx';
import { CommissionInvoice } from './ReferralPartners';

interface CommissionLog {
    id: number;
    referralCodeId: number;
    amount: number;
    status: 'PENDING' | 'PAID';
    paidAt: string | null;
    createdAt: string;
    referralCode: {
        code: string;
        partner: {
            id: number;
            name: string;
        }
    };
    transaction: {
        id: number;
        totalAmount: number;
    } | null;
}

interface PayoutGroup {
    id: string;
    timeKey: string;
    paidAt: string;
    partnerId: number;
    partner: {
        id: number;
        name: string;
    };
    totalAmount: number;
    items: CommissionLog[];
}

export default function PayoutHistory() {
    const { token } = useAuth();
    const { t } = useLanguage();
    const [history, setHistory] = useState<PayoutGroup[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [partners, setPartners] = useState<any[]>([]);
    const [filterPartnerId, setFilterPartnerId] = useState('');
    const [startDate, setStartDate] = useState(format(new Date(new Date().setDate(new Date().getDate() - 30)), 'yyyy-MM-dd'));
    const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [grouping, setGrouping] = useState<'batch' | 'day' | 'month' | 'partner'>('batch');
    const [selectedGroup, setSelectedGroup] = useState<PayoutGroup | null>(null);
    const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);

    useEffect(() => {
        if (token) {
            fetchPartners();
            fetchHistory();
        }
    }, [token]);

    const fetchPartners = async () => {
        try {
            const res = await fetch(`${API_REFERRAL}/partners`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const json = await res.json();
            setPartners(Array.isArray(json) ? json : []);
        } catch (e) {
            console.error(e);
        }
    };

    const fetchHistory = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                startDate,
                endDate,
                partnerId: filterPartnerId
            });
            const res = await fetch(`${API_REFERRAL}/commissions/history?${params.toString()}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const json = await res.json();
            setHistory(Array.isArray(json) ? json : []);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const getGroupedData = () => {
        if (grouping === 'batch') return history;

        const grouped: Record<string, any> = {};

        history.forEach(batch => {
            let key = '';
            let dateLabel = '';

            if (grouping === 'day') {
                key = `${batch.partnerId}-${batch.paidAt.substring(0, 10)}`;
                dateLabel = format(new Date(batch.paidAt), 'dd MMM yyyy');
            } else if (grouping === 'month') {
                key = `${batch.partnerId}-${batch.paidAt.substring(0, 7)}`;
                dateLabel = format(new Date(batch.paidAt), 'MMMM yyyy');
            } else if (grouping === 'partner') {
                key = `${batch.partnerId}`;
                dateLabel = 'Semua Periode';
            }

            if (!grouped[key]) {
                grouped[key] = {
                    ...batch,
                    id: key,
                    dateLabel,
                    totalAmount: 0,
                    itemsCount: 0,
                    batchCount: 0,
                    allItemIds: [] as number[]
                };
            }

            grouped[key].totalAmount += batch.totalAmount;
            grouped[key].itemsCount += batch.items.length;
            grouped[key].batchCount += 1;
            grouped[key].allItemIds.push(...batch.items.map(i => i.id));
        });

        return Object.values(grouped).sort((a, b) => new Date(b.paidAt).getTime() - new Date(a.paidAt).getTime());
    };

    const displayData = getGroupedData().filter(h =>
        h.partner.name.toLowerCase().includes(search.toLowerCase())
    );

    const columns: any[] = [
        {
            header: grouping === 'partner' ? 'Periode' : (grouping === 'batch' ? 'Tanggal Pencairan' : 'Periode'),
            accessorKey: 'paidAt',
            cell: (row: any) => (
                <div className="flex flex-col">
                    <span className="font-bold text-gray-900">
                        {grouping === 'batch' ? format(new Date(row.paidAt), 'dd MMMM yyyy') : row.dateLabel}
                    </span>
                    {grouping === 'batch' && (
                        <span className="text-[10px] text-gray-400 font-mono italic">{format(new Date(row.paidAt), 'HH:mm')}</span>
                    )}
                </div>
            )
        },
        {
            header: 'Mitra Referral',
            accessorKey: 'partner.name',
            cell: (row: PayoutGroup) => (
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-xs">
                        {row.partner.name.substring(0, 1)}
                    </div>
                    <span className="font-bold text-gray-700">{row.partner.name}</span>
                </div>
            )
        },
        {
            header: grouping === 'batch' ? 'Jumlah Transaksi' : 'Total Transaksi',
            accessorKey: 'itemsCount',
            cell: (row: any) => (
                <div className="flex items-center gap-2">
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-md text-xs font-bold">
                        {grouping === 'batch' ? row.items.length : row.itemsCount} TX
                    </span>
                    {grouping !== 'batch' && grouping !== 'partner' && (
                        <span className="text-[10px] text-gray-400">({row.batchCount} Batch)</span>
                    )}
                </div>
            )
        },
        {
            header: 'Total Komisi',
            accessorKey: 'totalAmount',
            cell: (row: any) => (
                <span className="font-black text-blue-600">
                    Rp {row.totalAmount.toLocaleString()}
                </span>
            )
        },
        {
            header: '',
            accessorKey: 'actions',
            cell: (row: any) => (
                <div className="flex justify-end">
                    <button
                        onClick={() => {
                            if (grouping === 'batch') {
                                setSelectedGroup(row);
                            } else {
                                // Create a dummy group for multiple items
                                setSelectedGroup({
                                    ...row,
                                    items: row.allItemIds.map((id: number) => ({ id }))
                                });
                            }
                            setIsInvoiceModalOpen(true);
                        }}
                        className="flex items-center gap-1 px-3 py-1.5 bg-gray-900 text-white rounded-lg text-xs font-bold hover:bg-gray-800 transition-colors shadow-sm"
                    >
                        <Printer size={14} /> {grouping === 'batch' ? 'Invoice' : 'Cetak Gabungan'}
                    </button>
                </div>
            )
        }
    ];

    return (
        <div className="space-y-6 pb-20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">{t('referral.history')}</h1>
                    <p className="text-gray-500">Daftar riwayat pencairan komisi mitra referral.</p>
                </div>
            </div>

            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-50 space-y-6">
                    {/* Primary Filters */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider ml-1">Dari Tanggal</label>
                            <input
                                type="date"
                                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-bold text-xs text-gray-700"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider ml-1">Sampai Tanggal</label>
                            <input
                                type="date"
                                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-bold text-xs text-gray-700"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider ml-1">Pilih Mitra</label>
                            <select
                                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-bold text-xs text-gray-700"
                                value={filterPartnerId}
                                onChange={(e) => setFilterPartnerId(e.target.value)}
                            >
                                <option value="">Semua Mitra</option>
                                {partners.map(p => (
                                    <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                            </select>
                        </div>

                        <button
                            onClick={fetchHistory}
                            className="h-[42px] px-6 bg-blue-600 text-white rounded-xl font-black text-xs hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 flex items-center justify-center gap-2 group"
                        >
                            <Filter size={16} className="group-hover:rotate-12 transition-transform" /> Terapkan Filter
                        </button>
                    </div>

                    {/* Secondary Controls (Search & Grouping) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-6 border-t border-gray-50">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider ml-1">Cari Nama Mitra (Hasil Filter)</label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                <input
                                    type="text"
                                    placeholder="Ketik nama mitra di sini..."
                                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-xs text-gray-600"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider ml-1">Kelompokkan Data Berdasarkan</label>
                            <div className="flex gap-2 p-1 bg-gray-50 rounded-xl border border-gray-100">
                                {(['batch', 'day', 'month', 'partner'] as const).map((mode) => (
                                    <button
                                        key={mode}
                                        onClick={() => setGrouping(mode)}
                                        className={clsx(
                                            "flex-1 py-1.5 rounded-lg text-[10px] font-black transition-all",
                                            grouping === mode
                                                ? "bg-white text-blue-600 shadow-sm border border-blue-50/50"
                                                : "text-gray-400 hover:text-gray-600"
                                        )}
                                    >
                                        {mode === 'batch' && 'Batch'}
                                        {mode === 'day' && 'Harian'}
                                        {mode === 'month' && 'Bulanan'}
                                        {mode === 'partner' && 'Mitra'}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="text-center py-20">
                        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
                        <p className="text-gray-400 text-sm">Memuat riwayat...</p>
                    </div>
                ) : (
                    <DataTable
                        columns={columns}
                        data={displayData}
                        searchKeys={['partner.name']}
                        hideHeader
                    />
                )}
            </div>

            {isInvoiceModalOpen && selectedGroup && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[70] p-4 backdrop-blur-sm print:p-0 print:bg-white print:static">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto print:max-h-none print:shadow-none print:rounded-none">
                        <div className="sticky top-0 bg-white/80 backdrop-blur-md p-6 border-b border-gray-100 flex justify-between items-center z-10 print:hidden">
                            <h3 className="text-xl font-bold text-gray-900">Detail Pencairan Komisi</h3>
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => window.print()}
                                    className="flex items-center gap-2 px-6 py-2.5 bg-gray-900 text-white rounded-xl font-bold hover:bg-gray-800 transition-all shadow-lg shadow-gray-200"
                                >
                                    <Printer size={18} /> Cetak Invoice
                                </button>
                                <button
                                    onClick={() => setIsInvoiceModalOpen(false)}
                                    className="p-2.5 text-gray-400 hover:bg-gray-100 rounded-xl transition-colors"
                                >
                                    <ArrowLeft className="rotate-90 md:rotate-0" size={24} />
                                </button>
                            </div>
                        </div>

                        <div className="p-8">
                            <CommissionInvoice
                                selectedCommissions={selectedGroup.items.map(i => i.id)}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
