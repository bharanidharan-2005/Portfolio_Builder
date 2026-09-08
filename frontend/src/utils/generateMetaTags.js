// Escape helper for injecting user-authored text into HTML <meta> content
// attributes without allowing tag/attribute breakout.
export function escapeHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

// Build a full set of SEO + social sharing <meta> tags from workspace state.
// Returns an array of ready-to-paste <meta>/<link> lines, each escaped so user
// text can never break out of the attribute. The Code Export panel offers these
// as a copyable snippet for custom deployments.
export function generateMetaTags({
    title,
    description,
    author,
    keywords = [],
    imageUrl,
    url,
    siteName = 'AuraBuild',
}) {
    const safeTitle = escapeHtml(title || `${siteName} Portfolio`);
    const safeDesc = escapeHtml(
        description || 'A portfolio built with AuraBuild Workspace Studio.',
    );
    const safeAuthor = escapeHtml(author || '');
    const safeKeywords = escapeHtml(
        Array.isArray(keywords) ? keywords.join(', ') : String(keywords || ''),
    );
    const safeImage = escapeHtml(imageUrl || '');
    const safeUrl = escapeHtml(url || '');

    return [
        `<title>${safeTitle}</title>`,
        `<meta name="description" content="${safeDesc}">`,
        ...(safeAuthor ? [`<meta name="author" content="${safeAuthor}">`] : []),
        ...(safeKeywords ? [`<meta name="keywords" content="${safeKeywords}">`] : []),
        `<meta name="robots" content="index, follow">`,
        // OpenGraph — required for rich link previews on most platforms.
        `<meta property="og:type" content="website">`,
        `<meta property="og:site_name" content="${escapeHtml(siteName)}">`,
        `<meta property="og:title" content="${safeTitle}">`,
        `<meta property="og:description" content="${safeDesc}">`,
        ...(safeImage ? [`<meta property="og:image" content="${safeImage}">`] : []),
        ...(safeUrl ? [`<meta property="og:url" content="${safeUrl}">`] : []),
        // Twitter Card — falls back to og:* when its own fields are absent.
        `<meta name="twitter:card" content="summary_large_image">`,
        `<meta name="twitter:title" content="${safeTitle}">`,
        `<meta name="twitter:description" content="${safeDesc}">`,
        ...(safeImage ? [`<meta name="twitter:image" content="${safeImage}">`] : []),
    ];
}