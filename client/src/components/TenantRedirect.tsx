import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function TenantRedirect() {
    const { slug } = useParams();
    const navigate = useNavigate();
    const { business } = useAuth();

    useEffect(() => {
        if (slug) {
            // Default to web (storefront) for now, or check generic settings if possible
            // But since we are at /:slug, we can just redirect to /:slug/web
            // However, useAuth might not have loaded business yet if we just landed here.

            // Actually simpler: just redirect to /web by default for public visitors
            navigate(`/${slug}/web`, { replace: true });
        }
    }, [slug, navigate]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
    );
}
