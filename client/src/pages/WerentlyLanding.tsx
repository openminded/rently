import { useState, useEffect } from 'react';
import { ArrowRight, Check, Play, LayoutDashboard, MessageSquare, Calendar, ShieldCheck, BarChart3, Users, Globe } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

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
            badge: "New SaaS Platform v1.0",
            titlePrefix: "Manage Your",
            titleAccent: "Rental Business",
            titleSuffix: "Like a Pro.",
            description: "The all-in-one platform for rental businesses. Handle bookings, track inventory, and automate customer notifications via WhatsApp.",
            ctaPrimary: "Start Free Trial",
            ctaSecondary: "Watch Demo",
            trustedBy: "Trusted by 100+ Businesses",
            dashboardPreview: "Dashboard Preview"
        },
        features: {
            headerTitle: "Powerful Features",
            headerSubtitle: "Everything you need to run your rental business.",
            headerDesc: "Stop using spreadsheets. Upgrade to a system designed for growth, efficiency, and peace of mind.",
            items: [
                {
                    title: "Smart Booking System",
                    desc: "Visual calendar to manage pickups, returns, and cleaning schedules effortlessly."
                },
                {
                    title: "WhatsApp Integration",
                    desc: "Automatically send booking confirmations and due date reminders to customers."
                },
                {
                    title: "Financial Analytics",
                    desc: "Track revenue, expenses, and asset ROI in real-time dashboards."
                },
                {
                    title: "Asset Protection",
                    desc: "Record item conditions, handle deposits, and track damages easily."
                },
                {
                    title: "Multi-User Access",
                    desc: "Give your staff specific roles and permissions to keep data secure."
                },
                {
                    title: "Barcode Support",
                    desc: "Speed up checkouts and returns with built-in barcode scanner integration."
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
            title: "Simple, Transparent Pricing",
            subtitle: "Choose the plan that fits your business stage.",
            perMonth: "/month",
            plans: [
                {
                    name: 'Starter',
                    price: 'IDR 199k',
                    desc: 'For small businesses just getting started.',
                    features: ['Up to 500 Items', 'Basic Reporting', 'Single User'],
                    cta: "Choose Starter"
                },
                {
                    name: 'Pro',
                    price: 'IDR 499k',
                    desc: 'For growing businesses with active rentals.',
                    features: ['Unlimited Items', 'Advanced Analytics', 'WhatsApp Integration', '3 Users', 'Priority Support'],
                    cta: "Choose Pro"
                },
                {
                    name: 'Enterprise',
                    price: 'Custom',
                    desc: 'For large operations requiring custom solutions.',
                    features: ['Unlimited Users', 'API Access', 'Custom Branding', 'On-premise Option'],
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
            badge: "Platform SaaS Baru v1.0",
            titlePrefix: "Kelola Bisnis",
            titleAccent: "Sewa & Rental",
            titleSuffix: "Lebih Profesional.",
            description: "Platform all-in-one untuk bisnis rental. Kelola booking, stok barang, dan notifikasi pelanggan otomatis via WhatsApp.",
            ctaPrimary: "Coba Gratis",
            ctaSecondary: "Lihat Demo",
            trustedBy: "Dipercaya 100+ Bisnis",
            dashboardPreview: "Pratinjau Dashboard"
        },
        features: {
            headerTitle: "Fitur Canggih",
            headerSubtitle: "Semua yang Anda butuhkan untuk bisnis rental.",
            headerDesc: "Tinggalkan cara lama pakai spreadsheet. Beralih ke sistem yang dirancang untuk efisiensi dan pertumbuhan bisnis.",
            items: [
                {
                    title: "Sistem Booking Pintar",
                    desc: "Kalender visual untuk atur jadwal ambil, kembali, dan cuci dengan mudah."
                },
                {
                    title: "Integrasi WhatsApp",
                    desc: "Kirim konfirmasi booking dan pengingat pengembalian otomatis ke WA pelanggan."
                },
                {
                    title: "Analitik Keuangan",
                    desc: "Pantau pendapatan, pengeluaran, dan profitabilitas aset secara real-time."
                },
                {
                    title: "Proteksi Aset",
                    desc: "Catat kondisi barang, kelola deposit, dan denda kerusakan dengan mudah."
                },
                {
                    title: "Akses Multi-User",
                    desc: "Berikan staf hak akses khusus sesuai peran mereka untuk keamanan data."
                },
                {
                    title: "Dukungan Barcode",
                    desc: "Percepat proses checkout dan pengembalian dengan scan barcode bawaan."
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
            title: "Harga Simpel & Transparan",
            subtitle: "Pilih paket yang sesuai dengan fase bisnis Anda.",
            perMonth: "/bulan",
            plans: [
                {
                    name: 'Starter',
                    price: 'Rp 199rb',
                    desc: 'Untuk bisnis kecil yang baru memulai.',
                    features: ['Hingga 500 Barang', 'Laporan Dasar', '1 Pengguna'],
                    cta: "Pilih Starter"
                },
                {
                    name: 'Pro',
                    price: 'Rp 499rb',
                    desc: 'Untuk bisnis berkembang dengan transaksi aktif.',
                    features: ['Barang Tanpa Batas', 'Analitik Lengkap', 'Integrasi WhatsApp', '3 Pengguna', 'Support Prioritas'],
                    cta: "Pilih Pro"
                },
                {
                    name: 'Enterprise',
                    price: 'Custom',
                    desc: 'Untuk operasional besar butuh solusi khusus.',
                    features: ['Pengguna Tanpa Batas', 'Akses API', 'Custom Branding', 'Opsi On-premise'],
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
    const [lang, setLang] = useState<'en' | 'id'>('en');

    useEffect(() => {
        // Auto-detect language
        const userLang = navigator.language || navigator.languages[0];
        if (userLang.toLowerCase().includes('id')) {
            setLang('id');
        }
    }, []);

    const t = TRANSLATIONS[lang];

    const featureIcons = [
        <Calendar className="text-white" size={24} />,
        <MessageSquare className="text-white" size={24} />,
        <BarChart3 className="text-white" size={24} />,
        <ShieldCheck className="text-white" size={24} />,
        <Users className="text-white" size={24} />,
        <Check className="text-white" size={24} />
    ];

    const featureColors = [
        "bg-blue-500", "bg-green-500", "bg-purple-500",
        "bg-orange-500", "bg-pink-500", "bg-cyan-500"
    ];

    return (
        <div className="min-h-screen bg-white font-sans text-slate-900 selection:bg-indigo-100 selection:text-indigo-900">
            {/* Navbar */}
            <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-2 font-bold text-2xl tracking-tighter text-indigo-950 cursor-pointer" onClick={() => navigate('/')}>
                        <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white">
                            <LayoutDashboard size={18} />
                        </div>
                        werently.
                    </div>

                    <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
                        <a href="#features" className="hover:text-indigo-600 transition-colors">{t.nav.features}</a>
                        <a href="#pricing" className="hover:text-indigo-600 transition-colors">{t.nav.pricing}</a>
                        <a href="#testimonials" className="hover:text-indigo-600 transition-colors">{t.nav.testimonials}</a>
                        <a href="/store" className="hover:text-indigo-600 transition-colors">{t.nav.demoStore}</a>
                    </div>

                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setLang(lang === 'en' ? 'id' : 'en')}
                            className="flex items-center gap-1 text-sm font-bold text-slate-500 hover:text-indigo-600 px-2 py-2 transition-colors uppercase"
                        >
                            <Globe size={16} /> {lang}
                        </button>
                        <button onClick={() => navigate('/login')} className="text-sm font-bold text-slate-600 hover:text-indigo-600 px-4 py-2 transition-colors">
                            {t.nav.login}
                        </button>
                        <button onClick={() => navigate('/login')} className="bg-indigo-600 text-white px-5 py-2.5 rounded-full text-sm font-bold hover:bg-indigo-700 hover:shadow-lg hover:-translate-y-0.5 transition-all shadow-indigo-200 shadow-md">
                            {t.nav.getStarted}
                        </button>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <header className="pt-32 pb-20 px-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-bl from-indigo-50 to-white -z-10 rounded-bl-[100px]" />
                <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-xs font-bold uppercase tracking-wider mb-6 border border-indigo-100">
                            <span className="w-2 h-2 bg-indigo-600 rounded-full animate-pulse"></span>
                            {t.hero.badge}
                        </div>
                        <h1 className="text-5xl lg:text-7xl font-bold leading-tight text-slate-900 mb-8 tracking-tight">
                            {t.hero.titlePrefix} <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">
                                {t.hero.titleAccent}
                            </span> <br />
                            {t.hero.titleSuffix}
                        </h1>
                        <p className="text-lg text-slate-500 mb-10 max-w-lg leading-relaxed">
                            {t.hero.description}
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4">
                            <button onClick={() => navigate('/login')} className="px-8 py-4 bg-indigo-600 text-white rounded-full font-bold shadow-xl shadow-indigo-200 hover:shadow-2xl hover:-translate-y-1 transition-all flex items-center justify-center gap-2">
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
                    <div className="relative">
                        <div className="absolute inset-0 bg-indigo-600 blur-[100px] opacity-20 rounded-full"></div>
                        <div className="relative bg-slate-900 rounded-2xl p-2 shadow-2xl border border-slate-800 rotate-1 hover:rotate-0 transition-transform duration-700">
                            <div className="bg-slate-800 rounded-xl overflow-hidden aspect-[16/10] relative group">
                                {/* Mockup Dashboard UI */}
                                <div className="absolute inset-0 flex flex-col">
                                    <div className="h-10 border-b border-slate-700 flex items-center px-4 gap-2">
                                        <div className="w-3 h-3 rounded-full bg-red-500"></div>
                                        <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                                        <div className="w-3 h-3 rounded-full bg-green-500"></div>
                                    </div>
                                    <div className="flex-1 p-6 grid grid-cols-4 gap-4">
                                        {/* Fake Cards */}
                                        <div className="col-span-1 bg-slate-700/50 rounded-lg h-24 animate-pulse"></div>
                                        <div className="col-span-1 bg-slate-700/50 rounded-lg h-24 animate-pulse delay-75"></div>
                                        <div className="col-span-1 bg-slate-700/50 rounded-lg h-24 animate-pulse delay-100"></div>
                                        <div className="col-span-1 bg-slate-700/50 rounded-lg h-24 animate-pulse delay-150"></div>
                                        {/* Fake Chart */}
                                        <div className="col-span-3 bg-slate-700/30 rounded-lg h-48 mt-2"></div>
                                        <div className="col-span-1 bg-slate-700/30 rounded-lg h-48 mt-2"></div>
                                    </div>
                                </div>

                                <div className="absolute inset-0 flex items-center justify-center">
                                    <span className="text-slate-500 font-medium text-sm">{t.hero.dashboardPreview}</span>
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

            {/* Features Grid */}
            <section id="features" className="py-24 px-6 max-w-7xl mx-auto">
                <div className="text-center max-w-3xl mx-auto mb-20">
                    <h2 className="text-indigo-600 font-bold tracking-wide uppercase text-sm mb-3">{t.features.headerTitle}</h2>
                    <h3 className="text-4xl font-bold text-slate-900 mb-6">{t.features.headerSubtitle}</h3>
                    <p className="text-lg text-slate-500">{t.features.headerDesc}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {t.features.items.map((feature, idx) => (
                        <div key={idx} className="p-8 rounded-3xl border border-slate-100 bg-white hover:shadow-xl hover:shadow-indigo-100 hover:-translate-y-1 transition-all group">
                            <div className={`w-14 h-14 ${featureColors[idx]} rounded-2xl flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform`}>
                                {featureIcons[idx]}
                            </div>
                            <h4 className="text-xl font-bold text-slate-900 mb-3">{feature.title}</h4>
                            <p className="text-slate-500 leading-relaxed">{feature.desc}</p>
                        </div>
                    ))}
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

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                    {t.pricing.plans.map((plan, i) => (
                        <div key={i} className={`p-8 rounded-3xl border ${i === 1 ? 'border-indigo-600 bg-indigo-50 ring-4 ring-indigo-100' : 'border-slate-100 bg-white'} flex flex-col`}>
                            <h3 className="font-bold text-slate-900 text-xl mb-2">{plan.name}</h3>
                            <div className="flex items-end gap-1 mb-4">
                                <span className="text-3xl font-black text-slate-900">{plan.price}</span>
                                <span className="text-slate-500 mb-1 text-sm">{t.pricing.perMonth}</span>
                            </div>
                            <p className="text-sm text-slate-500 mb-8 pb-8 border-b border-slate-200">{plan.desc}</p>

                            <ul className="space-y-4 mb-8 flex-1">
                                {plan.features.map(f => (
                                    <li key={f} className="flex items-center gap-3 text-sm font-medium text-slate-700">
                                        <Check size={16} className="text-green-500" /> {f}
                                    </li>
                                ))}
                            </ul>

                            <button className={`w-full py-3 rounded-xl font-bold transition-all ${i === 1 ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-200' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}>
                                {plan.cta}
                            </button>
                        </div>
                    ))}
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-slate-900 text-slate-300 py-16">
                <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-12">
                    <div className="col-span-2">
                        <div className="flex items-center gap-2 font-bold text-2xl tracking-tighter text-white mb-6">
                            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white">
                                <LayoutDashboard size={18} />
                            </div>
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
                            <li><a href="#" className="hover:text-white transition-colors">{t.footer.contact}</a></li>
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
