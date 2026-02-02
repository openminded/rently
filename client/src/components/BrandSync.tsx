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
            const head = document.getElementsByTagName('head')[0];
            // Find any existing icon link
            let link = document.querySelector("link[rel*='icon']") as HTMLLinkElement;

            if (!link) {
                link = document.createElement('link');
                link.rel = 'shortcut icon';
                head.appendChild(link);
            }

            // Force Type and Href
            link.type = 'image/png'; // Assume PNG for uploaded logos, or extract from url
            link.href = `${getImageUrl(logo)}?v=${new Date().getTime()}`; // Cache buster
        }
    }, [name, logo]);

    return null;
}
