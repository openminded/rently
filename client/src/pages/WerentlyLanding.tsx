import { useState, useEffect } from 'react';
import { ArrowRight, Check, Play, LayoutDashboard, MessageSquare, Calendar, ShieldCheck, BarChart3, Users, Globe, ShoppingCart, RotateCcw, TrendingUp, Smartphone, CreditCard, X, Maximize2, Calculator, Ticket } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import SEO from '../components/SEO';

const TRANSLATIONS = {
    en: {
        nav: {
            features: "Features",
            pricing: "Pricing",
            testimonials: "Testimonials",
            demoStore: "Demo Store",
            login: "Log In",
            getStarted: "Get Started"
        },
        hero: {
            badge: "SaaS Digital Transformation v1.0",
            titlePrefix: "Rental Solved,",
            titleAccent: "Business Evolved.",
            description: "Are you still struggling with manual bookkeeping? Werently is your Digital Personal Assistant for seamless rental management.",
            ctaPrimary: "Start Free Trial",
            ctaSecondary: "Watch Demo",
            trustedBy: "Trusted by 100+ Fashion Business Owners",
            dashboardPreview: "Dashboard Preview"
        },
        gallery: {
            title: "Designed for Growth",
            subtitle: "A professional interface that your team and customers will love.",
            dashTitle: "Smart Insights",
            dashDesc: "Monitor revenue, top products, and real-time inventory performance at a glance.",
            posTitle: "Hyper-fast POS",
            posDesc: "Close deals in seconds with barcode support and instant offline-ready receipts.",
            catTitle: "Storefront Pro",
            catDesc: "Your entire inquiry-ready catalog, automatically synced and mobile-optimized.",
            finTitle: "Auto-Accounting",
            finDesc: "Detailed P&L and cashflow reports that are always ready for tax season."
        },
        features: {
            headerTitle: "Powerful Features",
            headerSubtitle: "Everything you need to run your rental business.",
            headerDesc: "Stop using spreadsheets. Upgrade to a system designed for growth, efficiency, and peace of mind.",
            items: [
                {
                    title: "360° Vision Dashboard",
                    problem: "Manual bookkeeping leaves owners 'data-blind' and relying on guesswork for growth.",
                    solution: "Real-time analytics monitor revenue, item rankings, and growth metrics instantly.",
                    highlight: "Data-driven decisions.",
                    tag: "Analytics"
                },
                {
                    title: "Smart Inventory Controls",
                    problem: "Double bookings damage reputation and lead to lost revenue through scheduling chaos.",
                    solution: "Automated availability engine cross-references dates and stock to ensure zero conflicts.",
                    highlight: "Zero scheduling conflicts.",
                    tag: "Management"
                },
                {
                    title: "High-Performance POS",
                    problem: "Slow checkout processes frustrate customers and lead to high error rates in manual entry.",
                    solution: "Lightning-fast terminal with barcode support and instant digital receipt generation.",
                    highlight: "3x faster checkout.",
                    tag: "Checkout"
                },
                {
                    title: "Automated Online Catalog",
                    problem: "Maintaining a separate website is expensive and inventory is often out of sync.",
                    solution: "Live professional storefront that automatically reflects your current physical inventory.",
                    highlight: "24/7 customer engagement.",
                    tag: "Commerce"
                },
                {
                    title: "Precision Asset Tracking",
                    problem: "Expensive assets get lost or swapped due to lack of unique item identity tracking.",
                    solution: "Unique SKU tracking for every item to monitor condition and individual rental history.",
                    highlight: "Asset preservation.",
                    tag: "Security"
                },
                {
                    title: "Seamless Laundry Workflow",
                    problem: "Stock gets stuck in cleaning cycles, leading to empty shelves and missed rental opportunities.",
                    solution: "Integrated tracking for laundry flow that automatically restocks items once cleaned.",
                    highlight: "Optimized stock rotation.",
                    tag: "Operations"
                },
                {
                    title: "Institutional Financials",
                    problem: "Mixed revenue, deposits, and expenses make it impossible to calculate real net profit.",
                    solution: "Automated separation of cashflow streams for transparent, real-time profitability reports.",
                    highlight: "Transparent cashflow.",
                    tag: "Finance"
                },
                {
                    title: "Referral & Commission System",
                    problem: "Acquiring new customers through ads is expensive and often has low conversion rates.",
                    solution: "Turn your customers into brand advocates with a robust referral system and automated payouts.",
                    highlight: "Scalable organic growth.",
                    tag: "Referral"
                },
                {
                    title: "Verified QRIS Integration",
                    problem: "Checking bank mutations manually is exhausting and prone to fraudulent transfer proofs.",
                    solution: "Instant payment verification that automatically marks orders as paid upon success.",
                    highlight: "Secure automated payments.",
                    tag: "Payments"
                }
            ]
        },
        stats: {
            headline: "Ready to scale your operations?",
            benefits: ['Unlimited transactions', 'Secure cloud storage', '24/7 dedicated support'],
            cta: "Get Manager Access",
            items: [
                { label: 'Transactions', val: '50k+' },
                { label: 'Active Users', val: '2,000+' },
                { label: 'Assets Managed', val: '150k+' },
                { label: 'Uptime', val: '99.9%' }
            ]
        },
        pricing: {
            title: "Scaling with Your Success",
            subtitle: "Choose the package that aligns with your business growth and operational needs.",
            plans: [
                {
                    name: 'Starter',
                    desc: 'Essential tools for manual sellers transitioning to digital.',
                    features: ['Up to 100 Inventory Items', 'Basic Bookkeeping & Reports', '1 Manager Access', 'Manual Payment Records', 'No Online Catalog'],
                    cta: "Get Started Free"
                },
                {
                    name: 'Pro',
                    desc: 'For high-volume rental businesses needing automation.',
                    features: ['Unlimited Items', 'Hyper-fast POS Terminal', 'Referral & Commission System', 'Auto-restock Laundry Flow', 'Advanced 360° Analytics & Finance', 'Multi-User Access'],
                    cta: "Upgrade to Pro"
                },
                {
                    name: 'Enterprise',
                    desc: 'For multi-branch or institutional rental operations.',
                    features: ['Custom Website & Storefront', 'Online Booking System', 'Institutional Financial Reports', 'QRIS Auto-Verification', 'Multi-Branch Sync', 'API Export & Integrations'],
                    cta: "Contact Sales"
                }
            ]
        },
        footer: {
            description: "Empowering rental businesses with modern tools for a seamless experience. Built for reliability, designed for growth.",
            product: "Product",
            company: "Company",
            integrations: "Integrations",
            changelog: "Changelog",
            about: "About",
            careers: "Careers",
            contact: "Contact",
            privacyPolicy: "Privacy Policy",
            rights: "© 2026 Werently Inc. All rights reserved."
        }
    },
    id: {
        nav: {
            features: "Fitur",
            pricing: "Harga",
            testimonials: "Testimoni",
            demoStore: "Demo Toko",
            login: "Masuk",
            getStarted: "Mulai Sekarang"
        },
        hero: {
            badge: "Transformasi Digital Bisnis Sewa v1.0",
            titlePrefix: "Sewa Beres,",
            titleAccent: "Bisnis Sukses.",
            description: "Werently hadir sebagai Asisten Pribadi Digital yang membereskan kekacauan operasional bisnis sewa Anda.",
            ctaPrimary: "Coba Gratis Sekarang",
            ctaSecondary: "Lihat Demo",
            trustedBy: "Dipercaya 100+ Pemilik Bisnis Sewa Busana",
            dashboardPreview: "Pratinjau Dashboard"
        },
        gallery: {
            title: "Didesain untuk Pertumbuhan",
            subtitle: "Interface profesional yang akan dicintai oleh tim dan pelanggan Anda.",
            dashTitle: "Dashboard Pintar",
            dashDesc: "Pantau omset, produk terlaris, dan stok real-time dalam satu layar intuitif.",
            posTitle: "Kasir POS Kilat",
            posDesc: "Transaksi beres dalam hitungan detik dengan dukungan barcode dan struk kilat.",
            catTitle: "Katalog Profesional",
            catDesc: "Toko inquiry online yang sinkron otomatis dan tampil sempurna di mobile.",
            finTitle: "Laporan Keuangan Instan",
            finDesc: "Laporan laba rugi dan arus kas rapi, siap pakai tanpa perlu rekap manual."
        },
        features: {
            headerTitle: "Fitur Canggih",
            headerSubtitle: "Semua yang Anda butuhkan untuk bisnis rental.",
            headerDesc: "Tinggalkan cara lama pakai spreadsheet. Beralih ke sistem yang dirancang untuk efisiensi dan pertumbuhan bisnis.",
            items: [
                {
                    title: "Dashboard Monitoring 360°",
                    problem: "Pembukuan manual bikin 'buta data' dan hanya tebak-tebakan saat ambil keputusan.",
                    solution: "Analitik real-time pantau omset, ranking produk, dan performa bisnis secara instan.",
                    highlight: "Keputusan berbasis data.",
                    tag: "Analitik"
                },
                {
                    title: "Smart Booking & Calendar",
                    problem: "Double booking hancurkan reputasi dan bikin rugi karena jadwal yang berantakan.",
                    solution: "Sistem cek ketersediaan otomatis yang memvalidasi stok untuk cegah jadwal bentrok.",
                    highlight: "Bebas jadwal bentrok.",
                    tag: "Manajemen"
                },
                {
                    title: "Kasir POS Kecepatan Tinggi",
                    problem: "Antrean panjang bikin pelanggan kabur dan rawan kesalahan catat transaksi manual.",
                    solution: "Terminal kasir kilat dengan dukungan barcode dan cetak struk digital otomatis.",
                    highlight: "Checkout 3x lebih cepat.",
                    tag: "Kasir"
                },
                {
                    title: "Katalog Online Otomatis",
                    problem: "Bikin website itu mahal dan stok katalog sering tidak sinkron dengan stok fisik.",
                    solution: "Etalase profesional yang otomatis ter-update mengikuti stok riil di toko Anda.",
                    highlight: "Akses pelanggan 24/7.",
                    tag: "Commerce"
                },
                {
                    title: "Pelacakan Aset Presisi",
                    problem: "Barang branded sering hilang atau tertukar karena tidak ada identitas unik per item.",
                    solution: "Pelacakan SKU unik per item untuk pantau kondisi dan riwayat sewa setiap aset.",
                    highlight: "Keamanan aset mutlak.",
                    tag: "Keamanan"
                },
                {
                    title: "Alur Kerja Laundry Mulus",
                    problem: "Baju tertahan di laundry bikin stok kosong dan kehilangan potensi omset sewa.",
                    solution: "Tracking alur laundry terintegrasi yang otomatis restock barang saat selesai dicuci.",
                    highlight: "Rotasi stok optimal.",
                    tag: "Operasional"
                },
                {
                    title: "Laporan Keuangan Institusional",
                    problem: "Uang sewa, deposit, dan biaya operasional campur aduk hingga laba asli tak terlacak.",
                    solution: "Pemisahan kas otomatis per aliran dana untuk laporan laba rugi yang transparan.",
                    highlight: "Cashflow transparan.",
                    tag: "Keuangan"
                },
                {
                    title: "Sistem Referral & Komisi",
                    problem: "Biaya iklan semakin mahal dan sulit mendapatkan pelanggan baru yang loyal.",
                    solution: "Ubah pelanggan jadi marketing Anda dengan sistem referral otomatis dan pencairan komisi transparan.",
                    highlight: "Pertumbuhan organik eksponensial.",
                    tag: "Referral"
                },
                {
                    title: "Integrasi QRIS Terverifikasi",
                    problem: "Cek mutasi manual sangat melelahkan dan rawan tertipu bukti transfer palsu.",
                    solution: "Verifikasi pembayaran instan yang otomatis tandai transaksi 'Lunas' begitu sukses.",
                    highlight: "Pembayaran otomatis & aman.",
                    tag: "Pembayaran"
                }
            ]
        },
        stats: {
            headline: "Siap mengembangkan bisnis Anda?",
            benefits: ['Transaksi tanpa batas', 'Penyimpanan cloud aman', 'Support prioritas 24/7'],
            cta: "Dapatkan Akses Manager",
            items: [
                { label: 'Transaksi', val: '50rb+' },
                { label: 'Pengguna Aktif', val: '2,000+' },
                { label: 'Aset Dikelola', val: '150rb+' },
                { label: 'Uptime', val: '99.9%' }
            ]
        },
        pricing: {
            title: "Tumbuh Bersama Werently",
            subtitle: "Pilih paket yang sesuai dengan skala operasional dan ambisi bisnis Anda.",
            plans: [
                {
                    name: 'Starter',
                    desc: 'Solusi dasar untuk mulai mendigitalkan pembukuan Anda.',
                    features: ['Maksimal 100 Item Barang', 'Laporan Keuangan Dasar', '1 Akses Manager', 'Input Pembayaran Manual', 'Belum Termasuk Katalog'],
                    cta: "Mulai Sekarang"
                },
                {
                    name: 'Pro',
                    desc: 'Untuk bisnis sewa aktif yang butuh kecepatan dan efisiensi.',
                    features: ['Jumlah Barang Tanpa Batas', 'Terminal Kasir POS Kilat', 'Laporan Keuangan Standar', 'Sistem Referral & Komisi', 'Alur Laundry Otomatis', 'Dashboard Analitik 360°'],
                    cta: "Pilih Paket Pro"
                },
                {
                    name: 'Enterprise',
                    desc: 'Untuk operasional multi-cabang atau skala institusi.',
                    features: ['Website & Katalog Mandiri', 'Sistem Booking Online', 'Laporan Keuangan Institusi', 'Verifikasi QRIS Otomatis', 'Sinkronisasi Multi-Cabang', 'Ekspor API & Integrasi'],
                    cta: "Hubungi Sales"
                }
            ]
        },
        footer: {
            description: "Memberdayakan bisnis rental dengan alat modern untuk pengalaman yang mulus. Dibangun untuk keandalan, didesain untuk pertumbuhan.",
            product: "Produk",
            company: "Perusahaan",
            integrations: "Integrasi",
            changelog: "Catatan Perubahan",
            about: "Tentang Kami",
            careers: "Karir",
            contact: "Kontak",
            privacyPolicy: "Kebijakan Privasi",
            rights: "© 2026 Werently Inc. Hak cipta dilindungi."
        }
    }
};



export default function WerentlyLanding() {
    const navigate = useNavigate();
    const [lang, setLang] = useState<'en' | 'id'>('id');
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const [simTransactions, setSimTransactions] = useState(50);
    const [simPrice, setSimPrice] = useState(1000000);

    useEffect(() => {
        const userLang = navigator.language || navigator.languages[0];
        if (userLang.toLowerCase().includes('id')) {
            setLang('id');
        }
    }, []);

    const t = TRANSLATIONS[lang];

    const structuredData = {
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        "name": "Werently",
        "applicationCategory": "BusinessApplication",
        "operatingSystem": "Web, Android, iOS",
        "offers": {
            "@type": "Offer",
            "price": "0",
            "priceCurrency": "IDR"
        },
        "description": t.hero.description,
        "aggregateRating": {
            "@type": "AggregateRating",
            "ratingValue": "4.8",
            "ratingCount": "120"
        }
    };

    const handleWhatsAppCTA = (context?: string) => {
        let message = "";

        if (lang === 'id') {
            if (context === 'Starter') message = "Halo Werently, saya tertarik untuk mencoba Paket Starter.";
            else if (context === 'Pro') message = "Halo Werently, saya ingin tahu lebih lanjut tentang Paket Pro.";
            else if (context === 'Enterprise') message = "Halo Werently, saya butuh solusi kustom untuk Paket Enterprise kami.";
            else if (context === 'ManagerAccess') message = "Halo Werently, saya ingin membeli akses manager tambahan untuk akun saya.";
            else message = "Halo Werently, saya tertarik untuk mengetahui detail produk Werently lebih lanjut.";
        } else {
            if (context === 'Starter') message = "Hello Werently, I'm interested in trying out the Starter Plan.";
            else if (context === 'Pro') message = "Hello Werently, I want to learn more about the Pro Plan.";
            else if (context === 'Enterprise') message = "Hello Werently, I need a custom solution for our Enterprise needs.";
            else if (context === 'ManagerAccess') message = "Hello Werently, I'm interested in buying additional manager access for my account.";
            else message = "Hello Werently, I'm interested in learning more about Werently's product details.";
        }

        window.open(`https://wa.me/6285117535324?text=${encodeURIComponent(message)}`, '_blank');
    };

    const featureIcons = [
        <LayoutDashboard size={24} strokeWidth={1.5} />,
        <Calendar size={24} strokeWidth={1.5} />,
        <ShoppingCart size={24} strokeWidth={1.5} />,
        <Globe size={24} strokeWidth={1.5} />,
        <ShieldCheck size={24} strokeWidth={1.5} />,
        <RotateCcw size={24} strokeWidth={1.5} />,
        <TrendingUp size={24} strokeWidth={1.5} />,
        <Ticket size={24} strokeWidth={1.5} />,
        <Smartphone size={24} strokeWidth={1.5} />
    ];

    const featureColors = [
        "bg-slate-900/10 text-slate-900 border-slate-900/10",
        "bg-indigo-600/10 text-indigo-600 border-indigo-600/10",
        "bg-emerald-600/10 text-emerald-600 border-emerald-600/10",
        "bg-blue-600/10 text-blue-600 border-blue-600/10",
        "bg-rose-600/10 text-rose-600 border-rose-600/10",
        "bg-sky-600/10 text-sky-600 border-sky-600/10",
        "bg-violet-600/10 text-violet-600 border-violet-600/10",
        "bg-amber-600/10 text-amber-600 border-amber-600/10",
        "bg-teal-600/10 text-teal-600 border-teal-600/10"
    ];

    const Logo = ({ className = "w-10 h-10" }: { className?: string }) => (
        <div className={`${className} bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-100 relative overflow-hidden group/logo`}>
            <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover/logo:opacity-100 transition-opacity"></div>
            <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-white relative z-10" xmlns="http://www.w3.org/2000/svg">
                <path d="M4 6L8 18L12 9L16 18L20 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        </div>
    );

    return (
        <div className="min-h-screen bg-white font-sans text-slate-900 selection:bg-indigo-100 selection:text-indigo-900">
            <SEO
                title={lang === 'id' ? "Aplikasi Kasir Laundry & Sewa Baju Terbaik" : "Best Laundry POS & Rental Management Software"}
                description={lang === 'id'
                    ? "Kelola bisnis sewa baju, kostum, dan laundry dalam satu aplikasi. Fitur lengkap: Stok, Kasir Online, Website Katalog, dan Laporan Keuangan."
                    : "Manage your rental business, costumes, and laundry in one app. Features: Inventory, Online POS, Catalog Website, and Financial Reports."}
                keywords="aplikasi laundry, software rental, kasir sewa baju, manajemen stok, werently, pos laundry"
            />
            <script type="application/ld+json">
                {JSON.stringify(structuredData)}
            </script>

            {/* Minimalist Navigation */}
            <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-100">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-2.5 cursor-pointer group" onClick={() => navigate('/')}>
                        <Logo className="w-9 h-9" />
                        <span className="text-xl font-black text-slate-900 tracking-tighter group-hover:text-indigo-600 transition-colors">werently.</span>
                    </div>

                    <div className="hidden lg:flex items-center gap-10 text-[13px] font-bold text-slate-500 uppercase tracking-widest">
                        <a href="#features" className="hover:text-indigo-600 transition-colors">{t.nav.features}</a>
                        <a href="#pricing" className="hover:text-indigo-600 transition-colors">{t.nav.pricing}</a>
                        <a href="#testimonials" className="hover:text-indigo-600 transition-colors">{t.nav.testimonials}</a>
                        <a href="/store" className="hover:text-indigo-600 transition-colors">{t.nav.demoStore}</a>
                    </div>

                    <div className="flex items-center gap-3 lg:gap-6">
                        <button onClick={() => setLang(lang === 'en' ? 'id' : 'en')} className="flex items-center gap-1.5 text-xs font-black text-slate-400 hover:text-indigo-600 px-2 py-2 transition-colors uppercase tracking-widest">
                            <Globe size={14} className="hidden sm:block" /> {lang}
                        </button>

                        <button onClick={() => navigate('/register')} className="hidden sm:block bg-indigo-600 text-white px-5 lg:px-8 py-3 rounded-xl text-[11px] lg:text-xs font-black uppercase tracking-widest hover:bg-indigo-700 hover:shadow-2xl hover:-translate-y-0.5 transition-all shadow-indigo-200 shadow-xl">
                            {t.nav.getStarted}
                        </button>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <header className="pt-24 lg:pt-32 pb-16 lg:pb-20 px-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-full lg:w-1/2 h-full bg-gradient-to-bl from-indigo-50/50 to-white -z-10 rounded-bl-[60px] lg:rounded-bl-[100px]" />
                <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-xs font-bold uppercase tracking-wider mb-6 border border-indigo-100">
                            <span className="w-2 h-2 bg-indigo-600 rounded-full animate-pulse"></span>
                            {t.hero.badge}
                        </div>
                        <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold leading-tight text-slate-900 mb-6 lg:mb-8 tracking-tight">
                            {t.hero.titlePrefix} <br className="hidden sm:block" />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">
                                {t.hero.titleAccent}
                            </span>
                        </h1>
                        <p className="text-lg text-slate-500 mb-10 max-w-lg leading-relaxed">
                            {t.hero.description}
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4">
                            <button onClick={() => navigate('/register')} className="px-8 py-4 bg-indigo-600 text-white rounded-full font-bold shadow-xl shadow-indigo-200 hover:shadow-2xl hover:-translate-y-1 transition-all flex items-center justify-center gap-2">
                                {t.hero.ctaPrimary} <ArrowRight size={18} />
                            </button>
                            <button className="px-8 py-4 bg-white text-slate-700 border border-slate-200 rounded-full font-bold hover:bg-slate-50 transition-all flex items-center justify-center gap-2">
                                <Play size={18} className="fill-slate-700" /> {t.hero.ctaSecondary}
                            </button>
                        </div>
                        <div className="mt-10 flex items-center gap-4 text-sm text-slate-400 font-medium">
                            <div className="flex -space-x-2">
                                {[1, 2, 3, 4].map(i => (
                                    <div key={i} className="w-8 h-8 rounded-full bg-slate-200 border-2 border-white" />
                                ))}
                            </div>
                            <p>{t.hero.trustedBy}</p>
                        </div>
                    </div>
                    <div className="relative group mt-8 lg:mt-0">
                        <div className="absolute inset-0 bg-indigo-600 blur-[120px] opacity-20 rounded-full hidden lg:block"></div>

                        {/* POS Mockup (Back Layer) */}
                        <div className="absolute -left-12 -bottom-12 w-full bg-white rounded-2xl p-2 shadow-2xl border border-slate-100 -rotate-6 group-hover:-rotate-3 transition-transform duration-700 overflow-hidden z-10 hidden lg:block">
                            <div className="rounded-xl overflow-hidden aspect-[16/10] relative bg-slate-50 border border-slate-100 shadow-inner p-3 text-[10px]">
                                <div className="flex flex-col h-full bg-white rounded-lg shadow-sm border border-slate-200">
                                    <div className="p-2 border-b border-slate-100 flex justify-between items-center bg-indigo-600 text-white">
                                        <div className="font-bold flex items-center gap-1.5"><ShoppingCart size={10} strokeWidth={2} /> Werently POS</div>
                                        <div className="text-[7px] opacity-80">Kasir: Admin Utama</div>
                                    </div>
                                    <div className="flex-1 flex overflow-hidden">
                                        <div className="flex-1 p-2 grid grid-cols-3 gap-1.5 overflow-y-auto content-start">
                                            {[
                                                { n: "Kebaya Merah", p: "150k" },
                                                { n: "Jas Formal", p: "250k" },
                                                { n: "Batik Solo", p: "120k" },
                                                { n: "Gaun Pesta", p: "350k" },
                                                { n: "Beskap Jawa", p: "200k" },
                                                { n: "Jas Slimfit", p: "275k" }
                                            ].map((prod, i) => (
                                                <div key={i} className="p-1.5 border border-slate-100 rounded bg-white hover:border-indigo-200 transition-colors shadow-sm">
                                                    <div className="w-full aspect-square bg-slate-100 rounded-sm mb-1"></div>
                                                    <div className="font-bold truncate">{prod.n}</div>
                                                    <div className="text-indigo-600 font-bold">{prod.p}</div>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="w-24 border-l border-slate-100 bg-slate-50/50 p-2 flex flex-col">
                                            <div className="font-bold border-b border-slate-200 pb-1 mb-2">Keranjang</div>
                                            <div className="flex-1 text-[7px] space-y-1.5">
                                                <div className="flex justify-between font-medium"><span>Kebaya Merah</span><span>x1</span></div>
                                                <div className="flex justify-between font-medium"><span>Jas Formal</span><span>x1</span></div>
                                            </div>
                                            <div className="mt-auto border-t border-indigo-100 pt-2">
                                                <div className="flex justify-between font-bold text-slate-900 mb-2"><span>Total</span><span>400k</span></div>
                                                <div className="w-full py-1.5 bg-indigo-600 text-white rounded-md text-center font-bold shadow-md cursor-pointer hover:bg-indigo-700 transition-colors">BAYAR</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Dashboard Mockup (Front Layer) */}
                        <div className="relative bg-white rounded-2xl p-1.5 lg:p-2 shadow-2xl border border-slate-100 lg:translate-x-4 rotate-1 lg:rotate-1 group-hover:rotate-0 transition-transform duration-700 overflow-hidden z-20 scale-95 lg:scale-100">
                            <div className="rounded-xl overflow-hidden aspect-[16/10] relative bg-slate-50 border border-slate-100 shadow-inner p-2 lg:p-4 text-[7px] lg:text-[10px]">
                                {/* High-Fidelity Dashboard Mockup */}
                                <div className="flex flex-col h-full bg-white rounded-lg shadow-sm overflow-hidden border border-slate-200">
                                    <div className="p-3 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                                        <div className="font-bold text-slate-800 flex items-center gap-1.5"><LayoutDashboard size={12} strokeWidth={2} className="text-indigo-600" /> Owner Dashboard</div>
                                        <div className="flex gap-1">
                                            <div className="px-1.5 py-0.5 bg-indigo-600 text-white rounded-sm text-[8px]">Last 3 Months</div>
                                            <div className="px-1.5 py-0.5 bg-slate-200 text-slate-500 rounded-sm text-[8px]">05/02/2026</div>
                                        </div>
                                    </div>
                                    <div className="flex-1 p-3 flex flex-col gap-3">
                                        <div className="grid grid-cols-4 gap-2">
                                            <div className="p-2 border border-slate-100 rounded bg-white shadow-sm">
                                                <div className="text-slate-400 mb-1 font-medium">Total Revenue</div>
                                                <div className="font-bold text-slate-900 leading-none">Rp 47.019.000</div>
                                                <div className="mt-1 text-[7px] text-green-500 font-bold">↑ 12.5%</div>
                                            </div>
                                            <div className="p-2 border border-slate-100 rounded bg-white shadow-sm">
                                                <div className="text-slate-400 mb-1 font-medium">Active Rentals</div>
                                                <div className="font-bold text-slate-900 leading-none">156</div>
                                            </div>
                                            <div className="p-2 border border-slate-100 rounded bg-white shadow-sm">
                                                <div className="text-slate-400 mb-1 font-medium">New Customers</div>
                                                <div className="font-bold text-slate-900 leading-none">99</div>
                                            </div>
                                            <div className="p-2 border border-red-100 bg-red-50/30 rounded bg-white shadow-sm">
                                                <div className="text-slate-400 mb-1 font-medium uppercase tracking-tighter">Late Returns</div>
                                                <div className="font-bold text-red-600 leading-none">3</div>
                                            </div>
                                        </div>
                                        <div className="flex-1 flex gap-3">
                                            <div className="flex-[2] bg-slate-50/50 rounded p-2 flex flex-col">
                                                <div className="font-bold mb-2 flex items-center gap-1"><BarChart3 size={10} strokeWidth={2} className="text-indigo-600" /> Revenue Trend</div>
                                                <div className="flex-1 flex items-end gap-1 px-1">
                                                    {[40, 70, 45, 90, 65, 80, 50, 95, 100, 60, 85, 40].map((h, i) => (
                                                        <div key={i} className="flex-1 bg-indigo-500/10 rounded-t-sm relative group" style={{ height: `${h}%` }}>
                                                            <div className="absolute inset-x-0 bottom-0 bg-indigo-500 rounded-t-sm h-1/3 group-hover:h-full transition-all duration-500"></div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="flex-1 flex flex-col gap-1.5">
                                                <div className="font-bold mb-1">Top Rented</div>
                                                {[
                                                    { n: "Jas Slim Fit", c: 18 },
                                                    { n: "Batik Wanita", c: 17 },
                                                    { n: "Kebaya Wisuda", c: 14 }
                                                ].map((item, i) => (
                                                    <div key={i} className="flex justify-between items-center p-1.5 bg-white rounded border border-slate-100 shadow-sm">
                                                        <span className="truncate pr-2 font-medium">{item.n}</span>
                                                        <span className="font-bold text-indigo-600">{item.c}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="absolute inset-0 bg-gradient-to-t from-indigo-950/5 to-transparent pointer-events-none"></div>
                                <div className="absolute bottom-4 left-4 flex items-center gap-2">
                                    <div className="px-3 py-1 bg-white/90 backdrop-blur-sm rounded-full text-[10px] font-bold text-indigo-600 shadow-lg uppercase tracking-widest border border-indigo-100">
                                        Owner Analytics
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* Brands / Partners */}
            <section className="py-10 border-y border-slate-100 bg-slate-50/50">
                <div className="max-w-7xl mx-auto px-6 overflow-hidden">
                    <p className="text-center text-sm font-bold text-slate-400 uppercase tracking-widest mb-8">Powering modern rental businesses</p>
                    <div className="flex justify-center flex-wrap gap-12 grayscale opacity-40">
                        {/* Placeholder Logos */}
                        {['Velocity', 'Momentum', 'Apex', 'Vertex', 'Orbit'].map(brand => (
                            <span key={brand} className="text-xl font-black">{brand}</span>
                        ))}
                    </div>
                </div>
            </section>

            {/* Product Showcase Gallery */}
            <section className="py-24 bg-white relative overflow-hidden">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center max-w-3xl mx-auto mb-20">
                        <h2 className="text-indigo-600 font-bold tracking-wide uppercase text-xs lg:text-sm mb-3">
                            {(TRANSLATIONS[lang] as any).gallery.title}
                        </h2>
                        <h3 className="text-3xl lg:text-5xl font-black text-slate-900 mb-6">
                            {(TRANSLATIONS[lang] as any).gallery.subtitle}
                        </h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
                        {[
                            {
                                id: 'dash',
                                img: '/assets/landing/w2.jpg',
                                title: (TRANSLATIONS[lang] as any).gallery.dashTitle,
                                desc: (TRANSLATIONS[lang] as any).gallery.dashDesc,
                                color: 'indigo'
                            },
                            {
                                id: 'pos',
                                img: '/assets/landing/w1.jpg',
                                title: (TRANSLATIONS[lang] as any).gallery.posTitle,
                                desc: (TRANSLATIONS[lang] as any).gallery.posDesc,
                                color: 'slate'
                            },
                            {
                                id: 'fin',
                                img: '/assets/landing/w4.jpg',
                                title: (TRANSLATIONS[lang] as any).gallery.finTitle,
                                desc: (TRANSLATIONS[lang] as any).gallery.finDesc,
                                color: 'violet'
                            }
                        ].map((item, idx) => (
                            <div key={item.id} className={`group ${idx === 1 ? 'lg:mt-12' : ''}`}>
                                <div
                                    onClick={() => setPreviewImage(item.img)}
                                    className={`relative aspect-[4/3] rounded-2xl lg:rounded-3xl overflow-hidden shadow-xl transition-all duration-500 cursor-zoom-in hover:-translate-y-2 group-hover:shadow-indigo-200/50 border border-slate-100 bg-slate-50`}
                                >
                                    <img
                                        src={item.img}
                                        alt={item.title}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                                    />
                                    <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-slate-900/60 to-transparent translate-y-full group-hover:translate-y-0 transition-transform">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] font-black text-white uppercase tracking-widest">Click to expand</span>
                                            <Maximize2 size={16} className="text-white" />
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-6">
                                    <h4 className="text-lg font-bold text-slate-900 mb-2">{item.title}</h4>
                                    <p className="text-slate-500 text-xs leading-relaxed">{item.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Image Preview Modal / Lightbox */}
            {previewImage && (
                <div
                    className="fixed inset-0 z-[100] flex items-center justify-center p-4 lg:p-12 animate-in fade-in duration-300"
                    onClick={() => setPreviewImage(null)}
                >
                    <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md" />

                    <button
                        className="absolute top-6 right-6 w-12 h-12 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center transition-colors z-10"
                        onClick={() => setPreviewImage(null)}
                    >
                        <X size={24} />
                    </button>

                    <div
                        className="relative max-w-6xl w-full h-full flex items-center justify-center animate-in zoom-in-95 duration-300"
                        onClick={e => e.stopPropagation()}
                    >
                        <img
                            src={previewImage}
                            alt="Preview"
                            className="max-w-full max-h-full object-contain rounded-xl shadow-2xl border border-white/10"
                        />
                    </div>
                </div>
            )}

            {/* Bento Grid Features */}
            <section id="features" className="py-32 px-6 max-w-7xl mx-auto">
                <div className="text-center max-w-3xl mx-auto mb-24">
                    <h2 className="text-indigo-600 font-bold tracking-widest uppercase text-xs lg:text-sm mb-4">{t.features.headerTitle}</h2>
                    <h3 className="text-4xl lg:text-6xl font-black text-slate-900 mb-8 tracking-tight">{t.features.headerSubtitle}</h3>
                    <p className="text-lg text-slate-500 max-w-2xl mx-auto leading-relaxed">{t.features.headerDesc}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 auto-rows-[minmax(280px,auto)] gap-6 lg:gap-8">
                    {t.features.items.map((feature, idx) => {
                        // Bento Grid Pattern: 0, 3, 7 are large (Span 2)
                        const isLarge = idx === 0 || idx === 3 || idx === 7;

                        return (
                            <div
                                key={idx}
                                className={`
                                    ${isLarge ? "md:col-span-2" : "md:col-span-1"} 
                                    relative overflow-hidden rounded-[2.5rem] p-8 lg:p-10
                                    bg-white border border-slate-100 shadow-sm
                                    hover:shadow-2xl hover:shadow-indigo-100/50
                                    transition-all duration-500 group hover:-translate-y-1
                                    flex flex-col justify-between
                                `}
                            >
                                {/* Decorational Background Gradients */}
                                <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-slate-50 to-slate-100/50 rounded-full blur-3xl -mr-32 -mt-32 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>

                                <div className="relative z-10">
                                    <div className="flex justify-between items-start mb-8">
                                        <div className={`
                                            w-16 h-16 rounded-2xl flex items-center justify-center
                                            ${featureColors[idx]} 
                                            shadow-sm group-hover:scale-110 transition-transform duration-500
                                        `}>
                                            {/* Clone element to increase size slightly if needed, or just rely on CSS scale */}
                                            {featureIcons[idx]}
                                        </div>
                                        <div className="px-3 py-1 bg-slate-50 rounded-full border border-slate-100 text-[10px] font-bold uppercase tracking-widest text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 group-hover:border-indigo-100 transition-colors">
                                            {feature.tag}
                                        </div>
                                    </div>

                                    <h4 className={`font-black text-slate-900 mb-4 tracking-tight group-hover:text-indigo-600 transition-colors ${isLarge ? 'text-3xl' : 'text-xl'}`}>
                                        {feature.title}
                                    </h4>
                                    <p className="text-slate-500 leading-relaxed text-sm lg:text-base font-medium">
                                        {feature.solution}
                                    </p>
                                </div>

                                <div className="relative z-10 pt-8 mt-4 border-t border-slate-50 flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                        <Check size={14} strokeWidth={4} />
                                    </div>
                                    <span className="text-xs font-bold uppercase tracking-wider text-slate-600 group-hover:text-indigo-600 transition-colors">
                                        {feature.highlight}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </section>

            {/* Comprehensive Problem vs Solution Table */}
            <section className="py-24 bg-slate-50/50">
                <div className="max-w-5xl mx-auto px-6">
                    <div className="text-center mb-16">
                        <h2 className="text-indigo-600 font-bold tracking-wide uppercase text-xs lg:text-sm mb-3">
                            {lang === 'id' ? 'Kenapa Memilih Werently?' : 'Why Choose Werently?'}
                        </h2>
                        <h3 className="text-3xl lg:text-4xl font-black text-slate-900">
                            {lang === 'id' ? 'Ucapkan Selamat Tinggal pada Cara Lama.' : 'Say Goodbye to the Old Way.'}
                        </h3>
                    </div>

                    <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.05)] overflow-hidden">
                        <div className="grid grid-cols-2 bg-slate-900 text-white p-6 lg:p-8 font-black uppercase tracking-widest text-[10px] lg:text-xs">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-rose-500 rounded-full"></div>
                                {lang === 'id' ? 'Kekacauan Manual' : 'Manual Chaos'}
                            </div>
                            <div className="flex items-center gap-2 pl-6 lg:pl-10">
                                <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                                {lang === 'id' ? 'Werently Solution' : 'Werently Solution'}
                            </div>
                        </div>
                        <div className="divide-y divide-slate-100">
                            {t.features.items.map((item: any, i: number) => (
                                <div key={i} className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-100 group hover:bg-slate-50/50 transition-colors">
                                    <div className="p-6 lg:p-10 flex items-start gap-4">
                                        <div className="mt-1 text-rose-500 opacity-60 group-hover:opacity-100 transition-opacity whitespace-nowrap font-bold text-xs uppercase">0{i + 1}</div>
                                        <p className="text-slate-700 text-sm lg:text-base leading-relaxed font-medium">
                                            {item.problem}
                                        </p>
                                    </div>
                                    <div className="p-6 lg:p-10 flex items-start gap-4 bg-indigo-50/10">
                                        <Check className="mt-1 text-emerald-500 shrink-0" size={18} strokeWidth={3} />
                                        <p className="text-slate-900 font-bold text-sm lg:text-base leading-relaxed">
                                            {item.solution}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="mt-16 text-center">
                        <button onClick={() => handleWhatsAppCTA()} className="px-10 py-5 bg-indigo-600 text-white rounded-full font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-xl hover:-translate-y-1">
                            {lang === 'id' ? 'Transformasi Bisnis Anda Sekarang' : 'Transform Your Business Now'}
                        </button>
                    </div>
                </div>
            </section>

            {/* Conclusion / Kesimpulan */}
            <section className="py-24 px-6 max-w-5xl mx-auto text-center">
                <div className="bg-gradient-to-br from-indigo-600 via-indigo-600 to-violet-700 rounded-[2.5rem] p-10 md:p-16 text-white shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 blur-[100px] rounded-full -mr-40 -mt-40"></div>
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-400/20 blur-[80px] rounded-full -ml-32 -mb-32"></div>

                    <div className="relative z-10 max-w-2xl mx-auto">
                        <h2 className="text-2xl md:text-4xl font-black mb-6 leading-tight tracking-tight">
                            {lang === 'id' ? (
                                <>Werently bukan pengeluaran, <br /> tapi <span className="text-yellow-300 inline-block relative">INVESTASI.<div className="absolute -bottom-2 left-0 w-full h-1.5 bg-yellow-300/30 rounded-full blur-[1px]"></div></span></>
                            ) : (
                                <>Werently is not an expense, <br /> but an <span className="text-yellow-300 inline-block relative">INVESTMENT.<div className="absolute -bottom-2 left-0 w-full h-1.5 bg-yellow-300/30 rounded-full blur-[1px]"></div></span></>
                            )}
                        </h2>
                        <p className="text-base md:text-lg text-indigo-100/90 mb-10 font-medium leading-relaxed">
                            {lang === 'id'
                                ? "Sistem ini membayar dirinya sendiri dengan mencegah kerugian akibat barang hilang, mencegah bentrok jadwal, dan meningkatkan penjualan lewat website otomatis."
                                : "This system pays for itself by preventing loss, avoiding scheduling conflicts, and boosting sales through an automated website."}
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <button onClick={() => handleWhatsAppCTA()} className="px-8 py-4 bg-white text-indigo-600 rounded-2xl font-black uppercase tracking-widest hover:bg-slate-50 transition-all shadow-xl hover:-translate-y-1 active:scale-95">
                                {lang === 'id' ? 'Siap Naik Level?' : 'Ready to Level Up?'}
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Stats / CTA */}
            <section className="py-24 bg-indigo-900 text-white relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-16 items-center relative z-10">
                    <div>
                        <h2 className="text-4xl font-bold mb-6">{t.stats.headline}</h2>
                        <ul className="space-y-4 mb-8">
                            {t.stats.benefits.map(item => (
                                <li key={item} className="flex items-center gap-3 font-medium">
                                    <div className="w-6 h-6 rounded-full bg-indigo-500 flex items-center justify-center">
                                        <Check size={14} />
                                    </div>
                                    {item}
                                </li>
                            ))}
                        </ul>
                        <button className="px-8 py-3 bg-white text-indigo-900 rounded-full font-bold hover:bg-slate-100 transition-colors">
                            {t.stats.cta}
                        </button>
                    </div>
                    <div className="grid grid-cols-2 gap-8">
                        {t.stats.items.map((stat, i) => (
                            <div key={i} className="bg-white/10 backdrop-blur-sm p-6 rounded-2xl border border-white/10">
                                <div className="text-3xl font-bold mb-1">{stat.val}</div>
                                <div className="text-indigo-200 text-sm uppercase tracking-wider">{stat.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Pricing */}
            <section id="pricing" className="py-24 px-6 max-w-7xl mx-auto">
                <div className="text-center mb-16">
                    <h2 className="text-4xl font-bold text-slate-900 mb-4">{t.pricing.title}</h2>
                    <p className="text-slate-500">{t.pricing.subtitle}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                    {t.pricing.plans.map((plan: any, i: number) => (
                        <div key={i} className={`p-8 rounded-3xl border transition-all duration-300 hover:shadow-2xl ${i === 1 ? 'border-indigo-600 bg-white ring-4 ring-indigo-50 shadow-xl shadow-indigo-100' : 'border-slate-100 bg-white hover:border-slate-300'} flex flex-col`}>
                            <div className="mb-6">
                                <h3 className="font-bold text-slate-900 text-xl md:text-2xl mb-2">{plan.name}</h3>
                                <p className="text-sm text-slate-500 leading-relaxed">{plan.desc}</p>
                            </div>

                            <div className="h-px bg-slate-100 w-full mb-8"></div>

                            <ul className="space-y-4 mb-8 flex-1">
                                {plan.features.map((f: string, j: number) => (
                                    <li key={j} className="flex items-start gap-3 text-sm font-medium text-slate-700">
                                        <div className={`mt-0.5 shrink-0 w-5 h-5 rounded-full flex items-center justify-center ${i === 1 ? 'bg-indigo-600 text-white' : 'bg-emerald-100 text-emerald-600'}`}>
                                            <Check size={12} strokeWidth={3} />
                                        </div>
                                        {f === '1 Akses Manager' || f === '1 Manager Access' ? (
                                            <span
                                                className="cursor-pointer hover:text-indigo-600 hover:underline decoration-indigo-300 underline-offset-4 transition-all flex items-center gap-1"
                                                onClick={() => handleWhatsAppCTA('ManagerAccess')}
                                            >
                                                {f} <span className="text-[10px] font-bold bg-indigo-100 text-indigo-600 px-1.5 py-0.5 rounded-full uppercase tracking-tighter">Tambah Akses</span>
                                            </span>
                                        ) : (
                                            <span>{f}</span>
                                        )}
                                    </li>
                                ))}
                            </ul>

                            <button onClick={() => plan.name === 'Starter' ? navigate('/login') : handleWhatsAppCTA(plan.name)} className={`w-full py-4 rounded-2xl font-black uppercase tracking-widest transition-all ${i === 1 ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-xl shadow-indigo-200 hover:-translate-y-1' : 'bg-slate-100 text-slate-900 hover:bg-slate-200'}`}>
                                {plan.cta}
                            </button>
                        </div>
                    ))}
                </div>

                {/* Pricing Simulator Section */}
                <div className="mt-24 bg-slate-50 rounded-[3rem] p-8 md:p-16 border border-slate-100 max-w-5xl mx-auto shadow-inner relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-5 text-indigo-600">
                        <TrendingUp size={300} />
                    </div>

                    <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                        <div>
                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-[10px] font-bold uppercase tracking-widest mb-4">
                                <TrendingUp size={12} /> Mitra Tumbuh Bisnis
                            </div>
                            <h3 className="text-3xl lg:text-5xl font-black text-slate-900 mb-6 tracking-tighter leading-tight">
                                {lang === 'id' ? 'Hitung Investasi Sukses Anda' : 'Calculate Your Success Investment'}
                            </h3>
                            <p className="text-lg text-slate-500 mb-10 font-medium leading-relaxed">
                                {lang === 'id'
                                    ? 'Werently hadir sebagai partner, bukan beban. Biaya sistem kami sangat adil—hanya menyesuaikan dengan keramaian bisnis Anda.'
                                    : 'Werently acts as a partner, not a burden. Our system investment is fair—adjusting only to the volume of your business.'}
                            </p>

                            <div className="space-y-12">
                                <div>
                                    <div className="flex justify-between mb-4 items-end">
                                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest">
                                            {lang === 'id' ? 'Target Pesanan / Bulan' : 'Monthly Order Target'}
                                        </label>
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-indigo-600 font-black text-4xl tracking-tighter">{simTransactions}</span>
                                            <span className="text-slate-400 text-xs font-bold uppercase">{lang === 'id' ? 'Sewa' : 'Rentals'}</span>
                                        </div>
                                    </div>
                                    <input
                                        type="range" min="10" max="500" step="10"
                                        value={simTransactions}
                                        onChange={(e) => setSimTransactions(parseInt(e.target.value))}
                                        className="w-full h-2.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                                    />
                                    <div className="flex justify-between mt-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                        <span>Mulai Kecil</span>
                                        <span>Skala Besar</span>
                                    </div>
                                </div>

                                <div>
                                    <div className="flex justify-between mb-4 items-end">
                                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest">
                                            {lang === 'id' ? 'Harga Sewa Per Item' : 'Rental Price Per Item'}
                                        </label>
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-indigo-600 font-black text-4xl tracking-tighter">Rp {(simPrice / 1000).toLocaleString('id-ID')}k</span>
                                        </div>
                                    </div>
                                    <input
                                        type="range" min="100000" max="5000000" step="100000"
                                        value={simPrice}
                                        onChange={(e) => setSimPrice(parseInt(e.target.value))}
                                        className="w-full h-2.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-[3rem] p-8 lg:p-12 shadow-[0_48px_80px_-16px_rgba(79,70,229,0.18)] border border-indigo-50 relative">
                            <div className="absolute -top-5 -right-5 bg-gradient-to-r from-yellow-400 to-amber-500 text-amber-950 px-6 py-2.5 rounded-2xl text-xs font-black uppercase tracking-widest shadow-2xl rotate-3 border-4 border-white">
                                Recommended Plan
                            </div>

                            <div className="mb-10 pb-10 border-b border-slate-100">
                                <div className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-5 flex items-center gap-2">
                                    <div className="w-2 h-2 bg-indigo-600 rounded-full animate-ping"></div>
                                    Total Investasi Sistem Pintar
                                </div>
                                <div className="text-4xl lg:text-7xl font-black text-indigo-600 tracking-tighter flex items-baseline gap-2">
                                    Rp {(
                                        (simTransactions <= 100 ? 150000 : simTransactions <= 300 ? 300000 : 500000) +
                                        (simTransactions * 7500)
                                    ).toLocaleString('id-ID')}
                                    <span className="text-xs text-slate-400 font-bold uppercase tracking-widest">/ bln</span>
                                </div>
                            </div>

                            <div className="space-y-6 mb-12">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-slate-500 font-medium">{lang === 'id' ? 'Biaya Pemeliharaan Sistem' : 'System Maintenance'}</span>
                                    <span className="font-bold text-slate-900 bg-slate-50 px-4 py-2 rounded-xl text-xs">
                                        Rp {(simTransactions <= 100 ? 150000 : simTransactions <= 300 ? 300000 : 500000).toLocaleString('id-ID')}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-slate-500 font-medium">{lang === 'id' ? `Kontribusi Operasional (${simTransactions} Transaksi)` : `Operational Contribution (${simTransactions} Tx)`}</span>
                                    <span className="font-bold text-slate-900 bg-slate-50 px-4 py-2 rounded-xl text-xs">Rp {(simTransactions * 7500).toLocaleString('id-ID')}</span>
                                </div>
                                <div className="pt-8 mt-8 border-t border-slate-50 bg-emerald-50/30 -mx-8 lg:-mx-12 px-8 lg:px-12 pb-2 rounded-b-[2rem]">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-emerald-700 font-bold text-[10px] uppercase tracking-widest">Estimasi Omzet Bisnis</span>
                                        <span className="text-emerald-700 font-black text-2xl tracking-tighter">Rp {(simTransactions * simPrice).toLocaleString('id-ID')}</span>
                                    </div>
                                    <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-100 text-emerald-800 rounded-full text-[10px] font-black uppercase tracking-tight shadow-sm">
                                        INVESTASI SISTEM HANYA ~{(
                                            (((simTransactions <= 100 ? 150000 : simTransactions <= 300 ? 300000 : 500000) + (simTransactions * 7500)) / (simTransactions * simPrice)) * 100
                                        ).toFixed(2)}% DARI TOTAL OMZET
                                    </div>
                                </div>
                            </div>

                            <button onClick={() => handleWhatsAppCTA('Pro')} className="group w-full py-6 bg-indigo-600 text-white rounded-[1.8rem] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-[0_20px_40px_-10px_rgba(79,70,229,0.4)] hover:-translate-y-1.5 active:scale-95 flex items-center justify-center gap-3">
                                {lang === 'id' ? 'Mulai Kerja Sama' : 'Start Partnership Now'}
                                <ArrowRight size={22} className="group-hover:translate-x-1.5 transition-transform" />
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-slate-900 text-slate-300 py-16">
                <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-12">
                    <div className="col-span-2">
                        <div className="flex items-center gap-2.5 font-bold text-2xl tracking-tighter text-white mb-6">
                            <Logo className="w-8 h-8 rounded-lg" />
                            werently.
                        </div>
                        <p className="max-w-sm text-slate-400 leading-relaxed mb-6">
                            {t.footer.description}
                        </p>
                        <div className="flex gap-4">
                            {/* Social Icons Placeholder */}
                            <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center hover:bg-indigo-600 transition-colors"></div>
                            <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center hover:bg-indigo-600 transition-colors"></div>
                            <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center hover:bg-indigo-600 transition-colors"></div>
                        </div>
                    </div>
                    <div>
                        <h4 className="text-white font-bold uppercase tracking-wider mb-6">{t.footer.product}</h4>
                        <ul className="space-y-4 text-sm">
                            <li><a href="#" className="hover:text-white transition-colors">{t.nav.features}</a></li>
                            <li><a href="#" className="hover:text-white transition-colors">{t.nav.pricing}</a></li>
                            <li><a href="#" className="hover:text-white transition-colors">{t.footer.integrations}</a></li>
                            <li><a href="#" className="hover:text-white transition-colors">{t.footer.changelog}</a></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="text-white font-bold uppercase tracking-wider mb-6">{t.footer.company}</h4>
                        <ul className="space-y-4 text-sm">
                            <li><a href="#" className="hover:text-white transition-colors">{t.footer.about}</a></li>
                            <li><a href="#" className="hover:text-white transition-colors">{t.footer.careers}</a></li>
                            <li><a href="#" onClick={(e) => { e.preventDefault(); handleWhatsAppCTA(); }} className="hover:text-white transition-colors">{t.footer.contact}</a></li>
                            <li><a href="#" className="hover:text-white transition-colors">{t.footer.privacyPolicy}</a></li>
                        </ul>
                    </div>
                </div>
                <div className="max-w-7xl mx-auto px-6 border-t border-slate-800 mt-16 pt-8 flex justify-between items-center text-xs font-bold uppercase tracking-widest text-slate-500">
                    <p>{t.footer.rights}</p>
                </div>
            </footer>
        </div>
    );
}
