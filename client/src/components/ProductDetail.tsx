import React, { useState } from 'react';
import { X, Tag, Box, AlertCircle, Trash2 } from 'lucide-react';

interface ProductDetailProps {
    item: any;
    onClose: () => void;
    onEdit: (item: any) => void;
}

export default function ProductDetail({ item, onClose, onEdit }: ProductDetailProps) {
    const [activeImage, setActiveImage] = useState(0);

    if (!item) return null;

    const images = item.images && item.images.length > 0 ? item.images : [];

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl h-[90vh] flex overflow-hidden animate-in fade-in zoom-in duration-200">

                {/* Left Side: Images */}
                <div className="w-1/2 bg-gray-100 flex flex-col relative">
                    <div className="flex-1 flex items-center justify-center p-8">
                        {images.length > 0 ? (
                            <img
                                src={`http://localhost:3000${images[activeImage].url}`}
                                alt={item.name}
                                className="max-w-full max-h-full object-contain drop-shadow-lg"
                            />
                        ) : (
                            <div className="text-gray-400 flex flex-col items-center">
                                <Box size={64} />
                                <span className="mt-2 text-sm font-medium">No Image</span>
                            </div>
                        )}
                    </div>
                    {/* Thumbnail Strip */}
                    {images.length > 1 && (
                        <div className="bg-white/80 p-4 flex gap-2 overflow-x-auto justify-center backdrop-blur-md">
                            {images.map((img: any, idx: number) => (
                                <button
                                    key={img.id}
                                    onClick={() => setActiveImage(idx)}
                                    className={`w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${activeImage === idx ? 'border-gray-900 scale-105' : 'border-transparent opacity-70 hover:opacity-100'}`}
                                >
                                    <img src={`http://localhost:3000${img.url}`} className="w-full h-full object-cover" />
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Right Side: Details */}
                <div className="w-1/2 p-8 overflow-y-auto relative">
                    <button onClick={onClose} className="absolute top-6 right-6 p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <X size={24} className="text-gray-500" />
                    </button>

                    <div className="pr-10">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide">{item.category?.name || 'Uncategorized'}</span>
                            <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide">{item.brand?.name || 'No Brand'}</span>
                        </div>
                        <h2 className="text-3xl font-bold text-gray-900 mb-2">{item.name}</h2>
                        <h3 className="text-2xl font-semibold text-gray-900 mb-6">Rp {item.rentalPrice.toLocaleString()} <span className="text-base font-normal text-gray-500">/ rental</span></h3>

                        <div className="prose prose-sm text-gray-600 mb-8">
                            <p>{item.description || 'No description provided.'}</p>
                        </div>

                        <div className="bg-gray-50 rounded-xl p-6 border border-gray-100 mb-8">
                            <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <Box size={18} /> SKU Availability
                            </h4>
                            <div className="space-y-3">
                                {item.variants && item.variants.length > 0 ? (
                                    item.variants.map((v: any) => (
                                        <div key={v.id} className="flex items-center justify-between bg-white p-3 rounded-lg border border-gray-100 shadow-sm">
                                            <div className="flex items-center gap-3">
                                                <div className="w-4 h-4 rounded-full border shadow-sm" style={{ backgroundColor: v.color?.hexCode }}></div>
                                                <span className="font-medium text-gray-700">{v.size?.name} - {v.color?.name}</span>
                                            </div>
                                            {/* Stock fetching logic would go here */}
                                            <span className={`text-sm font-semibold px-2 py-1 rounded ${(v._count?.instances || 0) > 0 ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50'}`}>
                                                {(v._count?.instances || 0)} Available
                                            </span>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-4 text-gray-500 flex flex-col items-center">
                                        <AlertCircle size={24} className="mb-2 opacity-50" />
                                        No variants configured
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button onClick={() => onEdit(item)} className="flex-1 bg-gray-900 text-white py-3 rounded-xl font-medium hover:bg-gray-800 transition-colors">
                                Edit Product
                            </button>
                            {/* Further actions like Deactivate */}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
