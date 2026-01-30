import { useState, useEffect } from 'react';
import { Eye, CheckCircle, Printer, WashingMachine, Wallet, AlertTriangle } from 'lucide-react';
import { DataTable, type Column } from '../components/common/DataTable';
import { useAuth } from '../context/AuthContext';

const API_URL = 'http://localhost:3000/api';

interface TransactionsProps {
    type: 'booking' | 'waiting-pickup' | 'rent' | 'need-return' | 'laundry' | 'completed';
}

export default function Transactions({ type }: TransactionsProps) {
    const { hasRole, token } = useAuth();
    const [transactions, setTransactions] = useState<any[]>([]);
    const [rawData, setRawData] = useState<any[]>([]);
    const [dateRange, setDateRange] = useState({ start: '', end: '' });
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

    // Old states to remove implicitly by overwriting or ignoring
    // const [lateFine, setLateFine] = useState(0);
    // const [damageFine, setDamageFine] = useState(0);
    // const [damageNote, setDamageNote] = useState('');

    useEffect(() => {
        fetchData();
        fetchPaymentMethods();
        fetchViolationTypes();
        // Reset Modals on type change
        setShowPickupModal(false);
        setShowReturnModal(false);
        setShowDetailModal(false);
        setDateRange({ start: '', end: '' }); // Reset filters on tab change
    }, [type]);

    useEffect(() => {
        if (type === 'laundry') return; // Laundry has its own state

        let filtered = rawData;

        // 1. Filter by Type logic
        switch (type) {
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
        if (dateRange.start) {
            const start = new Date(dateRange.start);
            filtered = filtered.filter((t: any) => new Date(t.createdAt) >= start);
        }
        if (dateRange.end) {
            const end = new Date(dateRange.end); // End of day? usually dates are 00:00
            end.setHours(23, 59, 59, 999);
            filtered = filtered.filter((t: any) => new Date(t.createdAt) <= end);
        }

        setTransactions(filtered);
    }, [rawData, type, dateRange]);

    const fetchData = async () => {
        try {
            if (type === 'laundry') {
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

    useEffect(() => {
        fetchData();
        fetchPaymentMethods();
        fetchViolationTypes();
        // Reset Modals on type change
        setShowPickupModal(false);
        setShowReturnModal(false);
        setShowDetailModal(false);
        setDateRange({ start: '', end: '' }); // Reset filters on tab change
    }, [type]);

    const handlePickupClick = (tx: any) => {
        setSelectedTx(tx);
        const remaining = tx.totalAmount - tx.paidAmount;
        setPickupPayment(remaining > 0 ? remaining.toString() : '0');
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
            const remaining = selectedTx.totalAmount - selectedTx.paidAmount;

            // Start Logic Branching
            // If Booking Tab -> Use /pay endpoint (Confirm Booking/DP)
            // If Waiting Pickup -> Use /pickup endpoint (Finalize)

            const isBookingConfirmation = type === 'booking';
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
                alert("Pickup Successful!");
                setShowPickupModal(false);
                fetchData();
            } else {
                const err = await res.json();
                alert(`Error: ${err.error || err.message}`);
            }
        } catch (error) {
            console.error(error);
            alert("Pickup Failed");
        }
    };

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

            if (totalFines > 0) {
                if (returnPayAmount < totalFines) {
                    if (!confirm(`Payment amount (Rp ${returnPayAmount.toLocaleString()}) is less than total fines (Rp ${totalFines.toLocaleString()}). Continue as partial payment (Debt)?`)) {
                        return; // Cancel
                    }
                }
            }

            // Build itemsStatus - all items go to laundry queue
            const itemsStatus: { [sku: string]: string } = {};
            if (selectedTx.items && selectedTx.items.length > 0) {
                selectedTx.items.forEach((item: any) => {
                    if (item.itemInstanceSku) {
                        itemsStatus[item.itemInstanceSku] = 'IN_LAUNDRY';
                    } else if (item.itemInstance?.sku) {
                        itemsStatus[item.itemInstance.sku] = 'IN_LAUNDRY';
                    }
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
                alert("Returned Successfully! Items moved to Laundry Queue.");
                setShowReturnModal(false);
                fetchData();
            } else {
                const err = await res.json();
                alert(`Error: ${err.error}`);
            }
        } catch (error) {
            console.error(error);
            alert("Return Failed");
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
            if (!confirm("Are you sure you want to invalidate this transaction? Current revenue (payments) will get kept but items will be released.")) return;

            const res = await fetch(`${API_URL}/transactions/${selectedTx.id}/invalid`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ note: invalidNote })
            });

            if (res.ok) {
                alert("Transaction marked as Invalid.");
                setShowInvalidModal(false);
                fetchData();
            } else {
                alert("Failed to invalidate");
            }
        } catch (error) {
            console.error(error);
            alert("Error invalidating transaction");
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

    // --- RENDER HELPERS ---

    // Laundry Table Render
    if (type === 'laundry') {
        return (
            <div className="space-y-6">
                <h1 className="text-2xl font-bold text-purple-700 flex items-center gap-2">
                    <WashingMachine /> Queue in Laundry
                </h1>

                {laundryItems.length === 0 ? (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
                        <WashingMachine className="mx-auto mb-4 text-gray-300" size={64} />
                        <p className="text-gray-500 text-lg mb-2">No items in laundry queue</p>
                        <p className="text-gray-400 text-sm">
                            Items will appear here when they are marked as "IN_LAUNDRY" during the return process.
                        </p>
                    </div>
                ) : (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-purple-50 text-purple-700">
                                <tr>
                                    <th className="px-6 py-4">Item</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4">Sent Date</th>
                                    <th className="px-6 py-4 text-right">Action</th>
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
                                        <td className="px-6 py-4">
                                            {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : '-'}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => handleLaundryComplete([item.id])}
                                                className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-xs font-bold"
                                            >
                                                Mark Clean
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        );
    }

    // Standard Transaction Table Render
    const columns: Column<any>[] = [
        { header: 'ID', accessorKey: 'id', sortable: true, className: 'w-20' },
        {
            header: 'Customer',
            accessorKey: 'customerId',
            sortable: true,
            cell: (t) => t.customer?.name || '-'
        },
        {
            header: 'Dates',
            accessorKey: 'pickupDate',
            sortable: true,
            cell: (t) => (
                <div className="flex flex-col gap-1">
                    <span className="text-green-600 flex items-center gap-1 text-xs">
                        Pick: {new Date(t.pickupDate).toLocaleDateString()}
                        {new Date(t.pickupDate) < new Date(new Date().setHours(0, 0, 0, 0)) && t.status === 'BOOKED' && (
                            <span className="bg-red-100 text-red-600 px-1.5 py-0.5 rounded text-[10px] font-bold border border-red-200">
                                Overdue
                            </span>
                        )}
                    </span>
                    <span className="text-red-600 text-xs">Ret: {new Date(t.returnPlanDate).toLocaleDateString()}</span>
                </div>
            )
        },
        {
            header: 'Status',
            accessorKey: 'status',
            sortable: true,
            cell: (t) => (
                <div>
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${t.paymentStatus === 'PAID' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                        {t.paymentStatus}
                    </span>
                    <span className="ml-2 px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">{t.status}</span>
                </div>
            )
        }
    ];

    const actionColumn = (t: any) => (
        <div className="flex justify-end gap-2">
            <button onClick={() => window.open(`/invoice/${t.id}`, '_blank')} className="p-1.5 text-gray-400 hover:text-black bg-gray-100 rounded">
                <Printer size={16} />
            </button>

            <button
                onClick={() => handleDetailClick(t)}
                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded" title="View Details"
            >
                <Eye size={16} />
            </button>

            {(type === 'booking' || type === 'waiting-pickup') && (
                <>
                    <button
                        onClick={() => handlePickupClick(t)}
                        className={`px-3 py-1.5 text-white rounded text-xs font-bold bg-gray-900 hover:bg-gray-800`}
                    >
                        Process Pickup
                    </button>
                    {hasRole(['SUPERADMIN', 'SUPERVISOR']) && (
                        <button
                            onClick={() => handleInvalidClick(t)}
                            className="px-3 py-1.5 text-red-600 border border-red-200 hover:bg-red-50 rounded text-xs"
                            title="Mark as Invalid"
                        >
                            Invalid
                        </button>
                    )}
                </>
            )}

            {(type === 'rent' || type === 'need-return') && (
                <button
                    onClick={() => handleReturnClick(t)}
                    className="px-3 py-1.5 bg-red-600 text-white rounded text-xs font-bold hover:bg-red-700"
                >
                    Process Return
                </button>
            )}
        </div>
    );

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-900 capitalize flex items-center gap-2">
                {type.replace('-', ' ')} <span className="text-sm font-normal text-gray-500 ml-2">({transactions.length})</span>
            </h1>

            <DataTable
                data={transactions}
                columns={columns}
                searchKeys={['id', 'customer.name', 'status']}
                actions={actionColumn}
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


            {/* Pickup Modal */}
            {
                showPickupModal && selectedTx && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                        <div className="bg-white p-6 rounded-2xl w-96 shadow-xl">
                            <h2 className="text-xl font-bold mb-4">
                                Process Pickup #{selectedTx.id}
                            </h2>

                            <div className="space-y-4">
                                <div className="p-4 bg-gray-50 rounded-lg">
                                    <div className="flex justify-between text-sm">
                                        <span>Total Amount:</span>
                                        <span className="font-bold">Rp {selectedTx.totalAmount.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between text-sm text-green-600">
                                        <span>Already Paid:</span>
                                        <span>- Rp {selectedTx.paidAmount.toLocaleString()}</span>
                                    </div>
                                    <div className="border-t border-gray-200 my-2"></div>
                                    <div className="flex justify-between font-bold text-red-600">
                                        <span>Remaining:</span>
                                        <span>Rp {(selectedTx.totalAmount - selectedTx.paidAmount).toLocaleString()}</span>
                                    </div>
                                </div>

                                {(selectedTx.totalAmount - selectedTx.paidAmount) > 0 ? (
                                    <>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 mb-1">Pay Remaining Amount</label>
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
                                                    Change (Kembalian): Rp {(parseInt(pickupPayment) - (selectedTx.totalAmount - selectedTx.paidAmount)).toLocaleString()}
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 mb-1">Payment Method</label>
                                            <select
                                                value={selectedPaymentMethod}
                                                onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                                                className="w-full border border-gray-300 rounded-lg p-2"
                                            >
                                                {paymentMethods.map(m => (
                                                    <option key={m.id} value={m.id}>{m.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 mb-1">Note (Optional)</label>
                                            <input
                                                type="text"
                                                value={pickupNote}
                                                onChange={(e) => setPickupNote(e.target.value)}
                                                className="w-full border border-gray-300 rounded-lg p-2"
                                                placeholder="Bukti Transfer / Info..."
                                            />
                                        </div>
                                    </>
                                ) : (
                                    <div className="p-3 bg-green-50 text-green-800 text-xs rounded-lg flex items-center gap-2">
                                        <CheckCircle size={16} /> Already Fully Paid. Ready for Pickup.
                                    </div>
                                )}

                                <div className="flex justify-end gap-2 mt-4">
                                    <button onClick={() => setShowPickupModal(false)} className="px-4 py-2 text-gray-500 hover:bg-gray-100 rounded-lg">Cancel</button>
                                    <button onClick={confirmPickup} className="px-4 py-2 text-white rounded-lg font-bold bg-gray-900 hover:bg-gray-800">
                                        Confirm Pickup
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }
            {/* Return Modal */}
            {
                showReturnModal && selectedTx && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                        <div className="bg-white p-6 rounded-2xl w-[500px] shadow-xl max-h-[90vh] overflow-y-auto">
                            <h2 className="text-xl font-bold mb-4 text-red-600">Process Return #{selectedTx.id}</h2>
                            <div className="space-y-4">
                                {/* Violations Section */}
                                <div>
                                    <h3 className="text-sm font-bold text-gray-900 mb-2">Fines & Violations</h3>
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
                                                        <option value={0}>Select Violation</option>
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
                                            + Add Violation
                                        </button>
                                    </div>
                                    {selectedViolations.length > 0 && (
                                        <div className="mt-2 text-right font-bold text-red-700">
                                            Total Fines: Rp {selectedViolations.reduce((sum, v) => sum + (v.amount || 0), 0).toLocaleString()}
                                        </div>
                                    )}
                                </div>

                                <div className="border-t border-gray-100 my-2"></div>

                                {/* Payment Section for Return (Fines) */}
                                {selectedViolations.reduce((sum, v) => sum + (v.amount || 0), 0) > 0 && (
                                    <div className="bg-gray-50 p-3 rounded-lg space-y-3">
                                        <h3 className="text-sm font-bold text-gray-900">Payment for Fines</h3>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 mb-1">Amount Paid (Rp)</label>
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
                                            <label className="block text-xs font-bold text-gray-500 mb-1">Payment Method</label>
                                            <select
                                                value={returnPayMethodId}
                                                onChange={(e) => setReturnPayMethodId(parseInt(e.target.value))}
                                                className="w-full border border-gray-300 rounded-lg p-2 text-sm"
                                            >
                                                {paymentMethods.map(m => (
                                                    <option key={m.id} value={m.id}>{m.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                )}

                                <div className="p-3 bg-blue-50 text-blue-800 text-xs rounded-lg">
                                    Items will be moved to <b>Laundry Queue</b>.
                                </div>

                                <div className="flex justify-end gap-2 mt-4">
                                    <button onClick={() => setShowReturnModal(false)} className="px-4 py-2 text-gray-500 hover:bg-gray-100 rounded-lg">Cancel</button>
                                    <button onClick={confirmReturn} className="px-4 py-2 bg-red-600 text-white rounded-lg font-bold">
                                        Confirm Return & Pay
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Invalid Modal */}
            {
                showInvalidModal && selectedTx && (
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
                )
            }

            {/* View Detail Modal */}
            {
                showDetailModal && selectedTx && (
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
                )
            }
        </div >
    );
}
