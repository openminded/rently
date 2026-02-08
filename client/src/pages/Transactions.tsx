import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Search, Plus, Calendar, User, ShoppingCart, Filter, Download, MoreVertical, Trash2, CheckCircle, Clock, AlertCircle, Eye, Printer, ChevronLeft, ChevronRight, X, UserPlus, Phone, MapPin, CreditCard, ChevronDown, ChevronUp, WashingMachine, Wallet, AlertTriangle } from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import { clsx } from 'clsx';
import { DataTable, type Column } from '../components/common/DataTable';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

import { API_BASE_URL } from '../config/api';

const API_URL = API_BASE_URL;

import { useBarcodeScanner } from '../hooks/useBarcodeScanner';


interface TransactionsProps {
    type: 'booking' | 'waiting-pickup' | 'rent' | 'need-return' | 'laundry' | 'completed';
}

export default function Transactions({ type: initialType }: TransactionsProps) {
    const { hasRole, token, business } = useAuth();
    const { t } = useLanguage();
    const { type: urlType } = useParams();
    const navigate = useNavigate();

    const currentType = (urlType || initialType) as TransactionsProps['type'];

    const tabs = [
        { id: 'booking', label: t('menu.booking'), icon: Calendar },
        { id: 'waiting-pickup', label: t('menu.waitingPickup'), icon: Clock },
        { id: 'rent', label: t('menu.rentActive'), icon: ShoppingCart },
        { id: 'need-return', label: t('menu.needReturn'), icon: AlertTriangle },
        { id: 'laundry', label: t('menu.laundry'), icon: WashingMachine },
        { id: 'completed', label: t('menu.completed'), icon: CheckCircle },
    ];

    const [transactions, setTransactions] = useState<any[]>([]);
    const [rawData, setRawData] = useState<any[]>([]);

    // Helper to check if pickup is expired (Today > Return Date + 1 Day)
    const checkExpired = (tx: any) => {
        if (!tx.returnPlanDate) return false;
        const returnDate = new Date(tx.returnPlanDate);
        const expireDate = new Date(returnDate);
        expireDate.setDate(returnDate.getDate() + 1);
        expireDate.setHours(23, 59, 59, 999); // End of the +1 day

        const today = new Date();
        return today > expireDate;
    };
    const [dateRange, setDateRange] = useState({ start: '', end: '' });
    const [searchTerm, setSearchTerm] = useState('');
    const [laundryItems, setLaundryItems] = useState<any[]>([]); // For Laundry Tab

    // Modal States
    const [selectedTx, setSelectedTx] = useState<any>(null);
    const [showPickupModal, setShowPickupModal] = useState(false);
    const [showReturnModal, setShowReturnModal] = useState(false);
    const [showDetailModal, setShowDetailModal] = useState(false);

    // Pickup State
    const [pickupPayment, setPickupPayment] = useState('');
    const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('');
    const [pickupNote, setPickupNote] = useState('');

    // Invalid State
    const [showInvalidModal, setShowInvalidModal] = useState(false);
    const [invalidNote, setInvalidNote] = useState('');

    // Return State
    const [violationTypes, setViolationTypes] = useState<any[]>([]);
    const [selectedViolations, setSelectedViolations] = useState<{ violationTypeId: number, amount: number, note: string }[]>([]);
    const [returnPayAmount, setReturnPayAmount] = useState(0);
    const [returnPayMethodId, setReturnPayMethodId] = useState(0);

    // QRIS State
    const [qrisModal, setQrisModal] = useState<{ isOpen: boolean, paymentUrl?: string, qrString?: string, transactionId?: number }>({ isOpen: false });
    const pollingInterval = useRef<any>(null);

    useEffect(() => {
        fetchData();
        fetchPaymentMethods();
        fetchViolationTypes();
        // Reset Modals on type change
        setShowPickupModal(false);
        setShowReturnModal(false);
        setShowDetailModal(false);
        setDateRange({ start: '', end: '' }); // Reset filters on tab change
    }, [currentType]);

    useEffect(() => {
        if (currentType === 'laundry') return; // Laundry has its own state

        let filtered = rawData;

        // 1. Filter by Type logic
        switch (currentType) {
            case 'booking':
                // Booking: Status BOOKED but NOT fully paid (UNPAID or PARTIAL)
                filtered = rawData.filter((t: any) => t.status === 'BOOKED' && t.paymentStatus !== 'PAID');
                break;
            case 'waiting-pickup':
                // Waiting Pickup: Status BOOKED and fully PAID
                filtered = rawData.filter((t: any) => t.status === 'BOOKED' && t.paymentStatus === 'PAID');
                break;
            case 'rent':
                filtered = rawData.filter((t: any) => t.status === 'RENTED');
                break;
            case 'need-return':
                // "di range tgl rent tgl terakhir otomatis dia akan muncul di need to return"
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                filtered = rawData.filter((t: any) => {
                    if (t.status !== 'RENTED') return false;
                    const returnDate = new Date(t.returnPlanDate);
                    return returnDate <= today;
                });
                break;
            case 'completed':
                filtered = rawData.filter((t: any) => ['RETURNED', 'COMPLETED', 'CANCELLED', 'EXPIRED'].includes(t.status));
                break;
        }

        // 2. Filter by Date Range (if set)
        if (dateRange.start || dateRange.end) {
            const start = dateRange.start ? new Date(dateRange.start + 'T00:00:00') : null;
            const end = dateRange.end ? new Date(dateRange.end + 'T23:59:59.999') : null;

            filtered = filtered.filter((t: any) => {
                // Determine which date to filter by based on Tab
                let targetDate: Date;

                if (currentType === 'booking' || currentType === 'waiting-pickup') {
                    targetDate = new Date(t.pickupDate);
                } else if (currentType === 'rent' || currentType === 'need-return' || currentType === 'completed') {
                    if (currentType === 'completed') targetDate = new Date(t.createdAt);
                    else targetDate = new Date(t.returnPlanDate);
                } else {
                    targetDate = new Date(t.createdAt);
                }

                if (start && targetDate < start) return false;
                if (end && targetDate > end) return false;
                return true;
            });
        }

        // 3. Filter by Search Term (Custom implementation)
        if (searchTerm) {
            const lowerTerm = searchTerm.toLowerCase();
            filtered = filtered.filter((t: any) => {
                const idMatch = t.id.toString().includes(lowerTerm);
                const customerMatch = t.customer?.name?.toLowerCase().includes(lowerTerm);
                const itemMatch = t.items?.some((i: any) =>
                    (i.itemInstanceSku?.toLowerCase().includes(lowerTerm)) ||
                    (i.itemInstance?.itemVariant?.item?.name?.toLowerCase().includes(lowerTerm))
                );
                return idMatch || customerMatch || itemMatch;
            });
        }

        setTransactions(filtered);
    }, [rawData, currentType, dateRange, searchTerm]);

    const fetchData = async () => {
        try {
            if (currentType === 'laundry') {
                const res = await fetch(`${API_URL}/laundry`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await res.json();
                setLaundryItems(data);
                setTransactions([]); // Clear standard txs
            } else {
                const res = await fetch(`${API_URL}/transactions`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await res.json();
                setRawData(data);
            }
        } catch (error) {
            console.error("Failed to fetch data", error);
        }
    };

    const fetchPaymentMethods = async () => {
        try {
            const res = await fetch(`${API_URL}/masters/payment-methods`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            setPaymentMethods(data);
            if (data.length > 0) {
                setSelectedPaymentMethod(data[0].id.toString());
                setReturnPayMethodId(data[0].id);
            }
        } catch (error) {
            console.error("Failed to fetch payment methods", error);
        }
    };

    const fetchViolationTypes = async () => {
        try {
            const res = await fetch(`${API_URL}/masters/violation-types`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            setViolationTypes(data);
        } catch (error) {
            console.error("Failed to fetch violation types", error);
        }
    };

    const handlePickupClick = (tx: any) => {
        setSelectedTx(tx);
        const remainingAmount = tx.totalAmount - tx.paidAmount;
        setPickupPayment(remainingAmount > 0 ? remainingAmount.toString() : '0');
        setPickupNote('');
        setShowPickupModal(true);
    };

    const handleDetailClick = (tx: any) => {
        setSelectedTx(tx);
        setShowDetailModal(true);
    };

    const confirmPickup = async () => {
        if (!selectedTx) return;
        try {
            const payAmount = parseFloat(pickupPayment);

            const isBookingConfirmation = currentType === 'booking';
            const endpoint = isBookingConfirmation ? 'pay' : 'pickup';

            const res = await fetch(`${API_URL}/transactions/${selectedTx.id}/${endpoint}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    payment: payAmount > 0 ? {
                        amount: payAmount,
                        methodId: parseInt(selectedPaymentMethod),
                        note: pickupNote || (isBookingConfirmation ? 'Down Payment' : 'Pickup Payment')
                    } : undefined
                })
            });

            if (res.ok) {
                const data = await res.json();

                // If it is GATEWAY (Duitku), show QRIS Modal
                const selectedPM = paymentMethods.find(pm => pm.id.toString() === selectedPaymentMethod);
                if (selectedPM?.type === 'GATEWAY') {
                    setQrisModal({
                        isOpen: true,
                        paymentUrl: data.paymentUrl,
                        qrString: data.qrString,
                        transactionId: data.transactionId || selectedTx.id
                    });
                    startPolling(data.transactionId || selectedTx.id);
                } else {
                    alert(t('transactions.pickup.success'));
                    setShowPickupModal(false);
                    fetchData();
                }
            } else {
                const err = await res.json();
                alert(`${t('common.error')}: ${err.error || err.message}`);
            }
        } catch (error) {
            console.error(error);
            alert(t('common.error'));
        }
    };

    const startPolling = (txId: number) => {
        if (pollingInterval.current) clearInterval(pollingInterval.current);

        pollingInterval.current = setInterval(async () => {
            try {
                const res = await fetch(`${API_URL}/payments/duitku/status/${txId}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const statusData = await res.json();
                    // resultCode '00' is success in Duitku, '01' is pending
                    if (statusData.resultCode === '00') {
                        clearInterval(pollingInterval.current);
                        setQrisModal({ isOpen: false });
                        alert(t('pos.alert.success'));
                        setShowPickupModal(false);
                        setShowReturnModal(false);
                        fetchData(); // Refresh table
                    }
                }
            } catch (err) {
                console.error("Polling error:", err);
            }
        }, 5000);
    };

    useEffect(() => {
        return () => {
            if (pollingInterval.current) clearInterval(pollingInterval.current);
        };
    }, []);

    const handleReturnClick = (tx: any) => {
        setSelectedTx(tx);

        // Auto-calculate Late Violation if any
        const today = new Date();
        const plan = new Date(tx.returnPlanDate);
        const initialViolations = [];

        if (today > plan) {
            const diffTime = Math.abs(today.getTime() - plan.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            const calculatedFine = diffDays * 50000; // Hardcoded example fine

            // Try to find "Late" violation type ID 1 or similar, else just default key
            // Assuming we have violation types loaded, we might search for name "Late"
            // For now, let's just add it manually or if we know the ID.
            // Let's assume ID 1 is Late for simplicty or default to 0 to force selection.
            initialViolations.push({ violationTypeId: 1, amount: calculatedFine, note: `Late ${diffDays} Days` });
        }

        setSelectedViolations(initialViolations);
        setReturnPayAmount(0); // Reset payment input
        // Default payment method
        if (paymentMethods.length > 0) setReturnPayMethodId(paymentMethods[0].id);

        setShowReturnModal(true);
    };

    const addViolation = () => {
        setSelectedViolations([...selectedViolations, { violationTypeId: 0, amount: 0, note: '' }]);
    };

    const removeViolation = (index: number) => {
        setSelectedViolations(selectedViolations.filter((_, i) => i !== index));
    };

    const updateViolation = (index: number, field: keyof typeof selectedViolations[0], value: any) => {
        const newViolations = [...selectedViolations];
        newViolations[index] = { ...newViolations[index], [field]: value };
        setSelectedViolations(newViolations);
    };

    const confirmReturn = async () => {
        if (!selectedTx) return;
        try {
            // Validate Payment if fines exist
            const totalFines = selectedViolations.reduce((sum, v) => sum + (v.amount || 0), 0);

            if (returnPayAmount < totalFines) {
                alert(t('transactions.return.partialError', { amount: `Rp ${totalFines.toLocaleString()}` }));
                return;
            }

            // Build itemsStatus - all items go to laundry queue
            const itemsStatus: { [sku: string]: string } = {};
            if (selectedTx.items && selectedTx.items.length > 0) {
                selectedTx.items.forEach((item: any) => {
                    const sku = item.itemInstanceSku || item.itemInstance?.sku;
                    if (sku) itemsStatus[sku] = 'IN_LAUNDRY';
                });
            }

            console.log('Sending return request with itemsStatus:', itemsStatus);

            const res = await fetch(`${API_URL}/transactions/${selectedTx.id}/return`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    returnDate: new Date(),
                    fines: selectedViolations,
                    itemsStatus: itemsStatus,
                    payment: totalFines > 0 && returnPayAmount > 0 ? {
                        amount: returnPayAmount,
                        methodId: returnPayMethodId,
                        note: 'Fine Payment'
                    } : undefined
                })
            });

            if (res.ok) {
                const data = await res.json();

                // If it is GATEWAY (Duitku), show QRIS Modal
                if (data.qrString || data.paymentUrl) {
                    setQrisModal({
                        isOpen: true,
                        paymentUrl: data.paymentUrl,
                        qrString: data.qrString,
                        transactionId: data.transactionId || selectedTx.id
                    });
                    startPolling(data.transactionId || selectedTx.id);
                } else {
                    alert(t('transactions.return.success'));
                    setShowReturnModal(false);
                    fetchData();
                }
            } else {
                const err = await res.json();
                alert(`${t('common.error')}: ${err.error}`);
            }
        } catch (error) {
            console.error(error);
            alert(t('common.error'));
        }
    };

    const handleInvalidClick = (tx: any) => {
        setSelectedTx(tx);
        setInvalidNote('');
        setShowInvalidModal(true);
    };

    const confirmInvalid = async () => {
        if (!selectedTx) return;
        try {
            if (!confirm(t('transactions.invalid.confirm'))) return;

            const res = await fetch(`${API_URL}/transactions/${selectedTx.id}/invalid`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ note: invalidNote })
            });

            if (res.ok) {
                alert(t('transactions.invalid.success'));
                setShowInvalidModal(false);
                fetchData();
            } else {
                alert(t('common.error'));
            }
        } catch (error) {
            console.error(error);
            alert(t('common.error'));
        }
    };

    const handleLaundryComplete = async (logIds: number[]) => {
        if (!confirm("Start Laundry / Mark Clean for these items?")) return;
        try {
            const res = await fetch(`${API_URL}/laundry/complete`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ logIds })
            });
            if (res.ok) {
                alert("Items marked clean & available!");
                fetchData();
            }
        } catch (error) {
            console.error(error);
        }
    };

    // Reminder Selection State
    const [showReminderModal, setShowReminderModal] = useState(false);
    const [reminderTargets, setReminderTargets] = useState<any[]>([]);
    const [selectedTargetPhones, setSelectedTargetPhones] = useState<string[]>([]);
    const [reminderData, setReminderData] = useState<{ content: string, templateId: number, type: string } | null>(null);

    const handleReminderCheck = async (type: 'PICKUP' | 'RETURN') => {
        try {
            const res = await fetch(`${API_URL}/broadcast/reminders?type=${type}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();

            if (data.targets && data.targets.length > 0) {
                setReminderTargets(data.targets);
                // Default select all
                setSelectedTargetPhones(data.targets.map((t: any) => t.phone));
                setReminderData({
                    content: data.content,
                    templateId: data.templateId,
                    type
                });
                setShowReminderModal(true);
            } else {
                alert(`Tidak ada data ${type} untuk hari ini.`);
            }
        } catch (error) {
            console.error('Failed to fetch reminder targets:', error);
            alert('Gagal memuat data reminder.');
        }
    };

    const toggleTarget = (phone: string) => {
        setSelectedTargetPhones(prev =>
            prev.includes(phone) ? prev.filter(p => p !== phone) : [...prev, phone]
        );
    };

    const confirmReminder = () => {
        if (selectedTargetPhones.length === 0) {
            alert("Pilih minimal satu customer.");
            return;
        }

        const filteredTargets = reminderTargets.filter(t => selectedTargetPhones.includes(t.phone));

        // Navigate to broadcast with state
        const basePath = business ? `/${business.slug}/app` : '/app';
        navigate(`${basePath}/broadcast`, {
            state: {
                targets: filteredTargets,
                content: reminderData?.content,
                templateId: reminderData?.templateId,
                type: reminderData?.type
            }
        });
    };

    // Barcode Scanner Logic
    const handleScan = useCallback(async (code: string) => {
        if (!token) return;
        console.log("Tx Scan:", code);

        try {
            // Search Active Transaction by Item SKU
            const res = await fetch(`${API_URL}/transactions/items/${code}/active`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                const tx = await res.json();

                if (tx.status === 'BOOKED') {
                    handlePickupClick(tx);
                } else if (tx.status === 'RENTED') {
                    handleReturnClick(tx);
                } else {
                    alert(`Transaction status is ${tx.status}`);
                }
            } else {
                alert('No active transaction found for this item.');
            }
        } catch (e) {
            console.error("Scan Error", e);
        }
    }, [token]);

    useBarcodeScanner(handleScan);


    // --- RENDER HELPERS ---

    // Laundry Table Render
    if (currentType === 'laundry') {
        return (
            <div className="p-6 max-w-full mx-auto space-y-6">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <Wallet className="text-purple-600" /> {t('menu.transactions')}
                    </h1>

                    <div className="bg-gray-100 p-1 rounded-lg flex overflow-x-auto no-scrollbar max-w-full">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => {
                                    const basePath = business ? `/${business.slug}/app` : '/app';
                                    navigate(`${basePath}/transactions/${tab.id}`);
                                }}
                                className={clsx(
                                    "px-3 py-2 rounded-md text-xs font-bold transition-all whitespace-nowrap flex items-center gap-2",
                                    currentType === tab.id ? "bg-white shadow-sm text-gray-900" : "text-gray-500 hover:text-gray-700 hover:bg-gray-50/50"
                                )}
                            >
                                <tab.icon size={14} /> {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-4 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gray-50/30">
                        <div className="flex items-center gap-3">
                            <div className="bg-purple-600 w-1 h-6 rounded-full"></div>
                            <h2 className="font-bold text-gray-900 uppercase tracking-wider text-sm">
                                {tabs.find(t => t.id === currentType)?.label || 'Laundry'}
                            </h2>
                        </div>
                    </div>

                    {laundryItems.length === 0 ? (
                        <div className="p-12 text-center">
                            <WashingMachine className="mx-auto mb-4 text-gray-300" size={64} />
                            <p className="text-gray-500 text-lg mb-2">{t('transactions.laundry.empty')}</p>
                            <p className="text-gray-400 text-sm">
                                {t('transactions.laundry.emptyDesc')}
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-50 text-gray-700 border-b border-gray-100">
                                    <tr>
                                        <th className="px-6 py-4">{t('inventory.table.item')}</th>
                                        <th className="px-6 py-4">{t('transactions.table.status')}</th>
                                        <th className="px-6 py-4">{t('transactions.table.dates')}</th>
                                        <th className="px-6 py-4 text-right">{t('common.actions')}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {laundryItems.map(item => (
                                        <tr key={item.id} className="hover:bg-purple-50/10">
                                            <td className="px-6 py-4 font-medium">
                                                {item.itemInstance?.itemVariant?.item?.name || 'Unknown Item'}
                                                <span className="text-xs text-gray-500 ml-2">({item.itemInstance?.sku || 'N/A'})</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-bold">
                                                    {item.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-gray-500">
                                                {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : '-'}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button
                                                    onClick={() => handleLaundryComplete([item.id])}
                                                    className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-xs font-bold transition-colors"
                                                >
                                                    {t('transactions.laundry.markClean')}
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // Standard Transaction Table Render
    const columns: Column<any>[] = [
        { header: t('transactions.table.id'), accessorKey: 'id', sortable: true, className: 'w-20' },
        {
            header: t('transactions.table.customer'),
            accessorKey: 'customerId',
            sortable: true,
            cell: (tx) => (
                <div className="flex flex-col">
                    <span className="font-bold">{tx.customer?.name || '-'}</span>
                    <div className="mt-1">
                        {tx.source === 'ONLINE' ? (
                            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-[10px] font-black uppercase tracking-widest border border-blue-200">
                                Online
                            </span>
                        ) : (
                            <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-[10px] font-black uppercase tracking-widest border border-gray-200">
                                Offline
                            </span>
                        )}
                    </div>
                </div>
            )
        },
        {
            header: t('transactions.table.dates'),
            accessorKey: 'pickupDate',
            sortable: true,
            cell: (tx) => (
                <div className="flex flex-col gap-1">
                    <span className="text-green-600 flex items-center gap-1 text-xs">
                        {t('transactions.table.pick')}: {new Date(tx.pickupDate).toLocaleDateString()}
                        {new Date(tx.pickupDate) < new Date(new Date().setHours(0, 0, 0, 0)) && tx.status === 'BOOKED' && (
                            <span className="bg-red-100 text-red-600 px-1.5 py-0.5 rounded text-[10px] font-bold border border-red-200">
                                {t('transactions.status.overdue')}
                            </span>
                        )}
                    </span>
                    <span className="text-red-600 text-xs">{t('transactions.table.ret')}: {new Date(tx.returnPlanDate).toLocaleDateString()}</span>
                </div>
            )
        },
        {
            header: t('inventory.table.item'),
            accessorKey: 'items',
            className: 'w-64',
            cell: (tx) => (
                <div className="flex flex-col gap-1">
                    {tx.items?.slice(0, 3).map((i: any, idx: number) => (
                        <div key={idx} className="text-xs">
                            <span className="font-medium">{i.itemInstance?.itemVariant?.item?.name || 'Unknown'}</span>
                            <span className="text-gray-500 ml-1">({i.itemInstanceSku || i.itemInstance?.sku})</span>
                        </div>
                    ))}
                    {(tx.items?.length || 0) > 3 && (
                        <span className="text-xs text-gray-400 italic">+{tx.items.length - 3} more...</span>
                    )}
                </div>
            )
        },
        {
            header: t('transactions.table.status'),
            accessorKey: 'status',
            sortable: true,
            cell: (tx) => (
                <div>
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${tx.paymentStatus === 'PAID' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                        {tx.paymentStatus}
                    </span>
                    <span className="ml-2 px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">{tx.status}</span>
                </div>
            )
        }
    ];

    const actionColumn = (tx: any) => (
        <div className="flex justify-end gap-2">
            <button onClick={() => window.open(`/invoice/${tx.id}`, '_blank')} className="p-1.5 text-gray-400 hover:text-black bg-gray-100 rounded">
                <Printer size={16} />
            </button>

            <button
                onClick={() => handleDetailClick(tx)}
                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded" title={t('transactions.action.details')}
            >
                <Eye size={16} />
            </button>

            {/* Waiting Pickup Actions */}
            {(currentType === 'waiting-pickup') && (
                <div className="flex gap-2">
                    {checkExpired(tx) ? (
                        <div className="flex items-center gap-2">
                            <span className="px-3 py-1.5 bg-red-100 text-red-700 rounded text-xs font-bold border border-red-200">
                                {t('transactions.status.expired')}
                            </span>
                            {hasRole(['SUPERADMIN', 'OWNER', 'SUPERVISOR']) && (
                                <button
                                    onClick={() => handlePickupClick(tx)}
                                    className="px-3 py-1.5 bg-gray-900 text-white rounded text-xs font-bold hover:bg-gray-800"
                                >
                                    {t('transactions.action.forcePickup')}
                                </button>
                            )}
                        </div>
                    ) : (
                        <button
                            onClick={() => handlePickupClick(tx)}
                            className={`px-3 py-1.5 text-white rounded text-xs font-bold bg-gray-900 hover:bg-gray-800`}
                        >
                            {t('transactions.action.pickup')}
                        </button>
                    )}

                    {hasRole(['SUPERADMIN', 'SUPERVISOR', 'OWNER']) && (
                        <button
                            onClick={() => handleInvalidClick(tx)}
                            className="px-3 py-1.5 text-red-600 border border-red-200 hover:bg-red-50 rounded text-xs"
                            title="Mark as Invalid"
                        >
                            Invalid
                        </button>
                    )}
                </div>
            )}

            {/* Booking Actions */}
            {currentType === 'booking' && (
                <div className="flex gap-2">
                    <button
                        onClick={() => handlePickupClick(tx)}
                        className={`px-3 py-1.5 text-white rounded text-xs font-bold bg-gray-900 hover:bg-gray-800`}
                    >
                        {t('transactions.action.pickup')}
                    </button>

                    {hasRole(['SUPERADMIN', 'SUPERVISOR', 'OWNER']) && (
                        <button
                            onClick={() => handleInvalidClick(tx)}
                            className="px-3 py-1.5 text-red-600 border border-red-200 hover:bg-red-50 rounded text-xs"
                            title="Mark as Invalid"
                        >
                            Invalid
                        </button>
                    )}
                </div>
            )}

            {/* Rent & Return Actions */}
            {(currentType === 'rent' || currentType === 'need-return') && (
                <button
                    onClick={() => handleReturnClick(tx)}
                    className="px-3 py-1.5 bg-red-600 text-white rounded text-xs font-bold hover:bg-red-700"
                >
                    {t('transactions.action.return')}
                </button>
            )}
        </div>
    );


    return (
        <div className="p-6 max-w-full mx-auto space-y-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <Wallet className="text-purple-600" /> {t('menu.transactions')}
                </h1>

                <div className="flex items-center gap-2">
                    {currentType === 'waiting-pickup' && (
                        <button
                            onClick={() => handleReminderCheck('PICKUP')}
                            className="px-3 py-2 bg-green-600 text-white rounded-lg text-xs font-bold hover:bg-green-700 flex items-center gap-2"
                        >
                            <span className="hidden sm:inline">Send Pickup Reminder</span>
                            <span className="sm:hidden">Reminder</span>
                        </button>
                    )}
                    {currentType === 'need-return' && (
                        <button
                            onClick={() => handleReminderCheck('RETURN')}
                            className="px-3 py-2 bg-orange-600 text-white rounded-lg text-xs font-bold hover:bg-orange-700 flex items-center gap-2"
                        >
                            <span className="hidden sm:inline">Send Return Reminder</span>
                            <span className="sm:hidden">Reminder</span>
                        </button>
                    )}

                    <div className="bg-gray-100 p-1 rounded-lg flex overflow-x-auto no-scrollbar max-w-full">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => navigate(`/app/transactions/${tab.id}`)}
                                className={clsx(
                                    "px-3 py-2 rounded-md text-xs font-bold transition-all whitespace-nowrap flex items-center gap-2",
                                    currentType === tab.id ? "bg-white shadow-sm text-gray-900" : "text-gray-500 hover:text-gray-700 hover:bg-gray-50/50"
                                )}
                            >
                                <tab.icon size={14} /> {tab.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gray-50/30">
                    <div className="flex items-center gap-3">
                        <div className="bg-purple-600 w-1 h-6 rounded-full"></div>
                        <h2 className="font-bold text-gray-900 uppercase tracking-wider text-sm">
                            {tabs.find(t => t.id === currentType)?.label || 'Transactions'}
                        </h2>
                    </div>

                    <div className="flex gap-2 items-center">
                        <div className="relative">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                            <input
                                type="text"
                                placeholder="Search ID, Name, SKU..."
                                className="pl-8 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none w-64"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
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
                </div>

                <DataTable
                    data={transactions}
                    columns={columns}
                    searchKeys={[]} // Disabled internal search
                    hideSearch={true} // Custom search above
                    hideHeader={true}
                    noCard={true}
                    actions={actionColumn}
                />
            </div>

            {/* Pickup Modal */}
            {showPickupModal && selectedTx && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-2xl w-96 shadow-xl">
                        <h2 className="text-xl font-bold mb-4">
                            {t('transactions.pickup.title', { id: selectedTx.id })}
                        </h2>

                        <div className="space-y-4">
                            <div className="p-4 bg-gray-50 rounded-lg">
                                <div className="flex justify-between text-sm">
                                    <span>{t('transactions.pickup.total')}:</span>
                                    <span className="font-bold">Rp {selectedTx.totalAmount.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-sm text-green-600">
                                    <span>{t('transactions.pickup.paid')}:</span>
                                    <span>- Rp {selectedTx.paidAmount.toLocaleString()}</span>
                                </div>
                                <div className="border-t border-gray-200 my-2"></div>
                                <div className="flex justify-between font-bold text-red-600">
                                    <span>{t('transactions.pickup.remaining')}:</span>
                                    <span>Rp {(selectedTx.totalAmount - selectedTx.paidAmount).toLocaleString()}</span>
                                </div>
                            </div>

                            {(selectedTx.totalAmount - selectedTx.paidAmount) > 0 ? (
                                <>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 mb-1">{t('transactions.pickup.payRemaining')}</label>
                                        <input
                                            type="text"
                                            value={pickupPayment === '0' ? '' : parseInt(pickupPayment).toLocaleString('id-ID')}
                                            onChange={(e) => {
                                                const val = e.target.value.replace(/\D/g, '');
                                                setPickupPayment(val || '0');
                                            }}
                                            className="w-full border border-gray-300 rounded-lg p-2 font-mono text-lg font-bold"
                                            placeholder="0"
                                        />
                                        {parseInt(pickupPayment) > (selectedTx.totalAmount - selectedTx.paidAmount) && (
                                            <div className="text-right text-xs font-bold text-green-600 mt-1">
                                                {t('pos.change')}: Rp {(parseInt(pickupPayment) - (selectedTx.totalAmount - selectedTx.paidAmount)).toLocaleString()}
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 mb-1">{t('pos.paymentMethod')}</label>
                                        <select
                                            value={selectedPaymentMethod}
                                            onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                                            className="w-full border border-gray-300 rounded-lg p-2"
                                        >
                                            {paymentMethods.map(m => (
                                                <option key={m.id} value={m.id}>{m.name}</option>
                                            ))}
                                        </select>
                                        {/* Account Info for Transfer Methods */}
                                        {(() => {
                                            const selectedPM = paymentMethods.find(pm => pm.id.toString() === selectedPaymentMethod);
                                            if (selectedPM?.type === 'TRANSFER' && selectedPM.account && selectedPM.account !== '-') {
                                                return (
                                                    <div className="mt-2 p-2 bg-blue-50 border border-blue-100 rounded-lg">
                                                        <p className="text-[10px] text-blue-500 uppercase font-bold mb-0.5">Account Info</p>
                                                        <p className="text-xs font-bold text-blue-900">{selectedPM.account}</p>
                                                    </div>
                                                );
                                            }
                                            return null;
                                        })()}
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 mb-1">{t('transactions.pickup.note')}</label>
                                        <input
                                            type="text"
                                            value={pickupNote}
                                            onChange={(e) => setPickupNote(e.target.value)}
                                            className="w-full border border-gray-300 rounded-lg p-2"
                                            placeholder={t('common.description')}
                                        />
                                    </div>
                                </>
                            ) : (
                                <div className="p-3 bg-green-50 text-green-800 text-xs rounded-lg flex items-center gap-2">
                                    <CheckCircle size={16} /> {t('transactions.pickup.ready')}
                                </div>
                            )}

                            <div className="flex justify-end gap-2 mt-4">
                                <button onClick={() => setShowPickupModal(false)} className="px-4 py-2 text-gray-500 hover:bg-gray-100 rounded-lg">{t('common.cancel')}</button>
                                <button onClick={confirmPickup} className="px-4 py-2 text-white rounded-lg font-bold bg-gray-900 hover:bg-gray-800">
                                    {t('transactions.pickup.confirm')}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Return Modal */}
            {showReturnModal && selectedTx && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-2xl w-[500px] shadow-xl max-h-[90vh] overflow-y-auto">
                        <h2 className="text-xl font-bold mb-4 text-red-600">{t('transactions.return.title', { id: selectedTx.id })}</h2>
                        <div className="space-y-4">
                            {/* Violations Section */}
                            <div>
                                <h3 className="text-sm font-bold text-gray-900 mb-2">{t('transactions.return.finesTitle')}</h3>
                                <div className="space-y-2">
                                    {selectedViolations.map((v, idx) => (
                                        <div key={idx} className="flex gap-2 items-start bg-red-50 p-2 rounded-lg">
                                            <div className="flex-1 space-y-2">
                                                <select
                                                    value={v.violationTypeId}
                                                    onChange={(e) => {
                                                        const newId = parseInt(e.target.value);
                                                        const selected = violationTypes.find((vt: any) => vt.id === newId);
                                                        const newAmount = selected ? selected.defaultFine : 0;

                                                        const newViolations = [...selectedViolations];
                                                        newViolations[idx] = {
                                                            ...newViolations[idx],
                                                            violationTypeId: newId,
                                                            amount: newAmount
                                                        };
                                                        setSelectedViolations(newViolations);
                                                    }}
                                                    className="w-full text-xs p-1.5 border rounded"
                                                >
                                                    <option value={0}>{t('common.select')}</option>
                                                    {violationTypes.map((vt: any) => (
                                                        <option key={vt.id} value={vt.id}>
                                                            {vt.name} (Rp {vt.defaultFine.toLocaleString()})
                                                        </option>
                                                    ))}
                                                </select>
                                                <input
                                                    type="number"
                                                    placeholder="Fine Amount"
                                                    value={v.amount}
                                                    onChange={(e) => updateViolation(idx, 'amount', parseFloat(e.target.value))}
                                                    className="w-full text-xs p-1.5 border rounded"
                                                />
                                                <input
                                                    type="text"
                                                    placeholder="Note..."
                                                    value={v.note}
                                                    onChange={(e) => updateViolation(idx, 'note', e.target.value)}
                                                    className="w-full text-xs p-1.5 border rounded"
                                                />
                                            </div>
                                            <button onClick={() => removeViolation(idx)} className="text-red-400 hover:text-red-700 p-1">
                                                &times;
                                            </button>
                                        </div>
                                    ))}
                                    <button
                                        onClick={addViolation}
                                        className="text-xs text-blue-600 font-bold hover:underline flex items-center gap-1"
                                    >
                                        + {t('transactions.return.addViolation')}
                                    </button>
                                </div>
                                {selectedViolations.length > 0 && (
                                    <div className="mt-2 text-right font-bold text-red-700">
                                        {t('transactions.return.totalFines')}: Rp {selectedViolations.reduce((sum, v) => sum + (v.amount || 0), 0).toLocaleString()}
                                    </div>
                                )}
                            </div>

                            <div className="border-t border-gray-100 my-2"></div>

                            {/* Payment Section for Return (Fines) */}
                            {selectedViolations.reduce((sum, v) => sum + (v.amount || 0), 0) > 0 && (
                                <div className="bg-gray-50 p-3 rounded-lg space-y-3">
                                    <h3 className="text-sm font-bold text-gray-900">{t('transactions.return.paymentTitle')}</h3>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 mb-1">{t('pos.amountPaid')}</label>
                                        <input
                                            type="text"
                                            value={returnPayAmount === 0 ? '' : returnPayAmount.toLocaleString('id-ID')}
                                            onChange={(e) => {
                                                const val = parseInt(e.target.value.replace(/\D/g, '') || '0');
                                                setReturnPayAmount(val);
                                            }}
                                            className="w-full border border-gray-300 rounded-lg p-2 font-mono text-sm font-bold"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 mb-1">{t('pos.paymentMethod')}</label>
                                        <select
                                            value={returnPayMethodId}
                                            onChange={(e) => setReturnPayMethodId(parseInt(e.target.value))}
                                            className="w-full border border-gray-300 rounded-lg p-2 text-sm"
                                        >
                                            {paymentMethods.map(m => (
                                                <option key={m.id} value={m.id}>{m.name}</option>
                                            ))}
                                        </select>
                                        {/* Account Info for Transfer Methods */}
                                        {(() => {
                                            const selectedPM = paymentMethods.find(pm => pm.id === returnPayMethodId);
                                            if (selectedPM?.type === 'TRANSFER' && selectedPM.account && selectedPM.account !== '-') {
                                                return (
                                                    <div className="mt-2 p-2 bg-blue-50 border border-blue-100 rounded-lg">
                                                        <p className="text-[10px] text-blue-500 uppercase font-bold mb-0.5">Account Info</p>
                                                        <p className="text-xs font-bold text-blue-900">{selectedPM.account}</p>
                                                    </div>
                                                );
                                            }
                                            return null;
                                        })()}
                                    </div>
                                </div>
                            )}

                            <div className="p-3 bg-blue-50 text-blue-800 text-xs rounded-lg">
                                {t('transactions.return.laundryNote')}
                            </div>

                            <div className="flex justify-end gap-2 mt-4">
                                <button onClick={() => setShowReturnModal(false)} className="px-4 py-2 text-gray-500 hover:bg-gray-100 rounded-lg">{t('common.cancel')}</button>
                                <button onClick={confirmReturn} className="px-4 py-2 text-white rounded-lg font-bold bg-red-600 hover:bg-red-700">
                                    {t('transactions.return.confirm')}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Invalid Modal */}
            {showInvalidModal && selectedTx && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-2xl w-96 shadow-xl">
                        <h2 className="text-xl font-bold mb-4 text-red-600">Mark Invalid #{selectedTx.id}</h2>
                        <p className="text-sm text-gray-600 mb-4">
                            This will cancel the transaction and release items back to stock.
                            <br /><b className="text-gray-800">Payments will NOT be refunded.</b>
                        </p>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1">Reason / Note</label>
                                <textarea
                                    value={invalidNote}
                                    onChange={(e) => setInvalidNote(e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg p-2 h-24 text-sm"
                                    placeholder="Why is this transaction invalid?"
                                />
                            </div>
                            <div className="flex justify-end gap-2 mt-4">
                                <button onClick={() => setShowInvalidModal(false)} className="px-4 py-2 text-gray-500 hover:bg-gray-100 rounded-lg">Cancel</button>
                                <button onClick={confirmInvalid} className="px-4 py-2 bg-red-600 text-white rounded-lg font-bold">
                                    Mark Invalid
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* View Detail Modal */}
            {showDetailModal && selectedTx && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-2xl w-[600px] shadow-xl max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h2 className="text-xl font-bold">Transaction #{selectedTx.id}</h2>
                                <p className="text-gray-500 text-sm">{selectedTx.customer?.name} - {selectedTx.customer?.phone}</p>
                            </div>
                            <span className={`px-2 py-1 rounded text-xs font-bold ${selectedTx.status === 'RENTED' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100'}`}>{selectedTx.status}</span>
                        </div>

                        <div className="space-y-6">
                            {/* Items */}
                            <div>
                                <h3 className="text-sm font-bold text-gray-900 mb-2 border-b pb-1">Items Rented</h3>
                                <div className="space-y-2">
                                    {selectedTx.items.map((i: any) => (
                                        <div key={i.id} className="flex justify-between text-sm">
                                            <span>{i.itemInstance?.itemVariant?.item?.name} <span className="text-gray-400">({i.itemInstanceSku})</span></span>
                                            <span className="font-mono">Rp {i.priceAtRental.toLocaleString()}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Fines & Violations (if any) */}
                            {selectedTx.fines && selectedTx.fines.length > 0 && (
                                <div>
                                    <h3 className="text-sm font-bold text-red-600 mb-2 border-b pb-1 flex items-center gap-2">
                                        <AlertTriangle size={16} /> Fines & Violations
                                    </h3>
                                    <div className="space-y-2 bg-red-50 p-3 rounded-lg">
                                        {selectedTx.fines.map((f: any) => (
                                            <div key={f.id} className="flex justify-between items-center text-sm border-b border-red-100 last:border-0 pb-2 last:pb-0">
                                                <div>
                                                    <p className="font-bold text-red-800">{f.violationType?.name || 'Violation'}</p>
                                                    <p className="text-xs text-red-600 italic">{f.note || '-'}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-bold text-red-800">Rp {f.amount.toLocaleString()}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Payment History */}
                            <div>
                                <h3 className="text-sm font-bold text-gray-900 mb-2 border-b pb-1 flex items-center gap-2">
                                    <Wallet size={16} /> Payment History
                                </h3>
                                <div className="space-y-2 bg-gray-50 p-3 rounded-lg">
                                    {selectedTx.payments && selectedTx.payments.length > 0 ? (
                                        selectedTx.payments.map((p: any) => (
                                            <div key={p.id} className="flex justify-between items-center text-sm border-b border-gray-200 last:border-0 pb-2 last:pb-0">
                                                <div>
                                                    <p className="font-bold">Rp {p.amount.toLocaleString()}</p>
                                                    <p className="text-xs text-gray-500">{new Date(p.date).toLocaleString()}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-xs font-medium bg-white border px-1 rounded">{p.paymentMethod?.name || 'Unknown'}</p>
                                                    <p className="text-[10px] text-gray-500 italic">{p.note || '-'}</p>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-sm text-gray-500">No payments recorded.</p>
                                    )}
                                </div>
                                <div className="flex justify-between mt-2 font-bold text-sm">
                                    <span>Total Paid:</span>
                                    <span className="text-green-600">Rp {selectedTx.paidAmount.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-sm text-red-600">
                                    <span>Remaining:</span>
                                    <span>Rp {(selectedTx.totalAmount - selectedTx.paidAmount).toLocaleString()}</span>
                                </div>
                            </div>
                        </div>

                        <div className="mt-8 flex justify-end">
                            <button onClick={() => setShowDetailModal(false)} className="px-4 py-2 bg-gray-100 text-gray-700 font-bold rounded-lg hover:bg-gray-200">Close</button>
                        </div>
                    </div>
                </div>
            )}
            {/* QRIS Payment Modal */}
            {qrisModal.isOpen && (
                <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 flex flex-col items-center gap-6 animate-in zoom-in duration-200">
                        <div className="text-center">
                            <h3 className="text-xl font-bold text-gray-900">Pembayaran QRIS</h3>
                            <p className="text-sm text-gray-500 mt-1">Silakan scan kode QR di bawah ini</p>
                        </div>

                        <div className="bg-white p-4 rounded-xl border-2 border-dashed border-gray-100 shadow-inner">
                            <div className="text-center space-y-4">
                                {qrisModal.qrString ? (
                                    <div className="flex flex-col items-center gap-4">
                                        <div className="bg-white p-2 border rounded-lg shadow-sm">
                                            <QRCodeCanvas value={qrisModal.qrString} size={200} level="H" />
                                        </div>
                                        <p className="text-xs text-gray-400 font-bold">SCAN KODE QR INI</p>
                                    </div>
                                ) : qrisModal.paymentUrl ? (
                                    <>
                                        <p className="text-xs text-gray-400">Menunggu pembayaran...</p>
                                        <a
                                            href={qrisModal.paymentUrl}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="block bg-blue-600 text-white py-2 px-4 rounded-lg font-bold hover:bg-blue-700"
                                        >
                                            Buka Halaman Pembayaran
                                        </a>
                                    </>
                                ) : (
                                    <div className="text-center py-4">
                                        <p className="text-sm text-red-500 font-bold mb-2">Gagal Menghasilkan Pembayaran</p>
                                        <p className="text-xs text-gray-500">Silakan tutup modal ini dan coba lagi, atau hubungi admin.</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="w-full space-y-3">
                            <button
                                onClick={() => {
                                    if (pollingInterval.current) clearInterval(pollingInterval.current);
                                    setQrisModal({ isOpen: false });
                                }}
                                className="w-full py-3 text-sm font-medium text-gray-500 hover:text-gray-900 border border-gray-200 rounded-xl"
                            >
                                Tutup
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
