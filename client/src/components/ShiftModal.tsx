import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useShift } from '../context/ShiftContext';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { X, AlertTriangle, Lock, Unlock } from 'lucide-react';
import { clsx } from 'clsx';

interface OpenShiftModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const OpenShiftModal: React.FC<OpenShiftModalProps> = ({ isOpen, onClose }) => {
    const { t } = useLanguage();
    const { openShift } = useShift();
    const [startCash, setStartCash] = useState('0');
    const [notes, setNotes] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const navigate = useNavigate();
    const { business } = useAuth();

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await openShift(parseFloat(startCash), notes);
            onClose();
        } catch (error) {
            console.error(error);
            alert('Failed to open shift');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-indigo-50/50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-600 rounded-lg text-white">
                            <Unlock size={20} />
                        </div>
                        <h2 className="text-xl font-bold text-gray-800">Buka Shift Baru</h2>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg flex gap-3 text-amber-800 text-sm">
                        <AlertTriangle className="shrink-0" size={18} />
                        <p>Pastikan Anda menghitung uang di laci (drawer) sebelum mulai bekerja.</p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Uang Awal (Modal Tunai)</label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium">Rp</span>
                            <input
                                type="number"
                                value={startCash}
                                onChange={(e) => setStartCash(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all outline-none font-semibold text-lg"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Catatan (Optional)</label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 h-24 resize-none outline-none"
                            placeholder="Contoh: Shift pagi, uang pecahan 50rb habis..."
                        />
                    </div>

                    <div className="flex flex-col gap-3">
                        <button
                            type="submit"
                            disabled={submitting}
                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl transition-all shadow-lg hover:shadow-indigo-200 disabled:opacity-50"
                        >
                            {submitting ? 'Memproses...' : 'BUKA SHIFT SEKARANG'}
                        </button>
                        <button
                            type="button"
                            onClick={() => navigate(business ? `/${business.slug}/app` : '/app')}
                            className="w-full bg-white hover:bg-gray-50 text-gray-700 font-bold py-3 rounded-xl transition-all border border-gray-200"
                        >
                            Kembali ke Dashboard
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

interface CloseShiftModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const CloseShiftModal: React.FC<CloseShiftModalProps> = ({ isOpen, onClose }) => {
    const { currentShift, closeShift } = useShift();
    const [actualCash, setActualCash] = useState('');
    const [notes, setNotes] = useState('');
    const [submitting, setSubmitting] = useState(false);

    if (!isOpen || !currentShift) return null;

    const expectedCash = currentShift.expectedCash;
    const variance = (parseFloat(actualCash) || 0) - expectedCash;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!confirm('Apakah Anda yakin ingin menutup shift ini? Rekonstruksi data tidak dapat dilakukan setelah ini.')) return;
        setSubmitting(true);
        try {
            await closeShift(parseFloat(actualCash), notes);
            onClose();
        } catch (error) {
            console.error(error);
            alert('Failed to close shift');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-rose-50/50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-rose-600 rounded-lg text-white">
                            <Lock size={20} />
                        </div>
                        <h2 className="text-xl font-bold text-gray-800">Tutup Shift</h2>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/50 rounded-full transition-colors text-gray-500">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                            <p className="text-xs text-gray-500 uppercase font-bold mb-1">Modal Awal</p>
                            <p className="text-lg font-bold text-gray-800">Rp {currentShift.startCash.toLocaleString()}</p>
                        </div>
                        <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                            <p className="text-xs text-indigo-500 uppercase font-bold mb-1">Estimasi Cash (Sistem)</p>
                            <p className="text-lg font-bold text-indigo-700">Rp {expectedCash.toLocaleString()}</p>
                        </div>
                    </div>

                    <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl">
                        <label className="block text-sm font-bold text-blue-800 mb-2 underline decoration-blue-200">Uang Tunai Sebenarnya di Laci</label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-400 font-bold text-xl">Rp</span>
                            <input
                                type="number"
                                value={actualCash}
                                onChange={(e) => setActualCash(e.target.value)}
                                className="w-full pl-12 pr-4 py-4 border-2 border-blue-200 rounded-2xl focus:ring-4 focus:ring-blue-100 transition-all outline-none font-black text-2xl text-blue-900"
                                placeholder="0"
                                required
                            />
                        </div>
                    </div>

                    <div className={clsx(
                        "p-4 rounded-xl border-2 flex justify-between items-center",
                        variance === 0 ? "bg-green-50 border-green-200 text-green-700" :
                            variance > 0 ? "bg-cyan-50 border-cyan-200 text-cyan-700" :
                                "bg-rose-50 border-rose-200 text-rose-700"
                    )}>
                        <p className="font-bold flex items-center gap-2">
                            {variance === 0 ? "✅ Seimbang" : variance > 0 ? "➕ Surplus Cash" : "⚠️ Selisih Kurang"}
                        </p>
                        <p className="text-xl font-black">
                            {variance >= 0 ? "+" : ""}{variance.toLocaleString()}
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1 text-right italic">Notes penutupan...</label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-rose-500 h-20 resize-none outline-none text-sm"
                            placeholder="Contoh: Selisih 2rb karena uang parkir..."
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={submitting}
                        className="w-full bg-gray-900 hover:bg-black text-white font-bold py-4 rounded-2xl transition-all shadow-xl hover:shadow-gray-300 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        <Lock size={18} />
                        {submitting ? 'Menutup Shift...' : 'KONFIRMASI TUTUP SHIFT'}
                    </button>
                </form>
            </div>
        </div>
    );
};
