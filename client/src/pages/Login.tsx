import React, { useState } from 'react';
import { useBrand } from '../hooks/useBrand';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { Lock, User } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function Login() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { login } = useAuth();
    const { t } = useLanguage();
    const { name: brandName, logo: brandLogo } = useBrand(); // Use Hook
    const navigate = useNavigate();
    const location = useLocation();

    const from = location.state?.from?.pathname || '/app';

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const user = await login(username, password);

            // Smart Redirect
            if (user.business?.slug) {
                const target = `/${user.business.slug}/app/dashboard`;
                // If 'from' is generic or invalid, use target
                const isGeneric = !from || from === '/app' || from === '/login' || from === '/';
                if (isGeneric) {
                    navigate(target, { replace: true });
                } else {
                    navigate(from, { replace: true });
                }
            } else if (user.role === 'SUPERADMIN') {
                // Superadmin might not have a business attached directly or can access all
                // For now, redirect to first business or specific admin route?
                // Since we don't have /admin yet, we might need to handle this.
                // Maybe check if businessId is set?
                if (user.businessId) {
                    // Fetch slug?
                    // We included business in authController now.
                    // If business is null but role is superadmin...
                    // Maybe redirect to a business selection page? (Not built)
                    // Fallback to Main Landing for now
                    navigate('/');
                } else {
                    navigate('/');
                }
            } else {
                // Should not happen for normal users
                navigate('/');
            }

        } catch (err: any) {
            setError(err.message || t('auth.failed'));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden">
                <div className="bg-gray-900 p-8 text-center">
                    <div className="flex justify-center mb-4">
                        {brandLogo ? (
                            <div className="w-20 h-20 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-sm overflow-hidden p-2">
                                <img src={brandLogo} alt="Logo" className="w-full h-full object-contain" />
                            </div>
                        ) : (
                            <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                                <span className="text-3xl font-bold text-white mb-0">{brandName.substring(0, 2).toUpperCase()}</span>
                            </div>
                        )}
                    </div>
                    <h2 className="text-2xl font-bold text-white">{brandName}</h2>
                    <p className="text-gray-400 mt-2">{t('auth.signInToContinue')}</p>
                </div>

                <div className="p-8">
                    <div className="mb-6 p-4 bg-indigo-50 border border-indigo-100 rounded-xl">
                        <p className="text-xs font-bold text-indigo-600 uppercase tracking-widest mb-2 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-pulse"></span>
                            Demo Account
                        </p>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-tighter">Username</p>
                                <p className="text-sm font-black text-slate-900">owner</p>
                            </div>
                            <div>
                                <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-tighter">Password</p>
                                <p className="text-sm font-black text-slate-900">owner</p>
                            </div>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {error && (
                            <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100 flex items-start">
                                <span className="mr-2">⚠️</span> {error}
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">{t('auth.username')}</label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all"
                                    placeholder={t('auth.usernamePlaceholder')}
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">{t('auth.password')}</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-gray-900 text-white py-2.5 rounded-lg font-medium hover:bg-gray-800 focus:ring-4 focus:ring-gray-200 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {isLoading ? t('auth.signingIn') : t('auth.signIn')}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
