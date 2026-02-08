import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

import { API_BASE_URL } from '../config/api';

const API_URL = API_BASE_URL;

interface BrandSettings {
    name: string;
    logo: string;
    loading: boolean;
}

export function useBrand() {
    const { token, business } = useAuth();
    const [brand, setBrand] = useState<BrandSettings>({
        name: business?.name || 'Werently',
        logo: '',
        loading: true
    });

    useEffect(() => {
        const fetchBrand = async () => {
            try {
                // If we are in a business context, use that business's branding
                if (business) {
                    setBrand({
                        name: business.name,
                        logo: '', // TODO: Add logo to Business model or fetch from settings
                        loading: false
                    });
                    return;
                }

                let data: any = null;

                // 1. Try Authenticated Fetch if token exists (and no specific business context yet)
                if (token) {
                    const res = await fetch(`${API_URL}/settings`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    if (res.ok) {
                        data = await res.json();
                    }
                }

                // 2. Fallback to Public Fetch
                if (!data) {
                    const res = await fetch(`${API_URL}/settings/public`);
                    if (res.ok) {
                        data = await res.json();
                    }
                }

                if (data) {
                    setBrand({
                        name: data.BRAND_NAME || 'Werently',
                        logo: data.BRAND_LOGO || '',
                        loading: false
                    });
                } else {
                    setBrand(prev => ({ ...prev, loading: false }));
                }
            } catch (e) {
                console.error("Failed to fetch brand", e);
                setBrand(prev => ({ ...prev, loading: false }));
            }
        };

        fetchBrand();
    }, [token, business]);

    return brand;
}
