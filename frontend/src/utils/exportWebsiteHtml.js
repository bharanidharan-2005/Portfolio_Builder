import { PORTFOLIO_THEMES } from '../canvas/themes';
import { notify } from '../toast';

// HTML-escape user content before injecting it into the exported static site
// to prevent stored XSS in the downloadable portfolio file.
const escapeHtml = (value) => {
    if (value === null || value === undefined) return '';
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
};

// Builds a standalone, self-contained HTML string of the portfolio using the
// active page's sections. Pure logic + string template (no state), kept
// separate from the panel component so the exporter stays unit-testable and
// reusable by both the download and one-click deploy flows.
export function buildPortfolioHtml({ pages, activePage, selectedSection, localContent, userData }) {
    if (!pages || pages.length === 0) {
        notify("No data structure sections found to build.", 'error');
        return;
    }

    const themeId = (userData && userData.theme) ? userData.theme : 'cyberpunk_neon';
    const theme = PORTFOLIO_THEMES[themeId] || PORTFOLIO_THEMES['cyberpunk_neon'];
    // Export the page the user is currently viewing (fall back to the first page).
    const targetPage = activePage ? pages.find(p => p.name === activePage) : null;
    const activeSections = (targetPage && targetPage.sections) || pages[0].sections || [];

    let sectionsHtml = '';

    // Banner <img> for sections that have a generated image applied.
    const bannerImg = (url) => url
        ? `<img src="${escapeHtml(url)}" alt="Section image" class="w-full h-48 object-cover rounded-xl mb-6 shadow-sm border ${theme.border}">`
        : '';

    activeSections.forEach(sec => {
        const type = (sec.section_type || '').toLowerCase().trim();
        const data = (selectedSection && sec.id === selectedSection.id) ? { ...sec.content_data, ...localContent } : (sec.content_data || {});

        if (type === 'hero') {
            const bgImage = escapeHtml(data.backgroundImage || '');
            const bgInlineStyle = bgImage
                ? `style="background-image: linear-gradient(rgba(0,0,0,0.7), rgba(0,0,0,0.8)), url('${bgImage}'); background-size: cover; background-position: center; background-repeat: no-repeat;"`
                : '';

            const heroProjects = [];
            const pgSection = activeSections.find(s => (s.section_type || '').toLowerCase().trim() === 'projects_grid');
            if (pgSection && pgSection.content_data && Array.isArray(pgSection.content_data.projects)) {
                heroProjects.push(...pgSection.content_data.projects);
            }
            const liveOptions = [
                data.liveUrl ? { label: 'Live Website', url: data.liveUrl } : null,
                data.linkedin ? { label: 'LinkedIn', url: data.linkedin } : null,
                data.github ? { label: 'GitHub', url: data.github } : null,
            ].filter(Boolean);
            const designOptions = [
                data.designUrl ? { label: 'Design Repository', url: data.designUrl } : null,
                ...heroProjects.map(p => ({ label: p.title || 'Untitled Project', url: p.projectUrl })),
            ].filter(Boolean);

            const liveMenuHtml = liveOptions.length > 0
                ? liveOptions.map(opt => `<a href="${escapeHtml(opt.url)}" target="_blank" class="block px-3 py-2 rounded-lg text-xs font-bold ${theme.textPrimary} hover:bg-black/10 transition-colors">${escapeHtml(opt.label)}</a>`).join('')
                : `<span class="block px-3 py-2 text-xs ${theme.textSecondary}">No links configured.</span>`;
            const designMenuHtml = designOptions.length > 0
                ? designOptions.map(opt => opt.url
                    ? `<a href="${escapeHtml(opt.url)}" target="_blank" class="block px-3 py-2 rounded-lg text-xs font-bold ${theme.textPrimary} hover:bg-black/10 transition-colors">${escapeHtml(opt.label)}</a>`
                    : `<span class="block px-3 py-2 text-xs ${theme.textSecondary}">${escapeHtml(opt.label)} — no link</span>`).join('')
                : `<span class="block px-3 py-2 text-xs ${theme.textSecondary}">No projects or repository set.</span>`;

            sectionsHtml += `
            <section class="text-center py-20 px-4 space-y-6 rounded-2xl mb-8 border ${theme.border} ${!bgImage ? theme.cardBg || 'bg-slate-50' : ''}" ${bgInlineStyle}>
                <div class="relative z-10 max-w-2xl mx-auto">
                    <h1 class="text-4xl sm:text-5xl font-black tracking-tight ${bgImage ? 'text-white' : theme.textPrimary}">
                        ${escapeHtml(data.heading) || 'YOUR NAME'}
                    </h1>
                    <p class="text-sm sm:text-base leading-relaxed mt-4 ${bgImage ? 'text-slate-300' : theme.textSecondary}">
                        ${escapeHtml(data.subheading) || 'Professional Headline'}
                    </p>
                    
                    <div class="flex justify-center gap-4 pt-6">
                        <details class="relative">
                            <summary class="px-5 py-2.5 bg-white text-slate-900 border ${theme.border} text-sm font-bold rounded-xl hover:-translate-y-1 transition-all shadow-md cursor-pointer list-none text-center">See Live▾</summary>
                            <div class="absolute left-1/2 -translate-x-1/2 mt-2 w-48 rounded-xl bg-white border border-slate-200 p-2 shadow-xl text-left z-20">
                                ${liveMenuHtml}
                            </div>
                        </details>
                        <details class="relative">
                            <summary class="px-5 py-2.5 border ${theme.border} ${theme.textPrimary} bg-transparent hover:bg-black/5 text-sm font-bold rounded-xl hover:-translate-y-1 transition-all shadow-sm cursor-pointer list-none text-center">Projects▾</summary>
                            <div class="absolute left-1/2 -translate-x-1/2 mt-2 w-56 rounded-xl bg-white border border-slate-200 p-2 shadow-xl text-left z-20">
                                ${designMenuHtml}
                            </div>
                        </details>
                    </div>
                </div>
            </section>\n`;
        } else if (type === 'about') {
            sectionsHtml += `
            <section class="py-10 space-y-4">
                ${bannerImg(data.backgroundImage)}
                <h2 class="text-xs uppercase font-black tracking-widest ${theme.accentText}">About Me</h2>
                <p class="text-sm leading-relaxed ${theme.textSecondary}">
                    ${escapeHtml(data.bio)}
                </p>
            </section>\n`;
        } else if (type === 'education') {
            const schoolsHtml = (data.schools || []).map(school => `
                <div class="border ${theme.border} bg-white/5 p-5 rounded-xl transition-all hover:shadow-md">
                    <div class="flex justify-between items-start mb-2 gap-4">
                        <div class="space-y-1">
                            <h3 class="font-bold text-sm uppercase tracking-wide ${theme.textPrimary}">${escapeHtml(school.institution) || 'Institution'}</h3>
                            <p class="text-xs font-medium ${theme.textSecondary}">${escapeHtml(school.degree)}</p>
                        </div>
                        <span class="text-xs font-mono px-3 py-1 rounded-md shrink-0 border bg-slate-50 border-slate-200 text-slate-800">${escapeHtml(school.years)}</span>
                    </div>
                    <div class="mt-4 pt-3 border-t ${theme.border} flex items-center gap-2 text-xs">
                        <span class="${theme.textSecondary}">Performance:</span>
                        <span class="font-mono font-bold ${theme.textPrimary}">${escapeHtml(school.score) || 'N/A'}</span>
                    </div>
                </div>
            `).join('');
            sectionsHtml += `<section class="py-10 space-y-4">${bannerImg(data.backgroundImage)}<h2 class="text-xs uppercase font-black tracking-widest ${theme.accentText}">Educational Background</h2><div class="space-y-4">${schoolsHtml}</div></section>\n`;
        } else if (type === 'skills') {
            const skillsHtml = (data.items || []).map(skill => `
                <div class="relative group space-y-2 p-3 -m-3 rounded-xl hover:bg-slate-500/5 transition-colors">
                    <div class="flex justify-between items-center text-sm font-bold">
                        <span class="${theme.textPrimary}">${escapeHtml(skill.name) || 'Skill'}</span>
                        <span class="${theme.accentText} font-mono text-xs">${Number(skill.level) || 50}%</span>
                    </div>
                    <div class="w-full h-2.5 bg-black/5 rounded-full border ${theme.border} overflow-hidden">
                        <div class="h-full rounded-full ${theme.accentText} bg-current" style="width: ${Number(skill.level) || 50}%"></div>
                    </div>
                </div>
            `).join('');
            sectionsHtml += `<section class="py-10 space-y-4">${bannerImg(data.backgroundImage)}<h2 class="text-xs uppercase font-black tracking-widest ${theme.accentText}">Core Expertise</h2><div class="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5 mt-4">${skillsHtml}</div></section>\n`;
        } else if (type === 'projects_grid') {
            const projectsHtml = (data.projects || []).map(proj => `
                <div class="border ${theme.border} bg-white/5 p-5 rounded-xl flex flex-col justify-between space-y-4 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md">
                    <div class="space-y-2">
                        <h3 class="font-bold text-sm uppercase tracking-wide truncate ${theme.textPrimary}">${escapeHtml(proj.title) || 'Project'}</h3>
                        <p class="text-xs leading-relaxed line-clamp-3 ${theme.textSecondary}">${escapeHtml(proj.desc)}</p>
                    </div>
                    <div class="space-y-3 pt-2">
                        <div class="text-[10px] italic ${theme.textSecondary}">Tags: ${escapeHtml((proj.tags || []).join(", "))}</div>
                        ${proj.projectUrl ? `<a href="${escapeHtml(proj.projectUrl)}" target="_blank" class="block text-center w-full py-2 rounded-lg text-xs font-bold transition-all border bg-slate-50 text-slate-800 border-slate-200 hover:opacity-80">View Live &rarr;</a>` : ''}
                    </div>
                </div>
            `).join('');
            sectionsHtml += `<section class="py-10 space-y-4">${bannerImg(data.backgroundImage)}<h2 class="text-xs uppercase font-black tracking-widest ${theme.accentText}">${escapeHtml(data.title) || 'Showcase'}</h2><div class="grid grid-cols-1 md:grid-cols-2 gap-5">${projectsHtml}</div></section>\n`;
        } else if (type === 'contact') {
            const contactLinksHtml = [
                data.email ? `<a href="mailto:${escapeHtml(data.email)}" class="px-4 py-2 border rounded-full text-xs font-bold shadow-sm transition-all ${theme.border} ${theme.textPrimary} bg-white/5 hover:scale-105">✉ ${escapeHtml(data.email)}</a>` : '',
                data.phone ? `<a href="tel:${escapeHtml(data.phone)}" class="px-4 py-2 border rounded-full text-xs font-bold shadow-sm transition-all ${theme.border} ${theme.textPrimary} bg-white/5 hover:scale-105">☏ ${escapeHtml(data.phone)}</a>` : '',
                data.linkedin ? `<a href="${escapeHtml(data.linkedin)}" target="_blank" class="px-4 py-2 border rounded-full text-xs font-bold shadow-sm transition-all ${theme.border} ${theme.textPrimary} bg-white/5 hover:scale-105">LinkedIn</a>` : '',
                data.github ? `<a href="${escapeHtml(data.github)}" target="_blank" class="px-4 py-2 border rounded-full text-xs font-bold shadow-sm transition-all ${theme.border} ${theme.textPrimary} bg-white/5 hover:scale-105">GitHub</a>` : '',
            ].filter(Boolean).join(' ');
            sectionsHtml += `
            <section class="py-12 text-center space-y-6 border-t ${theme.border} mt-8">
                ${bannerImg(data.backgroundImage)}
                <h2 class="text-xs uppercase font-black tracking-widest ${theme.accentText}">Get In Touch</h2>
                <p class="text-sm max-w-md mx-auto leading-relaxed ${theme.textSecondary}">
                    ${escapeHtml(data.text) || 'Reach out to collaborate on future projects.'}
                </p>
                <div class="flex flex-wrap justify-center gap-3">
                    ${contactLinksHtml}
                </div>
            </section>\n`;
        }
    });

    const fullHtmlDocument = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <script src="https://cdn.tailwindcss.com"></script>
    <title>Portfolio Site</title>
</head>
<body class="${theme.bodyBg} min-h-screen p-6 md:p-12 font-sans selection:bg-blue-500/30">
    <main class="max-w-3xl mx-auto">${sectionsHtml}</main>
</body>
</html>`;

    return fullHtmlDocument;
}

// Thin wrapper for the "Download Standalone HTML Site" button: builds the HTML
// via buildPortfolioHtml and triggers a local file download.
export function downloadPortfolioHtml(props) {
    const html = buildPortfolioHtml(props);
    const blob = new Blob([html], { type: 'text/html;charset=utf-8;' });
    const anchorElement = document.createElement('a');
    anchorElement.href = URL.createObjectURL(blob);
    anchorElement.download = "portfolio_site.html";
    document.body.appendChild(anchorElement);
    anchorElement.click();
    document.body.removeChild(anchorElement);
}