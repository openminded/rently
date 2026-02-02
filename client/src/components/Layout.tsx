import { useState } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, ShoppingCart, Package, Database, ChevronDown, ClipboardList, Settings, LogOut, User, Package2, Menu, X, MessageSquare, DollarSign } from 'lucide-react';
import { clsx } from 'clsx';
import { useAuth } from '../context/AuthContext';
import { useBrand } from '../hooks/useBrand';
import { useLanguage } from '../context/LanguageContext';

export default function Layout() {
    const location = useLocation();
    const { user, logout, hasRole } = useAuth();
    const { t } = useLanguage();

    // State for Mobile and Desktop sidebars
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [desktopSidebarOpen, setDesktopSidebarOpen] = useState(true);

    const [openGroups, setOpenGroups] = useState({
        masters: true,
        transactions: true,
        inventory: true,
        settings: false,
        broadcast: true
    });

    const toggleGroup = (group: keyof typeof openGroups) => {
        setOpenGroups(prev => ({ ...prev, [group]: !prev[group] }));
    };

    const isMasterActive = location.pathname.startsWith('/app/masters');
    const isTransactionActive = location.pathname.startsWith('/app/transactions');
    const isInventoryActive = location.pathname.startsWith('/app/inventory');

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
                    {/* ... Navigation Items (Same as before) ... */}
                    {/* Re-using existing structure but ensuring clicks close menu on mobile */}

                    <NavLink to="/app" end onClick={() => setMobileMenuOpen(false)} className={({ isActive }) => clsx("flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors", isActive ? "bg-gray-900 text-white" : "text-gray-500 hover:bg-gray-100 hover:text-gray-900")}>
                        <LayoutDashboard size={18} /> {t('menu.dashboard')}
                    </NavLink>
                    <NavLink to="/app/pos" onClick={() => setMobileMenuOpen(false)} className={({ isActive }) => clsx("flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors", isActive ? "bg-gray-900 text-white" : "text-gray-500 hover:bg-gray-100 hover:text-gray-900")}>
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
                                <NavLink to="/app/inventory/showcase" onClick={() => setMobileMenuOpen(false)} className={({ isActive }) => clsx("block py-1.5 text-sm transition-colors", isActive ? "text-gray-900 font-medium" : "text-gray-500 hover:text-gray-900")}>
                                    {t('menu.showcase')}
                                </NavLink>
                                <NavLink to="/app/inventory/catalog" onClick={() => setMobileMenuOpen(false)} className={({ isActive }) => clsx("block py-1.5 text-sm transition-colors", isActive ? "text-gray-900 font-medium" : "text-gray-500 hover:text-gray-900")}>
                                    {t('menu.catalog')}
                                </NavLink>
                                <NavLink to="/app/inventory/history" onClick={() => setMobileMenuOpen(false)} className={({ isActive }) => clsx("block py-1.5 text-sm transition-colors", isActive ? "text-gray-900 font-medium" : "text-gray-500 hover:text-gray-900")}>
                                    {t('menu.history')}
                                </NavLink>
                            </div>
                        )}
                    </div>

                    {/* Laundry Menu */}
                    <NavLink to="/app/laundry" onClick={() => setMobileMenuOpen(false)} className={({ isActive }) => clsx("flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors mt-2", isActive ? "bg-purple-600 text-white" : "text-gray-500 hover:bg-gray-100 hover:text-gray-900")}>
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
                                <NavLink to="/app/transactions/booking" onClick={() => setMobileMenuOpen(false)} className={({ isActive }) => clsx("block py-1.5 text-sm transition-colors", isActive ? "text-orange-600 font-medium" : "text-gray-500 hover:text-gray-900")}>
                                    {t('menu.booking')}
                                </NavLink>
                                <NavLink to="/app/transactions/waiting-pickup" onClick={() => setMobileMenuOpen(false)} className={({ isActive }) => clsx("block py-1.5 text-sm transition-colors", isActive ? "text-blue-600 font-medium" : "text-gray-500 hover:text-gray-900")}>
                                    {t('menu.waitingPickup')}
                                </NavLink>
                                <NavLink to="/app/transactions/rent" onClick={() => setMobileMenuOpen(false)} className={({ isActive }) => clsx("block py-1.5 text-sm transition-colors", isActive ? "text-green-600 font-medium" : "text-gray-500 hover:text-gray-900")}>
                                    {t('menu.rentActive')}
                                </NavLink>
                                <NavLink to="/app/transactions/need-return" onClick={() => setMobileMenuOpen(false)} className={({ isActive }) => clsx("block py-1.5 text-sm transition-colors", isActive ? "text-red-600 font-medium" : "text-gray-500 hover:text-gray-900")}>
                                    {t('menu.needReturn')}
                                </NavLink>
                                <NavLink to="/app/transactions/completed" onClick={() => setMobileMenuOpen(false)} className={({ isActive }) => clsx("block py-1.5 text-sm transition-colors", isActive ? "text-gray-900 font-medium" : "text-gray-500 hover:text-gray-900")}>
                                    {t('menu.completed')}
                                </NavLink>
                            </div>
                        )}
                    </div>

                    {/* Finance Menu */}
                    {hasRole(['SUPERADMIN', 'OWNER']) && (
                        <NavLink to="/app/finance" onClick={() => setMobileMenuOpen(false)} className={({ isActive }) => clsx("flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors mt-2", isActive ? "bg-emerald-600 text-white" : "text-gray-500 hover:bg-gray-100 hover:text-gray-900")}>
                            <DollarSign size={18} /> {t('menu.finance')}
                        </NavLink>
                    )}

                    {/* User Management Menu (Owner, Superadmin, Supervisor) */}
                    {hasRole(['SUPERADMIN', 'OWNER', 'SUPERVISOR']) && (
                        <NavLink to="/app/users" onClick={() => setMobileMenuOpen(false)} className={({ isActive }) => clsx("flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors mt-2", isActive ? "bg-indigo-600 text-white" : "text-gray-500 hover:bg-gray-100 hover:text-gray-900")}>
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
                                <NavLink to="/app/masters/categories" onClick={() => setMobileMenuOpen(false)} className={({ isActive }) => clsx("block py-1.5 text-sm transition-colors", isActive ? "text-gray-900 font-medium" : "text-gray-500 hover:text-gray-900")}>
                                    {t('menu.categories')}
                                </NavLink>
                                <NavLink to="/app/masters/brands" onClick={() => setMobileMenuOpen(false)} className={({ isActive }) => clsx("block py-1.5 text-sm transition-colors", isActive ? "text-gray-900 font-medium" : "text-gray-500 hover:text-gray-900")}>
                                    {t('menu.brands')}
                                </NavLink>
                                <NavLink to="/app/masters/colors" onClick={() => setMobileMenuOpen(false)} className={({ isActive }) => clsx("block py-1.5 text-sm transition-colors", isActive ? "text-gray-900 font-medium" : "text-gray-500 hover:text-gray-900")}>
                                    {t('menu.colors')}
                                </NavLink>
                                <NavLink to="/app/masters/sizes" onClick={() => setMobileMenuOpen(false)} className={({ isActive }) => clsx("block py-1.5 text-sm transition-colors", isActive ? "text-gray-900 font-medium" : "text-gray-500 hover:text-gray-900")}>
                                    {t('menu.sizes')}
                                </NavLink>
                                <NavLink to="/app/masters/customers" onClick={() => setMobileMenuOpen(false)} className={({ isActive }) => clsx("block py-1.5 text-sm transition-colors", isActive ? "text-gray-900 font-medium" : "text-gray-500 hover:text-gray-900")}>
                                    {t('menu.customers')}
                                </NavLink>
                                <NavLink to="/app/masters/payments" onClick={() => setMobileMenuOpen(false)} className={({ isActive }) => clsx("block py-1.5 text-sm transition-colors", isActive ? "text-gray-900 font-medium" : "text-gray-500 hover:text-gray-900")}>
                                    {t('menu.payments')}
                                </NavLink>
                                <NavLink to="/app/masters/violations" onClick={() => setMobileMenuOpen(false)} className={({ isActive }) => clsx("block py-1.5 text-sm transition-colors", isActive ? "text-gray-900 font-medium" : "text-gray-500 hover:text-gray-900")}>
                                    {t('menu.violations')}
                                </NavLink>
                                <NavLink to="/app/masters/laundry-partners" onClick={() => setMobileMenuOpen(false)} className={({ isActive }) => clsx("block py-1.5 text-sm transition-colors", isActive ? "text-gray-900 font-medium" : "text-gray-500 hover:text-gray-900")}>
                                    {t('menu.laundryPartners')}
                                </NavLink>

                                <NavLink to="/app/masters/deposit-variants" onClick={() => setMobileMenuOpen(false)} className={({ isActive }) => clsx("block py-1.5 text-sm transition-colors", isActive ? "text-gray-900 font-medium" : "text-gray-500 hover:text-gray-900")}>
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
                                    <NavLink to="/app/settings/app-config" onClick={() => setMobileMenuOpen(false)} className={({ isActive }) => clsx("block py-1.5 text-sm transition-colors", isActive ? "text-gray-900 font-medium" : "text-gray-500 hover:text-gray-900")}>
                                        {t('menu.appConfig')}
                                    </NavLink>
                                    {hasRole(['SUPERADMIN', 'SUPERVISOR']) && (
                                        <NavLink to="/app/settings/backup-restore" onClick={() => setMobileMenuOpen(false)} className={({ isActive }) => clsx("block py-1.5 text-sm transition-colors", isActive ? "text-gray-900 font-medium" : "text-gray-500 hover:text-gray-900")}>
                                            {t('menu.backupRestore')}
                                        </NavLink>
                                    )}
                                    {hasRole(['SUPERADMIN', 'OWNER']) && (
                                        <NavLink to="/app/settings/brand" onClick={() => setMobileMenuOpen(false)} className={({ isActive }) => clsx("block py-1.5 text-sm transition-colors", isActive ? "text-gray-900 font-medium" : "text-gray-500 hover:text-gray-900")}>
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
                                className={clsx("w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors", location.pathname.startsWith('/app/broadcast') ? "text-gray-900 bg-gray-50" : "text-gray-500 hover:bg-gray-100")}
                            >
                                <div className="flex items-center gap-3">
                                    <MessageSquare size={18} className="text-purple-600" /> WhatsApp
                                </div>
                                <ChevronDown size={14} className={clsx("transition-transform", openGroups.broadcast ? "rotate-180" : "")} />
                            </button>

                            {openGroups.broadcast && (
                                <div className="pl-10 space-y-1 mt-1">
                                    <NavLink to="/app/broadcast/connection" onClick={() => setMobileMenuOpen(false)} className={({ isActive }) => clsx("block py-1.5 text-sm transition-colors", isActive ? "text-purple-600 font-medium" : "text-gray-500 hover:text-gray-900")}>
                                        Connection
                                    </NavLink>
                                    <NavLink to="/app/broadcast/templates" onClick={() => setMobileMenuOpen(false)} className={({ isActive }) => clsx("block py-1.5 text-sm transition-colors", isActive ? "text-purple-600 font-medium" : "text-gray-500 hover:text-gray-900")}>
                                        Templates
                                    </NavLink>
                                    <NavLink to="/app/broadcast/campaigns" onClick={() => setMobileMenuOpen(false)} className={({ isActive }) => clsx("block py-1.5 text-sm transition-colors", isActive ? "text-purple-600 font-medium" : "text-gray-500 hover:text-gray-900")}>
                                        Campaigns
                                    </NavLink>
                                </div>
                            )}
                        </div>
                    )}
                </nav>

                {/* User Footer */}
                <div className="p-4 border-t border-gray-100">
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
        </div>
    );
}
