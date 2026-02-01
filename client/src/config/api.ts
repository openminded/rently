// API Configuration
// This will use environment variable in production or fallback to localhost in development
export const API_BASE_URL = import.meta.env.VITE_API_URL;
export const API_URL = API_BASE_URL;

// Helper function to get full image URL
export const getImageUrl = (path: string) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;

    // Remove /api from base URL if it exists, to get the root URL for static files
    const baseUrl = API_BASE_URL.replace(/\/api$/, '');
    return `${baseUrl}${path}`;
};

export default {
    API_BASE_URL,
    API_URL,
    getImageUrl
};
