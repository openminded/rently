
import { Helmet } from 'react-helmet-async';

interface SEOProps {
    title: string;
    description: string;
    keywords?: string;
    image?: string;
    url?: string;
    type?: 'website' | 'article';
}

export default function SEO({
    title,
    description,
    keywords,
    image = '/og-image.jpg', // Default image (needs to be added to public folder)
    url = 'https://werently.com',
    type = 'website'
}: SEOProps) {
    const siteTitle = 'Werently - Aplikasi Kasir Laundry & Sewa Baju';

    return (
        <Helmet>
            {/* Standard Metadata */}
            <title>{`${title} | Werently`}</title>
            <meta name="description" content={description} />
            {keywords && <meta name="keywords" content={keywords} />}
            <link rel="canonical" href={url} />

            {/* Open Graph / Facebook */}
            <meta property="og:type" content={type} />
            <meta property="og:url" content={url} />
            <meta property="og:title" content={title} />
            <meta property="og:description" content={description} />
            <meta property="og:image" content={image} />
            <meta property="og:site_name" content={siteTitle} />

            {/* Twitter */}
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:url" content={url} />
            <meta name="twitter:title" content={title} />
            <meta name="twitter:description" content={description} />
            <meta name="twitter:image" content={image} />
        </Helmet>
    );
}
