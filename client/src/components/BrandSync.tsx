import { useEffect } from 'react';
import { useBrand } from '../hooks/useBrand';
import { getImageUrl } from '../config/api';

export default function BrandSync() {
    const { name, logo } = useBrand();

    useEffect(() => {
        // Update Title
        if (name) {
            document.title = name;
        }

        // Update Favicon
        if (logo) {
            const link: HTMLLinkElement | null = document.querySelector("link[rel*='icon']") || document.createElement('link');
            link.type = 'image/png';
            link.rel = 'shortcut icon';
            link.href = getImageUrl(logo);
            document.getElementsByTagName('head')[0].appendChild(link);
        } else {
            // Revert to default or keep simplified logic
        }
    }, [name, logo]);

    return null;
}
