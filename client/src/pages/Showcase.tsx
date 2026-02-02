import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { Search, Box, Calendar, ChevronDown, ChevronUp } from 'lucide-react';
import ProductDetail from '../components/ProductDetail';

import { API_BASE_URL, getImageUrl } from '../config/api';

const API_URL = API_BASE_URL;

export default function Showcase() {
    const { token } = useAuth();
    const { t } = useLanguage();
    const [items, setItems] = useState<any[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    // Filters
    const [filterType, setFilterType] = useState('ALL'); // ALL, AVAILABLE
    const [selectedCategory, setSelectedCategory] = useState('ALL');
    const [sortBy, setSortBy] = useState('NEWEST'); // NEWEST, TOP_RENT, FAVORITE

    // Detail View
    const [selectedItem, setSelectedItem] = useState<any>(null);
    const [viewScheduleId, setViewScheduleId] = useState<number | null>(null);
    const [scheduleData, setScheduleData] = useState<any[]>([]);
    const [loadingSchedule, setLoadingSchedule] = useState(false);

    // Date Filter State
    const [dateRange, setDateRange] = useState<{ start: string, end: string }>({ start: '', end: '' });

    useEffect(() => {
        if (token) {
            fetchCategories();
        }
    }, [token]);

    useEffect(() => {
        if (token) {
            setLoading(true);
            const timer = setTimeout(() => {
                fetchItems();
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [token, dateRange]);

    const fetchItems = async () => {
        try {
            const params = new URLSearchParams();
            if (dateRange.start && dateRange.end) {
                params.append('startDate', dateRange.start);
                params.append('endDate', dateRange.end);
            }
            const res = await fetch(`${API_URL}/items?${params.toString()}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            setItems(Array.isArray(data) ? data : []);
            setLoading(false);
        } catch (e) {
            console.error("Failed to fetch showcase items", e);
            setLoading(false);
        }
    };

    const fetchCategories = async () => {
        try {
            const res = await fetch(`${API_URL}/masters/categories`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            setCategories(Array.isArray(data) ? data : []);
        } catch (e) {
            console.error("Failed to fetch categories", e);
        }
    };

    const getItemStats = (item: any) => {
        let total = 0;
        let available = 0;
        let rented = 0;

        item.variants?.forEach((v: any) => {
            // Use _count.instances provided by backend (which handles date filtering logic)
            // Fallback to manual filter if _count missing (shouldn't happen with updated backend)
            available += (v._count?.instances !== undefined)
                ? v._count.instances
                : (v.instances?.filter((i: any) => i.status === 'AVAILABLE').length || 0);

            // Total is total physical instances
            total += v.instances?.length || 0;

            // Rented info is less critical for the summary card, but we can keep approx
            rented += v.instances?.filter((i: any) => i.status === 'RENTED').length || 0;
        });
        return { total, available, rented };
    };

    const processedItems = useMemo(() => {
        let result = [...items];

        // 1. Search
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            result = result.filter(i =>
                i.name.toLowerCase().includes(q) ||
                i.category?.name?.toLowerCase().includes(q) ||
                i.brand?.name?.toLowerCase().includes(q)
            );
        }

        // 2. Category Filter
        if (selectedCategory !== 'ALL') {
            result = result.filter(i => i.categoryId === parseInt(selectedCategory));
        }

        // 3. Status Filter (Manual or Date-Driven)
        // If Date Range is selected, ONLY show available items (User Request)
        const hasDateRange = dateRange.start && dateRange.end;
        if (filterType === 'AVAILABLE' || hasDateRange) {
            result = result.filter(i => getItemStats(i).available > 0);
        }

        // 4. Sort
        result.sort((a, b) => {
            if (sortBy === 'NEWEST') {
                return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            }
            if (sortBy === 'TOP_RENT') {
                const statsA = getItemStats(a);
                const statsB = getItemStats(b);
                return statsB.rented - statsA.rented;
            }
            return 0;
        });

        return result;
    }, [items, searchQuery, filterType, selectedCategory, sortBy]);

    return (
        <div className="space-y-6">
            {/* Header section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">{t('showcase.title')}</h1>
                    <p className="text-gray-500">{t('showcase.subtitle')}</p>
                </div>

                {/* Controls */}
                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder={t('showcase.searchPlaceholder')}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full sm:w-64 pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                        />
                    </div>

                    <div className="flex flex-wrap gap-2">
                        {/* Date Filter */}
                        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2">
                            <Calendar size={16} className="text-gray-400" />
                            <div className="flex items-center gap-2">
                                <input
                                    type="date"
                                    className="text-sm outline-none text-gray-600 bg-transparent"
                                    value={dateRange.start}
                                    onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                                />
                                <span className="text-gray-400">→</span>
                                <input
                                    type="date"
                                    className="text-sm outline-none text-gray-600 bg-transparent"
                                    value={dateRange.end}
                                    onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                                />
                            </div>
                        </div>

                        {/* Category Dropdown */}
                        <select
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none bg-white min-w-[120px]"
                        >
                            <option value="ALL">{t('showcase.filter.allCategories')}</option>
                            {categories.map(cat => (
                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                            ))}
                        </select>

                        <select
                            value={filterType}
                            onChange={(e) => setFilterType(e.target.value)}
                            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none bg-white"
                        >
                            <option value="ALL">{t('showcase.filter.all')}</option>
                            <option value="AVAILABLE">{t('showcase.filter.availableOnly')}</option>
                        </select>

                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none bg-white"
                        >
                            <option value="NEWEST">{t('showcase.sort.newest')}</option>
                            <option value="TOP_RENT">{t('showcase.sort.popular')}</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Grid */}
            {loading ? (
                <div className="text-center py-20 text-gray-400">{t('common.loading')}</div>
            ) : processedItems.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-xl border border-gray-100">
                    <Box size={48} className="mx-auto text-gray-300 mb-2" />
                    <p className="text-gray-500">{t('common.noData')} - Try adjusting filters or date range.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {processedItems.map(item => {
                        const stats = getItemStats(item);
                        const isAvailable = stats.available > 0;

                        return (
                            <div
                                key={item.id}
                                onClick={() => setSelectedItem(item)}
                                className="group bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-lg transition-all cursor-pointer flex flex-col"
                            >
                                <div className="aspect-[4/3] bg-gray-100 relative overflow-hidden">
                                    {item.images && item.images.length > 0 ? (
                                        <img
                                            src={getImageUrl(item.images[0].url)}
                                            alt={item.name}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                                            <Box size={32} />
                                        </div>
                                    )}

                                    <div className="absolute top-2 left-2 flex gap-1">
                                        {!isAvailable && (
                                            <span className="bg-red-500/90 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-1 rounded">
                                                {t('showcase.status.outOfStock')}
                                            </span>
                                        )}
                                        {isAvailable && (
                                            <span className="bg-green-500/90 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-1 rounded">
                                                {t('showcase.status.available')}
                                            </span>
                                        )}
                                    </div>
                                    <div className="absolute top-2 right-2">
                                        <span className="bg-white/90 backdrop-blur-sm text-gray-900 text-xs font-bold px-2 py-1 rounded shadow-sm">
                                            Rp {item.rentalPrice.toLocaleString()}
                                        </span>
                                    </div>
                                </div>

                                <div className="p-4 flex-1 flex flex-col">
                                    <div className="flex items-start justify-between mb-2">
                                        <div>
                                            <h3 className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-1">{item.name}</h3>
                                            <p className="text-xs text-gray-500">{item.brand?.name} • {item.category?.name}</p>
                                        </div>
                                    </div>

                                    <p className="text-sm text-gray-600 line-clamp-2 mb-4 flex-1">
                                        {item.description || 'No description available'}
                                    </p>

                                    <div className="flex items-center gap-1">
                                        <Box size={14} />
                                        <span className="text-sm text-gray-600">{t('showcase.stock')}: {stats.available} / {stats.total}</span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Detail Modal Overlay with Custom Schedule Logic */}
            {selectedItem && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto relative">
                        <button
                            onClick={() => setSelectedItem(null)}
                            className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full z-10"
                        >
                            <Box className="rotate-45" size={20} />
                        </button>

                        <div className="p-6">
                            <ProductDetail
                                item={selectedItem}
                                onClose={() => setSelectedItem(null)}
                                onEdit={() => { }}
                                hideEditButton={true}
                                customVariantRenderer={(variant: any) => (
                                    <div className="mt-2">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (viewScheduleId === variant.id) {
                                                    setViewScheduleId(null);
                                                } else {
                                                    setViewScheduleId(variant.id);
                                                    setLoadingSchedule(true);
                                                    fetch(`${API_URL}/transactions/schedule/${variant.id}`, {
                                                        headers: { 'Authorization': `Bearer ${token}` }
                                                    })
                                                        .then(res => res.json())
                                                        .then(data => setScheduleData(data))
                                                        .catch(err => console.error(err))
                                                        .finally(() => setLoadingSchedule(false));
                                                }
                                            }}
                                            className="w-full py-2 text-xs font-medium text-gray-500 hover:text-blue-600 hover:bg-blue-50 flex items-center justify-center gap-1 transition-colors border-t border-gray-100"
                                        >
                                            <Calendar size={14} />
                                            {viewScheduleId === variant.id ? 'Hide Schedule' : 'Check Schedule'}
                                            {viewScheduleId === variant.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                        </button>

                                        {viewScheduleId === variant.id && (
                                            <div className="bg-gray-50 p-3 text-xs border-t border-gray-100">
                                                {loadingSchedule ? (
                                                    <div className="text-center py-2 text-gray-400">Loading schedule...</div>
                                                ) : scheduleData.length === 0 ? (
                                                    <div className="text-center py-2 text-green-600 font-medium">No active bookings. Fully available.</div>
                                                ) : (
                                                    <div className="space-y-2">
                                                        <p className="font-bold text-gray-700 mb-2">Unavailable Dates (Booking + Cleaning):</p>
                                                        {scheduleData.map((event: any) => (
                                                            <div key={event.id} className="flex justify-between items-start bg-white p-2 rounded border border-gray-200">
                                                                <div>
                                                                    <div className="font-medium text-gray-900">
                                                                        {new Date(event.start).toLocaleDateString()} - {new Date(event.end).toLocaleDateString()}
                                                                    </div>
                                                                    <div className="text-[10px] text-gray-400">
                                                                        Busy until: <span className="text-red-500">{new Date(event.busyUntil).toLocaleDateString()}</span>
                                                                    </div>
                                                                </div>
                                                                <div className="text-right">
                                                                    <div className="font-medium text-blue-900">{event.customer}</div>
                                                                    <div className="text-[10px] text-gray-400 capitalize">{event.status.replace('_', ' ')}</div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
