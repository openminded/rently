import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

const API_URL = 'http://localhost:3000/api';

export default function Invoice() {
    const { id } = useParams();
    const [transaction, setTransaction] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isThermal, setIsThermal] = useState(false);

    useEffect(() => {
        const fetchTransaction = async () => {
            try {
                const res = await fetch(`${API_URL}/transactions/${id}`);
                if (res.ok) {
                    const data = await res.json();
                    setTransaction(data);
                } else {
                    const errText = await res.text();
                    console.error("Invoice Fetch Error:", res.status, errText);
                    alert(`Failed to load transaction: ${res.status} ${res.statusText}\n${errText}`);
                }
            } catch (error) {
                console.error("Failed to fetch transaction", error);
            } finally {
                setLoading(false);
            }
        };
        fetchTransaction();
    }, [id]);

    if (loading) return <div>Loading Invoice...</div>;
    if (!transaction) return <div>Transaction not found</div>;

    return (
        <div className="bg-gray-100 min-h-screen p-8 print:p-0 print:bg-white flex flex-col items-center">
            {/* Controls - Hidden in Print */}
            <div className="w-full max-w-3xl mb-6 flex justify-between items-center print:hidden">
                <div className="flex bg-white rounded-lg p-1 shadow-sm">
                    <button
                        onClick={() => setIsThermal(false)}
                        className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${!isThermal ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
                    >
                        A4 Invoice
                    </button>
                    <button
                        onClick={() => setIsThermal(true)}
                        className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${isThermal ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
                    >
                        Thermal (58mm)
                    </button>
                </div>
                <button
                    onClick={() => window.print()}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-700 transition-colors shadow-sm"
                >
                    Print Invoice
                </button>
            </div>

            {/* A4 Invoice Layout */}
            {!isThermal && (
                <div className="bg-white w-[210mm] min-h-[297mm] p-12 shadow-xl print:shadow-none print:w-full">
                    {/* Header */}
                    <div className="flex justify-between items-start mb-10 border-b pb-8">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 mb-2">RUMAH DINAR</h1>
                            <p className="text-gray-500 text-sm">Sewa Baju & Perlengkapan Pesta</p>
                            <p className="text-gray-500 text-sm">Jln. Contoh No. 123, Kota Bandung</p>
                            <p className="text-gray-500 text-sm">WA: 0812-3456-7890</p>
                        </div>
                        <div className="text-right">
                            <h2 className="text-4xl font-black text-gray-100 uppercase mb-2">INVOICE</h2>
                            <p className="font-mono text-gray-600">#{transaction.id.toString().padStart(6, '0')}</p>
                            <p className="text-sm text-gray-500 mt-1">Date: {new Date(transaction.createdAt).toLocaleDateString()}</p>
                        </div>
                    </div>

                    {/* Customer & Details */}
                    <div className="flex justify-between mb-10">
                        <div>
                            <h3 className="text-xs uppercase font-bold text-gray-400 mb-2">Bill To</h3>
                            <p className="font-bold text-lg">{transaction.customer.name}</p>
                            <p className="text-gray-600">{transaction.customer.phone}</p>
                            <p className="text-gray-600 max-w-xs text-sm mt-1">{transaction.customer.address || '-'}</p>
                        </div>
                        <div className="text-right">
                            <h3 className="text-xs uppercase font-bold text-gray-400 mb-2">Rental Detail</h3>
                            <div className="space-y-1 text-sm text-gray-600">
                                <div className="flex justify-end gap-4">
                                    <span>Pickup:</span>
                                    <span className="font-medium text-gray-900">{new Date(transaction.pickupDate).toLocaleDateString()}</span>
                                </div>
                                <div className="flex justify-end gap-4">
                                    <span>Return:</span>
                                    <span className="font-medium text-gray-900">{new Date(transaction.returnPlanDate).toLocaleDateString()}</span>
                                </div>
                                <div className="flex justify-end gap-4 mt-2">
                                    <span>Status:</span>
                                    <span className="font-bold uppercase bg-gray-100 px-2 py-0.5 rounded text-xs">{transaction.status}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Items Table */}
                    <table className="w-full mb-10">
                        <thead>
                            <tr className="border-b-2 border-gray-900">
                                <th className="text-left py-3 font-bold text-sm uppercase">Item Description</th>
                                <th className="text-center py-3 font-bold text-sm uppercase w-24">Variant</th>
                                <th className="text-right py-3 font-bold text-sm uppercase w-32">Price</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm">
                            {transaction.items.map((item: any, idx: number) => (
                                <tr key={idx} className="border-b border-gray-100">
                                    <td className="py-4">
                                        <p className="font-bold text-gray-900">{item.itemInstance.itemVariant.item.name}</p>
                                        <p className="text-xs text-gray-400">SKU: {item.itemInstanceSku}</p>
                                    </td>
                                    <td className="py-4 text-center text-gray-600">
                                        {item.itemInstance.itemVariant.size.name} / {item.itemInstance.itemVariant.color.name}
                                    </td>
                                    <td className="py-4 text-right font-medium">
                                        Rp {item.priceAtRental.toLocaleString()}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot>
                            <tr>
                                <td colSpan={2} className="pt-4 text-right text-gray-500">Subtotal</td>
                                <td className="pt-4 text-right font-bold text-gray-900">Rp {transaction.totalAmount.toLocaleString()}</td>
                            </tr>
                            {/* Simple Logic: Just show Total for now, fines/etc later */}
                            <tr className="text-xl">
                                <td colSpan={2} className="pt-2 text-right font-bold">Total</td>
                                <td className="pt-2 text-right font-bold">Rp {transaction.totalAmount.toLocaleString()}</td>
                            </tr>
                        </tfoot>
                    </table>

                    {/* Payment Info */}
                    <div className="bg-gray-50 p-6 rounded-xl flex justify-between items-center mb-10">
                        <div>
                            <p className="text-xs uppercase font-bold text-gray-400 mb-1">Payment Status</p>
                            <p className={`font-bold ${transaction.paymentStatus === 'PAID' ? 'text-green-600' : 'text-orange-500'}`}>
                                {transaction.paymentStatus}
                            </p>
                            <div className="mt-2">
                                <p className="text-xs uppercase font-bold text-gray-400 mb-1">Payment Method</p>
                                <div className="text-sm font-medium text-gray-900">
                                    {transaction.payments && transaction.payments.length > 0
                                        ? transaction.payments.map((p: any) => p.paymentMethod?.name || '-').join(', ')
                                        : '-'
                                    }
                                </div>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-xs uppercase font-bold text-gray-400 mb-1">Amount Paid</p>
                            <p className="font-mono font-bold text-lg">Rp {transaction.paidAmount.toLocaleString()}</p>
                            {transaction.totalAmount - transaction.paidAmount > 0 ? (
                                <p className="text-xs text-red-500 font-bold mt-1">Due: Rp {(transaction.totalAmount - transaction.paidAmount).toLocaleString()}</p>
                            ) : (
                                transaction.paidAmount - transaction.totalAmount > 0 && (
                                    <p className="text-xs text-green-600 font-bold mt-1">Change: Rp {(transaction.paidAmount - transaction.totalAmount).toLocaleString()}</p>
                                )
                            )}
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="border-t pt-8 text-center text-xs text-gray-400">
                        <p>Thank you for choosing Rumah Dinar.</p>
                        <p className="mt-1">Please return items by the due date to avoid late fees.</p>
                    </div>
                </div>
            )}

            {/* Thermal Layout (58mm) */}
            {isThermal && (
                <div className="bg-white w-[58mm] p-2 shadow-xl print:shadow-none print:w-full font-mono text-[10px] leading-tight">
                    <div className="text-center mb-4 border-b border-dashed border-black pb-2">
                        <h1 className="font-bold text-base mb-1">RUMAH DINAR</h1>
                        <p>Sewa Baju Pesta</p>
                        <p>0812-3456-7890</p>
                        <p className="mt-2 text-[9px]">{new Date(transaction.createdAt).toLocaleString()}</p>
                        <p>#{transaction.id}</p>
                    </div>

                    <div className="mb-2">
                        <p className="font-bold">{transaction.customer.name}</p>
                        <p>{transaction.customer.phone}</p>
                    </div>

                    <div className="border-b border-dashed border-black pb-2 mb-2">
                        {transaction.items.map((item: any, idx: number) => (
                            <div key={idx} className="mb-1">
                                <p className="font-bold truncate">{item.itemInstance.itemVariant.item.name}</p>
                                <div className="flex justify-between">
                                    <span>{item.itemInstance.itemVariant.size.name}/{item.itemInstance.itemVariant.color.name}</span>
                                    <span>{item.priceAtRental.toLocaleString()}</span>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="flex justify-between font-bold mb-1 text-xs">
                        <span>TOTAL</span>
                        <span>{transaction.totalAmount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between mb-1">
                        <span>Paid</span>
                        <span>{transaction.paidAmount.toLocaleString()}</span>
                    </div>
                    {transaction.payments && transaction.payments.length > 0 && (
                        <div className="flex justify-between mb-1">
                            <span>Type</span>
                            <span className="text-right">{transaction.payments.map((p: any) => p.paymentMethod?.name).join(', ')}</span>
                        </div>
                    )}
                    {transaction.totalAmount - transaction.paidAmount > 0 ? (
                        <div className="flex justify-between mb-4">
                            <span>Due</span>
                            <span>{(transaction.totalAmount - transaction.paidAmount).toLocaleString()}</span>
                        </div>
                    ) : (
                        transaction.paidAmount - transaction.totalAmount > 0 && (
                            <div className="flex justify-between mb-4">
                                <span>Change</span>
                                <span>{(transaction.paidAmount - transaction.totalAmount).toLocaleString()}</span>
                            </div>
                        )
                    )}

                    <div className="text-center border-t border-dashed border-black pt-2 mt-4">
                        <p>Pickup: {new Date(transaction.pickupDate).toLocaleDateString()}</p>
                        <p>Return: {new Date(transaction.returnPlanDate).toLocaleDateString()}</p>
                        <p className="mt-2 font-bold">Terima Kasih!</p>
                    </div>
                </div>
            )}
        </div>
    );
}
