import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

import { API_BASE_URL } from '../config/api';

const API_URL = API_BASE_URL;

export default function Invoice() {
    const { token, user } = useAuth();
    const { t } = useLanguage();
    const { id } = useParams();
    const [transaction, setTransaction] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isThermal, setIsThermal] = useState(false);

    const [settings, setSettings] = useState<any>({});

    useEffect(() => {
        if (!token) return;
        const fetchTransaction = async () => {
            try {
                const res = await fetch(`${API_URL}/transactions/${id}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
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

        const fetchSettings = async () => {
            try {
                const res = await fetch(`${API_URL}/settings`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setSettings(data);
                }
            } catch (error) {
                console.error("Failed to fetch settings", error);
            }
        };

        fetchTransaction();
        fetchSettings();
    }, [id, token]);

    if (loading) return <div className="p-8 text-center">{t('common.loading')}</div>;
    if (!transaction) return <div className="p-8 text-center">{t('common.noData')}</div>;

    const itemsSubtotal = transaction.items.reduce((s: number, i: any) => s + i.priceAtRental, 0);
    const finesSubtotal = transaction.fines?.reduce((s: number, f: any) => s + f.amount, 0) || 0;
    const expectedTotal = itemsSubtotal + transaction.adminFee + transaction.taxAmount + finesSubtotal;
    const discountAmount = Math.max(0, Math.round(expectedTotal - transaction.totalAmount));

    return (
        <div className="bg-gray-100 min-h-screen p-8 print:p-0 print:bg-white flex flex-col items-center">
            {/* Controls - Hidden in Print */}
            <div className="w-full max-w-3xl mb-6 flex justify-between items-center print:hidden">
                <div className="flex bg-white rounded-lg p-1 shadow-sm">
                    <button
                        onClick={() => setIsThermal(false)}
                        className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${!isThermal ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
                    >
                        {t('invoice.button.a4')}
                    </button>
                    <button
                        onClick={() => setIsThermal(true)}
                        className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${isThermal ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
                    >
                        {t('invoice.button.thermal')}
                    </button>
                </div>
                <button
                    onClick={() => window.print()}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-700 transition-colors shadow-sm"
                >
                    {t('invoice.button.print')}
                </button>
            </div>

            {/* A4 Invoice Layout */}
            {!isThermal && (
                <div className="bg-white w-[210mm] min-h-[297mm] p-12 shadow-xl print:shadow-none print:w-full">
                    {/* Header */}
                    <div className="flex justify-between items-start mb-10 border-b pb-8">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 mb-2">{settings.BRAND_NAME || 'WERENTLY'}</h1>
                            <p className="text-gray-500 text-sm">{settings.BRAND_TAGLINE || 'Sewa Baju & Perlengkapan Pesta'}</p>
                            <p className="text-gray-500 text-sm whitespace-pre-line">{settings.BRAND_ADDRESS || 'Jln. Contoh No. 123, Kota Bandung'}</p>
                            <p className="text-gray-500 text-sm">WA: {settings.BRAND_WA || '0812-3456-7890'}</p>
                        </div>
                        <div className="text-right">
                            <h2 className="text-4xl font-black text-gray-100 uppercase mb-2">{t('invoice.title')}</h2>
                            <p className="font-mono text-gray-600">#{transaction.id.toString().padStart(6, '0')}</p>
                            <p className="text-sm text-gray-500 mt-1">{t('invoice.date')}: {new Date(transaction.createdAt).toLocaleDateString()}</p>
                            <p className="text-xs text-gray-400 mt-1">{t('invoice.printedBy')}: {user?.name || '-'}</p>
                        </div>
                    </div>

                    {/* Customer & Details */}
                    <div className="flex justify-between mb-10">
                        <div>
                            <h3 className="text-xs uppercase font-bold text-gray-400 mb-2">{t('invoice.billTo')}</h3>
                            <p className="font-bold text-lg">{transaction.customer.name}</p>
                            <p className="text-gray-600">{transaction.customer.phone}</p>
                            <p className="text-gray-600 max-w-xs text-sm mt-1">{transaction.customer.address || '-'}</p>
                            <div className="mt-4 text-xs text-gray-500">
                                <p>{t('invoice.bookedBy')}: {transaction.user?.name || '-'}</p>
                                {transaction.pickedUpBy && <p>{t('invoice.servedByPickup')}: {transaction.pickedUpBy.name}</p>}
                                {transaction.returnedBy && <p>{t('invoice.servedByReturn')}: {transaction.returnedBy.name}</p>}
                            </div>
                        </div>
                        <div className="text-right">
                            <h3 className="text-xs uppercase font-bold text-gray-400 mb-2">{t('invoice.rentalDetail')}</h3>
                            <div className="space-y-1 text-sm text-gray-600">
                                <div className="flex justify-end gap-4">
                                    <span>{t('invoice.pickup')}:</span>
                                    <span className="font-medium text-gray-900">{new Date(transaction.pickupDate).toLocaleDateString()}</span>
                                </div>
                                <div className="flex justify-end gap-4">
                                    <span>{t('invoice.return')}:</span>
                                    <span className="font-medium text-gray-900">{new Date(transaction.returnPlanDate).toLocaleDateString()}</span>
                                </div>
                                <div className="flex justify-end gap-4 mt-2">
                                    <span>{t('invoice.status')}:</span>
                                    <span className="font-bold uppercase bg-gray-100 px-2 py-0.5 rounded text-xs">{transaction.status}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* SECTION 1: RENTAL & ITEMS */}
                    <div className="mb-8">
                        <h3 className="text-lg font-bold text-gray-900 border-b border-gray-200 pb-2 mb-4">{t('invoice.section.rental')}</h3>
                        <table className="w-full mb-4">
                            <thead>
                                <tr className="border-b border-gray-900">
                                    <th className="text-left py-2 font-bold text-sm uppercase">{t('invoice.table.item')}</th>
                                    <th className="text-center py-2 font-bold text-sm uppercase w-24">{t('invoice.table.variant')}</th>
                                    <th className="text-right py-2 font-bold text-sm uppercase w-32">{t('invoice.table.price')}</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm">
                                {transaction.items.map((item: any, idx: number) => (
                                    <tr key={idx} className="border-b border-gray-100">
                                        <td className="py-2">
                                            <p className="font-bold text-gray-900">{item.itemInstance.itemVariant.item.name}</p>
                                            <p className="text-xs text-gray-400">SKU: {item.itemInstanceSku}</p>
                                        </td>
                                        <td className="py-2 text-center text-gray-600">
                                            {item.itemInstance.itemVariant.size.name} / {item.itemInstance.itemVariant.color.name}
                                        </td>
                                        <td className="py-2 text-right font-medium">
                                            Rp {item.priceAtRental.toLocaleString()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot>
                                <tr>
                                    <td colSpan={2} className="pt-2 text-right text-sm text-gray-500 font-bold">{t('invoice.subtotal.rental')}</td>
                                    <td className="pt-2 text-right font-bold text-gray-900">
                                        Rp {transaction.items.reduce((s: number, i: any) => s + i.priceAtRental, 0).toLocaleString()}
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>

                    {/* SECTION 2: RETURNS & FINES (If Any) */}
                    {(transaction.fines && transaction.fines.length > 0) && (
                        <div className="mb-8">
                            <h3 className="text-lg font-bold text-red-700 border-b border-red-200 pb-2 mb-4">{t('invoice.section.fines')}</h3>
                            <table className="w-full mb-4">
                                <thead>
                                    <tr className="border-b border-red-900 text-red-700">
                                        <th className="text-left py-2 font-bold text-sm uppercase">{t('invoice.table.violation')}</th>
                                        <th className="text-left py-2 font-bold text-sm uppercase">{t('invoice.table.note')}</th>
                                        <th className="text-right py-2 font-bold text-sm uppercase w-32">{t('invoice.table.amount')}</th>
                                    </tr>
                                </thead>
                                <tbody className="text-sm">
                                    {transaction.fines.map((fine: any, idx: number) => (
                                        <tr key={idx} className="border-b border-red-50">
                                            <td className="py-2 font-bold text-gray-900">{fine.violationType.name}</td>
                                            <td className="py-2 text-gray-600 italic">{fine.note || '-'}</td>
                                            <td className="py-2 text-right font-medium text-red-600">
                                                Rp {fine.amount.toLocaleString()}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot>
                                    <tr>
                                        <td colSpan={2} className="pt-2 text-right text-sm text-red-500 font-bold">{t('invoice.subtotal.fines')}</td>
                                        <td className="pt-2 text-right font-bold text-red-700">
                                            Rp {transaction.fines.reduce((s: number, f: any) => s + f.amount, 0).toLocaleString()}
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    )}

                    {/* SECTION 3: GRAND TOTAL SUMMARY */}
                    <div className="flex justify-end mb-8">
                        <div className="w-80 bg-gray-50 p-5 rounded-xl border border-gray-100 shadow-sm">
                            <div className="space-y-2 mb-4">
                                <div className="flex justify-between text-sm text-gray-500">
                                    <span>{t('invoice.subtotal.rental')}</span>
                                    <span>Rp {itemsSubtotal.toLocaleString()}</span>
                                </div>
                                {transaction.adminFee > 0 && (
                                    <div className="flex justify-between text-sm text-blue-600 font-medium">
                                        <span>{t('invoice.adminFee')}</span>
                                        <span>Rp {transaction.adminFee.toLocaleString()}</span>
                                    </div>
                                )}
                                {transaction.taxAmount > 0 && (
                                    <div className="flex justify-between text-sm text-green-600 font-medium">
                                        <span>Pajak ({transaction.taxRate}%)</span>
                                        <span>Rp {transaction.taxAmount.toLocaleString()}</span>
                                    </div>
                                )}
                                {finesSubtotal > 0 && (
                                    <div className="flex justify-between text-sm text-red-600 font-medium">
                                        <span>{t('invoice.subtotal.fines')}</span>
                                        <span>Rp {finesSubtotal.toLocaleString()}</span>
                                    </div>
                                )}
                                {discountAmount > 0 && (
                                    <div className="flex justify-between text-sm text-pink-600 font-bold bg-pink-50 px-2 py-1 rounded">
                                        <span>{t('referral.discount')}</span>
                                        <span>- Rp {discountAmount.toLocaleString()}</span>
                                    </div>
                                )}
                            </div>
                            <div className="flex justify-between items-center pt-3 border-t-2 border-dashed border-gray-200">
                                <span className="text-sm font-bold text-gray-400 uppercase tracking-wider">{t('invoice.grandTotal')}</span>
                                <span className="text-xl font-black text-gray-900">Rp {transaction.totalAmount.toLocaleString()}</span>
                            </div>
                        </div>
                    </div>

                    {/* SECTION 4: PAYMENT HISTORY */}
                    <div className="mb-8">
                        <h3 className="text-lg font-bold text-gray-900 border-b border-gray-200 pb-2 mb-4">{t('invoice.section.payment')}</h3>
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-gray-100">
                                    <th className="px-4 py-2 text-left font-bold text-gray-600">{t('invoice.date')}</th>
                                    <th className="px-4 py-2 text-left font-bold text-gray-600">{t('invoice.table.method')}</th>
                                    <th className="px-4 py-2 text-left font-bold text-gray-600">{t('invoice.table.type')}</th>
                                    <th className="px-4 py-2 text-left font-bold text-gray-600">{t('invoice.table.receivedBy')}</th>
                                    <th className="px-4 py-2 text-right font-bold text-gray-600">{t('invoice.table.amount')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {transaction.payments && transaction.payments.length > 0 ? (
                                    transaction.payments.map((p: any, idx: number) => (
                                        <tr key={idx}>
                                            <td className="px-4 py-2">{new Date(p.date).toLocaleString()}</td>
                                            <td className="px-4 py-2">{p.paymentMethod?.name}</td>
                                            <td className="px-4 py-2">{p.note || '-'}</td>
                                            <td className="px-4 py-2">{p.createdBy?.name || '-'}</td>
                                            <td className="px-4 py-2 text-right font-mono font-bold">
                                                Rp {p.amount.toLocaleString()}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr><td colSpan={5} className="text-center py-4 text-gray-400">{t('invoice.noPayments')}</td></tr>
                                )}
                            </tbody>
                            <tfoot>
                                <tr className="bg-gray-50 border-t border-gray-200">
                                    <td colSpan={4} className="px-4 py-2 text-right font-bold text-gray-700">{t('invoice.totalPaid')}</td>
                                    <td className="px-4 py-2 text-right font-bold text-green-700 text-lg">
                                        Rp {transaction.paidAmount.toLocaleString()}
                                    </td>
                                </tr>
                                <tr>
                                    <td colSpan={4} className="px-4 py-2 text-right font-bold text-gray-500">
                                        {transaction.totalAmount > transaction.paidAmount ? t('invoice.balanceDue') : t('invoice.change')}
                                    </td>
                                    <td className={`px-4 py-2 text-right font-bold ${transaction.totalAmount > transaction.paidAmount ? 'text-red-600' : 'text-green-600'}`}>
                                        Rp {Math.abs(transaction.totalAmount - transaction.paidAmount).toLocaleString()}
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>

                    {/* Footer */}
                    <div className="border-t pt-8 text-center text-xs text-gray-400">
                        <p>{t('invoice.thankYou', { brand: settings.BRAND_NAME || 'Werently' })}</p>
                        <p className="mt-1">{t('invoice.followUs', { social: settings.BRAND_SOCIAL || '@werently' })}</p>
                    </div>
                </div>
            )}

            {/* Thermal Layout (58mm) */}
            {isThermal && (
                <div className="bg-white w-[58mm] p-2 shadow-xl print:shadow-none print:w-full font-mono text-[10px] leading-tight">
                    <div className="text-center mb-4 border-b border-dashed border-black pb-2">
                        <h1 className="font-bold text-baset mb-1">{settings.BRAND_NAME || 'WERENTLY'}</h1>
                        <p>{settings.BRAND_TAGLINE || 'Sewa Baju Pesta'}</p>
                        <p>{settings.BRAND_WA || '0812-3456-7890'}</p>
                        <p className="mt-2 text-[9px]">{new Date(transaction.createdAt).toLocaleString()}</p>
                        <p>#{transaction.id}</p>
                    </div>

                    <div className="mb-2">
                        <p className="font-bold">{transaction.customer.name}</p>
                        <p>{transaction.customer.phone}</p>
                        <p className="mt-1 text-[9px] text-gray-500">
                            Server: {transaction.pickedUpBy?.username || transaction.user?.username || '-'}
                        </p>
                    </div>

                    {/* RENTAL ITEMS */}
                    <div className="border-b border-dashed border-black pb-2 mb-2">
                        <p className="font-bold underline mb-1">{t('invoice.section.rental').replace(/^I\.\s*/, '')}</p>
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

                    {/* FINES */}
                    {(transaction.fines && transaction.fines.length > 0) && (
                        <div className="border-b border-dashed border-black pb-2 mb-2">
                            <p className="font-bold underline mb-1">{t('invoice.section.fines').replace(/^II\.\s*/, '')}</p>
                            {transaction.fines.map((fine: any, idx: number) => (
                                <div key={idx} className="mb-1 flex justify-between">
                                    <span>{fine.violationType.name}</span>
                                    <span>{fine.amount.toLocaleString()}</span>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* TOTALS */}
                    <div className="border-t border-black pt-1 mt-2 space-y-0.5">
                        <div className="flex justify-between">
                            <span>SUBTOTAL</span>
                            <span>{itemsSubtotal.toLocaleString()}</span>
                        </div>
                        {transaction.adminFee > 0 && (
                            <div className="flex justify-between">
                                <span>{t('invoice.adminFee')}</span>
                                <span>{transaction.adminFee.toLocaleString()}</span>
                            </div>
                        )}
                        {transaction.taxAmount > 0 && (
                            <div className="flex justify-between">
                                <span>PPN ({transaction.taxRate}%)</span>
                                <span>{transaction.taxAmount.toLocaleString()}</span>
                            </div>
                        )}
                        {finesSubtotal > 0 && (
                            <div className="flex justify-between">
                                <span>FINES</span>
                                <span>{finesSubtotal.toLocaleString()}</span>
                            </div>
                        )}
                        {discountAmount > 0 && (
                            <div className="flex justify-between font-bold">
                                <span>DISCOUNT</span>
                                <span>-{discountAmount.toLocaleString()}</span>
                            </div>
                        )}
                        <div className="flex justify-between font-bold text-xs border-t border-black pt-1 mt-1">
                            <span>TOTAL</span>
                            <span>{transaction.totalAmount.toLocaleString()}</span>
                        </div>
                    </div>

                    {/* PAYMENT HISTORY */}
                    <div className="mt-2 text-[9px] border-t border-dashed border-black pt-2">
                        <p className="font-bold mb-1">PAYMENTS</p>
                        {transaction.payments && transaction.payments.length > 0 ? (
                            transaction.payments.map((p: any, idx: number) => (
                                <div key={idx} className="flex justify-between mb-0.5">
                                    <span>{p.note || 'Payment'}</span>
                                    <span>{p.amount.toLocaleString()}</span>
                                </div>
                            ))
                        ) : (
                            <p>-</p>
                        )}
                        <div className="flex justify-between font-bold mt-1 border-t border-dashed border-gray-400 pt-1">
                            <span>{t('invoice.totalPaid')}</span>
                            <span>{transaction.paidAmount.toLocaleString()}</span>
                        </div>
                    </div>

                    {/* DUE / CHANGE */}
                    {transaction.totalAmount - transaction.paidAmount > 0 ? (
                        <div className="flex justify-between mb-4 font-bold">
                            <span>{t('invoice.balanceDue')}</span>
                            <span>{(transaction.totalAmount - transaction.paidAmount).toLocaleString()}</span>
                        </div>
                    ) : (
                        transaction.paidAmount - transaction.totalAmount > 0 && (
                            <div className="flex justify-between mb-4 font-bold">
                                <span>{t('invoice.change')}</span>
                                <span>{(transaction.paidAmount - transaction.totalAmount).toLocaleString()}</span>
                            </div>
                        )
                    )}

                    <div className="text-center border-t border-dashed border-black pt-2 mt-4">
                        <p>{t('invoice.pickup')}: {new Date(transaction.pickupDate).toLocaleDateString()}</p>
                        <p>{t('invoice.return')}: {new Date(transaction.returnPlanDate).toLocaleDateString()}</p>
                        <p className="mt-2 font-bold">{t('common.success')}!</p>
                    </div>
                </div>
            )}
        </div>
    );
}
