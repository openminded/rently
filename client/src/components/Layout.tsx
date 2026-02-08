import { useState } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, ShoppingCart, Package, Database, ChevronDown, ClipboardList, Settings, LogOut, User, Package2, Menu, X, MessageSquare, DollarSign } from 'lucide-react';
import { clsx } from 'clsx';
import { useAuth } from '../context/AuthContext';
import { useBrand } from '../hooks/useBrand';
import { useLanguage } from '../context/LanguageContext';
import { useShift } from '../context/ShiftContext';
import { CloseShiftModal } from './ShiftModal';
import { Lock } from 'lucide-react';

export default function Layout() {
    const location = useLocation();
    const { user, logout, hasRole, business } = useAuth();
    const { t } = useLanguage();
    const { currentShift } = useShift();
    const [isCloseShiftOpen, setIsCloseShiftOpen] = useState(false);

    // Dynamic Base Path
    const basePath = business ? `/${business.slug}/app` : '/app'; // Fallback if no business (e.g. admin root?)

    // State for Mobile and Desktop sidebars
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [desktopSidebarOpen, setDesktopSidebarOpen] = useState(true);

    const [openGroups, setOpenGroups] = useState({
        masters: true,
        transactions: true,
        inventory: true,
        settings: false,
        broadcast: true,
        referral: false
    });

    const toggleGroup = (group: keyof typeof openGroups) => {
        setOpenGroups(prev => ({ ...prev, [group]: !prev[group] }));
    };

    const isMasterActive = location.pathname.startsWith(`${basePath}/masters`);
    const isReferralActive = location.pathname.startsWith(`${basePath}/referral`);
    const isTransactionActive = location.pathname.startsWith(`${basePath}/transactions`);
    const isInventoryActive = location.pathname.startsWith(`${basePath}/inventory`);

    const { name: brandName, logo: brandLogo } = useBrand();

    return (
        <div className="flex h-screen bg-gray-50 font-sans overflow-hidden">
            {/* Mobile Header */}
            <header className="md:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-100 flex items-center justify-between px-4 z-40">
                <div className="flex items-center gap-2">
                    <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg">
                        <Menu size={24} />
                    </button>
                    <div className="flex items-center gap-2">
                        {brandLogo ? (
                            <img src={brandLogo} alt="Logo" className="w-8 h-8 object-contain rounded-lg" />
                        ) : (
                            <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center text-white font-bold">{brandName.substring(0, 1)}</div>
                        )}
                        <h1 className="font-bold text-lg tracking-tight text-gray-900">{brandName}</h1>
                    </div>
                </div>
            </header>

            {/* Sidebar Overlay (Mobile) */}
            {mobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 md:hidden animate-in fade-in duration-200"
                    onClick={() => setMobileMenuOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={clsx(
                "w-64 bg-white border-r border-gray-100 flex flex-col fixed inset-y-0 z-50 transition-transform duration-300",
                mobileMenuOpen ? "translate-x-0" : "-translate-x-full",
                // Desktop Logic
                desktopSidebarOpen ? "md:translate-x-0" : "md:-translate-x-full"
            )}>
                <div className="p-6 hidden md:flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        {brandLogo ? (
                            <img src={brandLogo} alt="Logo" className="w-8 h-8 object-contain rounded-lg" />
                        ) : (
                            <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center text-white font-bold">{brandName.substring(0, 1)}</div>
                        )}
                        <h1 className="font-bold text-xl tracking-tight text-gray-900">{brandName}</h1>
                    </div>
                </div>

                <div className="p-4 md:hidden flex justify-end">
                    <button onClick={() => setMobileMenuOpen(false)} className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg">
                        <X size={20} />
                    </button>
                </div>

                <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
                    {/* Dashboard & POS */}
                    <NavLink to={basePath} end onClick={() => setMobileMenuOpen(false)} className={({ isActive }) => clsx("flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors", isActive ? "bg-gray-900 text-white" : "text-gray-500 hover:bg-gray-100 hover:text-gray-900")}>
                        <LayoutDashboard size={18} /> {t('menu.dashboard')}
                    </NavLink>
                    <NavLink to={`${basePath}/pos`} onClick={() => setMobileMenuOpen(false)} className={({ isActive }) => clsx("flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors", isActive ? "bg-gray-900 text-white" : "text-gray-500 hover:bg-gray-100 hover:text-gray-900")}>
                        <ShoppingCart size={18} /> {t('menu.pos')}
                    </NavLink>

                    {/* Inventory Group */}
                    <div className="pt-2">
                        <button
                            onClick={() => toggleGroup('inventory')}
                            className={clsx("w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors", isInventoryActive ? "text-gray-900 bg-gray-50" : "text-gray-500 hover:bg-gray-100")}
                        >
                            <div className="flex items-center gap-3">
                                <Package size={18} /> {t('menu.inventory')}
                            </div>
                            <ChevronDown size={14} className={clsx("transition-transform", openGroups.inventory ? "rotate-180" : "")} />
                        </button>

                        {openGroups.inventory && (
                            <div className="pl-10 space-y-1 mt-1">
                                <NavLink to={`${basePath}/inventory/showcase`} onClick={() => setMobileMenuOpen(false)} className={({ isActive }) => clsx("block py-1.5 text-sm transition-colors", isActive ? "text-gray-900 font-medium" : "text-gray-500 hover:text-gray-900")}>
                                    {t('menu.showcase')}
                                </NavLink>
                                <NavLink to={`${basePath}/inventory/catalog`} onClick={() => setMobileMenuOpen(false)} className={({ isActive }) => clsx("block py-1.5 text-sm transition-colors", isActive ? "text-gray-900 font-medium" : "text-gray-500 hover:text-gray-900")}>
                                    {t('menu.catalog')}
                                </NavLink>
                                <NavLink to={`${basePath}/inventory/history`} onClick={() => setMobileMenuOpen(false)} className={({ isActive }) => clsx("block py-1.5 text-sm transition-colors", isActive ? "text-gray-900 font-medium" : "text-gray-500 hover:text-gray-900")}>
                                    {t('menu.history')}
                                </NavLink>
                            </div>
                        )}
                    </div>

                    {/* Laundry Menu */}
                    <NavLink to={`${basePath}/laundry`} onClick={() => setMobileMenuOpen(false)} className={({ isActive }) => clsx("flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors mt-2", isActive ? "bg-purple-600 text-white" : "text-gray-500 hover:bg-gray-100 hover:text-gray-900")}>
                        <Package2 size={18} /> {t('menu.laundry')}
                    </NavLink>

                    {/* Transactions Group */}
                    <div className="pt-2">
                        <button
                            onClick={() => toggleGroup('transactions')}
                            className={clsx("w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors", isTransactionActive ? "text-gray-900 bg-gray-50" : "text-gray-500 hover:bg-gray-100")}
                        >
                            <div className="flex items-center gap-3">
                                <ClipboardList size={18} /> {t('menu.transactions')}
                            </div>
                            <ChevronDown size={14} className={clsx("transition-transform", openGroups.transactions ? "rotate-180" : "")} />
                        </button>

                        {openGroups.transactions && (
                            <div className="pl-10 space-y-1 mt-1">
                                <NavLink to={`${basePath}/transactions/booking`} onClick={() => setMobileMenuOpen(false)} className={({ isActive }) => clsx("block py-1.5 text-sm transition-colors", isActive ? "text-orange-600 font-medium" : "text-gray-500 hover:text-gray-900")}>
                                    {t('menu.booking')}
                                </NavLink>
                                <NavLink to={`${basePath}/transactions/waiting-pickup`} onClick={() => setMobileMenuOpen(false)} className={({ isActive }) => clsx("block py-1.5 text-sm transition-colors", isActive ? "text-blue-600 font-medium" : "text-gray-500 hover:text-gray-900")}>
                                    {t('menu.waitingPickup')}
                                </NavLink>
                                <NavLink to={`${basePath}/transactions/rent`} onClick={() => setMobileMenuOpen(false)} className={({ isActive }) => clsx("block py-1.5 text-sm transition-colors", isActive ? "text-green-600 font-medium" : "text-gray-500 hover:text-gray-900")}>
                                    {t('menu.rentActive')}
                                </NavLink>
                                <NavLink to={`${basePath}/transactions/need-return`} onClick={() => setMobileMenuOpen(false)} className={({ isActive }) => clsx("block py-1.5 text-sm transition-colors", isActive ? "text-red-600 font-medium" : "text-gray-500 hover:text-gray-900")}>
                                    {t('menu.needReturn')}
                                </NavLink>
                                <NavLink to={`${basePath}/transactions/completed`} onClick={() => setMobileMenuOpen(false)} className={({ isActive }) => clsx("block py-1.5 text-sm transition-colors", isActive ? "text-gray-900 font-medium" : "text-gray-500 hover:text-gray-900")}>
                                    {t('menu.completed')}
                                </NavLink>
                            </div>
                        )}
                    </div>

                    {/* Finance Menu */}
                    {hasRole(['SUPERADMIN', 'OWNER']) && (
                        <>
                            <NavLink to={`${basePath}/finance`} onClick={() => setMobileMenuOpen(false)} className={({ isActive }) => clsx("flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors mt-2", isActive ? "bg-emerald-600 text-white" : "text-gray-500 hover:bg-gray-100 hover:text-gray-900")}>
                                <DollarSign size={18} /> {t('menu.finance')}
                            </NavLink>
                            <NavLink to={`${basePath}/shifts`} onClick={() => setMobileMenuOpen(false)} className={({ isActive }) => clsx("flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors mt-1", isActive ? "bg-indigo-600 text-white" : "text-gray-500 hover:bg-gray-100 hover:text-gray-900")}>
                                <Lock size={18} /> Shifts
                            </NavLink>
                        </>
                    )}

                    {/* Referral & Commission Menu */}
                    <div className="pt-2">
                        <button
                            onClick={() => toggleGroup('referral')}
                            className={clsx("w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors", isReferralActive ? "text-gray-900 bg-gray-50" : "text-gray-500 hover:bg-gray-100")}
                        >
                            <div className="flex items-center gap-3">
                                <MessageSquare size={18} /> {t('referral.title')}
                            </div>
                            <ChevronDown size={14} className={clsx("transition-transform", openGroups.referral ? "rotate-180" : "")} />
                        </button>

                        {openGroups.referral && (
                            <div className="pl-10 space-y-1 mt-1">
                                <NavLink to={`${basePath}/referral`} end onClick={() => setMobileMenuOpen(false)} className={({ isActive }) => clsx("block py-1.5 text-sm transition-colors", isActive ? "text-blue-600 font-medium" : "text-gray-500 hover:text-gray-900")}>
                                    {t('referral.management')}
                                </NavLink>
                                <NavLink to={`${basePath}/referral/history`} onClick={() => setMobileMenuOpen(false)} className={({ isActive }) => clsx("block py-1.5 text-sm transition-colors", isActive ? "text-blue-600 font-medium" : "text-gray-500 hover:text-gray-900")}>
                                    {t('referral.history')}
                                </NavLink>
                            </div>
                        )}
                    </div>

                    {/* User Management Menu (Owner, Superadmin, Supervisor) */}
                    {hasRole(['SUPERADMIN', 'OWNER', 'SUPERVISOR']) && (
                        <NavLink to={`${basePath}/users`} onClick={() => setMobileMenuOpen(false)} className={({ isActive }) => clsx("flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors mt-2", isActive ? "bg-indigo-600 text-white" : "text-gray-500 hover:bg-gray-100 hover:text-gray-900")}>
                            <User size={18} /> {t('menu.userManagement')}
                        </NavLink>
                    )}

                    {/* Master Groups */}
                    <div className="pt-2">
                        <button
                            onClick={() => toggleGroup('masters')}
                            className={clsx("w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors", isMasterActive ? "text-gray-900 bg-gray-50" : "text-gray-500 hover:bg-gray-100")}
                        >
                            <div className="flex items-center gap-3">
                                <Database size={18} /> {t('menu.masterData')}
                            </div>
                            <ChevronDown size={14} className={clsx("transition-transform", openGroups.masters ? "rotate-180" : "")} />
                        </button>

                        {openGroups.masters && (
                            <div className="pl-10 space-y-1 mt-1">
                                <NavLink to={`${basePath}/masters/categories`} onClick={() => setMobileMenuOpen(false)} className={({ isActive }) => clsx("block py-1.5 text-sm transition-colors", isActive ? "text-gray-900 font-medium" : "text-gray-500 hover:text-gray-900")}>
                                    {t('menu.categories')}
                                </NavLink>
                                <NavLink to={`${basePath}/masters/brands`} onClick={() => setMobileMenuOpen(false)} className={({ isActive }) => clsx("block py-1.5 text-sm transition-colors", isActive ? "text-gray-900 font-medium" : "text-gray-500 hover:text-gray-900")}>
                                    {t('menu.brands')}
                                </NavLink>
                                <NavLink to={`${basePath}/masters/colors`} onClick={() => setMobileMenuOpen(false)} className={({ isActive }) => clsx("block py-1.5 text-sm transition-colors", isActive ? "text-gray-900 font-medium" : "text-gray-500 hover:text-gray-900")}>
                                    {t('menu.colors')}
                                </NavLink>
                                <NavLink to={`${basePath}/masters/sizes`} onClick={() => setMobileMenuOpen(false)} className={({ isActive }) => clsx("block py-1.5 text-sm transition-colors", isActive ? "text-gray-900 font-medium" : "text-gray-500 hover:text-gray-900")}>
                                    {t('menu.sizes')}
                                </NavLink>
                                <NavLink to={`${basePath}/masters/customers`} onClick={() => setMobileMenuOpen(false)} className={({ isActive }) => clsx("block py-1.5 text-sm transition-colors", isActive ? "text-gray-900 font-medium" : "text-gray-500 hover:text-gray-900")}>
                                    {t('menu.customers')}
                                </NavLink>
                                <NavLink to={`${basePath}/masters/payments`} onClick={() => setMobileMenuOpen(false)} className={({ isActive }) => clsx("block py-1.5 text-sm transition-colors", isActive ? "text-gray-900 font-medium" : "text-gray-500 hover:text-gray-900")}>
                                    {t('menu.payments')}
                                </NavLink>
                                <NavLink to={`${basePath}/masters/violations`} onClick={() => setMobileMenuOpen(false)} className={({ isActive }) => clsx("block py-1.5 text-sm transition-colors", isActive ? "text-gray-900 font-medium" : "text-gray-500 hover:text-gray-900")}>
                                    {t('menu.violations')}
                                </NavLink>
                                <NavLink to={`${basePath}/masters/laundry-partners`} onClick={() => setMobileMenuOpen(false)} className={({ isActive }) => clsx("block py-1.5 text-sm transition-colors", isActive ? "text-gray-900 font-medium" : "text-gray-500 hover:text-gray-900")}>
                                    {t('menu.laundryPartners')}
                                </NavLink>

                                <NavLink to={`${basePath}/masters/deposit-variants`} onClick={() => setMobileMenuOpen(false)} className={({ isActive }) => clsx("block py-1.5 text-sm transition-colors", isActive ? "text-gray-900 font-medium" : "text-gray-500 hover:text-gray-900")}>
                                    {t('menu.depositVariants')}
                                </NavLink>
                            </div>
                        )}
                    </div>


                    {/* Settings Group */}
                    {(hasRole(['SUPERADMIN'])) && (
                        <div className="space-y-1 pt-2">
                            <button
                                onClick={() => toggleGroup('settings')}
                                className={clsx(
                                    "w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors",
                                    openGroups.settings ? "bg-gray-100 text-gray-900" : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                                )}
                            >
                                <div className="flex items-center gap-3">
                                    <Settings size={18} />
                                    <span className="font-medium text-sm">{t('menu.settings')}</span>
                                </div>
                                <ChevronDown
                                    size={14}
                                    className={clsx("transition-transform", openGroups.settings ? "rotate-180" : "")}
                                />
                            </button>

                            {openGroups.settings && (
                                <div className="pl-10 space-y-1 animate-in slide-in-from-top-2 duration-200">
                                    <NavLink to={`${basePath}/settings/app-config`} onClick={() => setMobileMenuOpen(false)} className={({ isActive }) => clsx("block py-1.5 text-sm transition-colors", isActive ? "text-gray-900 font-medium" : "text-gray-500 hover:text-gray-900")}>
                                        {t('menu.appConfig')}
                                    </NavLink>
                                    {hasRole(['SUPERADMIN', 'SUPERVISOR']) && (
                                        <NavLink to={`${basePath}/settings/backup-restore`} onClick={() => setMobileMenuOpen(false)} className={({ isActive }) => clsx("block py-1.5 text-sm transition-colors", isActive ? "text-gray-900 font-medium" : "text-gray-500 hover:text-gray-900")}>
                                            {t('menu.backupRestore')}
                                        </NavLink>
                                    )}
                                    {hasRole(['SUPERADMIN', 'OWNER']) && (
                                        <NavLink to={`${basePath}/settings/brand`} onClick={() => setMobileMenuOpen(false)} className={({ isActive }) => clsx("block py-1.5 text-sm transition-colors", isActive ? "text-gray-900 font-medium" : "text-gray-500 hover:text-gray-900")}>
                                            {t('menu.brandIdentity')}
                                        </NavLink>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* WhatsApp Group */}
                    {hasRole(['SUPERADMIN', 'OWNER', 'SUPERVISOR']) && (
                        <div className="pt-2">
                            <button
                                onClick={() => toggleGroup('broadcast')}
                                className={clsx("w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors", location.pathname.startsWith(`${basePath}/broadcast`) ? "text-gray-900 bg-gray-50" : "text-gray-500 hover:bg-gray-100")}
                            >
                                <div className="flex items-center gap-3">
                                    <MessageSquare size={18} className="text-purple-600" /> WhatsApp
                                </div>
                                <ChevronDown size={14} className={clsx("transition-transform", openGroups.broadcast ? "rotate-180" : "")} />
                            </button>

                            {openGroups.broadcast && (
                                <div className="pl-10 space-y-1 mt-1">
                                    <NavLink to={`${basePath}/broadcast/connection`} onClick={() => setMobileMenuOpen(false)} className={({ isActive }) => clsx("block py-1.5 text-sm transition-colors", isActive ? "text-purple-600 font-medium" : "text-gray-500 hover:text-gray-900")}>
                                        Connection
                                    </NavLink>
                                    <NavLink to={`${basePath}/broadcast/templates`} onClick={() => setMobileMenuOpen(false)} className={({ isActive }) => clsx("block py-1.5 text-sm transition-colors", isActive ? "text-purple-600 font-medium" : "text-gray-500 hover:text-gray-900")}>
                                        Templates
                                    </NavLink>
                                    <NavLink to={`${basePath}/broadcast/campaigns`} onClick={() => setMobileMenuOpen(false)} className={({ isActive }) => clsx("block py-1.5 text-sm transition-colors", isActive ? "text-purple-600 font-medium" : "text-gray-500 hover:text-gray-900")}>
                                        Campaigns
                                    </NavLink>
                                </div>
                            )}
                        </div>
                    )}
                </nav>

                {/* User Footer */}
                <div className="p-4 border-t border-gray-100">
                    {/* Shift Status */}
                    {currentShift ? (
                        <div className="bg-indigo-50 p-3 rounded-xl mb-3 border border-indigo-100 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <div className="flex justify-between items-center mb-1">
                                <p className="text-[10px] font-black text-indigo-600 uppercase tracking-wider">Shift Aktif</p>
                                <span className="flex h-2 w-2 relative">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                                </span>
                            </div>
                            <p className="text-sm font-bold text-indigo-900">Rp {(currentShift.expectedCash || 0).toLocaleString()}</p>
                            <button
                                onClick={() => setIsCloseShiftOpen(true)}
                                className="w-full mt-2 py-1.5 text-[10px] font-bold bg-white text-indigo-600 border border-indigo-200 rounded-lg hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                            >
                                TUTUP SHIFT
                            </button>
                        </div>
                    ) : (
                        <div className="bg-gray-50 p-3 rounded-xl mb-3 border border-gray-200 border-dashed">
                            <div className="flex justify-between items-center mb-1">
                                <p className="text-[10px] font-black text-gray-400 uppercase">Tidak Ada Shift</p>
                                <span className="w-2 h-2 bg-gray-300 rounded-full" />
                            </div>
                            <p className="text-[10px] italic text-gray-400 leading-tight">Buka shift di menu POS untuk mulai transaksi tunai.</p>
                        </div>
                    )}

                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                            <User size={20} className="text-gray-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{user?.name || user?.username}</p>
                            <p className="text-xs text-gray-500 truncate capitalize">{user?.role?.toLowerCase()}</p>
                        </div>
                    </div>
                    <button
                        onClick={logout}
                        className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 transition-colors"
                    >
                        <LogOut size={16} /> {t('menu.signOut')}
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className={clsx(
                "flex-1 pt-16 md:pt-0 p-4 md:p-8 overflow-y-auto transition-all duration-300",
                desktopSidebarOpen ? "md:ml-64" : "md:ml-0"
            )}>
                {/* Desktop Sidebar Toggle Button (Only visible on desktop) */}
                <button
                    onClick={() => setDesktopSidebarOpen(!desktopSidebarOpen)}
                    className={clsx(
                        "hidden md:flex items-center justify-center p-2 rounded-lg text-gray-500 hover:bg-gray-200 hover:text-gray-900 mb-4 transition-colors",
                        // Sticky position? Or just at top?
                        // If we want it sticky we'd need a header bar. For now, inline at top of content is fine,
                        // OR, floating. Let's try top left of content area properly.
                    )}
                    title={desktopSidebarOpen ? "Collapse Sidebar" : "Expand Sidebar"}
                >
                    <Menu size={20} />
                </button>
                <Outlet />
            </main>

            <CloseShiftModal
                isOpen={isCloseShiftOpen}
                onClose={() => setIsCloseShiftOpen(false)}
            />
        </div>
    );
}
