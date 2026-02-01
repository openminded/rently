import { useEffect, useState, useRef } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { Globe, Settings, ReceiptText, LayoutDashboard, Megaphone, Upload, Image as ImageIcon, X } from 'lucide-react';

import { API_BASE_URL, getImageUrl } from '../../config/api';

const API_URL = API_BASE_URL;

export default function AppConfig() {
    const { language, setLanguage, t } = useLanguage();
    const { token } = useAuth();
    const [settings, setSettings] = useState<any>({});
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'general' | 'landing'>('general');

    const [hasChanges, setHasChanges] = useState(false);

    useEffect(() => {
        if (!token) return;
        fetchSettings();
    }, [token]);

    const fetchSettings = async () => {
        try {
            const res = await fetch(`${API_URL}/settings`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setSettings(data);
                setHasChanges(false);
            }
        } catch (error) {
            console.error("Failed to fetch settings", error);
        } finally {
            setLoading(false);
        }
    };

    const handleLocalChange = (key: string, value: string) => {
        setSettings((prev: any) => ({ ...prev, [key]: value }));
        setHasChanges(true);
    };

    const saveAllSettings = async () => {
        try {
            const res = await fetch(`${API_URL}/settings`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(settings)
            });
            if (res.ok) {
                setHasChanges(false);
                alert('Pengaturan berhasil disimpan!');
            } else {
                alert('Gagal menyimpan pengaturan');
            }
        } catch (error) {
            console.error("Failed to update setting", error);
            alert('Error saat menyimpan');
        }
    };

    if (loading) return <div className="p-6 text-center text-gray-500">{t('common.loading')}</div>;

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold mb-6 flex items-center gap-2 text-gray-900">
                <Settings className="text-blue-600" /> {t('settings.appConfig.title')}
            </h1>

            <div className="flex border-b border-gray-200 mb-6">
                <button
                    onClick={() => setActiveTab('general')}
                    className={`px-6 py-3 border-b-2 font-bold text-sm transition-all flex items-center gap-2 ${activeTab === 'general' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                >
                    <Settings size={16} /> {t('settings.tab.general')}
                </button>
                <button
                    onClick={() => setActiveTab('landing')}
                    className={`px-6 py-3 border-b-2 font-bold text-sm transition-all flex items-center gap-2 ${activeTab === 'landing' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                >
                    <Megaphone size={16} /> {t('settings.tab.landing')}
                </button>
            </div>

            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 space-y-8">

                {activeTab === 'general' && (
                    <div className="animate-in fade-in slide-in-from-bottom-2 space-y-8">
                        {/* Language Setting */}
                        <div className="flex items-center justify-between pb-8 border-b border-gray-100">
                            <div className="flex items-start gap-4">
                                <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                                    <Globe size={24} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900 text-lg">{t('settings.appConfig.language')}</h3>
                                    <p className="text-gray-500 text-sm mt-1">{t('settings.appConfig.language.desc')}</p>
                                </div>
                            </div>

                            <div className="flex bg-gray-100 p-1.5 rounded-xl">
                                <button
                                    onClick={() => setLanguage('id')}
                                    className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${language === 'id' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                                >
                                    Bahasa Indonesia
                                </button>
                                <button
                                    onClick={() => setLanguage('en')}
                                    className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${language === 'en' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                                >
                                    English
                                </button>
                            </div>
                        </div>

                        {/* Admin Fee Setting */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-start gap-4">
                                <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
                                    <ReceiptText size={24} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900 text-lg">{t('settings.appConfig.adminFee')}</h3>
                                    <p className="text-gray-500 text-sm mt-1">{t('settings.appConfig.adminFee.desc')}</p>
                                </div>
                            </div>

                            <select
                                value={settings.ADMIN_FEE_MODE || 'DISABLED'}
                                onChange={(e) => handleLocalChange('ADMIN_FEE_MODE', e.target.value)}
                                className="bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 outline-none font-medium min-w-[200px]"
                            >
                                <option value="DISABLED">{t('settings.appConfig.adminFee.disabled')}</option>
                                <option value="PER_ITEM">{t('settings.appConfig.adminFee.perItem')}</option>
                                <option value="PER_TRANSACTION">{t('settings.appConfig.adminFee.perTransaction')}</option>
                            </select>
                        </div>

                        {/* Tax Rate Setting */}
                        <div className="flex items-center justify-between pt-8 border-t border-gray-100">
                            <div className="flex items-start gap-4">
                                <div className="p-3 bg-green-50 text-green-600 rounded-xl">
                                    <ReceiptText size={24} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900 text-lg">{t('settings.tax.title')}</h3>
                                    <p className="text-gray-500 text-sm mt-1">{t('settings.tax.desc')}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <input
                                    type="number"
                                    value={settings.TAX_RATE_DEFAULT || 0}
                                    onChange={(e) => handleLocalChange('TAX_RATE_DEFAULT', e.target.value)}
                                    className="bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 outline-none font-medium w-24 text-right"
                                    placeholder="0"
                                />
                                <span className="font-bold text-gray-500">%</span>
                            </div>
                        </div>

                        {/* Save Button for General Tab */}
                        <div className="flex justify-end pt-6 border-t border-gray-100">
                            <button
                                onClick={saveAllSettings}
                                disabled={!hasChanges}
                                className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${hasChanges
                                    ? 'bg-blue-600 text-white shadow-md hover:bg-blue-700 hover:shadow-lg transform hover:-translate-y-0.5'
                                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                    }`}
                            >
                                <Settings size={18} />
                                {t('common.save')}
                            </button>
                        </div>
                    </div>
                )}

                {activeTab === 'landing' && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
                        {/* GLOBAL TOGGLE */}
                        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 flex justify-between items-center shadow-sm">
                            <div>
                                <h3 className="font-black text-lg text-blue-900 uppercase">{t('settings.landing.toggleTitle')}</h3>
                                <p className="text-sm text-blue-700">{t('settings.landing.toggleDesc')}</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={settings.LANDING_ENABLE_GLOBAL === 'true'}
                                    onChange={(e) => handleLocalChange('LANDING_ENABLE_GLOBAL', e.target.checked ? 'true' : 'false')}
                                    className="sr-only peer"
                                />
                                <div className="w-14 h-7 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-blue-600"></div>
                            </label>
                        </div>
                        <div className="flex justify-between items-center mb-6 sticky top-[80px] z-30 bg-white/90 backdrop-blur p-4 rounded-xl border border-gray-100 shadow-sm">
                            <div className="flex gap-2 items-center text-sm text-gray-600">
                                <LayoutDashboard size={16} />
                                <span>Halaman ini mengatur konten publik.</span>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={async () => {
                                        if (confirm('Isi semua kolom dengan data default sistem? Data yang sudah ada mungkin tertimpa.')) {
                                            try {
                                                await fetch(`${API_URL}/seed`);
                                                window.location.reload();
                                            } catch (e) { alert('Gagal mengisi data default'); }
                                        }
                                    }}
                                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-xs font-bold hover:bg-gray-200 transition-colors"
                                >
                                    Isi Default
                                </button>
                                <button
                                    onClick={saveAllSettings}
                                    disabled={!hasChanges}
                                    className={`px-6 py-2 rounded-lg text-sm font-bold shadow-lg transition-all flex items-center gap-2 ${hasChanges ? 'bg-blue-600 text-white hover:bg-blue-700 hover:scale-105' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
                                >
                                    Simpan Perubahan
                                </button>
                            </div>
                        </div>

                        {/* HERO SECTION */}
                        <div className="border border-gray-200 rounded-xl p-6 relative">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="font-black text-lg text-gray-900 uppercase">Hero Section</h3>
                                <ToggleSwitch
                                    checked={settings.LANDING_ENABLE_HERO === 'true'}
                                    onChange={(val) => handleLocalChange('LANDING_ENABLE_HERO', val ? 'true' : 'false')}
                                    label="Tampilkan"
                                />
                            </div>
                            <div className={`transition-opacity ${settings.LANDING_ENABLE_HERO === 'false' ? 'opacity-50 pointer-events-none' : ''}`}>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <SettingInput label="Judul Baris 1" code="LANDING_HERO_TITLE_1" value={settings.LANDING_HERO_TITLE_1} onChange={handleLocalChange} placeholder="Default: Temukan" />
                                    <SettingInput label="Judul Aksen (Tengah/Warna Beda)" code="LANDING_HERO_TITLE_ACCENT" value={settings.LANDING_HERO_TITLE_ACCENT} onChange={handleLocalChange} placeholder="Default: Pesona" />
                                    <SettingInput label="Judul Baris 2" code="LANDING_HERO_TITLE_2" value={settings.LANDING_HERO_TITLE_2} onChange={handleLocalChange} placeholder="Default: Nusantara" />
                                    <SettingInput label="Badge (Teks Kecil Atas)" code="LANDING_HERO_BADGE" value={settings.LANDING_HERO_BADGE} onChange={handleLocalChange} placeholder="Default: Koleksi Baru 2026" />
                                </div>
                                <SettingInput label="Deskripsi (Paragraf)" code="LANDING_HERO_DESC" value={settings.LANDING_HERO_DESC} onChange={handleLocalChange} isTextarea placeholder="Default: Busana premium untuk momen istimewa Anda..." />

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-4">
                                    <SettingInput label="Teks Tombol Kiri (CTA)" code="LANDING_HERO_CTA_PRIMARY" value={settings.LANDING_HERO_CTA_PRIMARY} onChange={handleLocalChange} placeholder="Default: Jelajahi Sekarang" />
                                    <SettingInput label="Gambar Utama (Ideal: 1200x1500px - Portrait)" code="LANDING_HERO_IMAGE" value={settings.LANDING_HERO_IMAGE} onChange={handleLocalChange} isImage placeholder="Default: /hero_indo.png" />
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 bg-gray-50 p-4 rounded-lg">
                                    <SettingInput label="Label Harga" code="LANDING_HERO_FLOAT_PRICE_LABEL" value={settings.LANDING_HERO_FLOAT_PRICE_LABEL} onChange={handleLocalChange} placeholder="Set Premium" />
                                    <SettingInput label="Nominal Harga" code="LANDING_HERO_FLOAT_PRICE_VALUE" value={settings.LANDING_HERO_FLOAT_PRICE_VALUE} onChange={handleLocalChange} placeholder="Rp 1.500k" />
                                    <SettingInput label="Jumlah User" code="LANDING_HERO_FLOAT_USER_COUNT" value={settings.LANDING_HERO_FLOAT_USER_COUNT} onChange={handleLocalChange} placeholder="1.2k+" />
                                    <SettingInput label="Label User" code="LANDING_HERO_FLOAT_USER_LABEL" value={settings.LANDING_HERO_FLOAT_USER_LABEL} onChange={handleLocalChange} placeholder="Pelanggan Puas" />
                                </div>
                            </div>
                        </div>

                        {/* FEATURE SECTION */}
                        <div className="border border-gray-200 rounded-xl p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="font-black text-lg text-gray-900 uppercase">Feature / Editor's Choice</h3>
                                <ToggleSwitch
                                    checked={settings.LANDING_ENABLE_FEATURE === 'true'}
                                    onChange={(val) => handleLocalChange('LANDING_ENABLE_FEATURE', val ? 'true' : 'false')}
                                    label="Tampilkan"
                                />
                            </div>
                            <div className={`transition-opacity ${settings.LANDING_ENABLE_FEATURE === 'false' ? 'opacity-50 pointer-events-none' : ''}`}>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <SettingInput label="Judul Section (Kecil)" code="LANDING_FEATURE_TITLE" value={settings.LANDING_FEATURE_TITLE} onChange={handleLocalChange} placeholder="Default: Pilihan Editor" />
                                    <SettingInput label="Badge / Subjudul" code="LANDING_FEATURE_SUBTITLE" value={settings.LANDING_FEATURE_SUBTITLE} onChange={handleLocalChange} placeholder="Default: Koleksi Lebaran" />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <SettingInput label="Heading Baris 1" code="LANDING_FEATURE_HEAD_1" value={settings.LANDING_FEATURE_HEAD_1} onChange={handleLocalChange} placeholder="Default: Tampil Anggun" />
                                    <SettingInput label="Heading Baris 2" code="LANDING_FEATURE_HEAD_2" value={settings.LANDING_FEATURE_HEAD_2} onChange={handleLocalChange} placeholder="Default: Di Hari Fitri" />
                                </div>
                                <SettingInput label="Deskripsi" code="LANDING_FEATURE_DESC" value={settings.LANDING_FEATURE_DESC} onChange={handleLocalChange} isTextarea placeholder="Default: Temukan koleksi..." />
                                <SettingInput label="Teks Tombol" code="LANDING_FEATURE_CTA" value={settings.LANDING_FEATURE_CTA} onChange={handleLocalChange} placeholder="Default: Lihat Koleksi" />

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-4">
                                    <SettingInput label="Gambar 1 (Square - Ideal: 800x800px)" code="LANDING_FEATURE_IMG_1" value={settings.LANDING_FEATURE_IMG_1} onChange={handleLocalChange} isImage placeholder="Upload Gambar..." />
                                    <SettingInput label="Gambar 2 (Wide - Ideal: 1920x1080px)" code="LANDING_FEATURE_IMG_2" value={settings.LANDING_FEATURE_IMG_2} onChange={handleLocalChange} isImage placeholder="Upload Gambar..." />
                                </div>
                            </div>
                        </div>

                        {/* PROMO SECTION */}
                        <div className="border border-gray-200 rounded-xl p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="font-black text-lg text-gray-900 uppercase">Promo Section</h3>
                                <ToggleSwitch
                                    checked={settings.LANDING_ENABLE_PROMO === 'true'}
                                    onChange={(val) => handleLocalChange('LANDING_ENABLE_PROMO', val ? 'true' : 'false')}
                                    label="Tampilkan"
                                />
                            </div>
                            <div className={`transition-opacity ${settings.LANDING_ENABLE_PROMO === 'false' ? 'opacity-50 pointer-events-none' : ''}`}>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <SettingInput label="Judul Promo Baris 1" code="LANDING_PROMO_TITLE_1" value={settings.LANDING_PROMO_TITLE_1} onChange={handleLocalChange} placeholder="Default: Nikmati diskon 50%" />
                                    <SettingInput label="Judul Promo Baris 2" code="LANDING_PROMO_TITLE_2" value={settings.LANDING_PROMO_TITLE_2} onChange={handleLocalChange} placeholder="Default: untuk sewa pertama" />
                                </div>
                                <SettingInput label="Deskripsi" code="LANDING_PROMO_DESC" value={settings.LANDING_PROMO_DESC} onChange={handleLocalChange} isTextarea placeholder="Default: Penawaran spesial..." />

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                                    <SettingInput label="Badge Box Putih" code="LANDING_PROMO_BADGE" value={settings.LANDING_PROMO_BADGE} onChange={handleLocalChange} placeholder="Default: Rekomendasi Minggu Ini" />
                                    <SettingInput label="Teks Diskon Besar" code="LANDING_PROMO_DISCOUNT" value={settings.LANDING_PROMO_DISCOUNT} onChange={handleLocalChange} placeholder="Default: Hemat 15%" />
                                    <SettingInput label="Teks Tombol" code="LANDING_PROMO_CTA" value={settings.LANDING_PROMO_CTA} onChange={handleLocalChange} placeholder="Default: Sewa Sekarang" />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-4">
                                    <SettingInput label="Gambar Promo 1 (Portrait - Ideal: 800x1200px)" code="LANDING_PROMO_IMG_1" value={settings.LANDING_PROMO_IMG_1} onChange={handleLocalChange} isImage placeholder="Upload Gambar..." />
                                    <SettingInput label="Gambar Promo 2 (Portrait - Ideal: 800x1200px)" code="LANDING_PROMO_IMG_2" value={settings.LANDING_PROMO_IMG_2} onChange={handleLocalChange} isImage placeholder="Upload Gambar..." />
                                </div>
                            </div>
                        </div>

                        {/* HOW TO RENT */}
                        <div className="border border-gray-200 rounded-xl p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="font-black text-lg text-gray-900 uppercase">Cara Sewa (How To Rent)</h3>
                                <ToggleSwitch
                                    checked={settings.LANDING_ENABLE_HOWTO === 'true'}
                                    onChange={(val) => handleLocalChange('LANDING_ENABLE_HOWTO', val ? 'true' : 'false')}
                                    label="Tampilkan"
                                />
                            </div>
                            <div className={`transition-opacity ${settings.LANDING_ENABLE_HOWTO === 'false' ? 'opacity-50 pointer-events-none' : ''}`}>
                                <SettingInput label="Judul Section" code="LANDING_HOWTO_TITLE" value={settings.LANDING_HOWTO_TITLE} onChange={handleLocalChange} placeholder="Default: Cara Sewa Mudah" />

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                                    <div className="p-4 bg-gray-50 rounded-lg">
                                        <h4 className="font-bold mb-2 text-sm text-gray-500 uppercase">Langkah 1</h4>
                                        <SettingInput label="Judul" code="LANDING_HOWTO_STEP_1_TITLE" value={settings.LANDING_HOWTO_STEP_1_TITLE} onChange={handleLocalChange} placeholder="Pilih Busana" />
                                        <SettingInput label="Deskripsi" code="LANDING_HOWTO_STEP_1_DESC" value={settings.LANDING_HOWTO_STEP_1_DESC} onChange={handleLocalChange} isTextarea placeholder="Jelajahi koleksi..." />
                                    </div>
                                    <div className="p-4 bg-gray-50 rounded-lg">
                                        <h4 className="font-bold mb-2 text-sm text-gray-500 uppercase">Langkah 2</h4>
                                        <SettingInput label="Judul" code="LANDING_HOWTO_STEP_2_TITLE" value={settings.LANDING_HOWTO_STEP_2_TITLE} onChange={handleLocalChange} placeholder="Booking Tanggal" />
                                        <SettingInput label="Deskripsi" code="LANDING_HOWTO_STEP_2_DESC" value={settings.LANDING_HOWTO_STEP_2_DESC} onChange={handleLocalChange} isTextarea placeholder="Tentukan tanggal..." />
                                    </div>
                                    <div className="p-4 bg-gray-50 rounded-lg">
                                        <h4 className="font-bold mb-2 text-sm text-gray-500 uppercase">Langkah 3</h4>
                                        <SettingInput label="Judul" code="LANDING_HOWTO_STEP_3_TITLE" value={settings.LANDING_HOWTO_STEP_3_TITLE} onChange={handleLocalChange} placeholder="Ambil & Tampil" />
                                        <SettingInput label="Deskripsi" code="LANDING_HOWTO_STEP_3_DESC" value={settings.LANDING_HOWTO_STEP_3_DESC} onChange={handleLocalChange} isTextarea placeholder="Ambil di butik..." />
                                    </div>
                                    <div className="p-4 bg-gray-50 rounded-lg">
                                        <h4 className="font-bold mb-2 text-sm text-gray-500 uppercase">Langkah 4</h4>
                                        <SettingInput label="Judul" code="LANDING_HOWTO_STEP_4_TITLE" value={settings.LANDING_HOWTO_STEP_4_TITLE} onChange={handleLocalChange} placeholder="Kembalikan" />
                                        <SettingInput label="Deskripsi" code="LANDING_HOWTO_STEP_4_DESC" value={settings.LANDING_HOWTO_STEP_4_DESC} onChange={handleLocalChange} isTextarea placeholder="Kembalikan H+1..." />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* ABOUT US */}
                        <div className="border border-gray-200 rounded-xl p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="font-black text-lg text-gray-900 uppercase">Tentang Kami (About Us)</h3>
                                <ToggleSwitch
                                    checked={settings.LANDING_ENABLE_ABOUT === 'true'}
                                    onChange={(val) => handleLocalChange('LANDING_ENABLE_ABOUT', val ? 'true' : 'false')}
                                    label="Tampilkan"
                                />
                            </div>
                            <div className={`transition-opacity ${settings.LANDING_ENABLE_ABOUT === 'false' ? 'opacity-50 pointer-events-none' : ''}`}>
                                <SettingInput label="Judul" code="LANDING_ABOUT_TITLE" value={settings.LANDING_ABOUT_TITLE} onChange={handleLocalChange} placeholder="Default: Tentang Rumah Dinar" />
                                <SettingInput label="Deskripsi Lengkap" code="LANDING_ABOUT_DESC" value={settings.LANDING_ABOUT_DESC} onChange={handleLocalChange} isTextarea placeholder="Default: Rumah Dinar hadir..." />
                                <div className="mt-4">
                                    <SettingInput label="Gambar Ilustrasi (Landscape)" code="LANDING_ABOUT_IMAGE" value={settings.LANDING_ABOUT_IMAGE} onChange={handleLocalChange} isImage placeholder="Upload Gambar..." />
                                </div>
                            </div>
                        </div>

                        {/* CONTACT DETAIL */}
                        <div className="border border-gray-200 rounded-xl p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="font-black text-lg text-gray-900 uppercase">Detail Kontak</h3>
                                <ToggleSwitch
                                    checked={settings.LANDING_ENABLE_CONTACT === 'true'}
                                    onChange={(val) => handleLocalChange('LANDING_ENABLE_CONTACT', val ? 'true' : 'false')}
                                    label="Tampilkan"
                                />
                            </div>
                            <div className={`transition-opacity ${settings.LANDING_ENABLE_CONTACT === 'false' ? 'opacity-50 pointer-events-none' : ''}`}>
                                <SettingInput label="Judul Section" code="LANDING_CONTACT_TITLE" value={settings.LANDING_CONTACT_TITLE} onChange={handleLocalChange} placeholder="Default: Hubungi Kami" />
                                <SettingInput label="Alamat Lengkap" code="LANDING_CONTACT_ADDRESS" value={settings.LANDING_CONTACT_ADDRESS} onChange={handleLocalChange} isTextarea placeholder="Jl. Contoh..." />
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                    <SettingInput label="Email" code="LANDING_CONTACT_EMAIL" value={settings.LANDING_CONTACT_EMAIL} onChange={handleLocalChange} placeholder="hello@..." />
                                    <SettingInput label="No Telepon (Teks)" code="LANDING_CONTACT_PHONE" value={settings.LANDING_CONTACT_PHONE} onChange={handleLocalChange} placeholder="+62 812..." />
                                </div>
                            </div>
                        </div>

                        {/* CONTACT */}
                        <div className="border border-gray-200 rounded-xl p-6">
                            <h3 className="font-black text-lg mb-4 text-gray-900 uppercase">Contact & Social</h3>
                            <SettingInput label="Nomor WhatsApp (628...)" code="LANDING_WA_NUMBER" value={settings.LANDING_WA_NUMBER} onChange={handleLocalChange} placeholder="6281234567890" />
                        </div>

                        {/* FOOTER */}
                        <div className="border border-gray-200 rounded-xl p-6">
                            <h3 className="font-black text-lg mb-4 text-gray-900 uppercase">Footer</h3>
                            <SettingInput label="Teks Tentang (Kiri Bawah)" code="LANDING_FOOTER_ABOUT" value={settings.LANDING_FOOTER_ABOUT} onChange={handleLocalChange} isTextarea placeholder="Default: Dari busana wisuda..." />
                        </div>
                    </div>
                )}

            </div>
        </div >
    );
}

function ImageUpload({ url, onUpload, label }: { url: string, onUpload: (url: string) => void, label: string }) {
    const { token } = useAuth();
    const [uploading, setUploading] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        const formData = new FormData();
        formData.append('image', file);

        try {
            const res = await fetch(`${API_URL}/upload`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }, // Usually uploads are protected, adjust backend if needed
                body: formData
            });

            if (res.ok) {
                const data = await res.json();
                onUpload(data.url); // Save relative path e.g. /uploads/file.png
            } else {
                alert('Upload failed');
            }
        } catch (error) {
            console.error("Upload error", error);
            alert('Upload error');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="flex flex-col gap-2">
            <span className="text-sm font-bold text-gray-700">{label}</span>
            <div className="flex items-start gap-4">
                <div
                    className="w-24 h-24 bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center overflow-hidden relative group cursor-pointer"
                    onClick={() => inputRef.current?.click()}
                >
                    {url ? (
                        <img src={getImageUrl(url)} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                        <ImageIcon className="text-gray-400" />
                    )}
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Upload className="text-white" size={20} />
                    </div>
                </div>

                <div className="flex-1">
                    <input
                        type="text"
                        value={url || ''}
                        readOnly
                        className="w-full text-xs text-gray-500 bg-gray-50 border border-gray-200 rounded p-2 mb-2"
                        placeholder="URL akan muncul di sini..."
                    />
                    <input
                        type="file"
                        ref={inputRef}
                        onChange={handleFileChange}
                        accept="image/*"
                        className="hidden"
                    />
                    <button
                        onClick={() => inputRef.current?.click()}
                        disabled={uploading}
                        className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-semibold hover:bg-gray-50 transition-colors flex items-center gap-2"
                    >
                        {uploading ? 'Uploading...' : <><Upload size={14} /> Pilih Gambar</>}
                    </button>
                    {url && (
                        <button
                            onClick={() => onUpload('')}
                            className="mt-2 text-xs text-red-500 hover:text-red-700 flex items-center gap-1"
                        >
                            <X size={12} /> Hapus Gambar
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

function ToggleSwitch({ checked, onChange, label }: { checked: boolean, onChange: (val: boolean) => void, label: string }) {
    return (
        <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-gray-500 uppercase">{label}</span>
            <label className="relative inline-flex items-center cursor-pointer">
                <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) => onChange(e.target.checked)}
                    className="sr-only peer"
                />
                <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
        </div>
    );
}

function SettingInput({ label, code, value, onChange, placeholder, isTextarea = false, isImage = false }: any) {
    const [localValue, setLocalValue] = useState(value || '');

    useEffect(() => {
        setLocalValue(value || '');
    }, [value]);

    if (isImage) {
        return (
            <div className="mb-4">
                <ImageUpload
                    url={value}
                    onUpload={(url) => onChange(code, url)}
                    label={label}
                />
            </div>
        );
    }

    return (
        <div className="mb-4">
            <label className="block text-sm font-bold text-gray-700 mb-1">{label}</label>
            {isTextarea ? (
                <textarea
                    value={localValue}
                    onChange={(e) => setLocalValue(e.target.value)}
                    onBlur={() => onChange(code, localValue)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none transition-all h-24 resize-none"
                    placeholder={placeholder}
                />
            ) : (
                <input
                    type="text"
                    value={localValue}
                    onChange={(e) => setLocalValue(e.target.value)}
                    onBlur={() => onChange(code, localValue)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    placeholder={placeholder}
                />
            )}

        </div>
    );
}
