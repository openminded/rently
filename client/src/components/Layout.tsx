import React, { useState } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, ShoppingCart, Package, RotateCcw, Shirt, Database, ChevronDown, ClipboardList } from 'lucide-react';
import { clsx } from 'clsx';

export default function Layout() {
    const location = useLocation();
    const [isMastersOpen, setIsMastersOpen] = useState(true);
    const [isTransactionsOpen, setIsTransactionsOpen] = useState(true);

    const isMasterActive = location.pathname.startsWith('/masters');
    const isTransactionActive = location.pathname.startsWith('/transactions');

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
                    <NavLink to="/inventory" className={({ isActive }) => clsx("flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors", isActive ? "bg-gray-900 text-white" : "text-gray-500 hover:bg-gray-100 hover:text-gray-900")}>
                        <Package size={18} /> Inventory
                    </NavLink>

                    {/* Transactions Group */}
                    <div className="pt-2">
                        <button
                            onClick={() => setIsTransactionsOpen(!isTransactionsOpen)}
                            className={clsx("w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors", isTransactionActive ? "text-gray-900 bg-gray-50" : "text-gray-500 hover:bg-gray-100")}
                        >
                            <div className="flex items-center gap-3">
                                <ClipboardList size={18} /> Transactions
                            </div>
                            <ChevronDown size={14} className={clsx("transition-transform", isTransactionsOpen ? "rotate-180" : "")} />
                        </button>

                        {isTransactionsOpen && (
                            <div className="pl-10 space-y-1 mt-1">
                                <NavLink to="/transactions/booking" className={({ isActive }) => clsx("block py-1.5 text-sm transition-colors", isActive ? "text-gray-900 font-medium" : "text-gray-500 hover:text-gray-900")}>
                                    Booking
                                </NavLink>
                                <NavLink to="/transactions/waiting-pickup" className={({ isActive }) => clsx("block py-1.5 text-sm transition-colors", isActive ? "text-red-600 font-bold" : "text-gray-500 hover:text-gray-900")}>
                                    Waiting Pickup
                                </NavLink>
                                <NavLink to="/transactions/rent" className={({ isActive }) => clsx("block py-1.5 text-sm transition-colors", isActive ? "text-blue-600 font-medium" : "text-gray-500 hover:text-gray-900")}>
                                    Rent (Active)
                                </NavLink>
                                <NavLink to="/transactions/need-return" className={({ isActive }) => clsx("block py-1.5 text-sm transition-colors", isActive ? "text-orange-600 font-bold" : "text-gray-500 hover:text-gray-900")}>
                                    Need to Return
                                </NavLink>
                                <NavLink to="/transactions/laundry" className={({ isActive }) => clsx("block py-1.5 text-sm transition-colors", isActive ? "text-purple-600 font-medium" : "text-gray-500 hover:text-gray-900")}>
                                    Queue in Laundry
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
                            onClick={() => setIsMastersOpen(!isMastersOpen)}
                            className={clsx("w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors", isMasterActive ? "text-gray-900 bg-gray-50" : "text-gray-500 hover:bg-gray-100")}
                        >
                            <div className="flex items-center gap-3">
                                <Database size={18} /> Master Data
                            </div>
                            <ChevronDown size={14} className={clsx("transition-transform", isMastersOpen ? "rotate-180" : "")} />
                        </button>

                        {isMastersOpen && (
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
                            </div>
                        )}
                    </div>


                </nav>
            </aside>

            {/* Main Content */}
            <main className="flex-1 ml-64 p-8 overflow-y-auto">
                <Outlet />
            </main>
        </div>
    );
}
