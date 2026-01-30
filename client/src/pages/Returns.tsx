import React, { useState, useEffect } from 'react';
import { RotateCcw, AlertTriangle } from 'lucide-react';
import { DataTable, type Column } from '../components/common/DataTable';
import { useAuth } from '../context/AuthContext';

const API_URL = 'http://localhost:3000/api';

export default function Returns() {
    const { token } = useAuth();
    const [rentals, setRentals] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (token) {
            fetchRentals();
        }
    }, [token]);

    const fetchRentals = async () => {
        try {
            console.log("Fetching rentals from:", `${API_URL}/returns/rentals`);
            const res = await fetch(`${API_URL}/returns/rentals`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            setRentals(Array.isArray(data) ? data : []);
            setLoading(false);
        } catch (error) {
            console.error("Failed to fetch rentals", error);
            setLoading(false);
        }
    };

    const columns: Column<any>[] = [
        { header: 'ID', accessorKey: 'id', cell: (row) => <span className="font-medium text-gray-900">#{row.id}</span> },
        {
            header: 'Customer',
            accessorKey: 'customer.name',
            cell: (row) => (
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs">
                        {row.customer?.name?.charAt(0) || '?'}
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-900">{row.customer?.name}</p>
                        <p className="text-xs text-gray-500">{row.customer?.phone}</p>
                    </div>
                </div>
            )
        },
        {
            header: 'Items',
            accessorKey: 'items',
            cell: (row) => (
                <div className="space-y-1">
                    {row.items?.map((item: any) => (
                        <div key={item.id} className="text-sm text-gray-600 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-gray-400"></span>
                            {item.itemInstance?.itemVariant?.item?.name}
                            <span className="text-gray-400 text-xs">
                                ({item.itemInstance?.itemVariant?.size?.name}/{item.itemInstance?.itemVariant?.color?.name})
                            </span>
                        </div>
                    ))}
                </div>
            )
        },
        {
            header: 'Return Date',
            accessorKey: 'returnPlanDate',
            sortable: true,
            cell: (row) => {
                const date = new Date(row.returnPlanDate);
                const isLate = new Date() > date && row.status !== 'RETURNED' && row.status !== 'COMPLETED';
                return (
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-900">{date.toLocaleDateString()}</span>
                        {isLate && (
                            <span className="flex items-center gap-1 text-xs text-red-600 bg-red-50 px-2 py-0.5 rounded font-medium">
                                <AlertTriangle size={12} /> Late
                            </span>
                        )}
                    </div>
                );
            }
        },
        {
            header: 'Status',
            accessorKey: 'status',
            cell: (row) => (
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                    ${row.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                        row.status === 'RETURNED' ? 'bg-blue-100 text-blue-800' :
                            row.status === 'PICKED_UP' ? 'bg-purple-100 text-purple-800' :
                                'bg-yellow-100 text-yellow-800'
                    }`}>
                    {row.status.replace('_', ' ')}
                </span>
            )
        }
    ];

    const actions = (row: any) => (
        <button className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1 ml-auto">
            <RotateCcw size={16} /> Process
        </button>
    );

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Active Rentals & Returns</h1>
                    <p className="text-gray-500">Manage ongoing rentals and process returns</p>
                </div>
            </div>

            {loading ? (
                <div className="p-8 text-center text-gray-400">Loading Active Rentals...</div>
            ) : (
                <DataTable
                    data={rentals}
                    columns={columns}
                    searchKeys={['id', 'customer.name', 'customer.phone']}
                    actions={actions}
                />
            )}
        </div>
    );
}
