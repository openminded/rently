import React, { useState, useEffect } from 'react';
import { Plus, Box, X, Save, Eye, Edit2 } from 'lucide-react';
import { DataTable, type Column } from '../components/common/DataTable';
import ProductDetail from '../components/ProductDetail';

import { API_BASE_URL, getImageUrl } from '../config/api';

const API_URL = API_BASE_URL;

import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

export default function Inventory() {
    const { token } = useAuth();
    const { t } = useLanguage();
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Master Data helpers
    const [categories, setCategories] = useState<any[]>([]);
    const [brands, setBrands] = useState<any[]>([]);
    const [sizes, setSizes] = useState<any[]>([]);
    const [colors, setColors] = useState<any[]>([]);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentItem, setCurrentItem] = useState<any>(null); // For Edit
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [viewItem, setViewItem] = useState<any>(null); // For View

    // File Upload State
    const [selectedImages, setSelectedImages] = useState<File[]>([]);
    const [previewUrls, setPreviewUrls] = useState<string[]>([]);
    // For storing existing images during edit
    const [existingImages, setExistingImages] = useState<any[]>([]);

    // Variant Management State
    const [selectedSize, setSelectedSize] = useState('');
    const [selectedColor, setSelectedColor] = useState('');
    // For storing variants locally during CREATE mode before saving
    const [localVariants, setLocalVariants] = useState<any[]>([]);

    useEffect(() => {
        if (token) {
            fetchItems();
            fetchMasters();
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
            console.error("Failed to fetch inventory", e);
            setLoading(false);
        }
    };

    const fetchMasters = async () => {
        try {
            const headers = { 'Authorization': `Bearer ${token}` };
            const [catRes, brandRes, sizeRes, colorRes] = await Promise.all([
                fetch(`${API_URL}/masters/categories`, { headers }),
                fetch(`${API_URL}/masters/brands`, { headers }),
                fetch(`${API_URL}/masters/sizes`, { headers }),
                fetch(`${API_URL}/masters/colors`, { headers })
            ]);

            const catData = await catRes.json();
            setCategories(Array.isArray(catData) ? catData : []);

            const brandData = await brandRes.json();
            setBrands(Array.isArray(brandData) ? brandData : []);

            const sizeData = await sizeRes.json();
            setSizes(Array.isArray(sizeData) ? sizeData : []);

            const colorData = await colorRes.json();
            setColors(Array.isArray(colorData) ? colorData : []);
        } catch (e) {
            console.error("Failed to fetch masters", e);
            // Fallback to empty arrays on error
            setCategories([]);
            setBrands([]);
            setSizes([]);
            setColors([]);
        }
    };

    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const files = Array.from(e.target.files);
            const totalImages = (existingImages.length) + (selectedImages.length) + files.length;

            if (totalImages > 5) {
                alert("Max 5 images allowed total");
                return;
            }
            setSelectedImages([...selectedImages, ...files]);

            // Generate previews
            const newPreviews = files.map(file => URL.createObjectURL(file));
            setPreviewUrls([...previewUrls, ...newPreviews]);
        }
    };

    const removeNewImage = (index: number) => {
        const newImages = [...selectedImages];
        newImages.splice(index, 1);
        setSelectedImages(newImages);

        const newPreviews = [...previewUrls];
        URL.revokeObjectURL(newPreviews[index]); // Cleanup
        newPreviews.splice(index, 1);
        setPreviewUrls(newPreviews);
    };

    const removeExistingImage = async (imageId: number) => {
        if (!confirm('Delete this image?')) return;
        try {
            await fetch(`${API_URL}/items/images/${imageId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            // Update local state
            setExistingImages(existingImages.filter(img => img.id !== imageId));
            // Also update viewItem if detail is valid
            if (viewItem) {
                setViewItem({ ...viewItem, images: viewItem.images.filter((i: any) => i.id !== imageId) });
            }
        } catch (e) {
            console.error(e);
        }
    };

    const handleAddVariant = async () => {
        if (!selectedSize || !selectedColor) return;

        // Prepare variant object
        const sizeObj = sizes.find(s => s.id == selectedSize);
        const colorObj = colors.find(c => c.id == selectedColor);

        if (!currentItem) {
            // CREATE Mode - Add to local state
            // Check duplicate in local
            if (localVariants.find(v => v.sizeId == selectedSize && v.colorId == selectedColor)) {
                alert('Variant already added to list');
                return;
            }
            // Ask for initial stock? 
            // The backend supports 'quantity' now.
            const qtyStr = prompt("Initial stock quantity?", "0");
            const quantity = parseInt(qtyStr || "0");

            setLocalVariants([...localVariants, {
                id: Date.now(), // temp id
                sizeId: Number(selectedSize),
                colorId: Number(selectedColor),
                size: sizeObj,
                color: colorObj,
                quantity: quantity
            }]);
            setSelectedSize('');
            setSelectedColor('');
            return;
        }

        // EDIT Mode - Add to backend
        try {
            const res = await fetch(`${API_URL}/items/variants`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    itemId: currentItem.id,
                    sizeId: Number(selectedSize),
                    colorId: Number(selectedColor)
                })
            });

            if (res.ok) {
                const newVariant = await res.json();
                const fullVariant = {
                    ...newVariant,
                    size: sizeObj,
                    color: colorObj
                };

                const updatedVariants = [...(currentItem.variants || []), fullVariant];
                setCurrentItem({ ...currentItem, variants: updatedVariants });
                setItems(items.map(i => i.id === currentItem.id ? { ...i, variants: updatedVariants } : i));

                setSelectedSize('');
                setSelectedColor('');
            } else {
                alert('Failed to add variant. It may already exist.');
            }
        } catch (e) {
            console.error(e);
            alert('Error adding variant');
        }
    };

    const handleDeleteVariant = async (variantId: number) => {
        if (!confirm('Delete this variant?')) return;

        if (!currentItem) {
            // Create Mode
            setLocalVariants(localVariants.filter(v => v.id !== variantId));
            return;
        }

        try {
            const res = await fetch(`${API_URL}/items/variants/${variantId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const updatedVariants = currentItem.variants.filter((v: any) => v.id !== variantId);
                setCurrentItem({ ...currentItem, variants: updatedVariants });
                setItems(items.map(i => i.id === currentItem.id ? { ...i, variants: updatedVariants } : i));
            } else {
                alert('Failed to delete variant');
            }
        } catch (e) {
            console.error(e);
        }
    };

    const handleAddStock = async (variantId: number) => {
        const qtyStr = prompt("Enter quantity to add:", "1");
        if (!qtyStr) return;
        const qty = parseInt(qtyStr);
        if (isNaN(qty) || qty <= 0) return;

        try {
            const res = await fetch(`${API_URL}/items/stock`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    itemVariantId: variantId,
                    quantity: qty
                })
            });

            if (res.ok) {
                alert(`Added ${qty} items to stock!`);
                // Ideally refresh specific item or fetch all. Fetching all for simplicity.
                fetchItems();
                setIsModalOpen(false); // Close modal to refresh or just let user stay? 
                // Since we rely on fetchItems to update 'items' and 'currentItem' is state...
                // The easiest is to close modal or force re-sync of currentItem.
                // For now, let's keep modal open but we need to update 'currentItem' instance list?
                // Actually, fetchItems updates 'items'. 'currentItem' is a separate state clone.
                // We'd need to re-fetch the item to get the new instances.
                // Simplest: Close modal OR just let fetchItems run and user can re-open.
                // Or: don't optimistic update, just alert.
                // The user probably wants to see the count update.
                // Since we can't easily push to 'instances' without the new ID/sku structure (which backend returns in 'results'),
                // and we don't have 'results' captured here fully...
                // let's just close modal for safety or re-fetch item.

                // Since I can't easily update 'currentItem' structure deeply without logic,
                // I will skip optimistic update and rely on fetch.
            } else {
                alert('Failed to add stock');
            }
        } catch (e) {
            console.error(e);
            alert('Error adding stock');
        }
    };

    const openCreateModal = () => {
        setCurrentItem(null);
        setExistingImages([]);
        setSelectedImages([]);
        setPreviewUrls([]);
        setSelectedSize('');
        setSelectedColor('');
        setIsModalOpen(true);
    };

    const openEditModal = (item: any) => {
        setCurrentItem(item);
        setExistingImages(item.images || []);
        setSelectedImages([]);
        setPreviewUrls([]);
        setSelectedSize('');
        setSelectedColor('');
        setIsModalOpen(true);
        setIsDetailOpen(false); // Close detail if open
    };

    const openDetailModal = (item: any) => {
        setViewItem(item);
        setIsDetailOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        const form = e.target as HTMLFormElement;
        const formData = new FormData(form);

        // Append new images
        selectedImages.forEach((image) => {
            formData.append('images', image);
        });

        const url = currentItem
            ? `${API_URL}/items/${currentItem.id}`
            : `${API_URL}/items`;

        const method = currentItem ? 'PUT' : 'POST';

        try {
            const res = await fetch(url, {
                method: method,
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });
            if (res.ok) {
                setIsModalOpen(false);
                setSelectedImages([]);
                setPreviewUrls([]);
                setExistingImages([]);
                fetchItems();
            } else {
                const err = await res.json();
                alert(`Failed to save item: ${err.error || 'Unknown error'}`);
            }
        } catch (e) {
            console.error(e);
            alert('An unexpected error occurred while saving.');
        } finally {
            setLoading(false);
        }
    };

    // Filter State
    const [selectedCategory, setSelectedCategory] = useState('');
    const [selectedBrand, setSelectedBrand] = useState('');
    const [selectedStatus, setSelectedStatus] = useState('');

    const getItemStats = (item: any) => {
        let total = 0;
        let available = 0;
        let rented = 0;
        let laundry = 0;

        item.variants?.forEach((v: any) => {
            if (v.instances) {
                total += v.instances.length;
                available += v.instances.filter((i: any) => i.status === 'AVAILABLE').length;
                rented += v.instances.filter((i: any) => i.status === 'RENTED').length;
                laundry += v.instances.filter((i: any) => ['IN_LAUNDRY', 'LAUNDRY'].includes(i.status)).length;
            }
        });

        return { total, available, rented, laundry };
    };

    const columns: Column<any>[] = [
        {
            header: t('inventory.table.image'),
            accessorKey: 'images',
            className: 'w-20',
            cell: (item) => (
                <div className="w-12 h-12 bg-gray-50 rounded-lg overflow-hidden border border-gray-100 flex items-center justify-center">
                    {item.images && item.images.length > 0 ? (
                        <img src={getImageUrl(item.images[0].url)} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                        <Box size={16} className="text-gray-400" />
                    )}
                </div>
            )
        },
        {
            header: t('inventory.table.item'),
            accessorKey: 'name',
            sortable: true,
            cell: (item) => (
                <div>
                    <h3 className="font-bold text-gray-900">{item.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] bg-gray-100 px-2 py-0.5 rounded text-gray-600">{item.category?.name || 'No Cat'}</span>
                        <span className="text-[10px] bg-gray-100 px-2 py-0.5 rounded text-gray-600">{item.brand?.name || 'No Brand'}</span>
                    </div>
                </div>
            )
        },
        {
            header: t('inventory.table.rentalPrice'),
            accessorKey: 'rentalPrice',
            sortable: true,
            cell: (item) => <span className="font-medium">Rp {item.rentalPrice.toLocaleString()}</span>
        },
        {
            header: t('inventory.table.totalUnits'),
            accessorKey: 'totalUnits', // Virtual key
            cell: (item) => {
                const stats = getItemStats(item);
                return <span className="font-medium text-gray-900">{stats.total}</span>;
            }
        },
        {
            header: t('inventory.table.available'),
            accessorKey: 'available', // Virtual key
            cell: (item) => {
                const stats = getItemStats(item);
                return <span className="font-medium text-green-600">{stats.available}</span>;
            }
        },
        {
            header: t('inventory.table.inRent'),
            accessorKey: 'rented', // Virtual key
            cell: (item) => {
                const stats = getItemStats(item);
                return <span className="font-medium text-blue-600">{stats.rented}</span>;
            }
        },
        {
            header: t('inventory.table.laundry'),
            accessorKey: 'laundry', // Virtual key
            cell: (item) => {
                const stats = getItemStats(item);
                return <span className="font-medium text-purple-600">{stats.laundry}</span>;
            }
        }
    ];

    const actionColumn = (item: any) => (
        <div className="flex justify-end gap-2">
            <button onClick={(e) => { e.stopPropagation(); openEditModal(item); }} className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg" title="Edit">
                <Edit2 size={16} />
            </button>
            <button onClick={(e) => { e.stopPropagation(); openDetailModal(item); }} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg" title="View Details">
                <Eye size={16} />
            </button>
        </div>
    );

    // Apply Filters (Category/Brand/Status)
    const filteredItems = items.filter(item => {
        if (selectedCategory && item.categoryId != selectedCategory) return false;
        if (selectedBrand && item.brandId != selectedBrand) return false;

        if (selectedStatus) {
            const stats = getItemStats(item);
            if (selectedStatus === 'AVAILABLE' && stats.available === 0) return false;
            if (selectedStatus === 'OUT_OF_STOCK' && stats.available > 0) return false;
            if (selectedStatus === 'IN_LAUNDRY' && stats.laundry === 0) return false;
            if (selectedStatus === 'RENTED' && stats.rented === 0) return false;
        }

        return true;
    });

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">{t('inventory.title')}</h1>
                    <p className="text-gray-500">{t('inventory.subtitle')}</p>
                </div>
                <button
                    onClick={openCreateModal}
                    className="bg-gray-900 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-gray-800 transition-colors"
                >
                    <Plus size={18} /> {t('inventory.add')}
                </button>
            </div>

            {loading ? (
                <div className="text-center py-20 text-gray-400">{t('common.loading')}</div>
            ) : (
                <DataTable
                    data={filteredItems}
                    columns={columns}
                    searchKeys={['name', 'category.name', 'brand.name']}
                    actions={actionColumn}
                    filterSlot={
                        <div className="flex gap-2">
                            <select
                                value={selectedStatus}
                                onChange={(e) => setSelectedStatus(e.target.value)}
                                className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none"
                            >
                                <option value="">{t('inventory.filter.allStatus')}</option>
                                <option value="AVAILABLE">{t('inventory.filter.available')}</option>
                                <option value="OUT_OF_STOCK">{t('inventory.filter.outOfStock')}</option>
                                <option value="IN_LAUNDRY">{t('inventory.filter.inLaundry')}</option>
                                <option value="RENTED">{t('inventory.filter.rented')}</option>
                            </select>
                            <select
                                value={selectedCategory}
                                onChange={(e) => setSelectedCategory(e.target.value)}
                                className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none"
                            >
                                <option value="">{t('inventory.filter.allCategories')}</option>
                                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                            <select
                                value={selectedBrand}
                                onChange={(e) => setSelectedBrand(e.target.value)}
                                className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none"
                            >
                                <option value="">{t('inventory.filter.allBrands')}</option>
                                {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                            </select>
                        </div>
                    }
                />
            )}

            {/* Create/Edit Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-2xl animate-in fade-in zoom-in duration-200 overflow-y-auto max-h-[90vh]">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold">{currentItem ? t('inventory.edit') : t('inventory.newItem')}</h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-900"><X size={20} /></button>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">{t('inventory.form.itemName')}</label>
                                <input name="name" defaultValue={currentItem?.name} className="w-full p-2 border border-gray-300 rounded-lg outline-none focus:border-blue-500" required />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('inventory.form.category')}</label>
                                    <select name="categoryId" defaultValue={currentItem?.categoryId} className="w-full p-2 border border-gray-300 rounded-lg outline-none focus:border-blue-500">
                                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('inventory.form.brand')}</label>
                                    <select name="brandId" defaultValue={currentItem?.brandId} className="w-full p-2 border border-gray-300 rounded-lg outline-none focus:border-blue-500">
                                        {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">{t('inventory.table.rentalPrice')}</label>
                                <input name="rentalPrice" type="number" defaultValue={currentItem?.rentalPrice} className="w-full p-2 border border-gray-300 rounded-lg outline-none focus:border-blue-500" required />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">{t('inventory.form.description')}</label>
                                <textarea name="description" defaultValue={currentItem?.description} className="w-full p-2 border border-gray-300 rounded-lg outline-none focus:border-blue-500" rows={3}></textarea>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">{t('inventory.form.images')}</label>
                                <div className="flex flex-wrap gap-2 mb-2">
                                    {/* Existing Images */}
                                    {existingImages.map((img: any) => (
                                        <div key={img.id} className="relative w-16 h-16 rounded border overflow-hidden">
                                            <img src={getImageUrl(img.url)} alt="existing" className="w-full h-full object-cover" />
                                            <button
                                                type="button"
                                                onClick={() => removeExistingImage(img.id)}
                                                className="absolute top-0 right-0 bg-red-500 text-white p-0.5 rounded-bl hover:bg-red-700"
                                            >
                                                <X size={10} />
                                            </button>
                                        </div>
                                    ))}

                                    {/* New Preview Images */}
                                    {previewUrls.map((url, idx) => (
                                        <div key={idx} className="relative w-16 h-16 rounded border overflow-hidden">
                                            <img src={url} alt="preview" className="w-full h-full object-cover" />
                                            <button
                                                type="button"
                                                onClick={() => removeNewImage(idx)}
                                                className="absolute top-0 right-0 bg-red-500 text-white p-0.5 rounded-bl"
                                            >
                                                <X size={10} />
                                            </button>
                                        </div>
                                    ))}

                                    {(existingImages.length + previewUrls.length) < 5 && (
                                        <label className="w-16 h-16 flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded cursor-pointer hover:border-blue-500 hover:text-blue-500 transition-colors">
                                            <Plus size={20} />
                                            <input type="file" multiple accept="image/*" onChange={handleImageSelect} className="hidden" />
                                        </label>
                                    )}
                                </div>
                            </div>

                            {/* Variants Section - Create & Edit Mode */}
                            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                                <h4 className="font-bold text-gray-800 mb-3 text-sm">{t('inventory.form.manageVariants')}</h4>

                                {/* List Variants (Local or Existing) */}
                                <div className="space-y-2 mb-4">
                                    {(currentItem ? (currentItem.variants || []) : localVariants).map((v: any) => (
                                        <div key={v.id} className="flex items-center justify-between bg-white p-2 rounded shadow-sm">
                                            <div className="flex items-center gap-3">
                                                <div className="w-4 h-4 rounded-full border" style={{ backgroundColor: v.color?.hexCode }}></div>
                                                <span className="text-sm">{v.size?.name} - {v.color?.name}</span>
                                                {/* Show stock if available or quantity if local */}
                                                <span className="text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-600 font-medium">
                                                    {currentItem
                                                        ? `${t('inventory.form.stock')}: ${v.instances?.filter((i: any) => i.status === 'AVAILABLE').length || 0}`
                                                        : `${t('inventory.form.initialStock')}: ${v.quantity || 0}`
                                                    }
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                {currentItem && (
                                                    <button type="button" onClick={() => handleAddStock(v.id)} className="text-green-600 hover:bg-green-50 p-1 rounded text-xs px-2 border border-green-200">
                                                        + {t('inventory.form.addStock')}
                                                    </button>
                                                )}
                                                <button type="button" onClick={() => handleDeleteVariant(v.id)} className="text-red-500 hover:bg-red-50 p-1 rounded">
                                                    <X size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                    {((currentItem ? (currentItem.variants || []) : localVariants).length === 0) && (
                                        <p className="text-xs text-gray-500 italic">{t('inventory.form.noVariants')}</p>
                                    )}
                                </div>

                                {/* Add New */}
                                <div className="flex gap-2 items-end">
                                    <div className="flex-1">
                                        <label className="block text-xs font-medium text-gray-600 mb-1">{t('master.sizes.title')}</label>
                                        <select
                                            value={selectedSize}
                                            onChange={(e) => setSelectedSize(e.target.value)}
                                            className="w-full p-2 text-sm border rounded outline-none"
                                        >
                                            <option value="">{t('common.select')} {t('master.sizes.title')}</option>
                                            {sizes.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                        </select>
                                    </div>
                                    <div className="flex-1">
                                        <label className="block text-xs font-medium text-gray-600 mb-1">{t('master.colors.title')}</label>
                                        <select
                                            value={selectedColor}
                                            onChange={(e) => setSelectedColor(e.target.value)}
                                            className="w-full p-2 text-sm border rounded outline-none"
                                        >
                                            <option value="">{t('common.select')} {t('master.colors.title')}</option>
                                            {colors.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                        </select>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handleAddVariant}
                                        className="bg-blue-600 text-white p-2 rounded hover:bg-blue-700"
                                        disabled={!selectedSize || !selectedColor}
                                    >
                                        <Plus size={18} />
                                    </button>
                                </div>
                            </div>


                            <div className="flex justify-end gap-3 pt-4">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">{t('common.cancel')}</button>
                                <button type="submit" className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 flex items-center gap-2">
                                    <Save size={16} /> {currentItem ? t('inventory.form.saveChanges') : t('inventory.form.createItem')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* View Detail Modal */}
            {isDetailOpen && (
                <ProductDetail
                    item={viewItem}
                    onClose={() => setIsDetailOpen(false)}
                    onEdit={openEditModal}
                />
            )}
        </div>
    );
}
