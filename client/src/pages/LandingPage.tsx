import { useState, useEffect } from 'react';
import { ArrowRight, ShoppingBag, Menu, X, Play, ChevronDown, ArrowUpRight, Search, MessageCircle, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { QRCodeCanvas } from 'qrcode.react';
import {
    format,
    startOfMonth,
    endOfMonth,
    eachDayOfInterval,
    isSameDay,
    addMonths,
    subMonths,
    isToday,
    isBefore,
    startOfDay,
    getDay
} from 'date-fns';
import { id as localeId } from 'date-fns/locale';

import { API_BASE_URL, getImageUrl } from '../config/api';
import { useBrand } from '../hooks/useBrand';

const API_BASE = API_BASE_URL;

const ItemStatus = {
    AVAILABLE: 'AVAILABLE',
    RENTED: 'RENTED',
    IN_LAUNDRY: 'IN_LAUNDRY'
} as const;

// Palet Warna:
// Background: #FFF8F0 (Cream)
// Teks Utama: #4A3B32 (Coklat Tua)
// Aksen: #A67C52 (Coklat Muda/Emas)
// Background Kartu: #FFFFFF

// Background Kartu: #FFFFFF

function CalendarPicker({ variantId, onSelectRange, selectedStart, selectedEnd }: {
    variantId: number,
    onSelectRange: (start: string, end: string) => void,
    selectedStart: string,
    selectedEnd: string
}) {
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [availability, setAvailability] = useState<{ [date: string]: boolean }>({});
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!variantId) return;

        const fetchAvailability = async () => {
            setLoading(true);
            try {
                const start = startOfMonth(currentMonth);
                const end = endOfMonth(currentMonth);
                const startStr = format(start, 'yyyy-MM-dd');
                const endStr = format(end, 'yyyy-MM-dd');

                const res = await fetch(`${API_BASE_URL}/public/variants/${variantId}/availability?startDate=${startStr}&endDate=${endStr}`);
                const data = await res.json();
                setAvailability(data);
            } catch (err) {
                console.error("Gagal memuat ketersediaan", err);
            } finally {
                setLoading(false);
            }
        };

        fetchAvailability();
    }, [variantId, currentMonth]);

    const days = eachDayOfInterval({
        start: startOfMonth(currentMonth),
        end: endOfMonth(currentMonth)
    });

    const startDayOfWeek = getDay(startOfMonth(currentMonth));
    const blanks = Array(startDayOfWeek).fill(null);

    const handleDateClick = (date: Date) => {
        const dateStr = format(date, 'yyyy-MM-dd');
        if (availability[dateStr] === false) return;

        if (!selectedStart || (selectedStart && selectedEnd)) {
            onSelectRange(dateStr, '');
        } else {
            // If selecting second date, ensure it's after start
            if (isBefore(date, new Date(selectedStart))) {
                onSelectRange(dateStr, '');
            } else {
                // Check if any date in between is unavailable
                const range = eachDayOfInterval({
                    start: new Date(selectedStart),
                    end: date
                });
                const hasUnavailable = range.some(d => availability[format(d, 'yyyy-MM-dd')] === false);
                if (hasUnavailable) {
                    alert("Maaf, ada tanggal yang tidak tersedia di dalam rentang pilihan Anda.");
                    return;
                }
                onSelectRange(selectedStart, dateStr);
            }
        }
    };

    const isInRange = (date: Date) => {
        if (!selectedStart || !selectedEnd) return false;
        const d = startOfDay(date);
        const s = startOfDay(new Date(selectedStart));
        const e = startOfDay(new Date(selectedEnd));
        return (isSameDay(d, s) || isSameDay(d, e) || (d > s && d < e));
    };

    const isSelected = (date: Date) => {
        const dStr = format(date, 'yyyy-MM-dd');
        return dStr === selectedStart || dStr === selectedEnd;
    };

    const today = startOfDay(new Date());

    return (
        <div className="bg-white rounded-3xl p-4 border border-slate-100 shadow-sm">
            <div className="flex justify-between items-center mb-4 px-2">
                <h4 className="font-black text-[#2B211B] capitalize">{format(currentMonth, 'MMMM yyyy', { locale: localeId })}</h4>
                <div className="flex gap-2">
                    <button onClick={(e) => { e.preventDefault(); setCurrentMonth(subMonths(currentMonth, 1)); }} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><ChevronDown className="rotate-90" size={16} /></button>
                    <button onClick={(e) => { e.preventDefault(); setCurrentMonth(addMonths(currentMonth, 1)); }} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><ChevronDown className="-rotate-90" size={16} /></button>
                </div>
            </div>

            <div className="grid grid-cols-7 gap-1 text-center mb-2">
                {['M', 'S', 'S', 'R', 'K', 'J', 'S'].map(d => (
                    <div key={d} className="text-[10px] font-black text-slate-400 uppercase">{d}</div>
                ))}
            </div>

            <div className="grid grid-cols-7 gap-y-2 relative">
                {loading && (
                    <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] z-10 flex items-center justify-center">
                        <div className="w-5 h-5 border-2 border-[#A67C52] border-t-transparent rounded-full animate-spin"></div>
                    </div>
                )}
                {blanks.map((_, i) => <div key={`b-${i}`} />)}
                {days.map(date => {
                    const dateStr = format(date, 'yyyy-MM-dd');
                    const isAvail = availability[dateStr] !== false;
                    const past = isBefore(date, today) && !isToday(date);
                    const disabled = !isAvail || past;

                    return (
                        <button
                            key={dateStr}
                            disabled={disabled}
                            onClick={(e) => { e.preventDefault(); handleDateClick(date); }}
                            className={`
                                relative h-10 w-full flex flex-col items-center justify-center rounded-xl text-xs font-bold transition-all
                                ${isSelected(date) ? 'bg-[#2B211B] text-white z-20 shadow-md' : ''}
                                ${isInRange(date) && !isSelected(date) ? 'bg-[#F5EBE0] text-[#2B211B]' : ''}
                                ${!isSelected(date) && !isInRange(date) ? (isAvail ? 'text-[#4A3B32] hover:bg-green-50' : 'text-slate-300') : ''}
                                ${disabled ? 'cursor-not-allowed opacity-40' : 'cursor-pointer'}
                            `}
                        >
                            <span>{format(date, 'd')}</span>
                            <div className={`mt-0.5 w-1 h-1 rounded-full ${isAvail ? 'bg-green-500' : 'bg-red-500 animate-pulse'}`}></div>
                        </button>
                    );
                })}
            </div>

            <div className="mt-4 flex gap-4 px-2">
                <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    <span className="text-[9px] font-bold text-slate-400 uppercase">Tersedia</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-red-500"></div>
                    <span className="text-[9px] font-bold text-slate-400 uppercase">Penuh</span>
                </div>
            </div>
        </div>
    );
}

export default function LandingPage() {
    const [items, setItems] = useState<any[]>([]);
    const [appSettings, setAppSettings] = useState<any>({});
    const [loading, setLoading] = useState(true);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [categories, setCategories] = useState<any[]>([]);
    const [activeCategory, setActiveCategory] = useState<any>('ALL');

    // Online Booking States
    const [showBookingModal, setShowBookingModal] = useState(false);
    const [selectedItem, setSelectedItem] = useState<any>(null);
    const [bookingForm, setBookingForm] = useState({
        name: '',
        phone: '',
        email: '',
        pickupDate: '',
        returnPlanDate: ''
    });
    const [isBooking, setIsBooking] = useState(false);
    const [qrisData, setQrisData] = useState<any>(null);
    const [pollingActive, setPollingActive] = useState(false);
    const [bookingStatus, setBookingStatus] = useState<'IDLE' | 'PENDING' | 'CONFIRMED' | 'FAILED'>('IDLE');
    const [modalStep, setModalStep] = useState<'DETAIL' | 'BOOKING'>('DETAIL');
    const [selectedVariant, setSelectedVariant] = useState<any>(null);

    // Referral States
    const [referralCode, setReferralCode] = useState('');
    const [validatingReferral, setValidatingReferral] = useState(false);
    const [referralValid, setReferralValid] = useState<boolean | null>(null);
    const [referralMsg, setReferralMsg] = useState('');

    const navigate = useNavigate();
    const brand = useBrand();

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
        ? items
        : items.filter(item => item.categoryId === activeCategory);

    const handleBookingSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsBooking(true);
        try {
            const res = await fetch(`${API_BASE}/public/book`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...bookingForm,
                    items: [{ variantId: selectedVariant.id, quantity: 1 }],
                    referralCode: referralValid ? referralCode : undefined
                })
            });
            const data = await res.json();
            if (res.ok) {
                setQrisData(data);
                setBookingStatus('PENDING');
                startPolling(data.transactionId);
            } else {
                alert(data.error || 'Gagal membuat booking');
            }
        } catch (err) {
            console.error(err);
            alert('Terjadi kesalahan jaringan');
        } finally {
            setIsBooking(false);
        }
    };

    const startPolling = (txId: number) => {
        setPollingActive(true);
        const interval = setInterval(async () => {
            try {
                const res = await fetch(`${API_BASE}/public/transactions/${txId}/status`);
                const data = await res.json();
                if (data.status === 'SUCCESS' || data.resultCode === '00') {
                    setBookingStatus('CONFIRMED');
                    setPollingActive(false);
                    clearInterval(interval);
                }
            } catch (err) {
                console.error('Polling error', err);
            }
        }, 5000);

        setTimeout(() => {
            clearInterval(interval);
            setPollingActive(false);
        }, 600000); // 10 min timeout
    };

    return (
        <div className="font-sans text-[#4A3B32] bg-[#FFF8F0] overflow-x-hidden selection:bg-[#E6D5C3]">

            {/* Navbar - Floating & Rounded */}
            <nav className="fixed top-6 left-1/2 -translate-x-1/2 w-[90%] max-w-6xl z-50 bg-white/80 backdrop-blur-md rounded-full shadow-sm border border-white/50 px-6 py-3 flex justify-between items-center transition-all">
                <div className="text-xl font-black tracking-tight uppercase cursor-pointer flex items-center gap-2" onClick={() => navigate('/')}>
                    {brand.logo ? (
                        <img src={getImageUrl(brand.logo)} alt={brand.name} className="h-8 w-auto object-contain" />
                    ) : (
                        <>
                            <div className="w-3 h-3 bg-[#4A3B32] rounded-full"></div>
                            {brand.name}
                        </>
                    )}
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
                                    src={appSettings.LANDING_HERO_IMAGE ? getImageUrl(appSettings.LANDING_HERO_IMAGE) : '/hero_indo.png'}
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
                                        </div >
                                    ))}
                                </div >
                                <div className="ml-4">
                                    <p className="text-sm font-bold text-[#2B211B]">{appSettings.LANDING_HERO_FLOAT_USER_COUNT || '1.2k+'}</p>
                                    <p className="text-[10px] text-gray-400 font-bold uppercase">{appSettings.LANDING_HERO_FLOAT_USER_LABEL || 'Pelanggan Puas'}</p>
                                </div>
                            </div >
                        </div >
                    </div >
                </div >
            </header >

            {/* 2. FITUR TERBARU */}
            {
                appSettings.LANDING_ENABLE_FEATURE !== 'false' && (
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
                                        src={appSettings.LANDING_FEATURE_IMG_1 ? getImageUrl(appSettings.LANDING_FEATURE_IMG_1) : 'https://images.unsplash.com/photo-1616847231454-9e7ec2a53160?q=80&w=800&auto=format&fit=crop'}
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
                                        src={appSettings.LANDING_FEATURE_IMG_2 ? getImageUrl(appSettings.LANDING_FEATURE_IMG_2) : 'https://images.unsplash.com/photo-1621287959048-c84288b323bd?q=80&w=800&auto=format&fit=crop'}
                                        alt="Feature 2"
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                                    />
                                    <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors"></div>
                                </div>
                            </div>
                        </div>
                    </section>
                )
            }


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
                                        <button
                                            onClick={() => {
                                                if (item.status === ItemStatus.AVAILABLE) {
                                                    setSelectedItem(item);
                                                    setModalStep('DETAIL');
                                                    setSelectedVariant(null);
                                                    setShowBookingModal(true);
                                                } else {
                                                    alert('Maaf, item ini sedang tidak tersedia.');
                                                }
                                            }}
                                            className="px-6 py-2.5 rounded-full bg-[#2B211B] text-white text-[11px] font-black uppercase tracking-widest hover:bg-[#4A3B32] transition-all shadow-lg shadow-black/5"
                                        >
                                            Lihat Detail
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </section>

            {/* 4. DISKON SECTION */}
            {
                appSettings.LANDING_ENABLE_PROMO !== 'false' && (
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
                                            src={appSettings.LANDING_PROMO_IMG_1 ? getImageUrl(appSettings.LANDING_PROMO_IMG_1) : 'https://images.unsplash.com/photo-1542272617-08f08630329e?auto=format&fit=crop&q=80&w=400'}
                                            className="w-full aspect-[3/4] object-cover rounded-[1.5rem]" alt="Promo 1"
                                        />
                                    </div>
                                    <div className="bg-white p-2 rounded-[2rem] shadow-lg rotate-[3deg] mt-12">
                                        <img
                                            src={appSettings.LANDING_PROMO_IMG_2 ? getImageUrl(appSettings.LANDING_PROMO_IMG_2) : 'https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&q=80&w=400'}
                                            className="w-full aspect-[3/4] object-cover rounded-[1.5rem]" alt="Promo 2"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>
                )
            }

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
                            src={appSettings.LANDING_ABOUT_IMAGE ? getImageUrl(appSettings.LANDING_ABOUT_IMAGE) : 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?q=80&w=1000&auto=format&fit=crop'}
                            alt="About Us"
                            className="rounded-[3rem] shadow-xl w-full object-cover aspect-video hover:grayscale transition-all duration-500"
                        />
                    </div>
                    <div className="order-1 md:order-2">
                        <h2 className="text-4xl font-black text-[#2B211B] mb-6 uppercase leading-tight">
                            {appSettings.LANDING_ABOUT_TITLE || 'Tentang Werently'}
                        </h2>
                        <div className="w-20 h-1 bg-[#A67C52] mb-8 rounded-full"></div>
                        <p className="text-[#5D4037] text-lg leading-relaxed font-medium">
                            {appSettings.LANDING_ABOUT_DESC || 'Werently hadir untuk menjawab kebutuhan fashion premium tanpa harus membeli.'}
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
                            <h2 className="text-4xl font-black uppercase tracking-tight mb-6 text-white">{brand.name}</h2>
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
                        <p>© 2026 {brand.name} Inc.</p>
                        <button className="flex items-center gap-2 hover:text-white transition-colors">
                            Kembali ke Atas <ArrowDownIcon className="rotate-180" size={14} />
                        </button>
                    </div>
                </div>
            </footer>
            {/* Floating WhatsApp Button */}
            {/* Landing UI Content ends here */}

            {/* BOOKING MODAL */}
            {showBookingModal && selectedItem && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden relative border border-white/20 animate-in zoom-in-95 duration-300">
                        <button
                            onClick={() => { setShowBookingModal(false); setQrisData(null); setBookingStatus('IDLE'); }}
                            className="absolute top-6 right-6 p-2 hover:bg-slate-100 rounded-full transition-colors z-20"
                        >
                            <X size={24} />
                        </button>

                        <div className="p-6 md:p-8 max-h-[90vh] overflow-y-auto">
                            {bookingStatus === 'IDLE' && modalStep === 'DETAIL' && (
                                <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 mb-8">
                                        <div className="rounded-3xl overflow-hidden bg-slate-50 aspect-[3/4] shadow-inner">
                                            <img
                                                src={selectedItem.images?.[0]?.url ? getImageUrl(selectedItem.images[0].url) : 'https://via.placeholder.com/400x600'}
                                                className="w-full h-full object-cover"
                                                alt={selectedItem.name}
                                            />
                                        </div>
                                        <div>
                                            <h3 className="text-3xl font-black text-[#2B211B] leading-tight mb-4">{selectedItem.name}</h3>
                                            <div className="flex items-center gap-2 mb-6">
                                                <span className="text-2xl font-black text-[#A67C52]">Rp {(selectedItem.rentalPrice / 1000).toFixed(0)}rb</span>
                                                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest border-l pl-3">Per Sewa</span>
                                            </div>

                                            <div className="mb-8">
                                                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">Deskripsi</h4>
                                                <p className="text-sm text-[#8A7A6F] leading-relaxed line-clamp-4">
                                                    {selectedItem.description || 'Koleksi istimewa dengan kualitas premium, dirancang khusus untuk kenyamanan dan penampilan memukau Anda di momen berharga.'}
                                                </p>
                                            </div>

                                            <div className="mt-auto">
                                                <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-[#A67C52] mb-3">Pilih Ukuran & Warna</h4>
                                                <div className="flex flex-wrap gap-2.5">
                                                    {selectedItem.variants?.map((v: any) => (
                                                        <button
                                                            key={v.id}
                                                            onClick={() => setSelectedVariant(v)}
                                                            className={`px-5 py-3 rounded-2xl text-[11px] font-black tracking-wide transition-all border-2 ${selectedVariant?.id === v.id
                                                                ? 'bg-[#2B211B] text-white border-[#2B211B] shadow-lg shadow-black/10'
                                                                : 'bg-white text-[#4A3B32] border-slate-100 hover:border-[#A67C52]'
                                                                }`}
                                                        >
                                                            {v.size.name} • {v.color.name}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="pt-2 border-t border-slate-100 flex gap-3">
                                        <button
                                            onClick={() => setShowBookingModal(false)}
                                            className="px-6 py-4 rounded-2xl font-bold text-slate-400 hover:text-slate-600 transition-colors uppercase text-xs tracking-widest"
                                        >
                                            Batal
                                        </button>
                                        <button
                                            disabled={!selectedVariant}
                                            onClick={() => setModalStep('BOOKING')}
                                            className="flex-1 py-4 bg-[#2B211B] text-white rounded-2xl font-black uppercase tracking-widest hover:bg-[#4A3B32] transition-all shadow-xl shadow-black/5 disabled:opacity-20 disabled:grayscale"
                                        >
                                            Lanjutkan Booking
                                        </button>
                                    </div>
                                </div>
                            )}

                            {bookingStatus === 'IDLE' && modalStep === 'BOOKING' && (
                                <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                                    <button
                                        onClick={() => setModalStep('DETAIL')}
                                        className="mb-6 text-[10px] font-bold text-[#A67C52] uppercase tracking-widest flex items-center gap-1 hover:gap-2 transition-all"
                                    >
                                        ← Kembali ke Detail
                                    </button>
                                    <div className="flex items-center gap-4 mb-8 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                        <div className="w-12 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-white">
                                            <img
                                                src={selectedItem.images?.[0]?.url ? getImageUrl(selectedItem.images[0].url) : 'https://via.placeholder.com/100x150'}
                                                className="w-full h-full object-cover"
                                                alt={selectedItem.name}
                                            />
                                        </div>
                                        <div>
                                            <h3 className="font-black text-[#2B211B] line-clamp-1">{selectedItem.name}</h3>
                                            <p className="text-[10px] font-bold text-slate-400">{selectedVariant.size.name} | {selectedVariant.color.name}</p>
                                        </div>
                                    </div>

                                    <form onSubmit={handleBookingSubmit} className="space-y-5">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-1.5">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Nama Lengkap</label>
                                                <input
                                                    type="text" required value={bookingForm.name}
                                                    onChange={e => setBookingForm({ ...bookingForm, name: e.target.value })}
                                                    className="w-full px-5 py-3.5 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-[#A67C52] focus:bg-white transition-all font-bold text-sm"
                                                    placeholder="Contoh: Budi Santoso"
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">No. WhatsApp</label>
                                                <input
                                                    type="tel" required value={bookingForm.phone}
                                                    onChange={e => setBookingForm({ ...bookingForm, phone: e.target.value })}
                                                    className="w-full px-5 py-3.5 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-[#A67C52] focus:bg-white transition-all font-bold text-sm"
                                                    placeholder="0812..."
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Alamat Email</label>
                                            <input
                                                type="email" required value={bookingForm.email}
                                                onChange={e => setBookingForm({ ...bookingForm, email: e.target.value })}
                                                className="w-full px-5 py-3.5 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-[#A67C52] focus:bg-white transition-all font-bold text-sm"
                                                placeholder="budi@example.com"
                                            />
                                        </div>

                                        {/* Referral Code */}
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Kode Referral (Opsional)</label>
                                            <div className="flex gap-2">
                                                <input
                                                    type="text"
                                                    value={referralCode}
                                                    onChange={e => {
                                                        setReferralCode(e.target.value.toUpperCase());
                                                        setReferralValid(null);
                                                        setReferralMsg('');
                                                    }}
                                                    className={`flex-1 px-5 py-3 rounded-2xl bg-slate-50 border-2 transition-all font-mono font-bold text-sm uppercase ${referralValid === true ? 'border-green-500' :
                                                            referralValid === false ? 'border-red-500' : 'border-transparent'
                                                        }`}
                                                    placeholder="CONTOH10"
                                                />
                                                <button
                                                    type="button"
                                                    disabled={validatingReferral || !referralCode}
                                                    onClick={async () => {
                                                        setValidatingReferral(true);
                                                        try {
                                                            const res = await fetch(`${API_BASE}/referrals/validate`, {
                                                                method: 'POST',
                                                                headers: { 'Content-Type': 'application/json' },
                                                                body: JSON.stringify({ code: referralCode })
                                                            });
                                                            const data = await res.json();
                                                            setReferralValid(data.valid);
                                                            setReferralMsg(data.message || (data.valid ? 'Kode berhasil digunakan!' : 'Kode tidak valid'));
                                                        } catch (err) {
                                                            setReferralMsg('Gagal memvalidasi kode');
                                                        } finally {
                                                            setValidatingReferral(false);
                                                        }
                                                    }}
                                                    className="px-6 py-3 bg-[#A67C52] text-white rounded-2xl font-bold text-xs uppercase"
                                                >
                                                    {validatingReferral ? '...' : 'Cek'}
                                                </button>
                                            </div>
                                            {referralMsg && (
                                                <p className={`text-[10px] font-bold ml-1 ${referralValid ? 'text-green-600' : 'text-red-500'}`}>
                                                    {referralMsg}
                                                </p>
                                            )}
                                        </div>

                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1 block">Pilih Jadwal Sewa (Ambil & Kembali)</label>
                                            <CalendarPicker
                                                variantId={selectedVariant.id}
                                                selectedStart={bookingForm.pickupDate}
                                                selectedEnd={bookingForm.returnPlanDate}
                                                onSelectRange={(start, end) => setBookingForm(prev => ({ ...prev, pickupDate: start, returnPlanDate: end }))}
                                            />
                                            <div className="flex gap-4 p-4 bg-[#FFF8F0] rounded-2xl border border-[#E6D5C3]/50">
                                                <div className="flex-1">
                                                    <p className="text-[9px] font-black text-[#A67C52] uppercase tracking-wider mb-1">Ambil</p>
                                                    <p className="font-bold text-sm text-[#2B211B]">{bookingForm.pickupDate ? format(new Date(bookingForm.pickupDate), 'dd MMMM yyyy', { locale: localeId }) : '-'}</p>
                                                </div>
                                                <div className="w-px bg-[#E6D5C3]"></div>
                                                <div className="flex-1">
                                                    <p className="text-[9px] font-black text-[#A67C52] uppercase tracking-wider mb-1">Kembali</p>
                                                    <p className="font-bold text-sm text-[#2B211B]">{bookingForm.returnPlanDate ? format(new Date(bookingForm.returnPlanDate), 'dd MMMM yyyy', { locale: localeId }) : '-'}</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="pt-4">
                                            <button
                                                disabled={isBooking || !bookingForm.pickupDate || !bookingForm.returnPlanDate}
                                                className="w-full py-4 bg-[#2B211B] text-white rounded-2xl font-black uppercase tracking-widest hover:bg-[#4A3B32] transition-all shadow-xl shadow-orange-100 disabled:opacity-50"
                                            >
                                                {isBooking ? 'Memproses...' : 'Booking & Bayar Sekarang'}
                                            </button>
                                            <p className="text-[10px] text-center text-slate-400 mt-4 font-bold uppercase tracking-tighter italic">
                                                *Pembayaran wajib menggunakan QRIS (Duitku)
                                            </p>
                                        </div>
                                    </form>
                                </div>
                            )}

                            {bookingStatus === 'PENDING' && qrisData && (
                                <div className="text-center py-4">
                                    <h3 className="text-xl font-black text-[#2B211B] mb-2">Scan QRIS untuk Membayar</h3>
                                    <p className="text-sm text-slate-500 mb-6 font-medium">Silakan selesaikan pembayaran sebesar <br /> <span className="text-[#A67C52] font-black">Rp {qrisData.amount.toLocaleString()}</span></p>

                                    <div className="bg-white p-6 rounded-3xl shadow-inner inline-block border-4 border-slate-50 mb-6">
                                        <QRCodeCanvas value={qrisData.qrString} size={200} />
                                    </div>

                                    <div className="flex flex-col items-center gap-4">
                                        <div className="flex items-center gap-2 text-indigo-600 animate-pulse">
                                            <div className="w-2 h-2 bg-indigo-600 rounded-full"></div>
                                            <span className="text-xs font-black uppercase tracking-widest">Menunggu Pembayaran...</span>
                                        </div>
                                        <button
                                            onClick={() => window.open(qrisData.paymentUrl, '_blank')}
                                            className="text-xs font-bold text-slate-400 hover:text-[#2B211B] underline"
                                        >
                                            Buka di tab baru jika QR tidak muncul
                                        </button>
                                    </div>
                                </div>
                            )}

                            {bookingStatus === 'CONFIRMED' && (
                                <div className="text-center py-12">
                                    <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6 scale-110 shadow-lg">
                                        <Check size={40} />
                                    </div>
                                    <h3 className="text-3xl font-black text-[#2B211B] mb-3 uppercase tracking-tight">Booking Berhasil!</h3>
                                    <p className="text-slate-500 font-medium px-4 leading-relaxed">
                                        Terima kasih {bookingForm.name}. Booking Anda telah kami terima dan dikonfirmasi secara otomatis.
                                        Kami akan mengirimkan detail melalui WhatsApp.
                                    </p>
                                    <button
                                        onClick={() => setShowBookingModal(false)}
                                        className="mt-10 px-10 py-4 bg-green-600 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-green-700 transition-all shadow-xl shadow-green-100"
                                    >
                                        Tutup
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function ArrowDownIcon({ className, size }: { className?: string, size?: number }) {
    return <ChevronDown className={className} size={size} />;
}
