import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Search, Plus, ShoppingCart, User, Calendar, Trash2 } from 'lucide-react';

import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

const API_URL = 'http://localhost:3000/api';

export default function POS() {
    const { token } = useAuth();
    const { t } = useLanguage();
    const [cart, setCart] = useState<any[]>([]);
    const [customer, setCustomer] = useState<any>(null);
    const [customers, setCustomers] = useState<any[]>([]);
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isFetchingMore, setIsFetchingMore] = useState(false);

    // Pagination States
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const observer = useRef<IntersectionObserver | null>(null);
    const lastItemRef = useCallback((node: HTMLDivElement) => {
        if (loading || isFetchingMore) return;
        if (observer.current) observer.current.disconnect();
        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasMore) {
                setPage(prevPage => prevPage + 1);
            }
        });
        if (node) observer.current.observe(node);
    }, [loading, isFetchingMore, hasMore]);

    // States for inputs
    const [searchQuery, setSearchQuery] = useState('');
    const [showCustomerSearch, setShowCustomerSearch] = useState(false);
    const [customerSearchTerm, setCustomerSearchTerm] = useState('');

    // Variant Selection Modal State
    const [selectionModal, setSelectionModal] = useState<{ isOpen: boolean, item: any | null }>({ isOpen: false, item: null });

    // State for Payment Methods & Deposits
    const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<number | null>(null);
    const [depositVariants, setDepositVariants] = useState<any[]>([]);
    const [selectedDepositId, setSelectedDepositId] = useState<number | null>(null);
    const [settings, setSettings] = useState<any>({});

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
            return alert(t('pos.addCustomer.mandatory'));
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
                alert(t('pos.addCustomer.success'));
            } else {
                const err = await res.json();
                alert(`${t('pos.addCustomer.error')}: ${err.error || 'Unknown error'}`);
            }
        } catch (error) {
            console.error(error);
            alert(t('pos.addCustomer.error'));
        } finally {
            setIsSubmittingCustomer(false);
        }
    };

    // Initial load for masters
    useEffect(() => {
        if (!token) return;
        const fetchMasters = async () => {
            try {
                const headers = { 'Authorization': `Bearer ${token}` };
                const responses = await Promise.all([
                    fetch(`${API_URL}/masters/customers`, { headers }),
                    fetch(`${API_URL}/masters/payment-methods`, { headers }),
                    fetch(`${API_URL}/masters/deposit-variants`, { headers }),
                    fetch(`${API_URL}/settings`, { headers })
                ]);

                const [customersRes, pmRes, depRes, settingsRes] = responses;

                const parseRes = async (res: Response, name: string) => {
                    if (!res.ok) {
                        console.error(`Failed to fetch ${name}:`, res.status, res.statusText);
                        return [];
                    }
                    try {
                        return await res.json();
                    } catch (e) {
                        console.error(`Error parsing JSON for ${name}:`, e);
                        return [];
                    }
                };

                const customersData = await parseRes(customersRes, 'customers');
                const pmData = await parseRes(pmRes, 'paymentMethods');
                const depData = await parseRes(depRes, 'deposits');
                const settingsData = await parseRes(settingsRes, 'settings');

                setCustomers(Array.isArray(customersData) ? customersData : []);
                setPaymentMethods(Array.isArray(pmData) ? pmData : []);
                setDepositVariants(Array.isArray(depData) ? depData : []);
                // Settings returns an object, not array
                setSettings(Array.isArray(settingsData) ? {} : (settingsData || {}));

                if (Array.isArray(pmData) && pmData.length > 0) {
                    setSelectedPaymentMethod(pmData[0].id);
                }
            } catch (error) {
                console.error("Failed to fetch masters", error);
            }
        };
        fetchMasters();
    }, [token]);

    // Fetch Items with Pagination & Search
    const fetchItems = useCallback(async (currentPage: number, search: string) => {
        if (!token) return;
        if (currentPage === 1) setLoading(true);
        else setIsFetchingMore(true);

        try {
            const res = await fetch(`${API_URL}/items?page=${currentPage}&limit=20&search=${search}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();

            if (currentPage === 1) {
                setItems(data.items);
            } else {
                setItems(prev => [...prev, ...data.items]);
            }
            setHasMore(data.hasMore);
        } catch (error) {
            console.error("Failed to fetch items", error);
        } finally {
            setLoading(false);
            setIsFetchingMore(false);
        }
    }, [token]);

    // Handle Search Changes (Reset Pagination)
    useEffect(() => {
        setPage(1);
        setHasMore(true);
        const timer = setTimeout(() => {
            fetchItems(1, searchQuery);
        }, 500); // 500ms debounce
        return () => clearTimeout(timer);
    }, [searchQuery, fetchItems]);

    // Handle Page Changes
    useEffect(() => {
        if (page > 1) {
            fetchItems(page, searchQuery);
        }
    }, [page, fetchItems]); // SearchQuery is already handled by the search effect

    const handleItemClick = (item: any) => {
        const availableVariants = item.variants?.filter((v: any) => (v._count?.instances || 0) > 0) || [];

        if (availableVariants.length === 0) {
            alert(t('pos.alert.noStock'));
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
            alert(t('pos.alert.stockLimit', { count: variant._count?.instances }));
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
                maxStock: variant._count?.instances, // Track max for validation
                imageUrl: item.images?.[0]?.url
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
                    alert(t('pos.alert.stockLimit', { count: item.maxStock }));
                    return item;
                }
                return { ...item, quantity: newQty };
            }
            return item;
        }));
    };

    const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

    // Admin Fee Calculation
    let adminFee = 0;
    const feeMode = settings.ADMIN_FEE_MODE || 'DISABLED';

    if (feeMode === 'PER_ITEM') {
        adminFee = itemCount * 1000;
    } else if (feeMode === 'PER_TRANSACTION') {
        adminFee = 1000; // Flat fee
    }
    // else DISABLED -> 0

    const selectedDeposit = depositVariants.find(d => d.id === selectedDepositId);
    const depositAmount = selectedDeposit ? selectedDeposit.amount : 0;
    const [pickupDate, setPickupDate] = useState(new Date().toISOString().split('T')[0]);
    const [returnDate, setReturnDate] = useState(new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]); // Default +3 days

    // New State for Booking/Payment
    const [transactionType, setTransactionType] = useState<'BOOKING' | 'IMMEDIATE'>('BOOKING');
    const [amountPaid, setAmountPaid] = useState<number>(0);

    // Tax Calculation
    const [applyTax, setApplyTax] = useState(false);
    const taxRate = parseFloat(settings.TAX_RATE_DEFAULT || '0');
    const taxAmount = applyTax ? Math.round((cartTotal * taxRate) / 100) : 0;

    // Final Total Calculation (Items + Deposit + Admin + Tax)
    const total = cartTotal + depositAmount + adminFee + taxAmount;
    const remaining = total - amountPaid;

    const handleCheckout = async () => {
        if (!customer) return alert(t('pos.alert.selectCustomer'));
        if (cart.length === 0) return alert(t('pos.alert.cartEmpty'));
        if (!selectedPaymentMethod) return alert(t('pos.alert.selectPayment'));

        // Validation
        if (transactionType === 'IMMEDIATE' && amountPaid < total) {
            return alert(t('pos.alert.fullPayment', { amount: `Rp ${total.toLocaleString()}` }));
        }
        if (transactionType === 'BOOKING' && amountPaid <= 0) {
            return alert(t('pos.alert.dpRequired'));
        }
        if (amountPaid < 0) return alert(t('pos.alert.invalidAmount'));

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
                    depositAmount: depositAmount,
                    adminFee: adminFee,
                    taxRate: applyTax ? taxRate : 0,
                    taxAmount: taxAmount,
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
                alert(t('pos.alert.success'));
                setCart([]);
                setCustomer(null);
                setAmountPaid(0);
                // Refresh items to update stock
                const itemsRes = await fetch(`${API_URL}/items?page=1&limit=20&search=${searchQuery}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const itemsData = await itemsRes.json();
                setItems(itemsData.items);
                setHasMore(itemsData.hasMore);
                setPage(1);

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


    if (loading) return <div className="p-8">{t('common.loading')}</div>;

    return (
        <div className="flex h-[calc(100vh-theme(spacing.24))] gap-6">
            {/* Left Panel: Item Selection */}
            <div className="flex-1 flex flex-col gap-4">
                {/* Search Bar */}
                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center gap-3">
                    <Search className="text-gray-400" />
                    <input
                        type="text"
                        placeholder={t('pos.searchPlaceholder')}
                        className="flex-1 outline-none text-gray-700 placeholder-gray-400"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                {/* Item Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 overflow-y-auto pr-2 pb-20">
                    {items.map((item, index) => (
                        <div
                            key={item.id}
                            ref={index === items.length - 1 ? lastItemRef : null}
                            className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                            onClick={() => handleItemClick(item)}
                        >
                            <div className="h-32 bg-gray-100 rounded-lg mb-3 flex items-center justify-center text-gray-400 overflow-hidden">
                                {item.images && item.images.length > 0 ? (
                                    <img
                                        src={`http://localhost:3000${item.images[0].url}`}
                                        alt={item.name}
                                        loading="lazy"
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <span className="text-xs">{t('pos.noImage')}</span>
                                )}
                            </div>
                            <h3 className="font-semibold text-gray-900 line-clamp-1">{item.name}</h3>
                            <p className="text-sm text-gray-500">
                                {(item.variants?.reduce((acc: number, v: any) => acc + (v._count?.instances || 0), 0) || 0) > 0
                                    ? `${item.variants.reduce((acc: number, v: any) => acc + (v._count?.instances || 0), 0)} ${t('pos.available')}`
                                    : t('pos.outOfStock')}
                            </p>
                            <div className="mt-3 flex items-center justify-between">
                                <span className="font-bold text-gray-900">Rp {item.rentalPrice.toLocaleString()}</span>
                            </div>
                        </div>
                    ))}
                    {isFetchingMore && (
                        <div className="col-span-full py-4 text-center text-gray-500 text-sm">
                            {t('common.loadingMore')}...
                        </div>
                    )}
                </div>
            </div>

            {/* Right Panel: Cart & Checkout */}
            <div className="w-96 bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col h-full">
                {/* Customer Section */}
                <div className="p-3 border-b border-gray-100">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-gray-900">{t('pos.customer.title')}</h3>
                        <button
                            onClick={() => setIsAddCustomerOpen(true)}
                            className="text-blue-600 text-sm hover:underline flex items-center gap-1"
                        >
                            <Plus size={14} /> {t('pos.customer.new')}
                        </button>
                    </div>
                    {customer ? (
                        <div className="bg-blue-50 p-2 rounded-lg flex items-center gap-3">
                            <div className="bg-blue-100 p-1.5 rounded-full">
                                <User size={14} className="text-blue-600" />
                            </div>
                            <div>
                                <p className="font-medium text-blue-900 text-sm">{customer.name}</p>
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
                                className="w-full py-2 border-2 border-dashed border-gray-200 rounded-lg text-gray-400 hover:border-blue-300 hover:text-blue-500 transition-colors flex items-center justify-center gap-2 text-sm"
                            >
                                <Search size={14} /> {t('pos.customer.select')}
                            </button>
                            {showCustomerSearch && (
                                <div className="absolute top-full left-0 w-full bg-white shadow-xl border border-gray-100 rounded-lg mt-2 p-2 z-10">
                                    <div className="mb-2 p-2 bg-gray-50 rounded-lg flex items-center gap-2 border border-gray-100">
                                        <Search size={14} className="text-gray-400" />
                                        <input
                                            autoFocus
                                            type="text"
                                            placeholder={t('pos.customer.search')}
                                            className="bg-transparent outline-none text-sm w-full"
                                            onChange={(e) => setCustomerSearchTerm(e.target.value)}
                                        />
                                    </div>
                                    <div className="max-h-60 overflow-y-auto">
                                        {customers.filter(c => c.name.toLowerCase().includes(customerSearchTerm.toLowerCase())).length === 0 && <div className="p-2 text-sm text-gray-400 text-center">{t('pos.customer.notFound')}</div>}
                                        {customers.filter(c => c.name.toLowerCase().includes(customerSearchTerm.toLowerCase())).map(c => (
                                            <div key={c.id} className="p-2 hover:bg-gray-50 cursor-pointer rounded" onClick={() => { setCustomer(c); setShowCustomerSearch(false); }}>
                                                <p className="font-medium text-sm">{c.name}</p>
                                                <p className="text-xs text-gray-400">{c.phone}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Cart Items */}
                <div className="flex-1 overflow-y-auto p-2 bg-gray-50/50 min-h-[150px]">
                    {cart.length === 0 ? (
                        <div className="text-center text-gray-400 py-10 flex flex-col items-center gap-3">
                            <ShoppingCart size={40} className="opacity-20" />
                            <p className="text-sm">{t('pos.cart.empty')}</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {cart.map((item) => (
                                <div key={item.variantId} className="bg-white p-2 rounded-xl border border-gray-100 shadow-sm flex gap-3 group">
                                    <div className="w-12 h-12 bg-gray-100 rounded-lg flex-shrink-0 overflow-hidden">
                                        {item.imageUrl ? (
                                            <img
                                                src={`http://localhost:3000${item.imageUrl}`}
                                                alt={item.name}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                                                <ShoppingCart size={14} />
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                                        <div className="flex justify-between items-start">
                                            <h4 className="font-medium text-gray-900 text-sm line-clamp-1" title={item.name}>{item.name}</h4>
                                            <button
                                                onClick={() => removeFromCart(item.variantId)}
                                                className="text-gray-300 hover:text-red-500 transition-colors"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>

                                        <div className="flex items-center justify-between mt-1">
                                            <p className="text-xs text-gray-500">{item.size} / {item.color}</p>

                                            <div className="flex items-center gap-3">
                                                <p className="text-xs font-semibold text-gray-900">Rp {(item.price * item.quantity).toLocaleString()}</p>
                                                <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5">
                                                    <button
                                                        onClick={() => updateQuantity(item.variantId, -1)}
                                                        className="w-5 h-5 flex items-center justify-center text-gray-500 hover:text-gray-900 hover:bg-white rounded-md transition-all text-xs font-bold"
                                                    >-</button>
                                                    <span className="text-xs font-medium w-4 text-center">{item.quantity}</span>
                                                    <button
                                                        onClick={() => updateQuantity(item.variantId, 1)}
                                                        className="w-5 h-5 flex items-center justify-center text-gray-500 hover:text-gray-900 hover:bg-white rounded-md transition-all text-xs font-bold"
                                                    >+</button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Date Selection & Transaction Type */}
                <div className="p-3 border-t border-gray-100 bg-gray-50 flex flex-col gap-2">
                    {/* Transaction Type Toggle */}
                    <div className="flex bg-gray-200 p-0.5 rounded-lg">
                        <button
                            onClick={() => setTransactionType('BOOKING')}
                            className={`flex-1 py-1 text-xs font-medium rounded-md transition-all ${transactionType === 'BOOKING' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            {t('pos.transactionType.booking')}
                        </button>
                        <button
                            onClick={() => setTransactionType('IMMEDIATE')}
                            className={`flex-1 py-1 text-xs font-medium rounded-md transition-all ${transactionType === 'IMMEDIATE' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            {t('pos.transactionType.immediate')}
                        </button>
                    </div>

                    <div className="flex items-center gap-2 text-gray-600">
                        <Calendar size={14} />
                        <span className="text-xs font-medium">{t('pos.rentalPeriod')}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <input
                                type="date"
                                min={new Date().toISOString().split('T')[0]}
                                value={pickupDate}
                                onChange={(e) => setPickupDate(e.target.value)}
                                className="w-full text-xs p-1.5 rounded-lg border border-gray-200 outline-none focus:border-blue-500"
                            />
                        </div>
                        <div>
                            <input
                                type="date"
                                min={pickupDate}
                                value={returnDate}
                                onChange={(e) => setReturnDate(e.target.value)}
                                className="w-full text-xs p-1.5 rounded-lg border border-gray-200 outline-none focus:border-blue-500"
                            />
                        </div>
                    </div>
                </div>

                {/* Summary & Pay */}
                <div className="p-3 border-t border-gray-100 bg-white shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] space-y-2">

                    {/* Deposit Selector */}
                    <div>
                        <select
                            className="w-full p-1.5 text-xs border border-gray-200 rounded-lg outline-none focus:border-blue-500 bg-white"
                            value={selectedDepositId || ''}
                            onChange={(e) => setSelectedDepositId(e.target.value ? parseInt(e.target.value) : null)}
                        >
                            <option value="">{t('pos.deposit.none')}</option>
                            {depositVariants.map(dv => (
                                <option key={dv.id} value={dv.id}>
                                    {dv.name} - Rp {dv.amount.toLocaleString()}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-0.5">
                        <div className="flex justify-between items-center text-xs text-gray-500">
                            <span>Subtotal</span>
                            <span>Rp {cartTotal.toLocaleString()}</span>
                        </div>
                        {adminFee > 0 && (
                            <div className="flex justify-between items-center text-xs text-blue-600 font-medium">
                                <span>{t('invoice.adminFee')}</span>
                                <span>+ Rp {adminFee.toLocaleString()}</span>
                            </div>
                        )}
                        {depositAmount > 0 && (
                            <div className="flex justify-between items-center text-xs text-gray-500">
                                <span>Deposit</span>
                                <span>+ Rp {depositAmount.toLocaleString()}</span>
                            </div>
                        )}
                        {/* Tax Toggle UI - INSERTED CORRECTLY */}
                        {taxRate > 0 && (
                            <div className="flex justify-between items-center py-1 mt-1 border-t border-gray-100 bg-green-50 px-2 rounded -mx-2">
                                <div className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        id="applyTax"
                                        checked={applyTax}
                                        onChange={(e) => setApplyTax(e.target.checked)}
                                        className="w-4 h-4 text-green-600 rounded focus:ring-green-500 border-gray-300"
                                    />
                                    <label htmlFor="applyTax" className="text-xs font-bold text-green-700 cursor-pointer select-none">
                                        PPN {taxRate}%
                                    </label>
                                </div>
                                <span className="text-xs font-bold text-green-700">+ Rp {taxAmount.toLocaleString()}</span>
                            </div>
                        )}
                        <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                            <div>
                                <span className="text-gray-500 block text-xs">{t('pos.total')}</span>
                                <span className="text-2xl font-bold text-gray-900">Rp {total.toLocaleString()}</span>
                            </div>
                        </div>
                    </div>

                    {/* Payment Method Selector */}
                    <div>
                        <label className="text-xs text-gray-400 block mb-1">{t('pos.paymentMethod')}</label>
                        <select
                            className="w-full p-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-blue-500 bg-white"
                            value={selectedPaymentMethod || ''}
                            onChange={(e) => setSelectedPaymentMethod(e.target.value ? parseInt(e.target.value) : null)}
                        >
                            {/* If no method selected initially, show placeholder */}
                            <option value="" disabled>{t('pos.alert.selectPayment')}</option>
                            {paymentMethods.map(pm => (
                                <option key={pm.id} value={pm.id}>
                                    {pm.name}
                                </option>
                            ))}
                        </select>
                        {paymentMethods.length === 0 && <p className="text-xs text-gray-400 col-span-2">{t('pos.paymentMethod.notFound')}</p>}
                    </div>

                    {/* Payment Input */}
                    <div>
                        <label className="text-xs text-gray-400 block mb-1">{t('pos.amountPaid')}</label>
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
                                {remaining < 0 ? t('pos.change') : t('pos.remaining')}
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
                        {transactionType === 'IMMEDIATE' ? t('pos.process.immediate') : t('pos.process.booking')}
                    </button>
                </div>
            </div>

            {/* Add Customer Modal */}
            {isAddCustomerOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md animate-in fade-in zoom-in duration-200">
                        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-2xl">
                            <h3 className="font-bold text-gray-900">{t('pos.addCustomer.title')}</h3>
                            <button onClick={() => setIsAddCustomerOpen(false)} className="p-1 hover:bg-gray-200 rounded-full">
                                <Trash2 size={16} className="text-gray-400 rotate-45" />
                            </button>
                        </div>
                        <form onSubmit={handleCustomerSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1">{t('common.name')}</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full p-2 border border-gray-200 rounded-lg outline-none focus:border-blue-500"
                                    value={newCustomerForm.name}
                                    onChange={e => setNewCustomerForm({ ...newCustomerForm, name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1">{t('common.phone')}</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full p-2 border border-gray-200 rounded-lg outline-none focus:border-blue-500"
                                    value={newCustomerForm.phone}
                                    onChange={e => setNewCustomerForm({ ...newCustomerForm, phone: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1">{t('master.customers.address')} <span className="text-red-500">*</span></label>
                                <textarea
                                    required
                                    className="w-full p-2 border border-gray-200 rounded-lg outline-none focus:border-blue-500"
                                    value={newCustomerForm.address}
                                    onChange={e => setNewCustomerForm({ ...newCustomerForm, address: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1">{t('master.customers.idCard')} <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    required
                                    className="w-full p-2 border border-gray-200 rounded-lg outline-none focus:border-blue-500"
                                    value={newCustomerForm.identityCardNumber}
                                    onChange={e => setNewCustomerForm({ ...newCustomerForm, identityCardNumber: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1">{t('common.actions')} <span className="text-red-500">*</span></label>
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
                                    {t('common.cancel')}
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmittingCustomer}
                                    className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:bg-gray-400"
                                >
                                    {isSubmittingCustomer ? t('common.loading') : t('common.save')}
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
                                <p className="text-xs text-gray-500">{t('pos.variant.selectSubtitle')}</p>
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
                                            {variant._count?.instances || 0} {t('pos.variant.left')}
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
                                {t('common.cancel')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
