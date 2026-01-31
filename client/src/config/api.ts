// API Configuration
// This will use environment variable in production or fallback to localhost in development
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
export const API_URL = API_BASE_URL;

// Helper function to get full image URL
export const getImageUrl = (path: string) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    return import.meta.env.VITE_API_URL
        ? path.replace('/api', '')
        : `http://localhost:3000${path}`;
};

export default {
    API_BASE_URL,
    API_URL,
    getImageUrl
};
