import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { Search, Box } from 'lucide-react';
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

    useEffect(() => {
        if (token) {
            fetchItems();
            fetchCategories();
        }
    }, [token]);

    const fetchItems = async () => {
        try {
            const res = await fetch(`${API_URL}/items`, {
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
            if (v.instances) {
                total += v.instances.length;
                available += v.instances.filter((i: any) => i.status === 'AVAILABLE').length;
                rented += v.instances.filter((i: any) => i.status === 'RENTED').length;
            }
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

        // 3. Status Filter
        if (filterType === 'AVAILABLE') {
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
                    <p className="text-gray-500">{t('common.noData')}</p>
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

            {/* Detail Modal */}
            {selectedItem && (
                <ProductDetail
                    item={selectedItem}
                    onClose={() => setSelectedItem(null)}
                    onEdit={() => { }}
                    hideEditButton={true}
                />
            )}
        </div>
    );
}
