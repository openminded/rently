import { useState, useEffect } from 'react';
import { ArrowRight, ShoppingBag, Menu, X, Play, ChevronDown, ArrowUpRight, Search, MessageCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { API_BASE_URL, getImageUrl } from '../config/api';

const API_BASE = API_BASE_URL;

// Palet Warna:
// Background: #FFF8F0 (Cream)
// Teks Utama: #4A3B32 (Coklat Tua)
// Aksen: #A67C52 (Coklat Muda/Emas)
// Background Kartu: #FFFFFF

export default function LandingPage() {
    const [items, setItems] = useState<any[]>([]);
    const [appSettings, setAppSettings] = useState<any>({});
    const [loading, setLoading] = useState(true);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [categories, setCategories] = useState<any[]>([]);
    const [activeCategory, setActiveCategory] = useState<any>('ALL');
    const navigate = useNavigate();

    useEffect(() => {
        // Fetch Settings & Items in parallel
        Promise.all([
            fetch(`${API_BASE}/public/items?onlyWithImages=true`).then(res => res.json()),
            fetch(`${API_BASE}/settings/public`).then(res => res.json()),
            fetch(`${API_BASE}/public/categories`).then(res => res.json())
        ]).then(([itemsData, settingsData, categoriesData]) => {
            // Check if itemsData contains 'items' property (pagination structure) or is array
            const allItems = itemsData.items || itemsData;
            setItems(Array.isArray(allItems) ? allItems : []);
            setAppSettings(settingsData || {});
            setCategories(Array.isArray(categoriesData) ? categoriesData : []);
            setLoading(false);
        }).catch(err => {
            console.error("Gagal memuat data", err);
            setLoading(false);
        });
    }, []);

    const scrollToSection = (id: string) => {
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#FFF8F0] text-[#4A3B32] font-bold">Memuat...</div>;

    // GLOBAL TOGGLE CHECK
    if (appSettings.LANDING_ENABLE_GLOBAL === 'false') {
        window.location.href = '/app/login';
        return null;
    }

    // Filter Items for Display
    const displayedItems = activeCategory === 'ALL'
        ? items.slice(0, 8)
        : items.filter(item => item.categoryId === activeCategory).slice(0, 8);

    return (
        <div className="font-sans text-[#4A3B32] bg-[#FFF8F0] overflow-x-hidden selection:bg-[#E6D5C3]">

            {/* Navbar - Floating & Rounded */}
            <nav className="fixed top-6 left-1/2 -translate-x-1/2 w-[90%] max-w-6xl z-50 bg-white/80 backdrop-blur-md rounded-full shadow-sm border border-white/50 px-6 py-3 flex justify-between items-center transition-all">
                <div className="text-xl font-black tracking-tight uppercase cursor-pointer flex items-center gap-2" onClick={() => navigate('/')}>
                    <div className="w-3 h-3 bg-[#4A3B32] rounded-full"></div>
                    RumahDinar
                </div>

                <div className="hidden md:flex gap-8 text-sm font-bold uppercase tracking-wider text-[#8A7A6F]">
                    {[
                        { label: 'Koleksi', id: 'koleksi' },
                        { label: 'Cara Sewa', id: 'cara-sewa' },
                        { label: 'Tentang Kami', id: 'tentang-kami' },
                        { label: 'Kontak', id: 'kontak' }
                    ].map((item) => (
                        <a key={item.id} href={`#${item.id}`} className="hover:text-[#4A3B32] transition-colors relative group">
                            {item.label}
                            <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-[#4A3B32] transition-all group-hover:w-full"></span>
                        </a>
                    ))}
                </div>

                <div className="flex items-center gap-3">
                    <button className="p-2 hover:bg-[#F5EBE0] rounded-full transition-colors"><Search size={18} /></button>
                    <button className="md:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                        {mobileMenuOpen ? <X /> : <Menu />}
                    </button>
                </div>
            </nav>

            {/* Mobile Menu */}
            {mobileMenuOpen && (
                <div className="fixed inset-0 bg-[#FFF8F0] z-40 pt-32 px-6 md:hidden animate-fade-in">
                    <div className="flex flex-col gap-6 text-2xl font-black uppercase text-[#4A3B32]">
                        <a href="#" onClick={() => setMobileMenuOpen(false)}>Koleksi</a>
                        <a href="#" onClick={() => setMobileMenuOpen(false)}>Cara Sewa</a>
                        <a href="#" onClick={() => setMobileMenuOpen(false)}>Tentang Kami</a>
                        <a href="#" onClick={() => setMobileMenuOpen(false)}>Kontak</a>
                    </div>
                </div>
            )}

            {/* 1. HERO SECTION */}
            <header className="pt-40 pb-20 px-6 max-w-7xl mx-auto min-h-screen flex flex-col justify-center relative">
                {/* Garis Lengkung Dekoratif */}
                <svg className="absolute top-32 right-1/4 w-64 h-64 text-[#DCC7B3] hidden lg:block opacity-60" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1">
                    <path d="M10,10 Q50,50 90,10" />
                </svg>

                <div className="grid grid-cols-12 gap-8 items-center">
                    <div className="col-span-12 lg:col-span-6 relative z-10">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#FFE4C4] rounded-full mb-6">
                            <span className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></span>
                            <span className="text-xs font-bold uppercase tracking-wider text-[#5D4037]">
                                {appSettings.LANDING_HERO_BADGE || 'Koleksi Baru 2026'}
                            </span>
                        </div>
                        <h1 className="text-5xl md:text-7xl lg:text-8xl font-black text-[#2B211B] leading-tight mb-8">
                            {appSettings.LANDING_HERO_TITLE_1 || 'Temukan'} <br />
                            <span className="text-[#A67C52] font-serif italic font-normal">
                                {appSettings.LANDING_HERO_TITLE_ACCENT || 'Pesona'}
                            </span> <br />
                            {appSettings.LANDING_HERO_TITLE_2 || 'Nusantara'}
                        </h1>
                        <p className="text-lg text-[#8A7A6F] max-w-md mb-10 leading-relaxed font-medium">
                            {appSettings.LANDING_HERO_DESC || 'Busana premium untuk momen istimewa Anda. Sewa dengan mudah, tampil memukau tanpa harus membeli.'}
                        </p>

                        <div className="flex gap-4">
                            <button onClick={() => scrollToSection('koleksi')} className="px-8 py-4 bg-[#2B211B] text-white rounded-full font-bold shadow-lg hover:shadow-xl hover:translate-y-[-2px] transition-all flex items-center gap-2">
                                {appSettings.LANDING_HERO_CTA_PRIMARY || 'Jelajahi Sekarang'} <ArrowRight size={18} />
                            </button>
                            <button className="w-14 h-14 bg-white rounded-full flex items-center justify-center shadow-md hover:bg-[#F5EBE0] transition-colors border border-[#E6D5C3]">
                                <Play size={20} fill="currentColor" className="ml-1 text-[#2B211B]" />
                            </button>
                        </div>
                    </div>

                    <div className="col-span-12 lg:col-span-6 relative">
                        {/* Gambar Hero Utama */}
                        <div className="relative z-10 rounded-[3rem] overflow-hidden shadow-2xl bg-white p-2">
                            <div className="rounded-[2.5rem] overflow-hidden aspect-[4/5] bg-gray-100">
                                <img
                                    src={appSettings.LANDING_HERO_IMAGE || '/hero_indo.png'}
                                    alt="Hero Model"
                                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
                                />
                            </div>

                            {/* Kartu Mengambang: Harga */}
                            <div className="absolute top-10 -right-4 bg-white p-4 rounded-2xl shadow-xl flex items-center gap-4 animate-bounce-slow">
                                <div className="bg-[#FFF8F0] p-2 rounded-xl">
                                    <ShoppingBag size={20} className="text-[#A67C52]" />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 font-bold uppercase">{appSettings.LANDING_HERO_FLOAT_PRICE_LABEL || 'Set Premium'}</p>
                                    <p className="text-lg font-black text-[#2B211B]">{appSettings.LANDING_HERO_FLOAT_PRICE_VALUE || 'Rp 1.500k'}</p>
                                </div>
                            </div>

                            {/* Kartu Mengambang: Pengguna */}
                            <div className="absolute -bottom-6 -left-6 bg-white p-4 rounded-2xl shadow-lg flex gap-[-10px] items-center animate-in slide-in-from-bottom-5">
                                <div className="flex -space-x-3">
                                    {[1, 2, 3].map(i => (
                                        <div key={i} className="w-10 h-10 rounded-full border-2 border-white overflow-hidden bg-gray-200">
                                            <img src={`https://i.pravatar.cc/100?img=${i + 10}`} alt="user" className="w-full h-full object-cover" />
                                        </div>
                                    ))}
                                </div>
                                <div className="ml-4">
                                    <p className="text-sm font-bold text-[#2B211B]">{appSettings.LANDING_HERO_FLOAT_USER_COUNT || '1.2k+'}</p>
                                    <p className="text-[10px] text-gray-400 font-bold uppercase">{appSettings.LANDING_HERO_FLOAT_USER_LABEL || 'Pelanggan Puas'}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* 2. FITUR TERBARU */}
            {appSettings.LANDING_ENABLE_FEATURE !== 'false' && (
                <section className="py-20 px-6 max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-black text-[#2B211B] mb-2 uppercase tracking-wide">
                            {appSettings.LANDING_FEATURE_TITLE || 'Pilihan Editor'}
                        </h2>
                        <div className="w-20 h-1 bg-[#A67C52] mx-auto rounded-full"></div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                        <div className="relative group">
                            <div className="rounded-[2rem] overflow-hidden aspect-square shadow-lg bg-gray-100">
                                <img
                                    src={appSettings.LANDING_FEATURE_IMG_1 || 'https://images.unsplash.com/photo-1616847231454-9e7ec2a53160?q=80&w=800&auto=format&fit=crop'}
                                    alt="Feature 1"
                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                />
                            </div>
                        </div>
                        <div>
                            <div className="bg-[#E6D5C3]/30 p-10 rounded-[3rem]">
                                <h3 className="text-sm font-bold uppercase tracking-widest text-[#A67C52] mb-2">
                                    {appSettings.LANDING_FEATURE_SUBTITLE || 'Koleksi Lebaran'}
                                </h3>
                                <h2 className="text-4xl font-black text-[#2B211B] mb-4 leading-tight">
                                    {appSettings.LANDING_FEATURE_HEAD_1 || 'Tampil Anggun'} <br />
                                    {appSettings.LANDING_FEATURE_HEAD_2 || 'Di Hari Fitri'}
                                </h2>
                                <p className="text-[#8A7A6F] mb-8 leading-relaxed">
                                    {appSettings.LANDING_FEATURE_DESC || 'Temukan koleksi kaftan dan gamis eksklusif dengan bahan premium yang nyaman. Sempurna untuk silaturahmi bersama keluarga tercinta.'}
                                </p>
                                <button className="px-8 py-3 bg-[#2B211B] text-white rounded-full font-bold text-sm tracking-wide uppercase hover:bg-[#4A3B32] transition-colors shadow-lg">
                                    {appSettings.LANDING_FEATURE_CTA || 'Lihat Koleksi'}
                                </button>
                            </div>

                            <div className="mt-8 rounded-[2rem] overflow-hidden aspect-video shadow-lg relative group bg-gray-100">
                                <img
                                    src={appSettings.LANDING_FEATURE_IMG_2 || 'https://images.unsplash.com/photo-1621287959048-c84288b323bd?q=80&w=800&auto=format&fit=crop'}
                                    alt="Feature 2"
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                                />
                                <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors"></div>
                            </div>
                        </div>
                    </div>
                </section>
            )}


            {/* 3. KATALOG */}
            <section id="koleksi" className="py-10 px-6 max-w-7xl mx-auto bg-[#FDFBF7] rounded-[3rem] my-10 border border-[#F5EBE0]">
                <div className="flex flex-wrap justify-center gap-4">
                    <button
                        onClick={() => setActiveCategory('ALL')}
                        className={`px-8 py-3 rounded-full text-sm font-bold uppercase tracking-wide transition-all ${activeCategory === 'ALL'
                            ? 'bg-[#2B211B] text-white shadow-md'
                            : 'bg-transparent text-[#8A7A6F] hover:bg-[#E6D5C3]/30'
                            }`}
                    >
                        Semua
                    </button>
                    {categories.map((cat) => (
                        <button
                            key={cat.id}
                            onClick={() => setActiveCategory(cat.id)}
                            className={`px-8 py-3 rounded-full text-sm font-bold uppercase tracking-wide transition-all ${activeCategory === cat.id
                                ? 'bg-[#2B211B] text-white shadow-md'
                                : 'bg-transparent text-[#8A7A6F] hover:bg-[#E6D5C3]/30'
                                }`}
                        >
                            {cat.name}
                        </button>
                    ))}
                </div>

                {/* GRID SHOWCASE */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-12">
                    {loading ? (
                        <div className="col-span-4 text-center py-20 text-gray-400">Memuat koleksi...</div>
                    ) : displayedItems.length === 0 ? (
                        <div className="col-span-4 text-center py-20 text-gray-400">Belum ada koleksi di kategori ini</div>
                    ) : (
                        displayedItems.map((item) => (
                            <div key={item.id} className="bg-white p-3 rounded-[2rem] shadow-sm hover:shadow-xl transition-shadow group">
                                <div className="rounded-[1.5rem] overflow-hidden aspect-[3/4] mb-4 bg-gray-100 relative">
                                    <img
                                        src={item.images?.[0]?.url ? getImageUrl(item.images[0].url) : 'https://via.placeholder.com/400x600'}
                                        alt={item.name}
                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                    />
                                    <div className="absolute top-3 right-3 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
                                        {item.status === 'AVAILABLE' ? 'Tersedia' : 'Disewa'}
                                    </div>
                                </div>
                                <div className="px-2 pb-2">
                                    <h3 className="font-bold text-[#2B211B] text-lg truncate">{item.name}</h3>
                                    <div className="flex justify-between items-center mt-2">
                                        <p className="text-[#A67C52] font-black text-sm">Rp {(item.rentalPrice / 1000).toFixed(0)}rb</p>
                                        <button className="w-8 h-8 rounded-full bg-[#F5EBE0] flex items-center justify-center hover:bg-[#2B211B] hover:text-white transition-colors">
                                            <ArrowUpRight size={16} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </section>

            {/* 4. DISKON SECTION */}
            {appSettings.LANDING_ENABLE_PROMO !== 'false' && (
                <section className="py-20 px-6 max-w-7xl mx-auto">
                    <div className="bg-[#FFE4C4] rounded-[3rem] p-8 md:p-16 relative overflow-hidden">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center relative z-10">
                            <div>
                                <h2 className="text-4xl md:text-5xl font-black text-[#2B211B] mb-6 leading-tight">
                                    {appSettings.LANDING_PROMO_TITLE_1 || 'Nikmati diskon 50%'} <br />
                                    {appSettings.LANDING_PROMO_TITLE_2 || 'untuk sewa pertama'}
                                </h2>
                                <p className="text-[#5D4037] mb-8 max-w-md font-medium">
                                    {appSettings.LANDING_PROMO_DESC || 'Penawaran spesial untuk pelanggan baru. Rasakan kemewahan tanpa menguras dompet. Berlaku hingga akhir bulan.'}
                                </p>
                                <div className="bg-white p-6 rounded-3xl shadow-lg max-w-sm">
                                    <span className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1 block">
                                        {appSettings.LANDING_PROMO_BADGE || 'Rekomendasi Minggu Ini'}
                                    </span>
                                    <div className="flex justify-between items-center">
                                        <span className="text-2xl font-black text-[#2B211B]">
                                            {appSettings.LANDING_PROMO_DISCOUNT || 'Hemat 15%'}
                                        </span>
                                        <button className="px-4 py-2 bg-[#2B211B] text-white rounded-xl text-xs font-bold uppercase">
                                            {appSettings.LANDING_PROMO_CTA || 'Sewa Sekarang'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-white p-2 rounded-[2rem] shadow-lg rotate-[-3deg]">
                                    <img
                                        src={appSettings.LANDING_PROMO_IMG_1 || 'https://images.unsplash.com/photo-1542272617-08f08630329e?auto=format&fit=crop&q=80&w=400'}
                                        className="w-full aspect-[3/4] object-cover rounded-[1.5rem]" alt="Promo 1"
                                    />
                                </div>
                                <div className="bg-white p-2 rounded-[2rem] shadow-lg rotate-[3deg] mt-12">
                                    <img
                                        src={appSettings.LANDING_PROMO_IMG_2 || 'https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&q=80&w=400'}
                                        className="w-full aspect-[3/4] object-cover rounded-[1.5rem]" alt="Promo 2"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            )}

            {/* 5. CARA SEWA */}
            <section id="cara-sewa" className="py-20 px-6 max-w-7xl mx-auto">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-4xl font-black text-[#2B211B] mb-2 uppercase tracking-wide">
                        {appSettings.LANDING_HOWTO_TITLE || 'Cara Sewa Mudah'}
                    </h2>
                    <div className="w-20 h-1 bg-[#A67C52] mx-auto rounded-full"></div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {[1, 2, 3, 4].map((step) => (
                        <div key={step} className="bg-white p-6 rounded-3xl shadow-md border border-[#F5EBE0] hover:-translate-y-2 transition-transform duration-300">
                            <div className="w-12 h-12 bg-[#2B211B] text-[#E6D5C3] rounded-full flex items-center justify-center font-black text-xl mb-4 shadow-lg">
                                {step}
                            </div>
                            <h3 className="font-bold text-lg mb-2 text-[#2B211B]">
                                {appSettings[`LANDING_HOWTO_STEP_${step}_TITLE`] || `Langkah ${step}`}
                            </h3>
                            <p className="text-[#8A7A6F] text-sm leading-relaxed">
                                {appSettings[`LANDING_HOWTO_STEP_${step}_DESC`] || 'Deskripsi langkah sewa...'}
                            </p>
                        </div>
                    ))}
                </div>
            </section>

            {/* 6. TENTANG KAMI */}
            <section id="tentang-kami" className="py-20 px-6 bg-[#E6D5C3]/20">
                <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                    <div className="order-2 md:order-1">
                        <img
                            src={appSettings.LANDING_ABOUT_IMAGE || 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?q=80&w=1000&auto=format&fit=crop'}
                            alt="About Us"
                            className="rounded-[3rem] shadow-xl w-full object-cover aspect-video hover:grayscale transition-all duration-500"
                        />
                    </div>
                    <div className="order-1 md:order-2">
                        <h2 className="text-4xl font-black text-[#2B211B] mb-6 uppercase leading-tight">
                            {appSettings.LANDING_ABOUT_TITLE || 'Tentang Rumah Dinar'}
                        </h2>
                        <div className="w-20 h-1 bg-[#A67C52] mb-8 rounded-full"></div>
                        <p className="text-[#5D4037] text-lg leading-relaxed font-medium">
                            {appSettings.LANDING_ABOUT_DESC || 'Rumah Dinar hadir untuk menjawab kebutuhan fashion premium tanpa harus membeli.'}
                        </p>
                    </div>
                </div>
            </section>

            {/* 7. KONTAK */}
            <section id="kontak" className="py-20 px-6 max-w-7xl mx-auto">
                <div className="bg-[#2B211B] text-[#E6D5C3] rounded-[3rem] p-8 md:p-16 text-center">
                    <h2 className="text-3xl md:text-4xl font-black mb-8 uppercase tracking-wide text-white">
                        {appSettings.LANDING_CONTACT_TITLE || 'Hubungi Kami'}
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
                        <div className="bg-white/5 p-6 rounded-2xl backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-colors">
                            <div className="font-bold text-[#A67C52] mb-2 uppercase tracking-widest text-xs">Alamat</div>
                            <p>{appSettings.LANDING_CONTACT_ADDRESS || 'Surabaya, Indonesia'}</p>
                        </div>
                        <div className="bg-white/5 p-6 rounded-2xl backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-colors">
                            <div className="font-bold text-[#A67C52] mb-2 uppercase tracking-widest text-xs">Email</div>
                            <p>{appSettings.LANDING_CONTACT_EMAIL || 'hello@rumahdinar.com'}</p>
                        </div>
                        <div className="bg-white/5 p-6 rounded-2xl backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-colors">
                            <div className="font-bold text-[#A67C52] mb-2 uppercase tracking-widest text-xs">Telepon</div>
                            <p>{appSettings.LANDING_CONTACT_PHONE || '+62 812-3456-7890'}</p>
                        </div>
                    </div>

                    <a
                        href={`https://wa.me/${appSettings.LANDING_WA_NUMBER || '6281234567890'}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 px-8 py-4 bg-[#25D366] text-white rounded-full font-bold uppercase tracking-wide hover:bg-[#20bd5a] transition-all shadow-lg hover:scale-105"
                    >
                        <MessageCircle size={20} /> Chat WhatsApp Sekarang
                    </a>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-[#2B211B] text-[#E6D5C3] pt-24 pb-12 rounded-t-[3rem] mt-12 mx-2">
                <div className="max-w-7xl mx-auto px-8">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
                        <div className="col-span-2">
                            <h2 className="text-4xl font-black uppercase tracking-tight mb-6 text-white">RumahDinar</h2>
                            <p className="max-w-sm text-[#8A7A6F] leading-relaxed">
                                {appSettings.LANDING_FOOTER_ABOUT || 'Dari busana wisuda hingga gaun pernikahan, kami menyediakan ribuan pilihan untuk menyempurnakan hari istimewa Anda.'}
                            </p>
                            <div className="flex gap-4 mt-8">
                                {['Instagram', 'Twitter', 'Facebook'].map(social => (
                                    <div key={social} className="w-10 h-10 rounded-full border border-[#5D4037] flex items-center justify-center hover:bg-[#A67C52] hover:border-[#A67C52] hover:text-white transition-colors cursor-pointer">
                                        <span className="sr-only">{social}</span>
                                        <ArrowUpRight size={18} />
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div>
                            <h4 className="text-white font-bold uppercase tracking-wider mb-6">Menu</h4>
                            <ul className="space-y-4 text-sm font-medium text-[#8A7A6F]">
                                <li><a href="#" className="hover:text-white transition-colors">Beranda</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Koleksi</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Tentang Kami</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Hubungi</a></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="text-white font-bold uppercase tracking-wider mb-6">Bantuan</h4>
                            <ul className="space-y-4 text-sm font-medium text-[#8A7A6F]">
                                <li><a href="#" className="hover:text-white transition-colors">FAQ</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Syarat & Ketentuan</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Kebijakan Privasi</a></li>
                            </ul>
                        </div>
                    </div>

                    <div className="border-t border-[#5D4037] pt-8 flex justify-between items-center text-xs font-bold uppercase tracking-widest text-[#5D4037]">
                        <p>© 2026 Rumah Dinar Inc.</p>
                        <button className="flex items-center gap-2 hover:text-white transition-colors">
                            Kembali ke Atas <ArrowDownIcon className="rotate-180" size={14} />
                        </button>
                    </div>
                </div>
            </footer>
            {/* Floating WhatsApp Button */}
            {appSettings.LANDING_ENABLE_SOCIAL !== 'false' && appSettings.LANDING_WA_NUMBER && (
                <a
                    href={`https://wa.me/${appSettings.LANDING_WA_NUMBER}`}
                    target="_blank"
                    rel="noreferrer"
                    className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-[#25D366] rounded-full flex items-center justify-center shadow-2xl hover:scale-110 hover:-translate-y-1 transition-all duration-300 group"
                >
                    <MessageCircle size={32} className="text-white" />
                    <span className="absolute right-16 bg-white py-1 px-3 rounded-lg text-xs font-bold shadow-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                        Chat Kami
                    </span>
                </a>
            )}
        </div>
    );
}

function ArrowDownIcon({ className, size }: { className?: string, size?: number }) {
    return <ChevronDown className={className} size={size} />;
}
