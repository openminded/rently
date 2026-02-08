import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { API_URL } from '../config/api';

interface Shift {
    id: number;
    userId: number;
    startTime: string;
    startCash: number;
    expectedCash: number;
    status: 'OPEN' | 'CLOSED';
}

interface ShiftContextType {
    currentShift: Shift | null;
    loading: boolean;
    refreshShift: () => Promise<void>;
    openShift: (startCash: number, notes?: string) => Promise<void>;
    closeShift: (actualCash: number, notes?: string) => Promise<void>;
}

const ShiftContext = createContext<ShiftContextType | undefined>(undefined);

export const ShiftProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { token } = useAuth();
    const [currentShift, setCurrentShift] = useState<Shift | null>(null);
    const [loading, setLoading] = useState(true);

    const refreshShift = async () => {
        if (!token) {
            setCurrentShift(null);
            setLoading(false);
            return;
        }
        try {
            const res = await fetch(`${API_URL}/shifts/current`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data && (data.isOpen || data.status === 'OPEN')) {
                setCurrentShift(data);
            } else {
                setCurrentShift(null);
            }
        } catch (error) {
            console.error('Failed to fetch shift:', error);
        } finally {
            setLoading(false);
        }
    };

    const openShift = async (startCash: number, notes?: string) => {
        const res = await fetch(`${API_URL}/shifts/open`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ startCash, notes })
        });

        if (!res.ok) {
            const errorData = await res.json().catch(() => ({}));
            console.error('[ShiftContext] Open shift failed:', {
                status: res.status,
                error: errorData.error || 'Unknown error'
            });
            throw new Error(errorData.error || 'Failed to open shift');
        }
        await refreshShift();
    };

    const closeShift = async (actualCash: number, notes?: string) => {
        if (!currentShift) return;
        const res = await fetch(`${API_URL}/shifts/${currentShift.id}/close`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ actualCash, notes })
        });
        if (!res.ok) throw new Error('Failed to close shift');
        await refreshShift();
    };

    useEffect(() => {
        if (token) {
            refreshShift();
        } else {
            setCurrentShift(null);
            setLoading(false);
        }
    }, [token]);

    return (
        <ShiftContext.Provider value={{ currentShift, loading, refreshShift, openShift, closeShift }}>
            {children}
        </ShiftContext.Provider>
    );
};

export const useShift = () => {
    const context = useContext(ShiftContext);
    if (!context) throw new Error('useShift must be used within a ShiftProvider');
    return context;
};
