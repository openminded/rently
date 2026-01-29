import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Edit2, Trash2, CheckSquare, Square } from 'lucide-react';

interface Column {
    key: string;
    label: string;
    render?: (item: any) => React.ReactNode;
}

interface TableProps {
    data: any[];
    columns: Column[];
    onEdit?: (item: any) => void;
    onDelete?: (item: any) => void;
    onSelectionChange?: (selectedIds: number[]) => void;
}

export default function Table({ data, columns, onEdit, onDelete, onSelectionChange }: TableProps) {
    const [selectedIds, setSelectedIds] = useState<number[]>([]);

    const toggleSelectAll = () => {
        if (selectedIds.length === data.length) {
            setSelectedIds([]);
            onSelectionChange?.([]);
        } else {
            const allIds = data.map(d => d.id);
            setSelectedIds(allIds);
            onSelectionChange?.(allIds);
        }
    };

    const toggleSelect = (id: number) => {
        let newSelected = [];
        if (selectedIds.includes(id)) {
            newSelected = selectedIds.filter(i => i !== id);
        } else {
            newSelected = [...selectedIds, id];
        }
        setSelectedIds(newSelected);
        onSelectionChange?.(newSelected);
    };

    return (
        <div className="overflow-x-auto rounded-lg border border-gray-100 shadow-sm bg-white">
            <table className="w-full text-left text-sm text-gray-600">
                <thead className="bg-gray-50 text-xs uppercase font-medium text-gray-400 border-b border-gray-100">
                    <tr>
                        <th className="px-4 py-3 w-10">
                            <button onClick={toggleSelectAll} className="flex items-center text-gray-400 hover:text-gray-600">
                                {selectedIds.length === data.length && data.length > 0 ? <CheckSquare size={16} /> : <Square size={16} />}
                            </button>
                        </th>
                        {columns.map(col => (
                            <th key={col.key} className="px-4 py-3">{col.label}</th>
                        ))}
                        <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {data.length === 0 ? (
                        <tr>
                            <td colSpan={columns.length + 2} className="px-4 py-8 text-center text-gray-400">
                                No data available
                            </td>
                        </tr>
                    ) : (
                        data.map((item) => (
                            <tr key={item.id} className={`hover:bg-gray-50 transition-colors ${selectedIds.includes(item.id) ? 'bg-blue-50/30' : ''}`}>
                                <td className="px-4 py-3">
                                    <button onClick={() => toggleSelect(item.id)} className={`flex items-center ${selectedIds.includes(item.id) ? 'text-blue-500' : 'text-gray-300 hover:text-gray-500'}`}>
                                        {selectedIds.includes(item.id) ? <CheckSquare size={16} /> : <Square size={16} />}
                                    </button>
                                </td>
                                {columns.map(col => (
                                    <td key={col.key} className="px-4 py-3 text-gray-900">
                                        {col.render ? col.render(item) : item[col.key]}
                                    </td>
                                ))}
                                <td className="px-4 py-3 text-right flex items-center justify-end gap-2">
                                    {onEdit && (
                                        <button onClick={() => onEdit(item)} className="p-1 hover:bg-blue-50 text-gray-400 hover:text-blue-600 rounded">
                                            <Edit2 size={16} />
                                        </button>
                                    )}
                                    {onDelete && (
                                        <button onClick={() => onDelete(item)} className="p-1 hover:bg-red-50 text-gray-400 hover:text-red-600 rounded">
                                            <Trash2 size={16} />
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
}
