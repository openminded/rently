import React, { useState, useEffect } from 'react';
import { Search, Eye, CheckCircle, Printer, WashingMachine, Wallet } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const API_URL = 'http://localhost:3000/api';

interface TransactionsProps {
    type: 'booking' | 'waiting-pickup' | 'rent' | 'need-return' | 'laundry' | 'completed';
}

export default function Transactions({ type }: TransactionsProps) {
    const [transactions, setTransactions] = useState<any[]>([]);
    const [laundryItems, setLaundryItems] = useState<any[]>([]); // For Laundry Tab
    const [searchQuery, setSearchQuery] = useState('');

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

    // Return State
    const [lateFine, setLateFine] = useState(0);
    const [damageFine, setDamageFine] = useState(0);
    const [damageNote, setDamageNote] = useState('');

    useEffect(() => {
        fetchData();
        fetchPaymentMethods();
        // Reset Modals on type change
        setShowPickupModal(false);
        setShowReturnModal(false);
        setShowDetailModal(false);
    }, [type]);

    const fetchData = async () => {
        try {
            if (type === 'laundry') {
                const res = await fetch(`${API_URL}/laundry`);
                const data = await res.json();
                setLaundryItems(data);
                setTransactions([]); // Clear standard txs
            } else {
                const res = await fetch(`${API_URL}/transactions`);
                const data = await res.json();
                filterTransactions(data);
            }
        } catch (error) {
            console.error("Failed to fetch data", error);
        }
    };

    const fetchPaymentMethods = async () => {
        try {
            const res = await fetch(`${API_URL}/masters/payments`);
            const data = await res.json();
            setPaymentMethods(data);
            if (data.length > 0) setSelectedPaymentMethod(data[0].id.toString());
        } catch (error) {
            console.error("Failed to fetch payment methods", error);
        }
    };

    const filterTransactions = (data: any[]) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        let filtered = data;

        // Logic Mapping
        switch (type) {
            case 'booking':
                // Booking Tab: Only strictly UNPAID bookings.
                // Once they pay ANY amount (DP), they move to Waiting Pickup (Confirmed).
                filtered = data.filter((t: any) => t.status === 'BOOKED' && t.paymentStatus === 'UNPAID');
                break;
            case 'waiting-pickup':
                // Waiting Pickup: Confirmed Bookings (Paid/Partial) OR Ready for Pickup.
                // Show items that are BOOKED but have some payment (Confirmed).
                filtered = data.filter((t: any) => {
                    if (t.status !== 'BOOKED') return false;
                    // Show if PAID or PARTIAL (Confirmed)
                    return t.paymentStatus !== 'UNPAID';
                });
                break;
            case 'rent':
                filtered = data.filter((t: any) => t.status === 'RENTED');
                break;
            case 'need-return':
                // "di range tgl rent tgl terakhir otomatis dia akan muncul di need to return"
                filtered = data.filter((t: any) => {
                    if (t.status !== 'RENTED') return false;
                    const returnDate = new Date(t.returnPlanDate);
                    return returnDate <= today;
                });
                break;
            case 'completed':
                filtered = data.filter((t: any) => ['RETURNED', 'COMPLETED', 'CANCELLED', 'EXPIRED'].includes(t.status));
                break;
        }

        setTransactions(filtered);
    };

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
                headers: { 'Content-Type': 'application/json' },
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
        // Calculate Late Fine?
        // Simple logic: If today > returnPlanDate, fine = 50k per day (Example)
        const today = new Date();
        const plan = new Date(tx.returnPlanDate);
        let calculatedFine = 0;
        if (today > plan) {
            const diffTime = Math.abs(today.getTime() - plan.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            calculatedFine = diffDays * 50000; // Hardcoded example fine
        }
        setLateFine(calculatedFine);
        setDamageFine(0);
        setShowReturnModal(true);
    };

    const confirmReturn = async () => {
        if (!selectedTx) return;
        try {
            const fines = [];
            if (lateFine > 0) fines.push({ amount: lateFine, note: 'Late Return', violationTypeId: 1 }); // Assume ID 1 = Late
            if (damageFine > 0) fines.push({ amount: damageFine, note: damageNote, violationTypeId: 2 }); // Assume ID 2 = Damage

            const res = await fetch(`${API_URL}/transactions/${selectedTx.id}/return`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    returnDate: new Date(),
                    fines: fines
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

    const handleLaundryComplete = async (logIds: number[]) => {
        if (!confirm("Start Laundry / Mark Clean for these items?")) return;
        try {
            const res = await fetch(`${API_URL}/laundry/complete`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
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
                    <WashingMachine /> Laundry Queue
                </h1>
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
                                        {item.itemInstance.itemVariant.item.name}
                                        <span className="text-xs text-gray-500 ml-2">({item.itemInstance.sku})</span>
                                    </td>
                                    <td className="px-6 py-4"><span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-bold">{item.status}</span></td>
                                    <td className="px-6 py-4">{new Date(item.sentDate).toLocaleDateString()}</td>
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
                            {laundryItems.length === 0 && <tr><td colSpan={4} className="px-6 py-8 text-center text-gray-400">No items in laundry.</td></tr>}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    }

    // Standard Transaction Table Render
    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-900 capitalize flex items-center gap-2">
                {type.replace('-', ' ')} <span className="text-sm font-normal text-gray-500 ml-2">({transactions.length})</span>
            </h1>

            {/* Filter/Search Bar */}
            <div className="flex items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <Search className="text-gray-400" />
                <input
                    type="text"
                    placeholder="Search Customer..."
                    className="bg-transparent outline-none w-full"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 text-gray-500 font-medium">
                        <tr>
                            <th className="px-6 py-4">ID</th>
                            <th className="px-6 py-4">Customer</th>
                            <th className="px-6 py-4">Dates</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {transactions.filter(t => t.customer.name.toLowerCase().includes(searchQuery.toLowerCase())).map(t => (
                            <tr key={t.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4">#{t.id}</td>
                                <td className="px-6 py-4 font-medium">{t.customer.name}</td>
                                <td className="px-6 py-4 text-xs">
                                    <div className="flex flex-col gap-1">
                                        <span className="text-green-600">Pick: {new Date(t.pickupDate).toLocaleDateString()}</span>
                                        <span className="text-red-600">Ret: {new Date(t.returnPlanDate).toLocaleDateString()}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${t.paymentStatus === 'PAID' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                                        }`}>
                                        {t.paymentStatus}
                                    </span>
                                    <span className="ml-2 px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">{t.status}</span>
                                </td>
                                <td className="px-6 py-4 text-right space-x-2">
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
                                        <button
                                            onClick={() => handlePickupClick(t)}
                                            className={`px-3 py-1.5 text-white rounded text-xs font-bold ${type === 'booking' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-900 hover:bg-gray-800'}`}
                                        >
                                            {type === 'booking' ? 'Pay DP' : 'Process Pickup'}
                                        </button>
                                    )}

                                    {(type === 'rent' || type === 'need-return') && (
                                        <button
                                            onClick={() => handleReturnClick(t)}
                                            className="px-3 py-1.5 bg-red-600 text-white rounded text-xs font-bold hover:bg-red-700"
                                        >
                                            Process Return
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Pickup Modal */}
            {showPickupModal && selectedTx && (
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
                                            type="number"
                                            value={pickupPayment}
                                            onChange={(e) => setPickupPayment(e.target.value)}
                                            className="w-full border border-gray-300 rounded-lg p-2 font-mono"
                                        />
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
            )}
            {/* Return Modal */}
            {
                showReturnModal && selectedTx && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                        <div className="bg-white p-6 rounded-2xl w-96 shadow-xl">
                            <h2 className="text-xl font-bold mb-4 text-red-600">Process Return #{selectedTx.id}</h2>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1">Late Fine</label>
                                    <input
                                        type="number"
                                        value={lateFine}
                                        onChange={(e) => setLateFine(parseFloat(e.target.value))}
                                        className="w-full border border-gray-300 rounded-lg p-2"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1">Damage Fine</label>
                                    <input
                                        type="number"
                                        value={damageFine}
                                        onChange={(e) => setDamageFine(parseFloat(e.target.value))}
                                        className="w-full border border-gray-300 rounded-lg p-2"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1">Damage Note</label>
                                    <input
                                        type="text"
                                        value={damageNote}
                                        onChange={(e) => setDamageNote(e.target.value)}
                                        className="w-full border border-gray-300 rounded-lg p-2"
                                        placeholder="Description of damage..."
                                    />
                                </div>

                                <div className="p-3 bg-blue-50 text-blue-800 text-xs rounded-lg">
                                    Items will be moved to <b>Laundry Queue</b>.
                                </div>

                                <div className="flex justify-end gap-2 mt-4">
                                    <button onClick={() => setShowReturnModal(false)} className="px-4 py-2 text-gray-500 hover:bg-gray-100 rounded-lg">Cancel</button>
                                    <button onClick={confirmReturn} className="px-4 py-2 bg-red-600 text-white rounded-lg font-bold">Confirm Return</button>
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
