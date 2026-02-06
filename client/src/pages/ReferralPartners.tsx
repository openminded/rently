import React, { useState, useEffect } from 'react';
import { Plus, Trash2, X, Save, Edit2, Ticket, DollarSign, ChevronRight, ChevronDown, Check, AlertCircle, History, User, Search, Filter, Printer, CheckSquare, Square, ArrowLeft } from 'lucide-react';
import { DataTable, type Column } from '../components/common/DataTable';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { API_BASE_URL } from '../config/api';
import { clsx } from 'clsx';
import { format, parseISO, startOfMonth } from 'date-fns';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar, Legend, Cell
} from 'recharts';

const API_REFERRAL = `${API_BASE_URL}/referrals`;

interface ReferralCode {
    id: number;
    code: string;
    discountType: 'PERCENTAGE' | 'FIXED';
    discountValue: number;
    commissionRate: number;
    isActive: boolean;
    _count?: {
        transactions: number;
    };
}

interface ReferralPartner {
    id: number;
    name: string;
    phone: string | null;
    email: string | null;
    bankInfo: string | null;
    codes: ReferralCode[];
    _count?: {
        codes: number;
    };
}

interface CommissionLog {
    id: number;
    amount: number;
    status: 'PENDING' | 'PAID';
    createdAt: string;
    paidAt: string | null;
    referralCode: {
        code: string;
        partner: {
            name: string;
        }
    };
    transaction: {
        id: number;
        totalAmount: number;
        status: string;
    } | null;
}

export default function ReferralPartners() {
    const { hasRole, token } = useAuth();
    const { t } = useLanguage();
    const [activeTab, setActiveTab] = useState<'PARTNERS' | 'COMMISSIONS'>('PARTNERS');

    const [partners, setPartners] = useState<ReferralPartner[]>([]);
    const [commissions, setCommissions] = useState<CommissionLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingCommissions, setLoadingCommissions] = useState(false);

    const [expandedPartner, setExpandedPartner] = useState<number | null>(null);
    const [expandedMonths, setExpandedMonths] = useState<string[]>([]);

    // Filters
    const [commissionSearch, setCommissionSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'PAID'>('ALL');
    const [partnerFilter, setPartnerFilter] = useState<string>('ALL');

    // Selection for Bulk Payout & Invoicing
    const [selectedCommissions, setSelectedCommissions] = useState<number[]>([]);
    const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);

    // Grouping & Chart Data Logic
    const getFilteredCommissions = () => {
        return commissions.filter(c => {
            const matchesSearch = c.referralCode.code.toLowerCase().includes(commissionSearch.toLowerCase()) ||
                c.referralCode.partner.name.toLowerCase().includes(commissionSearch.toLowerCase());
            const matchesStatus = statusFilter === 'ALL' || c.status === statusFilter;
            const matchesPartner = partnerFilter === 'ALL' || c.referralCode.partner.name === partnerFilter;
            return matchesSearch && matchesStatus && matchesPartner;
        });
    };

    const groupedCommissions = getFilteredCommissions().reduce((acc: any, curr) => {
        const month = format(parseISO(curr.createdAt), 'MMMM yyyy');
        if (!acc[month]) {
            acc[month] = {
                month,
                sortDate: startOfMonth(parseISO(curr.createdAt)),
                items: [],
                total: 0,
                pending: 0,
                paid: 0
            };
        }
        acc[month].items.push(curr);
        acc[month].total += curr.amount;
        if (curr.status === 'PENDING') acc[month].pending += curr.amount;
        else acc[month].paid += curr.amount;
        return acc;
    }, {});

    const sortedGroups = Object.values(groupedCommissions).sort((a: any, b: any) => b.sortDate.getTime() - a.sortDate.getTime());

    // Analytics Data
    const chartData = commissions.reduce((acc: any[], curr) => {
        const month = format(parseISO(curr.createdAt), 'MMM yy');
        const existing = acc.find(d => d.name === month);
        if (existing) {
            existing.amount += curr.amount;
        } else {
            acc.push({ name: month, amount: curr.amount, rawDate: startOfMonth(parseISO(curr.createdAt)) });
        }
        return acc;
    }, []).sort((a, b) => a.rawDate.getTime() - b.rawDate.getTime()).slice(-6);

    const partnerStats = commissions.reduce((acc: any[], curr) => {
        const name = curr.referralCode.partner.name;
        const existing = acc.find(d => d.name === name);
        if (existing) {
            existing.value += curr.amount;
        } else {
            acc.push({ name, value: curr.amount });
        }
        return acc;
    }, []).sort((a, b) => b.value - a.value).slice(0, 5);

    // Modal States
    const [isPartnerModalOpen, setIsPartnerModalOpen] = useState(false);
    const [currentPartner, setCurrentPartner] = useState<ReferralPartner | null>(null);

    const [isCodeModalOpen, setIsCodeModalOpen] = useState(false);
    const [targetPartnerId, setTargetPartnerId] = useState<number | null>(null);

    useEffect(() => {
        if (token) {
            fetchPartners();
            fetchCommissions();
        }
    }, [token]);

    const fetchPartners = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_REFERRAL}/partners`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const json = await res.json();
            setPartners(Array.isArray(json) ? json : []);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const fetchCommissions = async () => {
        setLoadingCommissions(true);
        try {
            const res = await fetch(`${API_REFERRAL}/commissions`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const json = await res.json();
            setCommissions(Array.isArray(json) ? json : []);
        } catch (e) {
            console.error(e);
        } finally {
            setLoadingCommissions(false);
        }
    };

    const handleSavePartner = async (e: React.FormEvent) => {
        e.preventDefault();
        const formData = new FormData(e.target as HTMLFormElement);
        const payload = {
            name: formData.get('name'),
            phone: formData.get('phone'),
            email: formData.get('email'),
            bankInfo: formData.get('bankInfo'),
        };

        try {
            const url = currentPartner
                ? `${API_REFERRAL}/partners/${currentPartner.id}`
                : `${API_REFERRAL}/partners`;
            const method = currentPartner ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (!res.ok) throw new Error('Failed to save partner');

            setIsPartnerModalOpen(false);
            fetchPartners();
        } catch (e: any) {
            alert(e.message);
        }
    };

    const handleDeletePartner = async (id: number) => {
        if (!window.confirm('Are you sure you want to delete this partner? This will also delete their referral codes.')) return;
        try {
            const res = await fetch(`${API_REFERRAL}/partners/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) throw new Error('Failed to delete partner');
            fetchPartners();
        } catch (e: any) {
            alert(e.message);
        }
    };

    const handleSaveCode = async (e: React.FormEvent) => {
        e.preventDefault();
        const formData = new FormData(e.target as HTMLFormElement);
        const payload = {
            partnerId: targetPartnerId,
            code: (formData.get('code') as string).toUpperCase(),
            discountType: formData.get('discountType'),
            discountValue: Number(formData.get('discountValue')),
            commissionRate: Number(formData.get('commissionRate')),
            isActive: true
        };

        try {
            const res = await fetch(`${API_REFERRAL}/codes`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Failed to create code');
            }

            setIsCodeModalOpen(false);
            fetchPartners();
        } catch (e: any) {
            alert(e.message);
        }
    };

    const handlePayCommission = async (id: number) => {
        if (!window.confirm('Mark this commission as PAID?')) return;
        try {
            const res = await fetch(`${API_REFERRAL}/commissions/${id}/pay`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) throw new Error('Failed to process payout');
            fetchCommissions();
        } catch (e: any) {
            alert(e.message);
        }
    };

    const handleBulkPay = async () => {
        if (selectedCommissions.length === 0) return;
        if (!window.confirm(`Mark ${selectedCommissions.length} selected commissions as PAID?`)) return;

        try {
            const res = await fetch(`${API_REFERRAL}/commissions/bulk-pay`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ ids: selectedCommissions })
            });
            if (!res.ok) throw new Error('Failed to process bulk payout');

            const result = await res.json();
            alert(`Successfully paid ${result.count} commissions.`);
            setSelectedCommissions([]);
            fetchCommissions();
        } catch (e: any) {
            alert(e.message);
        }
    };

    const toggleSelection = (id: number) => {
        setSelectedCommissions(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const handlePrint = () => {
        window.print();
    };

    const partnerColumns: Column<ReferralPartner>[] = [
        {
            header: t('common.name'),
            accessorKey: 'name',
            cell: (row) => (
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs">
                        {row.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                        <div className="font-medium text-gray-900">{row.name}</div>
                        <div className="text-xs text-gray-500">{row.email || 'No email'}</div>
                    </div>
                </div>
            )
        },
        {
            header: t('common.phone'),
            accessorKey: 'phone',
        },
        {
            header: t('referral.codes'),
            accessorKey: 'codes',
            cell: (row) => (
                <div className="flex items-center gap-2">
                    <Ticket size={14} className="text-gray-400" />
                    <span className="text-sm font-medium">{row.codes?.length || 0} Codes</span>
                </div>
            )
        },
        {
            header: t('referral.bankInfo'),
            accessorKey: 'bankInfo',
            cell: (row) => <span className="text-sm text-gray-600 truncate max-w-[150px] inline-block">{row.bankInfo || '-'}</span>
        }
    ];

    const partnerActions = (row: ReferralPartner) => (
        <div className="flex items-center justify-end gap-2">
            <button
                onClick={(e) => { e.stopPropagation(); setExpandedPartner(expandedPartner === row.id ? null : row.id); }}
                className={clsx(
                    "p-1.5 rounded transition-colors",
                    expandedPartner === row.id ? "bg-gray-900 text-white" : "text-gray-500 hover:bg-gray-100"
                )}
                title="View Codes"
            >
                <Ticket size={16} />
            </button>
            <button
                onClick={(e) => { e.stopPropagation(); setCurrentPartner(row); setIsPartnerModalOpen(true); }}
                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                title={t('common.edit')}
            >
                <Edit2 size={16} />
            </button>
            <button
                onClick={(e) => { e.stopPropagation(); handleDeletePartner(row.id); }}
                className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                title={t('common.delete')}
            >
                <Trash2 size={16} />
            </button>
        </div>
    );

    const commissionColumns: Column<CommissionLog>[] = [
        {
            header: '',
            accessorKey: 'id',
            cell: (row) => row.status === 'PENDING' ? (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        toggleSelection(row.id);
                    }}
                    className={clsx(
                        "p-1 rounded-lg transition-colors",
                        selectedCommissions.includes(row.id) ? "text-blue-600 bg-blue-50" : "text-gray-300 hover:bg-gray-50"
                    )}
                >
                    {selectedCommissions.includes(row.id) ? <CheckSquare size={18} /> : <Square size={18} />}
                </button>
            ) : (
                <div className="w-6 h-6" /> // Spacer for PAID items
            )
        },
        {
            header: 'Date',
            accessorKey: 'createdAt',
            cell: (row) => <span className="text-xs font-medium text-gray-500">{format(new Date(row.createdAt), 'dd MMM yyyy HH:mm')}</span>
        },
        {
            header: 'Partner / Code',
            accessorKey: 'referralCode',
            cell: (row) => (
                <div>
                    <div className="font-bold text-gray-900">{row.referralCode.partner.name}</div>
                    <div className="text-xs font-mono text-blue-600 uppercase">{row.referralCode.code}</div>
                </div>
            )
        },
        {
            header: 'Transaction',
            accessorKey: 'transaction',
            cell: (row) => row.transaction ? (
                <div>
                    <div className="text-xs font-bold text-gray-500">TX #{row.transaction.id}</div>
                    <div className="text-sm font-black text-gray-900">Rp {row.transaction.totalAmount.toLocaleString()}</div>
                </div>
            ) : '-'
        },
        {
            header: 'Commission',
            accessorKey: 'amount',
            cell: (row) => <span className="font-black text-emerald-600">Rp {row.amount.toLocaleString()}</span>
        },
        {
            header: 'Status',
            accessorKey: 'status',
            cell: (row) => (
                <span className={clsx(
                    "px-2 py-1 rounded-full text-[10px] font-bold uppercase",
                    row.status === 'PAID' ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"
                )}>
                    {row.status}
                </span>
            )
        }
    ];

    const commissionActions = (row: CommissionLog) => (
        <div className="flex justify-end">
            {row.status === 'PENDING' && (
                <button
                    onClick={() => handlePayCommission(row.id)}
                    className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 transition-colors shadow-sm"
                >
                    <Check size={14} /> Pay
                </button>
            )}
            {row.status === 'PAID' && row.paidAt && (
                <div className="text-[10px] text-gray-400 font-medium italic">
                    Paid on {format(new Date(row.paidAt), 'dd/MM/yy')}
                </div>
            )}
        </div>
    );

    return (
        <div className="space-y-6 pb-20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">{t('referral.title')}</h1>
                    <p className="text-gray-500">{t('master.referralPartners.desc')}</p>
                </div>

                {activeTab === 'PARTNERS' && (
                    <button
                        onClick={() => { setCurrentPartner(null); setIsPartnerModalOpen(true); }}
                        className="bg-gray-900 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-gray-800 transition-colors self-start shadow-lg shadow-gray-200"
                    >
                        <Plus size={18} /> {t('referral.addPartner')}
                    </button>
                )}
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-200">
                <button
                    onClick={() => setActiveTab('PARTNERS')}
                    className={clsx(
                        "px-6 py-3 text-sm font-bold border-b-2 transition-all",
                        activeTab === 'PARTNERS' ? "border-gray-900 text-gray-900" : "border-transparent text-gray-500 hover:text-gray-700"
                    )}
                >
                    {t('referral.partners') || 'Partners'}
                </button>
                <button
                    onClick={() => setActiveTab('COMMISSIONS')}
                    className={clsx(
                        "px-6 py-3 text-sm font-bold border-b-2 transition-all flex items-center gap-2",
                        activeTab === 'COMMISSIONS' ? "border-gray-900 text-gray-900" : "border-transparent text-gray-500 hover:text-gray-700"
                    )}
                >
                    <History size={16} /> Commissions
                </button>
            </div>

            {activeTab === 'PARTNERS' ? (
                loading ? (
                    <div className="text-center py-20">
                        <div className="animate-spin w-8 h-8 border-4 border-gray-900 border-t-transparent rounded-full mx-auto mb-4"></div>
                        <p className="text-gray-500">{t('common.loading')}</p>
                    </div>
                ) : (
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                        <DataTable
                            data={partners}
                            columns={partnerColumns}
                            searchKeys={['name', 'phone', 'email']}
                            actions={partnerActions}
                            noCard={true}
                        />

                        {/* Expanded Section for Codes */}
                        {expandedPartner && (
                            <div className="border-t border-gray-100 bg-gray-50/50 p-6 animate-in slide-in-from-top-2 duration-200">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="font-bold text-gray-900 flex items-center gap-2">
                                        <Ticket size={18} className="text-blue-600" />
                                        Active Referral Codes for {partners.find(p => p.id === expandedPartner)?.name}
                                    </h3>
                                    <button
                                        onClick={() => { setTargetPartnerId(expandedPartner); setIsCodeModalOpen(true); }}
                                        className="text-sm bg-blue-600 text-white px-3 py-1.5 rounded-lg flex items-center gap-1.5 hover:bg-blue-700 transition-colors"
                                    >
                                        <Plus size={14} /> {t('referral.addCode')}
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {partners.find(p => p.id === expandedPartner)?.codes.map(code => (
                                        <div key={code.id} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between hover:border-blue-300 transition-colors group">
                                            <div>
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="font-mono font-bold text-lg text-gray-900 tracking-wider">{code.code}</span>
                                                    <span className={clsx(
                                                        "text-[10px] px-2 py-0.5 rounded-full font-bold uppercase",
                                                        code.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
                                                    )}>
                                                        {code.isActive ? 'Active' : 'Inactive'}
                                                    </span>
                                                </div>
                                                <div className="space-y-1">
                                                    <div className="text-xs text-gray-500 flex justify-between">
                                                        <span>{t('referral.discount')}:</span>
                                                        <span className="font-semibold text-gray-900">
                                                            {code.discountValue}{code.discountType === 'PERCENTAGE' ? '%' : ' (Fixed)'}
                                                        </span>
                                                    </div>
                                                    <div className="text-xs text-gray-500 flex justify-between">
                                                        <span>{t('referral.commissionRate')}:</span>
                                                        <span className="font-semibold text-emerald-600">{code.commissionRate}%</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    {partners.find(p => p.id === expandedPartner)?.codes.length === 0 && (
                                        <div className="col-span-full py-10 text-center text-gray-400 italic text-sm">
                                            No codes found for this partner.
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                )
            ) : (
                <div className="space-y-6">
                    {/* Analytics Section */}
                    {!loadingCommissions && commissions.length > 0 && (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                                <h3 className="text-sm font-bold text-gray-500 mb-4 uppercase tracking-wider">Commission Trends (Last 6 Months)</h3>
                                <div className="h-[200px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={chartData}>
                                            <defs>
                                                <linearGradient id="colorAmt" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.1} />
                                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} dy={10} />
                                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} tickFormatter={(value) => `Rp ${value / 1000}k`} />
                                            <Tooltip
                                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                                formatter={(value: any) => [`Rp ${value.toLocaleString()}`, 'Total Commission']}
                                            />
                                            <Area type="monotone" dataKey="amount" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorAmt)" />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                                <h3 className="text-sm font-bold text-gray-500 mb-4 uppercase tracking-wider">Top Partners</h3>
                                <div className="h-[200px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={partnerStats} layout="vertical" margin={{ left: -20 }}>
                                            <XAxis type="number" hide />
                                            <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 'bold', fill: '#475569' }} width={100} />
                                            <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '8px' }} />
                                            <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                                                {partnerStats.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={['#0f172a', '#334155', '#475569', '#64748b', '#94a3b8'][index % 5]} />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Filter Row */}
                    <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-wrap items-center gap-4">
                        <div className="relative flex-1 min-w-[200px]">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="text"
                                placeholder="Search partner or code..."
                                value={commissionSearch}
                                onChange={(e) => setCommissionSearch(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 outline-none"
                            />
                        </div>

                        <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-gray-400 uppercase">Status:</span>
                            <div className="flex bg-gray-50 p-1 rounded-xl border border-gray-100">
                                {(['ALL', 'PENDING', 'PAID'] as const).map(s => (
                                    <button
                                        key={s}
                                        onClick={() => setStatusFilter(s)}
                                        className={clsx(
                                            "px-3 py-1 rounded-lg text-xs font-bold transition-all",
                                            statusFilter === s ? "bg-white text-gray-900 shadow-sm" : "text-gray-400 hover:text-gray-600"
                                        )}
                                    >
                                        {s}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-gray-400 uppercase">Partner:</span>
                            <select
                                value={partnerFilter}
                                onChange={(e) => setPartnerFilter(e.target.value)}
                                className="bg-gray-50 border border-gray-100 p-2 rounded-xl text-xs font-bold outline-none"
                            >
                                <option value="ALL">All Partners</option>
                                {partners.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                            </select>
                        </div>
                    </div>

                    {/* Grouped List */}
                    <div className="space-y-4">
                        {loadingCommissions ? (
                            <div className="text-center py-20">
                                <div className="animate-spin w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full mx-auto mb-4"></div>
                                <p className="text-gray-400 text-sm">Loading commissions...</p>
                            </div>
                        ) : sortedGroups.length === 0 ? (
                            <div className="bg-white rounded-2xl py-20 text-center border border-dashed border-gray-200">
                                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <DollarSign className="text-gray-300" size={32} />
                                </div>
                                <h3 className="text-gray-900 font-bold">No Commissions Found</h3>
                                <p className="text-gray-400 text-sm">Try adjusting your filters or search.</p>
                            </div>
                        ) : (
                            sortedGroups.map((group: any) => (
                                <div key={group.month} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                                    <div
                                        className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer hover:bg-gray-50 transition-colors"
                                        onClick={() => {
                                            setExpandedMonths(prev =>
                                                prev.includes(group.month) ? prev.filter(m => m !== group.month) : [...prev, group.month]
                                            );
                                        }}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-blue-50 rounded-xl flex flex-col items-center justify-center text-blue-600">
                                                <span className="text-[10px] font-bold uppercase leading-tight">{group.month.split(' ')[0].substring(0, 3)}</span>
                                                <span className="text-sm font-black leading-tight">{group.month.split(' ')[1].substring(2)}</span>
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-gray-900">{group.month}</h3>
                                                <p className="text-xs text-gray-400">{group.items.length} Transactions</p>
                                            </div>
                                        </div>

                                        <div className="flex flex-wrap items-center gap-6">
                                            <div className="text-right">
                                                <p className="text-[10px] font-bold text-gray-400 uppercase">Paid</p>
                                                <p className="text-sm font-black text-emerald-600">Rp {group.paid.toLocaleString()}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[10px] font-bold text-gray-400 uppercase">Pending</p>
                                                <p className="text-sm font-black text-orange-600">Rp {group.pending.toLocaleString()}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-tight">Total</p>
                                                <p className="text-lg font-black text-gray-900 leading-tight">Rp {group.total.toLocaleString()}</p>
                                            </div>
                                            <button className={clsx(
                                                "p-2 rounded-lg transition-transform duration-200",
                                                expandedMonths.includes(group.month) ? "rotate-180 bg-gray-100" : "bg-gray-50"
                                            )}>
                                                <ChevronDown size={20} />
                                            </button>
                                        </div>
                                    </div>

                                    {expandedMonths.includes(group.month) && (
                                        <div className="border-t border-gray-100 animate-in slide-in-from-top-2 duration-300">
                                            <DataTable
                                                data={group.items}
                                                columns={commissionColumns}
                                                searchKeys={[]}
                                                noCard={true}
                                                hideHeader={true}
                                                actions={commissionActions}
                                            />
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}

            {/* Partner Modal */}
            {isPartnerModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md animate-in fade-in zoom-in duration-200">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-gray-900">{currentPartner ? t('common.edit') : t('referral.addPartner')}</h3>
                            <button onClick={() => setIsPartnerModalOpen(false)} className="text-gray-400 hover:text-gray-900 p-1 hover:bg-gray-100 rounded-lg transition-colors"><X size={24} /></button>
                        </div>
                        <form onSubmit={handleSavePartner} className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t('common.name')}</label>
                                <input name="name" defaultValue={currentPartner?.name} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium" required placeholder="Partner name..." />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t('common.phone')}</label>
                                    <input name="phone" defaultValue={currentPartner?.phone || ''} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" placeholder="081..." />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t('common.email')}</label>
                                    <input name="email" type="email" defaultValue={currentPartner?.email || ''} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" placeholder="email@..." />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t('referral.bankInfo')}</label>
                                <textarea name="bankInfo" defaultValue={currentPartner?.bankInfo || ''} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all h-20 resize-none" placeholder="Bank Name, Account Number, Holder Name..." />
                            </div>
                            <div className="flex justify-end gap-3 pt-6">
                                <button type="button" onClick={() => setIsPartnerModalOpen(false)} className="px-5 py-2.5 text-gray-600 hover:bg-gray-100 rounded-xl font-medium transition-colors">{t('common.cancel')}</button>
                                <button type="submit" className="px-6 py-2.5 bg-gray-900 text-white rounded-xl hover:bg-gray-800 flex items-center gap-2 font-bold shadow-lg shadow-gray-200 transition-all active:scale-95">
                                    <Save size={18} /> {currentPartner ? t('common.update') : t('common.save')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Code Modal */}
            {isCodeModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md animate-in fade-in zoom-in duration-200">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-gray-900">{t('referral.addCode')}</h3>
                            <button onClick={() => setIsCodeModalOpen(false)} className="text-gray-400 hover:text-gray-900 p-1 hover:bg-gray-100 rounded-lg transition-colors"><X size={24} /></button>
                        </div>
                        <form onSubmit={handleSaveCode} className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t('referral.code')}</label>
                                <input name="code" className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-mono font-bold text-lg tracking-widest uppercase" required placeholder="PARTNER10" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t('referral.discount')} Type</label>
                                    <select name="discountType" className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium">
                                        <option value="PERCENTAGE">Percentage (%)</option>
                                        <option value="FIXED">Fixed Amount (IDR)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t('referral.discount')} Value</label>
                                    <input name="discountValue" type="number" className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium" required placeholder="10" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t('referral.commissionRate')} (%)</label>
                                <input name="commissionRate" type="number" step="0.1" className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium" required placeholder="5" />
                                <p className="text-[10px] text-gray-400 mt-1 italic">Partner will earn this percentage from total rental amount.</p>
                            </div>

                            <div className="flex justify-end gap-3 pt-6">
                                <button type="button" onClick={() => setIsCodeModalOpen(false)} className="px-5 py-2.5 text-gray-600 hover:bg-gray-100 rounded-xl font-medium transition-colors">{t('common.cancel')}</button>
                                <button type="submit" className="px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 flex items-center gap-2 font-bold shadow-lg shadow-blue-200 transition-all active:scale-95">
                                    <Check size={18} /> {t('common.create')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            {/* Selected Tooltip / Floating Bar */}
            {selectedCommissions.length > 0 && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-6 z-50 animate-in slide-in-from-bottom-10 duration-300">
                    <div className="flex flex-col">
                        <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">{selectedCommissions.length} Selected</span>
                        <span className="text-lg font-black text-emerald-400">Rp {
                            commissions.filter(c => selectedCommissions.includes(c.id))
                                .reduce((sum, c) => sum + c.amount, 0).toLocaleString()
                        }</span>
                    </div>

                    <div className="h-8 w-px bg-gray-700 mx-2" />

                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setIsInvoiceModalOpen(true)}
                            className="flex items-center gap-2 px-4 py-2 hover:bg-gray-800 rounded-xl transition-colors font-bold text-sm"
                        >
                            <Printer size={18} /> Print Invoice
                        </button>
                        <button
                            onClick={handleBulkPay}
                            className="flex items-center gap-2 px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl transition-all font-black text-sm shadow-lg shadow-emerald-900/20 active:scale-95"
                        >
                            <Check size={18} /> Mark as Paid
                        </button>
                        <button
                            onClick={() => setSelectedCommissions([])}
                            className="p-2 hover:bg-gray-800 text-gray-400 hover:text-white rounded-xl transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>
            )}

            {isInvoiceModalOpen && selectedCommissions.length > 0 && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[70] p-4 backdrop-blur-sm print:p-0 print:bg-white print:static">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto print:max-h-none print:shadow-none print:rounded-none">
                        <div className="sticky top-0 bg-white/80 backdrop-blur-md p-6 border-b border-gray-100 flex justify-between items-center z-10 print:hidden">
                            <h3 className="text-xl font-bold text-gray-900">Preview Invoice</h3>
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
                            <CommissionInvoice selectedCommissions={selectedCommissions} />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}




export function CommissionInvoice({ selectedCommissions }: { selectedCommissions: number[] }) {
    const { token } = useAuth();
    const [commissions, setCommissions] = useState<CommissionLog[]>([]);
    const [partners, setPartners] = useState<ReferralPartner[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (token && selectedCommissions.length > 0) {
            fetchData();
        }
    }, [token, selectedCommissions]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [cRes, pRes] = await Promise.all([
                fetch(`${API_BASE_URL}/referrals/commissions`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                }),
                fetch(`${API_BASE_URL}/referrals/partners`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                })
            ]);
            const [cJson, pJson] = await Promise.all([cRes.json(), pRes.json()]);
            setCommissions(Array.isArray(cJson) ? cJson : []);
            setPartners(Array.isArray(pJson) ? pJson : []);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="p-20 text-center font-bold text-gray-400">Loading Invoice Data...</div>;

    const selectedItems = commissions.filter(c => selectedCommissions.includes(c.id));
    const firstItem = selectedItems[0];
    const partner = partners.find(p => p.name === firstItem?.referralCode.partner.name);

    return (
        <div className="space-y-10" id="printable-invoice">
            {/* Header */}
            <div className="flex justify-between items-start border-b-2 border-gray-100 pb-8">
                <div className="space-y-2">
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight">WERENTLY</h1>
                    <p className="text-sm text-gray-500 font-bold">Premium Car & Property Rental</p>
                </div>
                <div className="text-right">
                    <h2 className="text-xl font-black text-blue-600">COMMISSION INVOICE</h2>
                    <p className="text-xs text-gray-400 font-medium">Date: {format(new Date(), 'dd MMMM yyyy')}</p>
                    <p className="text-xs text-gray-400 font-medium font-mono uppercase">INV/REF/{Date.now().toString().slice(-6)}</p>
                </div>
            </div>

            {/* Summary Grid */}
            <div className="grid grid-cols-2 gap-12">
                <div className="space-y-4">
                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Partner Details</h4>
                    <div className="space-y-1">
                        <p className="font-black text-gray-900 text-lg">{firstItem?.referralCode.partner.name}</p>
                        <p className="text-sm text-gray-600 font-medium">{partner?.email}</p>
                        <p className="text-sm text-gray-600 font-medium">{partner?.phone}</p>
                    </div>
                </div>
                <div className="space-y-4">
                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Bank Information</h4>
                    <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                        <p className="text-sm text-gray-700 font-bold whitespace-pre-wrap">
                            {partner?.bankInfo || 'No bank information provided.'}
                        </p>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="space-y-4">
                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Transaction Breakdown</h4>
                <table className="w-full">
                    <thead>
                        <tr className="border-b-2 border-gray-900 text-left">
                            <th className="py-3 text-[10px] font-black uppercase text-gray-500">Date</th>
                            <th className="py-3 text-[10px] font-black uppercase text-gray-500">Code</th>
                            <th className="py-3 text-[10px] font-black uppercase text-gray-500 text-right">TX Amount</th>
                            <th className="py-3 text-[10px] font-black uppercase text-gray-500 text-right">Commission</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {selectedItems.map(tx => (
                            <tr key={tx.id}>
                                <td className="py-4 text-xs font-bold text-gray-600">{format(new Date(tx.createdAt), 'dd MMM yyyy')}</td>
                                <td className="py-4 text-xs font-black text-gray-900">{tx.referralCode.code}</td>
                                <td className="py-4 text-xs font-bold text-gray-600 text-right">Rp {tx.transaction?.totalAmount.toLocaleString()}</td>
                                <td className="py-4 text-xs font-black text-emerald-600 text-right">Rp {tx.amount.toLocaleString()}</td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot>
                        <tr className="border-t-2 border-gray-900">
                            <td colSpan={3} className="py-6 text-right text-sm font-black text-gray-900 uppercase">Total Payout</td>
                            <td className="py-6 text-right text-xl font-black text-blue-600">
                                Rp {selectedItems.reduce((sum, c) => sum + c.amount, 0).toLocaleString()}
                            </td>
                        </tr>
                    </tfoot>
                </table>
            </div>

            {/* Footer / Signatures */}
            <div className="grid grid-cols-2 gap-12 pt-12">
                <div className="space-y-16">
                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Prepared By</h4>
                    <div className="border-t border-gray-300 pt-2 w-48">
                        <p className="text-xs font-bold text-gray-900">WERENTLY ADMIN</p>
                    </div>
                </div>
                <div className="space-y-16 flex flex-col items-end">
                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Authorized Receiver</h4>
                    <div className="border-t border-gray-300 pt-2 w-48 text-right">
                        <p className="text-xs font-bold text-gray-900 uppercase">{firstItem?.referralCode.partner.name}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
