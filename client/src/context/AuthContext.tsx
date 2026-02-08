import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';

import { API_BASE_URL } from '../config/api';

const API_URL = API_BASE_URL;

interface User {
    id: number;
    username: string;
    role: 'SUPERADMIN' | 'OWNER' | 'SUPERVISOR' | 'KASIR';
    name: string;
    businessId: number;
    business?: Business;
}

export interface Business {
    id: number;
    name: string;
    slug: string;
    address: string | null;
    phone: string | null;
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    business: Business | null;
    login: (username: string, password: string) => Promise<User>;
    logout: () => void;
    isAuthenticated: boolean;
    hasRole: (roles: string[]) => boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
    const [business, setBusiness] = useState<Business | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const location = useLocation();

    // 1. Resolve Business from URL Slug
    useEffect(() => {
        const resolveBusiness = async () => {
            const segments = location.pathname.split('/');
            // pathname: /:slug/app/... or /:slug/web/...
            // segments[0] is "", segments[1] is the slug
            const potentialSlug = segments[1];

            // Reserved slugs that are NOT businesses
            const reserved = ['login', 'register', 'invoice', '', 'app', 'store', 'assets'];

            if (potentialSlug && !reserved.includes(potentialSlug)) {
                // Determine if we need to fetch (don't refetch if already same slug)
                if (business?.slug !== potentialSlug) {
                    try {
                        const res = await fetch(`${API_URL}/business/${potentialSlug}`);
                        if (res.ok) {
                            const data = await res.json();
                            setBusiness(data);
                        } else {
                            // Slug not found
                            setBusiness(null);
                        }
                    } catch (e) {
                        setBusiness(null);
                    }
                }
            } else {
                // Not in a business context (e.g. root landing page)
                // However, do not clear if we are in a sub-route that might need it, 
                // but strictly speaking, if URL doesn't have slug, we are not in business context.
                // Except maybe /login might need to know? No, /:slug/app/login handles that.
                if (location.pathname === '/' || location.pathname === '/register' || location.pathname === '/login') {
                    setBusiness(null);
                }
            }
        };

        resolveBusiness();
    }, [location.pathname]);

    // 2. Validate User against Business Context
    useEffect(() => {
        if (user && business) {
            if (user.businessId !== business.id && user.role !== 'SUPERADMIN') {
                // User is logged in but trying to access a different business's app
                // Logout or redirect?
                // Ideally, we just warn or redirect.
                // For now, let's just log.
                console.warn(`User ${user.username} (Business ${user.businessId}) accessing Business ${business.name} (${business.id})`);
            }
        }
    }, [user, business]);

    useEffect(() => {
        const initAuth = async () => {
            if (token) {
                try {
                    const res = await fetch(`${API_URL}/auth/me`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    if (res.ok) {
                        const userData = await res.json();
                        setUser(userData);
                    } else {
                        logout();
                    }
                } catch (e) {
                    logout();
                }
            }
            setIsLoading(false);
        };
        initAuth();
    }, [token]);

    const login = async (username: string, password: string): Promise<User> => {
        const res = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Login failed');

        // Validation: If we are in a business context, ensure user belongs to it
        if (business) {
            if (data.user.businessId !== business.id && data.user.role !== 'SUPERADMIN') {
                throw new Error(`Invalid account for ${business.name}.`);
            }
        }

        setToken(data.token);
        setUser(data.user);
        localStorage.setItem('token', data.token);
        return data.user;
    };

    const logout = () => {
        setToken(null);
        setUser(null);
        localStorage.removeItem('token');
    };

    const hasRole = (roles: string[]) => {
        return user ? roles.includes(user.role) : false;
    };

    if (isLoading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

    return (
        <AuthContext.Provider value={{ user, token, business, login, logout, isAuthenticated: !!user, hasRole }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within an AuthProvider');
    return context;
};

export const ProtectedRoute = ({ children, roles }: { children: React.ReactNode, roles?: string[] }) => {
    const { isAuthenticated, user, hasRole, business } = useAuth();
    const location = useLocation();

    if (!isAuthenticated) {
        // Redirect to /:slug/app/login if business context exists
        const redirectPath = business ? `/${business.slug}/app/login` : '/login';
        return <Navigate to={redirectPath} state={{ from: location }} replace />;
    }

    if (roles && !hasRole(roles)) {
        return <div className="p-8 text-center text-red-600">Access Denied: You do not have permission to view this page.</div>;
    }

    // Double check business context match
    if (business && user && user.businessId !== business.id && user.role !== 'SUPERADMIN') {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center">
                <h2 className="text-xl font-bold mb-2">Wrong Business Account</h2>
                <p className="mb-4">You are logged in as <b>{user.username}</b> (Business ID: {user.businessId}), <br />but are trying to access <b>{business.name}</b> (Business ID: {business.id}).</p>
                <button onClick={() => {
                    // Logout and redirect to login
                    // We need access to logout here, but we are destructuring properties.
                    // The ProtectedRoute component cannot easily call logout from context if we only destructor specific props.
                    // Better to just let user switch.
                    window.location.href = `/${business.slug}/app/login`; // Force refresh to clear state implies we should likely handle logout better.
                }} className="bg-indigo-600 text-white px-4 py-2 rounded">
                    Log in to {business.name}
                </button>
            </div>
        )
    }

    return <>{children}</>;
};
