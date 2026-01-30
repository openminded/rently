import { useState } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, ShoppingCart, Package, Database, ChevronDown, ClipboardList, Settings, LogOut, User, Package2 } from 'lucide-react';
import { clsx } from 'clsx';
import { useAuth } from '../context/AuthContext';

export default function Layout() {
    const location = useLocation();
    const { user, logout, hasRole } = useAuth();

    const [openGroups, setOpenGroups] = useState({
        masters: true,
        transactions: true,
        inventory: true,
        settings: false
    });

    const toggleGroup = (group: keyof typeof openGroups) => {
        setOpenGroups(prev => ({ ...prev, [group]: !prev[group] }));
    };

    const isMasterActive = location.pathname.startsWith('/masters');
    const isTransactionActive = location.pathname.startsWith('/transactions');
    const isInventoryActive = location.pathname.startsWith('/inventory');

    return (
        <div className="flex h-screen bg-gray-50 font-sans">
            {/* Sidebar */}
            <aside className="w-64 bg-white border-r border-gray-100 flex flex-col fixed inset-y-0 z-10">
                <div className="p-6">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center text-white font-bold">R</div>
                        <h1 className="font-bold text-xl tracking-tight text-gray-900">Rumah Dinar</h1>
                    </div>
                </div>

                <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
                    <NavLink to="/" className={({ isActive }) => clsx("flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors", isActive ? "bg-gray-900 text-white" : "text-gray-500 hover:bg-gray-100 hover:text-gray-900")}>
                        <LayoutDashboard size={18} /> Dashboard
                    </NavLink>
                    <NavLink to="/pos" className={({ isActive }) => clsx("flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors", isActive ? "bg-gray-900 text-white" : "text-gray-500 hover:bg-gray-100 hover:text-gray-900")}>
                        <ShoppingCart size={18} /> Point of Sales
                    </NavLink>


                    {/* Inventory Group */}
                    <div className="pt-2">
                        <button
                            onClick={() => toggleGroup('inventory')}
                            className={clsx("w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors", isInventoryActive ? "text-gray-900 bg-gray-50" : "text-gray-500 hover:bg-gray-100")}
                        >
                            <div className="flex items-center gap-3">
                                <Package size={18} /> Inventory
                            </div>
                            <ChevronDown size={14} className={clsx("transition-transform", openGroups.inventory ? "rotate-180" : "")} />
                        </button>

                        {openGroups.inventory && (
                            <div className="pl-10 space-y-1 mt-1">
                                <NavLink to="/inventory/catalog" className={({ isActive }) => clsx("block py-1.5 text-sm transition-colors", isActive ? "text-gray-900 font-medium" : "text-gray-500 hover:text-gray-900")}>
                                    Katalog
                                </NavLink>
                                <NavLink to="/inventory/history" className={({ isActive }) => clsx("block py-1.5 text-sm transition-colors", isActive ? "text-gray-900 font-medium" : "text-gray-500 hover:text-gray-900")}>
                                    History
                                </NavLink>
                            </div>
                        )}
                    </div>

                    {/* Laundry Menu */}
                    <NavLink to="/laundry" className={({ isActive }) => clsx("flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors mt-2", isActive ? "bg-purple-600 text-white" : "text-gray-500 hover:bg-gray-100 hover:text-gray-900")}>
                        <Package2 size={18} /> Laundry
                    </NavLink>

                    {/* Transactions Group */}
                    <div className="pt-2">
                        <button
                            onClick={() => toggleGroup('transactions')}
                            className={clsx("w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors", isTransactionActive ? "text-gray-900 bg-gray-50" : "text-gray-500 hover:bg-gray-100")}
                        >
                            <div className="flex items-center gap-3">
                                <ClipboardList size={18} /> Transactions
                            </div>
                            <ChevronDown size={14} className={clsx("transition-transform", openGroups.transactions ? "rotate-180" : "")} />
                        </button>

                        {openGroups.transactions && (
                            <div className="pl-10 space-y-1 mt-1">
                                <NavLink to="/transactions/booking" className={({ isActive }) => clsx("block py-1.5 text-sm transition-colors", isActive ? "text-orange-600 font-medium" : "text-gray-500 hover:text-gray-900")}>
                                    Booking
                                </NavLink>
                                <NavLink to="/transactions/waiting-pickup" className={({ isActive }) => clsx("block py-1.5 text-sm transition-colors", isActive ? "text-blue-600 font-medium" : "text-gray-500 hover:text-gray-900")}>
                                    Waiting Pickup
                                </NavLink>
                                <NavLink to="/transactions/rent" className={({ isActive }) => clsx("block py-1.5 text-sm transition-colors", isActive ? "text-green-600 font-medium" : "text-gray-500 hover:text-gray-900")}>
                                    Rent (Active)
                                </NavLink>
                                <NavLink to="/transactions/need-return" className={({ isActive }) => clsx("block py-1.5 text-sm transition-colors", isActive ? "text-red-600 font-medium" : "text-gray-500 hover:text-gray-900")}>
                                    Need to Return
                                </NavLink>
                                <NavLink to="/transactions/completed" className={({ isActive }) => clsx("block py-1.5 text-sm transition-colors", isActive ? "text-gray-900 font-medium" : "text-gray-500 hover:text-gray-900")}>
                                    History (Complete)
                                </NavLink>
                            </div>
                        )}
                    </div>


                    {/* Master Groups */}
                    <div className="pt-2">
                        <button
                            onClick={() => toggleGroup('masters')}
                            className={clsx("w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors", isMasterActive ? "text-gray-900 bg-gray-50" : "text-gray-500 hover:bg-gray-100")}
                        >
                            <div className="flex items-center gap-3">
                                <Database size={18} /> Master Data
                            </div>
                            <ChevronDown size={14} className={clsx("transition-transform", openGroups.masters ? "rotate-180" : "")} />
                        </button>

                        {openGroups.masters && (
                            <div className="pl-10 space-y-1 mt-1">
                                <NavLink to="/masters/categories" className={({ isActive }) => clsx("block py-1.5 text-sm transition-colors", isActive ? "text-gray-900 font-medium" : "text-gray-500 hover:text-gray-900")}>
                                    Categories
                                </NavLink>
                                <NavLink to="/masters/brands" className={({ isActive }) => clsx("block py-1.5 text-sm transition-colors", isActive ? "text-gray-900 font-medium" : "text-gray-500 hover:text-gray-900")}>
                                    Brands
                                </NavLink>
                                <NavLink to="/masters/colors" className={({ isActive }) => clsx("block py-1.5 text-sm transition-colors", isActive ? "text-gray-900 font-medium" : "text-gray-500 hover:text-gray-900")}>
                                    Colors
                                </NavLink>
                                <NavLink to="/masters/sizes" className={({ isActive }) => clsx("block py-1.5 text-sm transition-colors", isActive ? "text-gray-900 font-medium" : "text-gray-500 hover:text-gray-900")}>
                                    Sizes
                                </NavLink>
                                <NavLink to="/masters/customers" className={({ isActive }) => clsx("block py-1.5 text-sm transition-colors", isActive ? "text-gray-900 font-medium" : "text-gray-500 hover:text-gray-900")}>
                                    Customers
                                </NavLink>
                                <NavLink to="/masters/payments" className={({ isActive }) => clsx("block py-1.5 text-sm transition-colors", isActive ? "text-gray-900 font-medium" : "text-gray-500 hover:text-gray-900")}>
                                    Payment Methods
                                </NavLink>
                                <NavLink to="/masters/violations" className={({ isActive }) => clsx("block py-1.5 text-sm transition-colors", isActive ? "text-gray-900 font-medium" : "text-gray-500 hover:text-gray-900")}>
                                    Violation Types
                                </NavLink>
                                <NavLink to="/masters/laundry-partners" className={({ isActive }) => clsx("block py-1.5 text-sm transition-colors", isActive ? "text-gray-900 font-medium" : "text-gray-500 hover:text-gray-900")}>
                                    Laundry Partners
                                </NavLink>
                            </div>
                        )}
                    </div>


                    {/* Settings Group */}
                    {hasRole(['SUPERADMIN', 'SUPERVISOR', 'OWNER']) && (
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
                                    <span className="font-medium text-sm">Settings</span>
                                </div>
                                <ChevronDown
                                    size={14}
                                    className={clsx("transition-transform", openGroups.settings ? "rotate-180" : "")}
                                />
                            </button>

                            {openGroups.settings && (
                                <div className="pl-10 space-y-1 animate-in slide-in-from-top-2 duration-200">
                                    {hasRole(['SUPERADMIN', 'SUPERVISOR']) && (
                                        <NavLink to="/settings/backup-restore" className={({ isActive }) => clsx("block py-1.5 text-sm transition-colors", isActive ? "text-gray-900 font-medium" : "text-gray-500 hover:text-gray-900")}>
                                            Backup & Restore
                                        </NavLink>
                                    )}
                                    {hasRole(['SUPERADMIN', 'OWNER']) && (
                                        <NavLink to="/settings/users" className={({ isActive }) => clsx("block py-1.5 text-sm transition-colors", isActive ? "text-gray-900 font-medium" : "text-gray-500 hover:text-gray-900")}>
                                            User Management
                                        </NavLink>
                                    )}
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
                        <LogOut size={16} /> Sign Out
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 ml-64 p-8 overflow-y-auto">
                <Outlet />
            </main>
        </div>
    );
}
