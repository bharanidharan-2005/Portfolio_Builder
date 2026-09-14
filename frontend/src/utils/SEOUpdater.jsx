import { useEffect } from 'react';

export default function SEOUpdater({ pages, userData, isPublicPreview }) {
    useEffect(() => {
        if (!pages || pages.length === 0 || !isPublicPreview) return;

        // Try to find the hero section to extract metadata
        let heroSection = null;
        for (const page of pages) {
            if (page.sections) {
                heroSection = page.sections.find(s => s.section_type === 'hero');
                if (heroSection) break;
            }
        }

        const title = heroSection?.content_data?.heading || userData?.name ? `${userData.name}'s Portfolio` : 'Portfolio';
        const description = heroSection?.content_data?.subheading || 'A professional portfolio built with AuraBuild Studio.';

        document.title = title;

        // Update meta tags dynamically
        const setMetaTag = (name, content) => {
            let element = document.querySelector(`meta[name="${name}"]`);
            if (!element) {
                element = document.createElement('meta');
                element.setAttribute('name', name);
                document.head.appendChild(element);
            }
            element.setAttribute('content', content);
        };

        const setOgTag = (property, content) => {
            let element = document.querySelector(`meta[property="${property}"]`);
            if (!element) {
                element = document.createElement('meta');
                element.setAttribute('property', property);
                document.head.appendChild(element);
            }
            element.setAttribute('content', content);
        };

        setMetaTag('description', description);
        setOgTag('og:title', title);
        setOgTag('og:description', description);
        setOgTag('og:type', 'website');

        // Note: For full SEO visibility by crawlers, Server-Side Rendering (SSR) is optimal,
        // but this client-side injection helps with link preview unfurling on platforms that run JS.

    }, [pages, userData, isPublicPreview]);

    return null; // Component does not render anything
}
