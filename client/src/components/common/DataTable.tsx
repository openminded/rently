import React from 'react';
import { Search, ChevronDown, ChevronUp, ChevronLeft, ChevronRight } from 'lucide-react';
import { useDataTable } from '../../hooks/useDataTable';

export interface Column<T> {
    header: string | React.ReactNode;
    accessorKey: keyof T | string; // keyof T or nested path or string ID
    sortable?: boolean;
    className?: string;
    cell?: (item: T) => React.ReactNode; // Custom render
}

interface DataTableProps<T> {
    data: T[];
    columns: Column<T>[];
    searchKeys: string[];
    actions?: (item: T) => React.ReactNode; // Optional actions column
    filterSlot?: React.ReactNode; // Extra filters UI
    rowClassName?: (item: T) => string;
}

export function DataTable<T>({ data, columns, searchKeys, actions, filterSlot, rowClassName }: DataTableProps<T>) {
    const {
        searchQuery, setSearchQuery,
        sortConfig, handleSort,
        currentPage, setCurrentPage,
        pageSize, setPageSize,
        paginatedData,
        totalItems,
        totalPages
    } = useDataTable(data, searchKeys);

    // Render Sort Indicator
    const renderSortIcon = (colKey: string) => {
        if (sortConfig?.key !== colKey) return <div className="w-4 h-4 ml-1 opacity-0 group-hover:opacity-30"><ChevronDown size={14} /></div>;
        return sortConfig.direction === 'asc'
            ? <ChevronUp size={14} className="ml-1 text-gray-800" />
            : <ChevronDown size={14} className="ml-1 text-gray-800" />;
    };

    return (
        <div className="w-full">
            {/* Controls Header */}
            <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4">
                <div className="flex items-center gap-2 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                        />
                    </div>
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto">
                    {filterSlot}

                    <select
                        value={pageSize}
                        onChange={(e) => {
                            setPageSize(Number(e.target.value));
                            setCurrentPage(1); // Reset to page 1 on size change
                        }}
                        className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none"
                    >
                        <option value={20}>20 per page</option>
                        <option value={100}>100 per page</option>
                        <option value={-1}>Show All</option>
                    </select>
                </div>
            </div>

            {/* Table */}
            <div className="border border-gray-100 rounded-xl overflow-hidden bg-white shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 text-gray-500 font-medium">
                            <tr>
                                {columns.map((col, idx) => (
                                    <th
                                        key={idx}
                                        className={`px-6 py-4 transition-colors ${col.sortable ? 'cursor-pointer hover:bg-gray-100 group select-none' : ''} ${col.className || ''}`}
                                        onClick={() => col.sortable && handleSort(col.accessorKey as string)}
                                    >
                                        <div className="flex items-center">
                                            {col.header}
                                            {col.sortable && renderSortIcon(col.accessorKey as string)}
                                        </div>
                                    </th>
                                ))}
                                {actions && <th className="px-6 py-4 text-right">Actions</th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {paginatedData.length === 0 ? (
                                <tr>
                                    <td colSpan={columns.length + (actions ? 1 : 0)} className="px-6 py-8 text-center text-gray-400">
                                        No data found
                                    </td>
                                </tr>
                            ) : (
                                paginatedData.map((item, idx) => (
                                    <tr key={idx} className={`hover:bg-gray-50 transition-colors ${rowClassName ? rowClassName(item) : ''}`}>
                                        {columns.map((col, cIdx) => (
                                            <td key={cIdx} className={`px-6 py-4 ${col.className || ''}`}>
                                                {col.cell
                                                    ? col.cell(item)
                                                    : (item as any)[col.accessorKey as string]
                                                }
                                            </td>
                                        ))}
                                        {actions && (
                                            <td className="px-6 py-4 text-right">
                                                {actions(item)}
                                            </td>
                                        )}
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Footer */}
                {pageSize !== -1 && totalPages > 1 && (
                    <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
                        <div className="text-xs text-gray-500">
                            Showing <span className="font-bold">{((currentPage - 1) * pageSize) + 1}</span> to <span className="font-bold">{Math.min(currentPage * pageSize, totalItems)}</span> of <span className="font-bold">{totalItems}</span> entries
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="p-1.5 rounded-lg border border-gray-200 text-gray-600 disabled:opacity-50 hover:bg-gray-50"
                            >
                                <ChevronLeft size={16} />
                            </button>
                            {Array.from({ length: totalPages }, (_, i) => i + 1)
                                // Standard pagination usually truncates, typically showing only a few pages.
                                // For simplicity valid for "client side with 20/100", simple range is ok usually if total isn't huge.
                                // If huge, simplistic list is bad. Let's just show 'Page X of Y' for compact.
                                // But user requested "pagination".
                                // Let's simplify to showing neighbors if pages > 7.
                                .filter(p => p === 1 || p === totalPages || (p >= currentPage - 1 && p <= currentPage + 1))
                                .reduce((acc: any[], p, i, arr) => {
                                    if (i > 0 && p > arr[i - 1] + 1) acc.push('...');
                                    acc.push(p);
                                    return acc;
                                }, [])
                                .map((p, i) => (
                                    typeof p === 'number' ? (
                                        <button
                                            key={i}
                                            onClick={() => setCurrentPage(p)}
                                            className={`w-8 h-8 flex items-center justify-center rounded-lg text-xs font-bold transition-colors ${currentPage === p
                                                ? 'bg-gray-900 text-white'
                                                : 'text-gray-600 hover:bg-gray-100'
                                                }`}
                                        >
                                            {p}
                                        </button>
                                    ) : (
                                        <span key={i} className="text-gray-400 text-xs px-1">...</span>
                                    )
                                ))
                            }
                            <button
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className="p-1.5 rounded-lg border border-gray-200 text-gray-600 disabled:opacity-50 hover:bg-gray-50"
                            >
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
