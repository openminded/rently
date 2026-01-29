import React from 'react';
import { TrendingUp, Users, ShoppingBag, AlertCircle } from 'lucide-react';

const StatCard = ({ title, value, label, icon: Icon, color }: any) => (
    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between">
            <div>
                <p className="text-sm font-medium text-gray-500">{title}</p>
                <h3 className="text-2xl font-bold text-gray-900 mt-2">{value}</h3>
                <p className="text-xs text-gray-400 mt-1">{label}</p>
            </div>
            <div className={`p-3 rounded-xl ${color}`}>
                <Icon size={20} className="text-white" />
            </div>
        </div>
    </div>
);

export default function Dashboard() {
    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-2xl font-bold text-gray-900">Overview</h2>
                <p className="text-gray-500">Welcome back, here's what's happening today.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Total Revenue"
                    value="Rp 12.5M"
                    label="+12% from last month"
                    icon={TrendingUp}
                    color="bg-emerald-500"
                />
                <StatCard
                    title="Active Rentals"
                    value="24"
                    label="Items currently out"
                    icon={ShoppingBag}
                    color="bg-blue-500"
                />
                <StatCard
                    title="New Customers"
                    value="8"
                    label="This week"
                    icon={Users}
                    color="bg-violet-500"
                />
                <StatCard
                    title="Late Returns"
                    value="3"
                    label="Action needed"
                    icon={AlertCircle}
                    color="bg-rose-500"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm min-h-[300px]">
                    <h3 className="font-bold text-gray-900 mb-4">Recent Transactions</h3>
                    <div className="text-center text-gray-400 py-10">No recent transactions</div>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm min-h-[300px]">
                    <h3 className="font-bold text-gray-900 mb-4">Items Due Today</h3>
                    <div className="text-center text-gray-400 py-10">No items due today</div>
                </div>
            </div>
        </div>
    );
}
