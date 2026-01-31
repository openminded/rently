import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const API_URL = 'http://localhost:3000/api';

interface BrandSettings {
    name: string;
    logo: string;
    loading: boolean;
}

export function useBrand() {
    const { token } = useAuth();
    const [brand, setBrand] = useState<BrandSettings>({
        name: 'Rumah Dinar', // Default
        logo: '',
        loading: true
    });

    useEffect(() => {
        const fetchBrand = async () => {
            try {
                let data: any = null;

                // 1. Try Authenticated Fetch if token exists
                if (token) {
                    const res = await fetch(`${API_URL}/settings`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    if (res.ok) {
                        data = await res.json();
                    }
                }

                // 2. Fallback to Public Fetch if no token or auth failed
                if (!data) {
                    const res = await fetch(`${API_URL}/settings/public`);
                    if (res.ok) {
                        data = await res.json();
                    }
                }

                if (data) {
                    setBrand({
                        name: data.BRAND_NAME || 'Rumah Dinar',
                        logo: data.BRAND_LOGO || '',
                        loading: false
                    });
                } else {
                    // Keep default but stop loading
                    setBrand(prev => ({ ...prev, loading: false }));
                }
            } catch (e) {
                console.error("Failed to fetch brand", e);
                setBrand(prev => ({ ...prev, loading: false }));
            }
        };

        fetchBrand();
    }, [token]);

    return brand;
}
