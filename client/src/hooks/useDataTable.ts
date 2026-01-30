import { useState, useMemo } from 'react';

export interface SortConfig {
    key: string;
    direction: 'asc' | 'desc';
}

export function useDataTable<T>(data: T[], searchKeys: string[]) {
    const [searchQuery, setSearchQuery] = useState('');
    const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(20);

    // 1. Search / Filter
    const filteredData = useMemo(() => {
        if (!searchQuery) return data;
        const lowerQuery = searchQuery.toLowerCase();
        return data.filter(item => {
            return searchKeys.some(key => {
                const val = (item as any)[key];
                return val ? String(val).toLowerCase().includes(lowerQuery) : false;
            });
        });
    }, [data, searchQuery, searchKeys]);

    // 2. Sort
    const sortedData = useMemo(() => {
        if (!sortConfig) return filteredData;
        return [...filteredData].sort((a: any, b: any) => {
            const aVal = a[sortConfig.key];
            const bVal = b[sortConfig.key];

            // Handle strings (improving sort accuracy for text)
            if (typeof aVal === 'string' && typeof bVal === 'string') {
                return sortConfig.direction === 'asc'
                    ? aVal.localeCompare(bVal)
                    : bVal.localeCompare(aVal);
            }

            // Handle Dates if they are strings but parseable? Or usually just rely on < >
            if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
            if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });
    }, [filteredData, sortConfig]);

    // 3. Pagination
    const paginatedData = useMemo(() => {
        if (pageSize === -1) return sortedData; // All
        const start = (currentPage - 1) * pageSize;
        return sortedData.slice(start, start + pageSize);
    }, [sortedData, currentPage, pageSize]);

    const totalPages = pageSize === -1 ? 1 : Math.ceil(sortedData.length / pageSize);

    // Helpers
    const handleSort = (key: string) => {
        setSortConfig(current => {
            if (current?.key === key) {
                if (current.direction === 'asc') return { key, direction: 'desc' };
                return null; // Reset
            }
            return { key, direction: 'asc' };
        });
    };

    return {
        searchQuery, setSearchQuery,
        sortConfig, handleSort,
        currentPage, setCurrentPage,
        pageSize, setPageSize,
        paginatedData,
        totalItems: sortedData.length,
        totalPages
    };
}
