import React, { useState, useEffect } from 'react';
import { Search, Filter, RotateCcw, CheckCircle, AlertTriangle } from 'lucide-react';

const API_URL = 'http://localhost:3000/api';

export default function Returns() {
    const [rentals, setRentals] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchRentals();
    }, []);

    const fetchRentals = async () => {
        try {
            console.log("Fetching rentals from:", `${API_URL}/returns/rentals`);
            const res = await fetch(`${API_URL}/returns/rentals`);
            console.log("Response status:", res.status);
            const data = await res.json();
            console.log("Rentals data:", data);
            setRentals(Array.isArray(data) ? data : []);
            setLoading(false);
        } catch (error) {
            console.error("Failed to fetch rentals", error);
            setLoading(false);
        }
    };

    const filteredRentals = rentals.filter(r =>
        r.customer?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.id.toString().includes(searchTerm)
    );

    if (loading) return <div className="p-8">Loading Active Rentals...</div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Active Rentals & Returns</h1>
                    <p className="text-gray-500">Manage ongoing rentals and process returns</p>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
                <div className="flex-1 flex items-center gap-3 bg-gray-50 px-4 py-2.5 rounded-lg border border-gray-200">
                    <Search className="text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="Search by customer name or transaction ID..."
                        className="bg-transparent outline-none flex-1 text-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <button className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-lg hover:bg-gray-50 text-sm font-medium text-gray-600">
                    <Filter size={18} /> Filter Status
                </button>
            </div>

            {/* Rentals List */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-100">
                        <tr>
                            <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Transaction ID</th>
                            <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Customer</th>
                            <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Items</th>
                            <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Return Date</th>
                            <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Status</th>
                            <th className="text-right px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {filteredRentals.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                                    No active rentals found
                                </td>
                            </tr>
                        ) : (
                            filteredRentals.map((rental) => (
                                <tr key={rental.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 text-sm font-medium text-gray-900">#{rental.id}</td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs">
                                                {rental.customer?.name.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-gray-900">{rental.customer?.name}</p>
                                                <p className="text-xs text-gray-500">{rental.customer?.phone}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="space-y-1">
                                            {rental.items?.map((item: any) => (
                                                <div key={item.id} className="text-sm text-gray-600 flex items-center gap-2">
                                                    <span className="w-2 h-2 rounded-full bg-gray-400"></span>
                                                    {item.itemInstance?.itemVariant?.item?.name}
                                                    <span className="text-gray-400 text-xs">
                                                        ({item.itemInstance?.itemVariant?.size?.name}/{item.itemInstance?.itemVariant?.color?.name})
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm text-gray-900">
                                                {new Date(rental.returnPlanDate).toLocaleDateString()}
                                            </span>
                                            {new Date() > new Date(rental.returnPlanDate) && rental.status !== 'RETURNED' && rental.status !== 'COMPLETED' && (
                                                <span className="flex items-center gap-1 text-xs text-red-600 bg-red-50 px-2 py-0.5 rounded font-medium">
                                                    <AlertTriangle size={12} /> Late
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                                            ${rental.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                                                rental.status === 'RETURNED' ? 'bg-blue-100 text-blue-800' :
                                                    rental.status === 'PICKED_UP' ? 'bg-purple-100 text-purple-800' :
                                                        'bg-yellow-100 text-yellow-800'
                                            }`}>
                                            {rental.status.replace('_', ' ')}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1 ml-auto">
                                            <RotateCcw size={16} /> Process Return
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
