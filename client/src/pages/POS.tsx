import React, { useState, useEffect } from 'react';
import { Search, Plus, ShoppingCart, User, Calendar, Trash2 } from 'lucide-react';

import { useAuth } from '../context/AuthContext';

const API_URL = 'http://localhost:3000/api';

export default function POS() {
    const { token } = useAuth();
    const [cart, setCart] = useState<any[]>([]);
    const [customer, setCustomer] = useState<any>(null);
    const [customers, setCustomers] = useState<any[]>([]);
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // States for inputs
    const [searchQuery, setSearchQuery] = useState('');
    const [showCustomerSearch, setShowCustomerSearch] = useState(false);

    // Variant Selection Modal State
    const [selectionModal, setSelectionModal] = useState<{ isOpen: boolean, item: any | null }>({ isOpen: false, item: null });

    // State for Payment Methods
    const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<number | null>(null);

    // Add Customer Modal State
    const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false);
    const [newCustomerForm, setNewCustomerForm] = useState({
        name: '',
        phone: '',
        address: '',
        identityCardNumber: '',
        identityCardImage: null as File | null
    });
    const [isSubmittingCustomer, setIsSubmittingCustomer] = useState(false);

    const handleCustomerSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newCustomerForm.address || !newCustomerForm.identityCardNumber || !newCustomerForm.identityCardImage) {
            return alert("Address, KTP Number, and KTP Image are mandatory.");
        }

        setIsSubmittingCustomer(true);
        try {
            const formData = new FormData();
            formData.append('name', newCustomerForm.name);
            formData.append('phone', newCustomerForm.phone);
            formData.append('address', newCustomerForm.address);
            formData.append('identityCardNumber', newCustomerForm.identityCardNumber);
            formData.append('identityCardImage', newCustomerForm.identityCardImage);

            const res = await fetch(`${API_URL}/masters/customers`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });

            if (res.ok) {
                const newCustomer = await res.json();
                setCustomers([...customers, newCustomer]);
                setCustomer(newCustomer); // Auto select
                setIsAddCustomerOpen(false);
                setNewCustomerForm({ name: '', phone: '', address: '', identityCardNumber: '', identityCardImage: null });
                alert("Customer added successfully!");
            } else {
                const err = await res.json();
                alert(`Failed to add customer: ${err.error || 'Unknown error'}`);
            }
        } catch (error) {
            console.error(error);
            alert("Error adding customer");
        } finally {
            setIsSubmittingCustomer(false);
        }
    };

    useEffect(() => {
        if (!token) return;
        const fetchData = async () => {
            try {
                const headers = { 'Authorization': `Bearer ${token}` };
                const [itemsRes, customersRes, pmRes] = await Promise.all([
                    fetch(`${API_URL}/items`, { headers }),
                    fetch(`${API_URL}/masters/customers`, { headers }),
                    fetch(`${API_URL}/masters/payment-methods`, { headers })
                ]);

                const itemsData = await itemsRes.json();
                const customersData = await customersRes.json();
                const pmData = await pmRes.json();

                setItems(itemsData);
                setCustomers(Array.isArray(customersData) ? customersData : []);
                setPaymentMethods(Array.isArray(pmData) ? pmData : []);

                // Set default payment method if available
                if (Array.isArray(pmData) && pmData.length > 0) {
                    setSelectedPaymentMethod(pmData[0].id);
                }

                setLoading(false);
            } catch (error) {
                console.error("Failed to fetch data", error);
                setLoading(false);
            }
        };
        fetchData();
    }, [token]);

    const handleItemClick = (item: any) => {
        const availableVariants = item.variants?.filter((v: any) => (v._count?.instances || 0) > 0) || [];

        if (availableVariants.length === 0) {
            alert("No stock available for this item.");
            return;
        }

        if (availableVariants.length === 1) {
            // Auto-select if only one
            addVariantToCart(item, availableVariants[0]);
        } else {
            // Open Selection Modal
            setSelectionModal({ isOpen: true, item: item });
        }
    };

    const addVariantToCart = (item: any, variant: any) => {
        // Check if already in cart and if we have enough stock vs cart quantity
        const existing = cart.find(c => c.variantId === variant.id);
        const currentCartQty = existing ? existing.quantity : 0;

        if (currentCartQty + 1 > (variant._count?.instances || 0)) {
            alert(`Only ${variant._count?.instances} available in stock.`);
            return;
        }

        if (existing) {
            setCart(cart.map(c => c.variantId === variant.id ? { ...c, quantity: c.quantity + 1 } : c));
        } else {
            setCart([...cart, {
                id: item.id,
                name: item.name,
                variantId: variant.id,
                price: item.rentalPrice,
                size: variant.size?.name,
                color: variant.color?.name,
                quantity: 1,
                maxStock: variant._count?.instances // Track max for validation
            }]);
        }
        // Close modal if open
        setSelectionModal({ isOpen: false, item: null });
    };



    const removeFromCart = (variantId: number) => {
        setCart(cart.filter(c => c.variantId !== variantId));
    };

    const updateQuantity = (variantId: number, delta: number) => {
        setCart(cart.map(item => {
            if (item.variantId === variantId) {
                const newQty = item.quantity + delta;
                if (newQty < 1) return item; // Don't go below 1, use trash to remove
                if (newQty > item.maxStock) {
                    alert(`Only ${item.maxStock} available in stock.`);
                    return item;
                }
                return { ...item, quantity: newQty };
            }
            return item;
        }));
    };

    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    const [pickupDate, setPickupDate] = useState(new Date().toISOString().split('T')[0]);
    const [returnDate, setReturnDate] = useState(new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]); // Default +3 days

    // New State for Booking/Payment
    const [transactionType, setTransactionType] = useState<'BOOKING' | 'IMMEDIATE'>('BOOKING');
    const [amountPaid, setAmountPaid] = useState<number>(0);
    const remaining = total - amountPaid;

    const handleCheckout = async () => {
        if (!customer) return alert("Select customer first");
        if (cart.length === 0) return alert("Cart is empty");
        if (!selectedPaymentMethod) return alert("Select payment method");

        // Validation
        if (transactionType === 'IMMEDIATE' && amountPaid < total) {
            return alert(`For Direct Pickup, full payment (Rp ${total.toLocaleString()}) is required.`);
        }
        if (transactionType === 'BOOKING' && amountPaid <= 0) {
            return alert("For Booking, a Down Payment (DP) is required.");
        }
        if (amountPaid < 0) return alert("Invalid amount.");

        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/transactions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    type: transactionType,
                    customerId: customer.id,
                    pickupDate: pickupDate,
                    returnPlanDate: returnDate,
                    items: cart.map(c => ({
                        variantId: c.variantId,
                        quantity: c.quantity
                    })),
                    payment: {
                        amount: amountPaid,
                        methodId: selectedPaymentMethod,
                        note: transactionType === 'BOOKING' ? 'Booking DP' : 'Direct Payment'
                    }
                })
            });

            if (res.ok) {
                alert("Transaction successful!");
                setCart([]);
                setCustomer(null);
                setAmountPaid(0);
                // Refresh items to update stock
                const itemsRes = await fetch(`${API_URL}/items`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                setItems(await itemsRes.json());

                // Open Invoice
                const txData = await res.json();
                window.open(`/invoice/${txData.transactionId || txData.id}`, '_blank');
            } else {
                const err = await res.json();
                alert(`Transaction failed: ${err.error}`);
            }
        } catch (e) {
            console.error(e);
            alert("Error processing transaction");
        } finally {
            setLoading(false);
        }
    };

    const filteredItems = items.filter(i => i.name.toLowerCase().includes(searchQuery.toLowerCase()));

    if (loading) return <div className="p-8">Loading POS Data...</div>;

    return (
        <div className="flex h-[calc(100vh-theme(spacing.24))] gap-6">
            {/* Left Panel: Item Selection */}
            <div className="flex-1 flex flex-col gap-4">
                {/* Search Bar */}
                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center gap-3">
                    <Search className="text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search items..."
                        className="flex-1 outline-none text-gray-700 placeholder-gray-400"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                {/* Item Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 overflow-y-auto pr-2 pb-20">
                    {filteredItems.map((item) => (
                        <div key={item.id} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => handleItemClick(item)}>
                            <div className="h-32 bg-gray-100 rounded-lg mb-3 flex items-center justify-center text-gray-400">
                                {/* Placeholder Image */}
                                <span className="text-xs">No Image</span>
                            </div>
                            <h3 className="font-semibold text-gray-900 line-clamp-1">{item.name}</h3>
                            <p className="text-sm text-gray-500">
                                {(item.variants?.reduce((acc: number, v: any) => acc + (v._count?.instances || 0), 0) || 0) > 0
                                    ? `${item.variants.reduce((acc: number, v: any) => acc + (v._count?.instances || 0), 0)} Available`
                                    : 'Out of Stock'}
                            </p>
                            <div className="mt-3 flex items-center justify-between">
                                <span className="font-bold text-gray-900">Rp {item.rentalPrice.toLocaleString()}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Right Panel: Cart & Checkout */}
            <div className="w-96 bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col h-full">
                {/* Customer Section */}
                <div className="p-4 border-b border-gray-100">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-gray-900">Customer</h3>
                        <button
                            onClick={() => setIsAddCustomerOpen(true)}
                            className="text-blue-600 text-sm hover:underline flex items-center gap-1"
                        >
                            <Plus size={14} /> New
                        </button>
                    </div>
                    {customer ? (
                        <div className="bg-blue-50 p-3 rounded-lg flex items-center gap-3">
                            <div className="bg-blue-100 p-2 rounded-full">
                                <User size={16} className="text-blue-600" />
                            </div>
                            <div>
                                <p className="font-medium text-blue-900">{customer.name}</p>
                                <p className="text-xs text-blue-500">{customer.phone}</p>
                            </div>
                            <button
                                onClick={() => setCustomer(null)}
                                className="ml-auto text-gray-400 hover:text-red-500"
                            >
                                ×
                            </button>
                        </div>
                    ) : (
                        <div className="relative">
                            <button
                                onClick={() => setShowCustomerSearch(!showCustomerSearch)}
                                className="w-full py-3 border-2 border-dashed border-gray-200 rounded-lg text-gray-400 hover:border-blue-300 hover:text-blue-500 transition-colors flex items-center justify-center gap-2"
                            >
                                <Search size={16} /> Select Customer
                            </button>
                            {showCustomerSearch && (
                                <div className="absolute top-full left-0 w-full bg-white shadow-xl border border-gray-100 rounded-lg mt-2 p-2 z-10 max-h-60 overflow-y-auto">
                                    {customers.length === 0 && <div className="p-2 text-sm text-gray-400 text-center">No customers found</div>}
                                    {customers.map(c => (
                                        <div key={c.id} className="p-2 hover:bg-gray-50 cursor-pointer rounded" onClick={() => { setCustomer(c); setShowCustomerSearch(false); }}>
                                            <p className="font-medium text-sm">{c.name}</p>
                                            <p className="text-xs text-gray-400">{c.phone}</p>
                                        </div>
                                    ))}

                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Cart Items */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {cart.length === 0 ? (
                        <div className="text-center text-gray-400 py-10 flex flex-col items-center gap-3">
                            <ShoppingCart size={40} className="opacity-20" />
                            <p>Cart is empty</p>
                        </div>
                    ) : (
                        cart.map((item) => (
                            <div key={item.variantId} className="flex gap-3">
                                <div className="w-16 h-16 bg-gray-100 rounded-lg flex-shrink-0" />
                                <div className="flex-1">
                                    <h4 className="font-medium text-gray-900 line-clamp-1">{item.name}</h4>
                                    <p className="text-xs text-gray-500">{item.size} / {item.color}</p>
                                    <div className="flex items-center justify-between mt-2">
                                        <p className="text-sm font-semibold">Rp {(item.price * item.quantity).toLocaleString()}</p>
                                        <div className="flex items-center gap-3">
                                            <div className="flex items-center bg-gray-100 rounded-lg">
                                                <button
                                                    onClick={() => updateQuantity(item.variantId, -1)}
                                                    className="w-6 h-6 flex items-center justify-center text-gray-500 hover:text-gray-900 hover:bg-gray-200 rounded-l-lg transition-colors"
                                                >-</button>
                                                <span className="text-xs font-medium w-6 text-center">{item.quantity}</span>
                                                <button
                                                    onClick={() => updateQuantity(item.variantId, 1)}
                                                    className="w-6 h-6 flex items-center justify-center text-gray-500 hover:text-gray-900 hover:bg-gray-200 rounded-r-lg transition-colors"
                                                >+</button>
                                            </div>
                                            <button onClick={() => removeFromCart(item.variantId)} className="text-red-400 hover:text-red-600 p-1 hover:bg-red-50 rounded">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Date Selection & Transaction Type */}
                <div className="p-4 border-t border-gray-100 bg-gray-50 flex flex-col gap-3">
                    {/* Transaction Type Toggle */}
                    <div className="flex bg-gray-200 p-1 rounded-lg">
                        <button
                            onClick={() => setTransactionType('BOOKING')}
                            className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${transactionType === 'BOOKING' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            Booking (DP)
                        </button>
                        <button
                            onClick={() => setTransactionType('IMMEDIATE')}
                            className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${transactionType === 'IMMEDIATE' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            Direct Pickup
                        </button>
                    </div>

                    <div className="flex items-center gap-2 text-gray-600">
                        <Calendar size={16} />
                        <span className="text-sm font-medium">Rental Period</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-xs text-gray-400 block mb-1">Start Date</label>
                            <input
                                type="date"
                                min={new Date().toISOString().split('T')[0]}
                                value={pickupDate}
                                onChange={(e) => setPickupDate(e.target.value)}
                                className="w-full text-sm p-2 rounded-lg border border-gray-200 outline-none focus:border-blue-500"
                            />
                        </div>
                        <div>
                            <label className="text-xs text-gray-400 block mb-1">End Date</label>
                            <input
                                type="date"
                                min={pickupDate}
                                value={returnDate}
                                onChange={(e) => setReturnDate(e.target.value)}
                                className="w-full text-sm p-2 rounded-lg border border-gray-200 outline-none focus:border-blue-500"
                            />
                        </div>
                    </div>
                </div>

                {/* Summary & Pay */}
                <div className="p-4 border-t border-gray-100 bg-white shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] space-y-3">
                    <div className="flex justify-between items-center">
                        <span className="text-gray-500">Total</span>
                        <span className="text-2xl font-bold text-gray-900">Rp {total.toLocaleString()}</span>
                    </div>

                    {/* Payment Method Selector */}
                    <div>
                        <label className="text-xs text-gray-400 block mb-1">Payment Method</label>
                        <div className="grid grid-cols-2 gap-2">
                            {paymentMethods.map(pm => (
                                <button
                                    key={pm.id}
                                    onClick={() => setSelectedPaymentMethod(pm.id)}
                                    className={`p-2 text-xs font-medium rounded-lg border transition-all ${selectedPaymentMethod === pm.id ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'}`}
                                >
                                    {pm.name}
                                </button>
                            ))}
                            {paymentMethods.length === 0 && <p className="text-xs text-gray-400 col-span-2">No methods found.</p>}
                        </div>
                    </div>

                    {/* Payment Input */}
                    <div>
                        <label className="text-xs text-gray-400 block mb-1">Amount Paid (Rp)</label>
                        <input
                            type="text"
                            value={amountPaid === 0 ? '' : amountPaid.toLocaleString('id-ID')}
                            onChange={(e) => {
                                // Remove non-numeric characters (except for potential future decimal support if needed, but for IDR usually just ints)
                                const numericValue = e.target.value.replace(/\D/g, '');
                                setAmountPaid(numericValue ? parseInt(numericValue) : 0);
                            }}
                            className="w-full p-3 font-mono text-lg font-bold border border-gray-200 rounded-xl focus:border-gray-900 focus:ring-1 focus:ring-gray-900 outline-none"
                            placeholder="0"
                        />
                        <div className="flex justify-between mt-1 text-xs">
                            <span className={remaining < 0 ? 'text-green-600 font-bold' : 'text-red-500 font-bold'}>
                                {remaining < 0 ? 'Change (Kembalian):' : 'Remaining (Sisa):'}
                            </span>
                            <span className={remaining < 0 ? 'text-green-600 font-bold' : 'text-red-500 font-bold'}>
                                Rp {Math.abs(remaining).toLocaleString()}
                            </span>
                        </div>
                    </div>

                    <button
                        onClick={handleCheckout}
                        disabled={cart.length === 0 || !customer || !selectedPaymentMethod}
                        className="w-full bg-gray-900 text-white py-4 rounded-xl font-bold hover:bg-gray-800 transition-colors shadow-lg shadow-gray-200 active:scale-95 duration-100 disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                        {transactionType === 'IMMEDIATE' ? 'Process Payment & Pickup' : 'Process Booking'}
                    </button>
                </div>
            </div>

            {/* Add Customer Modal */}
            {isAddCustomerOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md animate-in fade-in zoom-in duration-200">
                        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-2xl">
                            <h3 className="font-bold text-gray-900">Add New Customer</h3>
                            <button onClick={() => setIsAddCustomerOpen(false)} className="p-1 hover:bg-gray-200 rounded-full">
                                <Trash2 size={16} className="text-gray-400 rotate-45" />
                            </button>
                        </div>
                        <form onSubmit={handleCustomerSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1">Full Name</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full p-2 border border-gray-200 rounded-lg outline-none focus:border-blue-500"
                                    value={newCustomerForm.name}
                                    onChange={e => setNewCustomerForm({ ...newCustomerForm, name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1">Phone Number</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full p-2 border border-gray-200 rounded-lg outline-none focus:border-blue-500"
                                    value={newCustomerForm.phone}
                                    onChange={e => setNewCustomerForm({ ...newCustomerForm, phone: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1">Domicile Address <span className="text-red-500">*</span></label>
                                <textarea
                                    required
                                    className="w-full p-2 border border-gray-200 rounded-lg outline-none focus:border-blue-500"
                                    value={newCustomerForm.address}
                                    onChange={e => setNewCustomerForm({ ...newCustomerForm, address: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1">KTP Number <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    required
                                    className="w-full p-2 border border-gray-200 rounded-lg outline-none focus:border-blue-500"
                                    value={newCustomerForm.identityCardNumber}
                                    onChange={e => setNewCustomerForm({ ...newCustomerForm, identityCardNumber: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1">KTP Image <span className="text-red-500">*</span></label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    required
                                    className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                    onChange={e => {
                                        if (e.target.files && e.target.files[0]) {
                                            setNewCustomerForm({ ...newCustomerForm, identityCardImage: e.target.files[0] });
                                        }
                                    }}
                                />
                            </div>
                            <div className="pt-4 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsAddCustomerOpen(false)}
                                    className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmittingCustomer}
                                    className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:bg-gray-400"
                                >
                                    {isSubmittingCustomer ? 'Saving...' : 'Save Customer'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            {/* Variant Selection Modal */}
            {selectionModal.isOpen && selectionModal.item && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md animate-in fade-in zoom-in duration-200 overflow-hidden">
                        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <div>
                                <h3 className="font-bold text-gray-900">{selectionModal.item.name}</h3>
                                <p className="text-xs text-gray-500">Select a variant to add to cart</p>
                            </div>
                            <button onClick={() => setSelectionModal({ isOpen: false, item: null })} className="p-1 hover:bg-gray-200 rounded-full">
                                <Trash2 size={16} className="text-gray-400 rotate-45" /> {/* Using Trash2 as X close icon */}
                            </button>
                        </div>

                        <div className="p-4 grid grid-cols-1 gap-3 max-h-[60vh] overflow-y-auto">
                            {selectionModal.item.variants?.filter((v: any) => (v._count?.instances || 0) > 0).map((variant: any) => (
                                <button
                                    key={variant.id}
                                    onClick={() => addVariantToCart(selectionModal.item, variant)}
                                    className="flex items-center justify-between p-3 rounded-xl border border-gray-100 hover:border-blue-500 hover:bg-blue-50 transition-all group text-left"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full border shadow-sm flex items-center justify-center" style={{ backgroundColor: variant.color?.hexCode }}>
                                            {!variant.color?.hexCode && <span className="text-[10px]">?</span>}
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-900">{variant.size?.name} - {variant.color?.name}</p>
                                            <p className="text-xs text-gray-500">Rp {selectionModal.item.rentalPrice.toLocaleString()}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-xs font-bold bg-green-100 text-green-700 px-2 py-1 rounded-full">
                                            {variant._count?.instances || 0} left
                                        </span>
                                    </div>
                                </button>
                            ))}
                        </div>

                        <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end">
                            <button
                                onClick={() => setSelectionModal({ isOpen: false, item: null })}
                                className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
