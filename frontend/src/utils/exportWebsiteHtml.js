import React from 'react';
import { renderToString } from 'react-dom/server';
import { PORTFOLIO_THEMES, PORTFOLIO_FONTS } from '../canvas/themes';
import { notify } from '../toast';
import PortfolioFrontpage, { getRoleImage } from '../components/portfolio/PortfolioFrontpage';
import { getSkillIconUrl } from './skillIcons';

const escapeHtml = (value) => {
    if (value === null || value === undefined) return '';
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
};

const getAbsoluteUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) return url;
    
    // Extract backend base URL from VITE_API_URL or use fallback
    const rawApiUrl = import.meta.env.VITE_API_URL || 'https://aurabuild-backend.onrender.com';
    // Remove trailing slashes and '/api' if present
    const baseUrl = rawApiUrl.replace(/\/api\/?$/, '').replace(/\/$/, '');
    
    return baseUrl + (url.startsWith('/') ? '' : '/') + url;
};

const getTechIconHtml = (techName) => {
    if (!techName) return '';
    const url = getSkillIconUrl(techName);
    if (url) {
        return `<img src="${url}" alt="" class="w-4 h-4 object-contain inline-block mr-1.5 drop-shadow-md" />`;
    }
    const fallbackSvg = getFallbackIconSvg(techName);
    return fallbackSvg.replace('w-7 h-7', 'w-4 h-4 inline-block mr-1.5');
};

const getFallbackIconSvg = (skillName) => {
    const key = String(skillName || "").toLowerCase().trim();
    const wrapper = (path) => `<svg xmlns="http://www.w3.org/2000/svg" class="w-7 h-7 opacity-80 group-hover:opacity-100 transition-opacity drop-shadow-md text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${path}</svg>`;

    if (key.includes('ai') || key.includes('machine learning') || key.includes('deep learning') || key.includes('rag') || key.includes('generative')) {
        return wrapper('<path d="M12 4.5a2.5 2.5 0 0 0-4.96-.46 2.5 2.5 0 0 0-1.98 3 2.5 2.5 0 0 0-1.32 4.24 3 3 0 0 0 .34 5.58 2.5 2.5 0 0 0 2.96 3.08 2.5 2.5 0 0 0 4.91.05L12 20V4.5Z"/><path d="M16 8V5c0-1.1.9-2 2-2"/><path d="M12 13h4"/><path d="M12 17h6"/><path d="M21 9V7"/><path d="M21 14v-2"/><path d="M21 19v-2"/>');
    }
    if (key.includes('database') || key.includes('sql') || key.includes('data')) {
        return wrapper('<ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5V19A9 3 0 0 0 21 19V5"/><path d="M3 12A9 3 0 0 0 21 12"/>');
    }
    if (key.includes('api') || key.includes('rest') || key.includes('network') || key.includes('backend') || key.includes('server')) {
        return wrapper('<rect width="20" height="8" x="2" y="2" rx="2" ry="2"/><rect width="20" height="8" x="2" y="14" rx="2" ry="2"/><line x1="6" x2="6.01" y1="6" y2="6"/><line x1="6" x2="6.01" y1="18" y2="18"/>');
    }
    if (key.includes('frontend') || key.includes('ui') || key.includes('ux') || key.includes('design') || key.includes('web')) {
        return wrapper('<rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><line x1="3" x2="21" y1="9" y2="9"/><line x1="9" x2="9" y1="21" y2="9"/>');
    }
    if (key.includes('devops') || key.includes('cloud') || key.includes('deploy') || key.includes('ci/cd') || key.includes('pipeline')) {
        return wrapper('<rect x="16" y="16" width="6" height="6" rx="1"/><rect x="2" y="16" width="6" height="6" rx="1"/><rect x="9" y="2" width="6" height="6" rx="1"/><path d="M5 16v-3a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v3"/><path d="M12 12V8"/>');
    }
    if (key.includes('system') || key.includes('architecture') || key.includes('infrastructure')) {
        return wrapper('<path d="M2.97 12.92A2 2 0 0 0 2 14.63v3.24a2 2 0 0 0 .97 1.71l3 1.8a2 2 0 0 0 2.06 0L12 19v-5.5l-5-3-4.03 2.42Z"/><path d="M12 19l3.97 2.38a2 2 0 0 0 2.06 0l3-1.8a2 2 0 0 0 .97-1.71v-3.24a2 2 0 0 0-.97-1.71L17 10.5l-5 3V19Z"/><path d="M7 10.5 11.03 8.1a2 2 0 0 1 1.94 0L17 10.5l-5 3-5-3Z"/>');
    }
    if (key.includes('script') || key.includes('code') || key.includes('programming')) {
        return wrapper('<path d="M4 22h14a2 2 0 0 0 2-2V7l-5-5H6a2 2 0 0 0-2 2v4"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="m5 12-3 3 3 3"/><path d="m9 18 3-3-3-3"/>');
    }
    return wrapper('<path d="m18 16 4-4-4-4"/><path d="m6 8-4 4 4 4"/><path d="m14.5 4-5 16"/>');
};

const FRONT_PAGE_TEMPLATES = {
    template1: { bgClass: 'bg-[#05050A]', textClass: 'text-white', accentClass: 'text-blue-400', buttonClass: 'bg-blue-600', layoutDir: 'lg:flex-row', visual: 'Image' },
    template2: { bgClass: 'bg-slate-950', textClass: 'text-white', accentClass: 'text-emerald-400', buttonClass: 'bg-emerald-600', layoutDir: 'lg:flex-row-reverse', visual: 'Code' },
    template3: { bgClass: 'bg-[#0f172a]', textClass: 'text-slate-100', accentClass: 'text-purple-400', buttonClass: 'bg-purple-600', layoutDir: 'lg:flex-row', visual: 'Sphere' },
    template4: { bgClass: 'bg-zinc-950', textClass: 'text-zinc-100', accentClass: 'text-rose-400', buttonClass: 'bg-rose-600', layoutDir: 'lg:flex-row', visual: 'Icons' },
    template5: { bgClass: 'bg-[#1e1e2e]', textClass: 'text-[#cdd6f4]', accentClass: 'text-[#89b4fa]', buttonClass: 'bg-[#89b4fa]', layoutDir: 'lg:flex-row-reverse', visual: 'Image' },
    template6: { bgClass: 'bg-[#0B0C10]', textClass: 'text-[#C5C6C7]', accentClass: 'text-[#66FCF1]', buttonClass: 'bg-[#45A29E]', layoutDir: 'lg:flex-row', visual: 'Code' },
    template7: { bgClass: 'bg-black', textClass: 'text-gray-200', accentClass: 'text-yellow-400', buttonClass: 'bg-yellow-600', layoutDir: 'lg:flex-row-reverse', visual: 'Sphere' },
    template8: { bgClass: 'bg-indigo-950', textClass: 'text-indigo-100', accentClass: 'text-indigo-400', buttonClass: 'bg-indigo-600', layoutDir: 'lg:flex-row', visual: 'Icons' },
    template9: { bgClass: 'bg-[#121212]', textClass: 'text-[#E0E0E0]', accentClass: 'text-[#BB86FC]', buttonClass: 'bg-[#BB86FC]', layoutDir: 'lg:flex-row', visual: 'Image' },
    template10: { bgClass: 'bg-slate-900', textClass: 'text-slate-200', accentClass: 'text-cyan-400', buttonClass: 'bg-cyan-600', layoutDir: 'lg:flex-row-reverse', visual: 'Code' },
    template11: { bgClass: 'bg-[#282c34]', textClass: 'text-[#abb2bf]', accentClass: 'text-[#61afef]', buttonClass: 'bg-[#61afef]', layoutDir: 'lg:flex-row', visual: 'Icons' },
    template12: { bgClass: 'bg-gray-950', textClass: 'text-gray-100', accentClass: 'text-orange-400', buttonClass: 'bg-orange-600', layoutDir: 'lg:flex-row-reverse', visual: 'Sphere' },
    template13: { bgClass: 'bg-[#1a1a1a]', textClass: 'text-[#f2f2f2]', accentClass: 'text-[#ff6b6b]', buttonClass: 'bg-[#ff6b6b]', layoutDir: 'lg:flex-row', visual: 'Image' },
    template14: { bgClass: 'bg-[#0d1117]', textClass: 'text-[#c9d1d9]', accentClass: 'text-[#58a6ff]', buttonClass: 'bg-[#1f6feb]', layoutDir: 'lg:flex-row-reverse', visual: 'Code' },
    template15: { bgClass: 'bg-[#11111b]', textClass: 'text-[#cdd6f4]', accentClass: 'text-[#f38ba8]', buttonClass: 'bg-[#f38ba8]', layoutDir: 'lg:flex-row', visual: 'Icons' }
};

export function buildPortfolioHtml({ pages, activePage, selectedSection, localContent, userData }) {
    if (!pages || pages.length === 0) {
        notify("No data structure sections found to build.", 'error');
        return;
    }

    const themeId = (userData && userData.theme) ? userData.theme : 'cyberpunk_neon';
    const theme = PORTFOLIO_THEMES[themeId] || PORTFOLIO_THEMES['minimal_executive'];
    
    const targetPage = activePage ? pages.find(p => p.name === activePage) : null;
    const activeSections = (targetPage && targetPage.sections) || pages[0].sections || [];

    const globalBg = (userData && userData.globalBg) ? getAbsoluteUrl(userData.globalBg) : '';
    const isDark = theme.bodyBg?.includes('black') || theme.bodyBg?.includes('#0') || /bg-(slate|gray|zinc|neutral|stone)-9/.test(theme.bodyBg) || theme.bodyBg?.includes('dark:');

    const heroSec = activeSections.find(s => (s.section_type || '').toLowerCase().trim() === 'hero');
    const heroData = heroSec?.content_data || {};
    
    const fullName = heroData.heading || 'Developer';
    const frontName = escapeHtml(fullName);
    const frontHeadline = escapeHtml(heroData.subheading || 'Professional Portfolio');
    const frontBio = escapeHtml(heroData.description || heroData.text || '');
    
    const frontInitials = fullName.split(' ').filter(Boolean).map(n => n[0]).join('').substring(0, 2).toUpperCase();
    const frontFirstName = escapeHtml(fullName.split(' ')[0]);
    const roleImageUrl = getAbsoluteUrl(getRoleImage(heroData.subheading || ""));

    const templateKey = userData?.frontpageTemplate || 'template1';
    const tplConfig = FRONT_PAGE_TEMPLATES[templateKey] || FRONT_PAGE_TEMPLATES.template1;

    const heroCustomImage = heroData.customSideImage ? getAbsoluteUrl(heroData.customSideImage) : '';
    const heroVisualImageUrl = heroCustomImage || roleImageUrl;

    const rawHtml = renderToString(React.createElement(PortfolioFrontpage, {
        userData: userData,
        sections: activeSections,
        themeMode: isDark ? 'dark' : 'light',
        onVisualize: null
    }));

    const overrideCss = `
    <style>
      #frontpage-overlay {
          position: fixed !important;
          top: 0; left: 0; right: 0; bottom: 0;
          z-index: 100;
          overflow-y: auto !important;
          -webkit-overflow-scrolling: touch;
          transition: opacity 1s ease-in-out, visibility 1s ease-in-out;
      }
      #frontpage-overlay * {
          opacity: 1 !important;
      }
      /* Ensure nested template wrappers don't cut off scrolling */
      #frontpage-overlay > div {
          min-height: 100vh;
          height: auto !important;
          overflow-y: visible !important;
      }
    </style>
    `;

    const frontpageHtml = `
    <div id="frontpage-overlay" class="fixed inset-0 z-[100] transition-opacity duration-1000 ease-in-out overflow-y-auto bg-slate-950">
        ${overrideCss}
        ${rawHtml}
        <script>
            // Dismiss overlay when any action button or link inside frontpage is clicked
            setTimeout(() => {
                const overlay = document.getElementById('frontpage-overlay');
                if (overlay) {
                    const interactives = overlay.querySelectorAll('button, a, [role="button"], .cursor-pointer');
                    interactives.forEach(btn => {
                        btn.addEventListener('click', (e) => {
                            if (typeof dismissFrontpage === 'function') dismissFrontpage();
                        });
                    });
                }
            }, 100);
        </script>
    </div>
    `;

    // 2. Build Navigation Bar (Inner Content)
    const navLinks = activeSections
        .filter(s => s.section_type !== 'hero' && s.section_type !== 'footer')
        .map(s => {
            let label = s.section_type === 'projects_grid' ? 'Projects' : s.section_type.charAt(0).toUpperCase() + s.section_type.slice(1);
            if (s.section_type === 'about') label = 'About';
            if (s.section_type === 'education') label = 'Education';
            if (s.section_type === 'skills') label = 'Skills';
            if (s.section_type === 'contact') label = 'Contact';
            return `<li><a href="#section-${s.id}" class="text-sm font-bold hover:text-blue-400 hover:-translate-y-0.5 inline-block transition-all">${escapeHtml(label)}</a></li>`;
        }).join('');
        
    const navBarHtml = `
    <nav class="fixed top-0 w-full z-50 backdrop-blur-xl bg-black/30 border-b ${theme.border} py-4 px-6 md:px-12 flex justify-between items-center transition-all duration-300 shadow-2xl">
        <div class="text-lg font-black tracking-widest flex items-center gap-3">
            <div class="w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm shadow-inner ${theme.accentBg || 'bg-blue-600'} text-white animate-bounce-slow">
                ${frontInitials}
            </div>
            <span class="${theme.textPrimary}">${frontFirstName}</span>
        </div>
        <ul class="hidden md:flex gap-8 ${theme.textSecondary}">
            ${navLinks}
        </ul>
        <a href="#section-${activeSections[0]?.id || ''}" class="px-5 py-2.5 text-xs font-bold ${theme.accentBg || 'bg-blue-600'} text-white rounded-xl shadow-lg hover:shadow-[0_10px_20px_rgba(59,130,246,0.3)] hover:-translate-y-1 transition-all">Back to Top</a>
    </nav>`;

    // 3. Build Inner Sections
    let sectionsHtml = '';

    activeSections.forEach((sec, idx) => {
        const type = (sec.section_type || '').toLowerCase().trim();
        const data = (selectedSection && sec.id === selectedSection.id) ? { ...sec.content_data, ...localContent } : (sec.content_data || {});
        
        const animDelay = (idx % 3) * 0.2;
        sectionsHtml += `<div id="section-${sec.id}" class="scroll-mt-32 reveal-on-scroll stagger-container" style="transition-delay: ${animDelay}s">`;

        if (type === 'hero') {
            const bgImage = getAbsoluteUrl(data.backgroundImage || '');
            const bgInlineStyle = bgImage
                ? `style="background-image: linear-gradient(rgba(0,0,0,0.7), rgba(0,0,0,0.9)), url('${bgImage}'); background-size: cover; background-position: center;"`
                : '';

            const heroLiveOptions = [];
            if (data.liveUrl) heroLiveOptions.push({ label: "Live Website", url: data.liveUrl });
            if (data.github) heroLiveOptions.push({ label: "GitHub", url: data.github });
            if (data.linkedin) heroLiveOptions.push({ label: "LinkedIn", url: data.linkedin });

            const pg = activeSections.find((s) => { const st = (s.section_type || "").toLowerCase().trim(); return st === "projects_grid" || st === "projects"; });
            const heroProjects = (pg && pg.content_data && pg.content_data.projects) ? pg.content_data.projects : [];
            
            const heroDesignOptions = [];
            if (data.designUrl) heroDesignOptions.push({ label: "Design Repository", url: data.designUrl });
            heroProjects.forEach((project) => {
                heroDesignOptions.push({ label: project.title || "Untitled Project", url: project.projectUrl });
            });

            let seeLiveDropdown = '';
            if (heroLiveOptions.length > 0) {
                if (heroLiveOptions.length === 1) {
                    seeLiveDropdown = `<a href="${escapeHtml(heroLiveOptions[0].url)}" target="_blank" class="px-5 py-2.5 rounded-xl text-sm font-bold transition-all border border-white/5 shadow-lg flex items-center gap-2 bg-[#0a0a0f] hover:bg-[#1a1a24] text-white">See Live &nearr;</a>`;
                } else {
                    const links = heroLiveOptions.map(l => `<a href="${escapeHtml(l.url)}" target="_blank" class="text-left px-4 py-2.5 rounded-lg text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/10 transition-all truncate flex items-center justify-between"><span>${escapeHtml(l.label)}</span><span class="opacity-50 text-[10px]">&nearr;</span></a>`).join('');
                    seeLiveDropdown = `<div class="group relative z-50"><button class="px-5 py-2.5 rounded-xl text-sm font-bold transition-all border border-white/5 shadow-lg flex items-center gap-2 bg-[#0a0a0f] hover:bg-[#1a1a24] text-white">See Live ▾</button><div class="absolute top-full left-0 mt-2 w-48 rounded-xl border border-slate-800 bg-[#0a0a0f]/95 backdrop-blur-xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 flex flex-col p-2 max-h-60 overflow-y-auto custom-scrollbar text-left">${links}</div></div>`;
                }
            }

            let projectsDropdown = '';
            if (heroDesignOptions.length > 0) {
                const links = heroDesignOptions.map(l => `<a href="${escapeHtml(l.url)}" target="_blank" class="text-left px-4 py-2.5 rounded-lg text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/10 transition-all truncate flex items-center justify-between"><span>${escapeHtml(l.label)}</span><span class="opacity-50 text-[10px]">&nearr;</span></a>`).join('');
                projectsDropdown = `<div class="group relative z-50"><button class="px-5 py-2.5 rounded-xl text-sm font-bold transition-all border border-white/5 shadow-lg flex items-center gap-2 bg-[#0a0a0f] hover:bg-[#1a1a24] text-white">Projects ▾</button><div class="absolute top-full left-0 mt-2 w-56 rounded-xl border border-slate-800 bg-[#0a0a0f]/95 backdrop-blur-xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 flex flex-col p-2 max-h-60 overflow-y-auto custom-scrollbar text-left">${links}</div></div>`;
            }

            // CRITICAL FIX: Respect hideSideImage flag for Hero section
            const isHeroImageHidden = data.hideSideImage === true || String(data.hideSideImage).toLowerCase() === 'true';
            const heroSideImage = isHeroImageHidden ? '' : (data.customSideImage ? getAbsoluteUrl(data.customSideImage) : getAbsoluteUrl(getRoleImage(data.subheading || "")));
            const isCustomSide = !!data.customSideImage;

            const heroDescText = data.description || data.text || '';
            const heroDescHtml = heroDescText ? `
                <p class="text-lg md:text-xl leading-relaxed w-full max-w-xl font-medium ${bgImage ? 'text-white/80' : `${theme.textSecondary}`}">
                    ${escapeHtml(heroDescText)}
                </p>
            ` : '';

            sectionsHtml += `
            <section class="py-16 sm:py-24 px-6 sm:px-12 relative rounded-3xl overflow-visible border ${theme.border} ${theme.cardBg || 'bg-black/40 backdrop-blur-xl'} mb-16 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)]" ${bgInlineStyle}>
                <div class="relative z-10 w-full max-w-7xl mx-auto flex flex-col-reverse lg:flex-row items-center gap-12 lg:gap-20">
                    <div class="flex-1 space-y-8 flex flex-col ${heroSideImage ? 'items-center lg:items-start text-center lg:text-left' : 'items-center text-center max-w-4xl mx-auto'} stagger-item stagger-fade-left">
                        <div class="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold border ${theme.border} bg-white/5 backdrop-blur-md shadow-sm">
                            <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                            <span class="${theme.textSecondary} opacity-90">Open to opportunities</span>
                        </div>
                        
                        <div class="space-y-4 w-full">
                            <h1 class="font-black tracking-tight leading-tight w-full max-w-3xl text-4xl sm:text-5xl lg:text-6xl break-words ${bgImage ? 'text-white' : theme.textPrimary}">
                                ${escapeHtml(data.heading) || 'YOUR NAME'}
                            </h1>
                            <p class="text-xl md:text-2xl font-bold w-full ${theme.accentText || 'text-blue-400'}">
                                ${escapeHtml(data.subheading) || 'Professional Headline'}
                            </p>
                            ${heroDescHtml}
                        </div>
                        
                        <div class="flex flex-col items-center lg:items-start gap-6 pt-4 w-full">
                            <div class="flex flex-wrap items-center justify-center lg:justify-start gap-4 w-full">
                                <button onclick="document.getElementById('section-${activeSections.find(s=>s.section_type==='projects_grid')?.id||''}').scrollIntoView({behavior:'smooth'})" class="px-8 py-4 rounded-xl text-sm md:text-base font-bold transition-all shadow-lg hover:shadow-[0_20px_40px_rgba(59,130,246,0.3)] ${theme.accentBg || 'bg-blue-600'} text-white flex items-center gap-2 hover:scale-110 hover:-translate-y-2">
                                    View My Work &rarr;
                                </button>
                                <button class="px-8 py-4 rounded-xl text-sm md:text-base font-bold transition-all bg-transparent hover:bg-white/10 border shadow-sm hover:shadow-lg hover:shadow-white/10 ${theme.textPrimary} border-current hover:scale-110 hover:-translate-y-2">
                                    Download Resume
                                </button>
                            </div>
                            
                            <div class="flex flex-wrap items-center justify-center lg:justify-start gap-3 w-full mt-2">
                                ${seeLiveDropdown}
                                ${projectsDropdown}
                            </div>
                        </div>
                    </div>

                    ${heroSideImage ? `
                    <div class="flex-1 w-full flex justify-center lg:justify-end relative stagger-item stagger-fade-right" style="transition-delay: 0.2s">
                        <div class="relative w-[300px] h-[300px] md:w-[450px] md:h-[450px] lg:w-[500px] lg:h-[500px] animate-float">
                            <div class="absolute inset-0 bg-blue-500/20 rounded-full blur-[100px]"></div>
                            <img src="${heroSideImage}" alt="3D Workspace" class="absolute inset-0 w-full h-full object-cover opacity-90 rounded-3xl ${!isCustomSide ? 'mix-blend-screen' : 'shadow-2xl'}" style="filter: drop-shadow(0 0 30px rgba(59,130,246,0.3));" />
                        </div>
                    </div>
                    ` : ''}
                </div>
            </section>`;
        } else if (type === 'about') {
            const isAboutImageHidden = data.hideSideImage === true || String(data.hideSideImage).toLowerCase() === 'true';
            const aboutSideImg = (isAboutImageHidden || !data.customSideImage) ? '' : getAbsoluteUrl(data.customSideImage);
            const aboutBgImg = data.backgroundImage ? getAbsoluteUrl(data.backgroundImage) : '';
            
            sectionsHtml += `
            <section class="py-12 md:py-16 px-6 md:px-12 mb-16 rounded-[2.5rem] relative overflow-hidden border ${theme.border} ${theme.cardBg || 'bg-black/40 backdrop-blur-xl'} shadow-[0_20px_40px_-15px_rgba(0,0,0,0.4)]">
                ${aboutBgImg ? `
                <div class="absolute inset-0 z-0 pointer-events-none rounded-[2.5rem] overflow-hidden">
                    <div class="absolute inset-0 z-10 backdrop-blur-[4px] bg-[#0B0C10]/80"></div>
                    <img src="${aboutBgImg}" alt="About Background" class="w-full h-full object-cover" />
                </div>
                ` : ''}
                <div class="flex flex-wrap justify-center items-center gap-10 relative z-10">
                    ${aboutSideImg ? `
                    <div class="shrink-0 relative group w-48 h-48 md:w-64 md:h-64 mx-auto md:mx-0 stagger-item stagger-fade-left">
                        <div class="absolute inset-0 rounded-2xl md:rounded-full blur-[30px] opacity-40 bg-gradient-to-tr from-blue-500 to-purple-500 group-hover:opacity-80 transition-opacity duration-700"></div>
                        <img src="${aboutSideImg}" alt="Profile" class="relative w-full h-full object-cover rounded-2xl md:rounded-[3rem] border-4 ${theme.border} shadow-2xl transform transition-transform duration-700 group-hover:scale-110 group-hover:rotate-3" />
                    </div>
                    ` : ''}
                    <div class="flex-[1_1_300px] space-y-5 w-full text-center min-[600px]:text-left stagger-item stagger-fade-right" style="transition-delay: 0.2s">
                        <h2 class="text-3xl sm:text-4xl uppercase font-black tracking-widest mb-10 ${theme.textPrimary}">${escapeHtml(data.title) || 'About Me'}</h2>
                        ${data.bio ? `
                        <div class="text-lg md:text-xl leading-relaxed break-words max-w-full font-medium ${theme.textSecondary}">
                            ${escapeHtml(data.bio)}
                        </div>
                        ` : ''}
                    </div>
                </div>
            </section>`;
        } else if (type === 'education') {
            const hasSchools = data.schools && data.schools.length > 0;
            const itemsHtml = hasSchools ? (data.schools || []).map((s, i) => `
                <div class="stagger-item stagger-fade-up p-8 rounded-3xl border ${theme.border} bg-white/5 hover:bg-white/10 transition-all shadow-md hover:shadow-[0_15px_30px_rgba(0,0,0,0.3)] hover:-translate-y-2 hover:border-white/20 group" style="transition-delay: ${(i%4)*0.1}s">
                    <div class="flex flex-wrap justify-between items-start gap-4">
                        <div class="space-y-2 w-full sm:w-auto flex-1">
                            <h3 class="text-xl font-bold uppercase tracking-wide break-words max-w-full ${theme.textPrimary} group-hover:text-blue-400 transition-colors">${escapeHtml(s.institution || 'Unknown College')}</h3>
                            <p class="text-base font-medium break-words max-w-full ${theme.textSecondary}">${escapeHtml(s.degree || 'Degree')}</p>
                        </div>
                        ${s.years ? `<span class="text-sm font-mono px-5 py-2 rounded-xl border ${theme.border} bg-black/40 ${theme.textSecondary} shadow-inner">${escapeHtml(s.years)}</span>` : ''}
                    </div>
                    ${s.score ? `
                    <div class="mt-6 pt-6 border-t border-white/10 flex items-center gap-2 text-sm">
                        <span class="${theme.textSecondary}">Performance:</span>
                        <span class="font-mono font-bold text-lg ${theme.accentText}">${escapeHtml(s.score)}</span>
                    </div>
                    ` : ''}
                </div>
            `).join('') : `
            <div class="p-12 flex flex-col items-center justify-center text-center rounded-3xl border ${theme.border} bg-white/5 w-full max-w-2xl mx-auto my-8 shadow-sm">
                <h3 class="text-lg font-bold mb-2 ${theme.textPrimary}">No Education Added</h3>
                <p class="text-sm max-w-sm mx-auto ${theme.textSecondary}">This section is currently empty. Check back later for updates.</p>
            </div>
            `;
            sectionsHtml += `<section class="py-16 px-6 md:px-12 mb-16 rounded-3xl border ${theme.border} ${theme.cardBg || 'bg-black/40 backdrop-blur-xl'} shadow-2xl stagger-container"><h2 class="text-3xl sm:text-4xl uppercase font-black tracking-widest mb-12 ${theme.textPrimary} stagger-item stagger-fade-down">${escapeHtml(data.title) || 'Educational Background'}</h2><div class="space-y-6">${itemsHtml}</div></section>`;
        } else if (type === 'skills') {
            const hasItems = data.items && data.items.length > 0;
            const itemsHtml = hasItems ? (data.items || []).map((s, i) => {
                const levelVal = (s.level !== undefined && s.level !== null && s.level !== '') ? s.level : 50;
                const isEven = i % 2 === 0;
                const iconUrl = s.customIcon ? getAbsoluteUrl(s.customIcon) : getSkillIconUrl(s.name);
                return `
                <div class="stagger-item stagger-fade-up p-6 md:p-8 rounded-3xl transition-all duration-500 w-full md:w-[70%] border shadow-md ${theme.border} bg-white/5 hover:bg-white/10 hover:shadow-[0_20px_40px_rgba(0,0,0,0.3)] hover:-translate-y-2 hover:border-white/20 ${isEven ? 'self-start' : 'self-end'} group" style="transition-delay: ${(i%4)*0.1}s">
                    <div class="flex justify-between items-center text-lg font-bold mb-4">
                        <div class="flex items-center gap-3">
                            ${iconUrl ? `<img src="${iconUrl}" alt="${escapeHtml(s.name)}" class="w-8 h-8 object-contain drop-shadow-lg" />` : getFallbackIconSvg(s.name)}
                            <span class="tracking-wide ${theme.textPrimary} group-hover:text-white transition-colors">${escapeHtml(s.name)}</span>
                        </div>
                        <span class="${theme.accentText} font-mono text-sm px-4 py-2 rounded-xl border ${theme.border} bg-black/40 shadow-inner group-hover:bg-black/60 transition-colors">${escapeHtml(levelVal)}%</span>
                    </div>
                    <div class="h-4 w-full rounded-full bg-black/50 overflow-hidden shadow-inner border ${theme.border}">
                        <div class="h-full rounded-full ${theme.accentBg || 'bg-blue-500'} transition-all duration-[1.5s] ease-out group-hover:brightness-125" style="width: ${escapeHtml(levelVal)}%; box-shadow: inset 0 1px 3px rgba(255,255,255,0.2);"></div>
                    </div>
                </div>
            `;
            }).join('') : `
            <div class="p-12 flex flex-col items-center justify-center text-center rounded-3xl border ${theme.border} bg-white/5 w-full shadow-sm">
                <h3 class="text-lg font-bold mb-2 ${theme.textPrimary}">No Skills Added</h3>
                <p class="text-sm max-w-sm mx-auto ${theme.textSecondary}">This section is currently empty. Check back later for updates.</p>
            </div>
            `;
            sectionsHtml += `<section class="py-16 px-6 md:px-12 mb-16 rounded-3xl border ${theme.border} ${theme.cardBg || 'bg-black/40 backdrop-blur-xl'} shadow-2xl stagger-container"><h2 class="text-3xl sm:text-4xl uppercase font-black tracking-widest mb-12 text-center ${theme.textPrimary} stagger-item stagger-fade-down">${escapeHtml(data.title) || 'Core Expertise'}</h2><div class="flex flex-col gap-8 pt-2 w-full max-w-5xl mx-auto px-2">${itemsHtml}</div></section>`;
        } else if (type === 'projects_grid') {
            const hasProjects = data.projects && data.projects.length > 0;
            const projectsHtml = hasProjects ? (data.projects || []).map((p, i) => {
                const isProjImgHidden = p.hideProjectImage === true || String(p.hideProjectImage).toLowerCase() === 'true';
                const projImg = (isProjImgHidden || !p.projectImage) ? '' : getAbsoluteUrl(p.projectImage);
                const tagsList = Array.isArray(p.tags) ? p.tags : (p.tags ? String(p.tags).split(',') : []);
                return `
                <div class="group relative flex flex-col lg:flex-row items-center gap-10 rounded-[2.5rem] border ${theme.border} bg-white/5 overflow-hidden hover:shadow-[0_20px_40px_rgba(0,0,0,0.4)] transition-all duration-700 hover:bg-white/10 p-10 hover:-translate-y-3 hover:border-white/20">
                    <div class="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-1 transition-all duration-700 group-hover:w-full ${theme.accentBg || 'bg-blue-500'} shadow-[0_0_15px_rgba(59,130,246,0.8)]"></div>
                    
                    ${projImg ? `
                    <div class="w-full lg:w-2/5 shrink-0 relative aspect-video rounded-2xl overflow-hidden shadow-xl border ${theme.border} group-hover:border-white/30 transition-all duration-500 stagger-custom-left" style="transition-delay: ${(i*0.2) + 0.1}s">
                        <div class="absolute inset-0 bg-blue-500/20 group-hover:opacity-0 transition-opacity z-10 mix-blend-overlay"></div>
                        <img src="${projImg}" alt="${escapeHtml(p.title)}" class="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700" />
                    </div>
                    ` : ''}
                    
                    <div class="flex-1 space-y-8 flex flex-col ${projImg ? 'lg:pl-6 items-start text-left' : 'items-center text-center'}">
                        ${p.category ? `<div class="text-xs font-bold uppercase tracking-widest ${theme.accentText}">${escapeHtml(p.category)}</div>` : ''}
                        <h3 class="text-3xl sm:text-4xl font-black ${theme.textPrimary} stagger-custom-left group-hover:text-white transition-colors" style="transition-delay: ${(i*0.2) + 0.1}s">${escapeHtml(p.title)}</h3>
                        ${p.desc ? `<p class="text-lg sm:text-xl text-slate-400 leading-relaxed font-medium stagger-custom-right group-hover:text-slate-300 transition-colors" style="transition-delay: ${(i*0.2) + 0.2}s">${escapeHtml(p.desc)}</p>` : ''}
                        ${tagsList.length > 0 ? `
                        <div class="flex flex-wrap gap-3 pt-4 stagger-custom-up ${projImg ? '' : 'justify-center'}" style="transition-delay: ${(i*0.2) + 0.3}s">
                            ${tagsList.map(tag => {
                                const t = tag.trim();
                                if (!t) return '';
                                return `<span class="px-5 py-2.5 text-xs font-mono font-bold rounded-xl bg-black/40 border ${theme.border} ${theme.accentText} shadow-sm group-hover:shadow-md transition-shadow flex items-center">${getTechIconHtml(t)} ${escapeHtml(t)}</span>`;
                            }).join('')}
                        </div>
                        ` : ''}
                        ${p.projectUrl ? `<div class="pt-8 stagger-fade-up" style="transition-delay: ${(i*0.2) + 0.4}s"><a href="${escapeHtml(p.projectUrl)}" target="_blank" class="inline-flex px-8 py-4 text-sm font-bold rounded-xl ${theme.accentBg || 'bg-blue-600'} text-white hover:scale-110 hover:-translate-y-2 transition-all shadow-lg hover:shadow-[0_15px_30px_rgba(59,130,246,0.4)]">View Project &rarr;</a></div>` : ''}
                    </div>
                </div>
            `;
            }).join('') : `
            <div class="p-12 flex flex-col items-center justify-center text-center rounded-3xl border ${theme.border} bg-white/5 w-full shadow-sm">
                <h3 class="text-lg font-bold mb-2 ${theme.textPrimary}">No Projects Yet</h3>
                <p class="text-sm max-w-sm mx-auto ${theme.textSecondary}">This section is currently empty. Check back later for updates.</p>
            </div>
            `;
            sectionsHtml += `<section class="py-16 px-6 md:px-12 mb-16 rounded-3xl border ${theme.border} ${theme.cardBg || 'bg-black/40 backdrop-blur-xl'} shadow-2xl stagger-container"><h2 class="text-3xl sm:text-4xl uppercase font-black tracking-widest mb-12 text-center ${theme.textPrimary} stagger-item stagger-fade-down">${escapeHtml(data.title) || 'Showcase of Innovations'}</h2><div class="flex flex-col gap-12 w-full max-w-5xl mx-auto">${projectsHtml}</div></section>`;
        } else if (type === 'contact') {
            const formHtml = `
            <form class="max-w-xl mx-auto space-y-6 mt-12 bg-black/30 p-10 rounded-3xl border ${theme.border} shadow-2xl text-left stagger-item stagger-fade-up hover:border-white/20 transition-colors duration-500" style="transition-delay: 0.3s" onsubmit="event.preventDefault(); alert('Form submitted! (Demo only in static export)');">
                <div>
                    <label class="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Name</label>
                    <input type="text" placeholder="Your name" class="w-full px-6 py-4 rounded-xl border ${theme.border} bg-black/50 ${theme.textPrimary} focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all shadow-inner focus:scale-[1.02]" />
                </div>
                <div>
                    <label class="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Email</label>
                    <input type="email" placeholder="you@email.com" class="w-full px-6 py-4 rounded-xl border ${theme.border} bg-black/50 ${theme.textPrimary} focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all shadow-inner focus:scale-[1.02]" />
                </div>
                <div>
                    <label class="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Message</label>
                    <textarea placeholder="Tell me about your project..." rows="5" class="w-full px-6 py-4 rounded-xl border ${theme.border} bg-black/50 ${theme.textPrimary} focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all shadow-inner resize-none focus:scale-[1.02]"></textarea>
                </div>
                <button class="w-full px-6 py-4 rounded-xl ${theme.accentBg || 'bg-blue-600'} text-white font-bold hover:shadow-[0_15px_30px_rgba(59,130,246,0.4)] hover:-translate-y-2 transition-all flex items-center justify-center gap-2 text-lg mt-6">
                    Send Message
                </button>
            </form>
            `;
            
            const linksHtml = [
                data.email ? `<a href="mailto:${escapeHtml(data.email)}" class="px-8 py-4 rounded-full text-sm font-bold border ${theme.border} bg-white/5 hover:scale-110 hover:-translate-y-2 hover:bg-white/10 hover:border-white/20 hover:shadow-[0_10px_20px_rgba(255,255,255,0.1)] transition-all text-slate-300 hover:text-white stagger-item stagger-fade-up">✉ ${escapeHtml(data.email)}</a>` : '',
                data.phone ? `<a href="tel:${escapeHtml(data.phone)}" class="px-8 py-4 rounded-full text-sm font-bold border ${theme.border} bg-white/5 hover:scale-110 hover:-translate-y-2 hover:bg-white/10 hover:border-white/20 hover:shadow-[0_10px_20px_rgba(255,255,255,0.1)] transition-all text-slate-300 hover:text-white stagger-item stagger-fade-up">☏ ${escapeHtml(data.phone)}</a>` : '',
                data.linkedin ? `<a href="${escapeHtml(data.linkedin)}" target="_blank" class="px-8 py-4 rounded-full text-sm font-bold border ${theme.border} bg-white/5 hover:scale-110 hover:-translate-y-2 hover:bg-white/10 hover:border-white/20 hover:shadow-[0_10px_20px_rgba(255,255,255,0.1)] transition-all text-slate-300 hover:text-white stagger-item stagger-fade-up">LinkedIn</a>` : '',
                data.github ? `<a href="${escapeHtml(data.github)}" target="_blank" class="px-8 py-4 rounded-full text-sm font-bold border ${theme.border} bg-white/5 hover:scale-110 hover:-translate-y-2 hover:bg-white/10 hover:border-white/20 hover:shadow-[0_10px_20px_rgba(255,255,255,0.1)] transition-all text-slate-300 hover:text-white stagger-item stagger-fade-up">GitHub</a>` : '',
            ].filter(Boolean).join('');
            
            sectionsHtml += `<section class="py-20 px-6 md:px-12 mb-16 text-center rounded-3xl border ${theme.border} ${theme.cardBg || 'bg-black/40 backdrop-blur-xl'} shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)] stagger-container"><h2 class="text-3xl sm:text-4xl uppercase font-black tracking-widest mb-6 ${theme.textPrimary} stagger-item stagger-fade-down">${escapeHtml(data.title) || 'Get In Touch'}</h2>${data.text ? `<p class="text-xl text-slate-400 max-w-lg mx-auto mb-12 leading-relaxed stagger-item stagger-fade-up">${escapeHtml(data.text)}</p>` : ''}<div class="flex flex-wrap justify-center gap-6 mb-10">${linksHtml}</div>${formHtml}</section>`;
        }
        sectionsHtml += `</div>`;
    });

    const fontId = (userData && userData.globalFont) || 'font-inter';
    const fontObj = PORTFOLIO_FONTS.find(f => f.id === fontId) || PORTFOLIO_FONTS.find(f => f.id === 'font-inter');
    const fontFamilyStyle = fontObj ? fontObj.style.fontFamily : "'Inter', sans-serif";
    
    let bgStyleStr = '';
    if (globalBg) {
        bgStyleStr = `background-image: url('${globalBg}'); background-size: cover; background-position: center; background-attachment: fixed;`;
    }

    const fullHtmlDocument = `<!DOCTYPE html>
<html lang="en" class="scroll-smooth ${isDark ? 'dark' : ''}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Archivo:wght@400;500;600;700&family=Bebas+Neue&family=DM+Sans:wght@400;500;600;700&family=Fira+Code:wght@400;500;600;700&family=Geist:wght@400;500;600;700&family=IBM+Plex+Sans:wght@400;500;600;700&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&family=Lora:wght@400;500;600;700&family=Manrope:wght@400;500;600;700&family=Montserrat:wght@400;500;600;700&family=Oswald:wght@400;500;600;700&family=Outfit:wght@400;500;600;700&family=Playfair+Display:wght@400;700&family=Plus+Jakarta+Sans:wght@400;500;600;700&family=Poppins:wght@400;500;600;700&family=Raleway:wght@400;500;600;700&family=Roboto:wght@400;500;700&family=Sora:wght@400;500;600;700&family=Space+Grotesk:wght@400;500;600;700&family=Space+Mono:wght@400;700&family=Syne:wght@400;500;600;700&family=Urbanist:wght@400;500;600;700&display=swap" rel="stylesheet">
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
      tailwind.config = {
        darkMode: 'class',
      }
    </script>
    <link rel="manifest" href="/manifest.json">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="mobile-web-app-capable" content="yes">
    <meta name="theme-color" content="#000000">
    <link rel="apple-touch-icon" href="https://cdn-icons-png.flaticon.com/512/3242/3242120.png">
    <script>
      if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
          navigator.serviceWorker.register('/sw.js').catch(err => console.log('SW setup skipped for local file'));
        });
      }
    </script>
    <title>${frontName} | Portfolio</title>
    <style>
        body { font-family: ${fontFamilyStyle}; }
        ::-webkit-scrollbar { width: 12px; }
        ::-webkit-scrollbar-track { background: rgba(0,0,0,0.3); }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.2); border-radius: 12px; border: 3px solid rgba(0,0,0,0.3); }
        ::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.5); }
        
        .reveal-on-scroll { opacity: 0; transition: all 1.2s cubic-bezier(0.19, 1, 0.22, 1); }
        .reveal-on-scroll.is-visible { opacity: 1; }
        
        /* Ultra Premium Stagger Definitions */
        .stagger-fade-up { opacity: 0; transform: translateY(60px) scale(0.95); transition: all 1s cubic-bezier(0.19, 1, 0.22, 1); }
        .stagger-fade-down { opacity: 0; transform: translateY(-60px) scale(0.95); transition: all 1s cubic-bezier(0.19, 1, 0.22, 1); }
        .stagger-fade-left { opacity: 0; transform: translateX(-60px) scale(0.95); transition: all 1s cubic-bezier(0.19, 1, 0.22, 1); }
        .stagger-fade-right { opacity: 0; transform: translateX(60px) scale(0.95); transition: all 1s cubic-bezier(0.19, 1, 0.22, 1); }
        
        /* Extreme Custom Project Staggers */
        .stagger-custom-left { opacity: 0; transform: translateX(-100px) rotateY(-10deg); transition: all 1s cubic-bezier(0.19, 1, 0.22, 1); }
        .stagger-custom-right { opacity: 0; transform: translateX(100px) rotateY(10deg); transition: all 1s cubic-bezier(0.19, 1, 0.22, 1); }
        .stagger-custom-up { opacity: 0; transform: translateY(50px) scale(0.9); transition: all 1s cubic-bezier(0.19, 1, 0.22, 1); }

        .reveal-on-scroll.is-visible .stagger-fade-up,
        .reveal-on-scroll.is-visible .stagger-fade-down,
        .reveal-on-scroll.is-visible .stagger-fade-left,
        .reveal-on-scroll.is-visible .stagger-fade-right,
        .reveal-on-scroll.is-visible .stagger-custom-left,
        .reveal-on-scroll.is-visible .stagger-custom-right,
        .reveal-on-scroll.is-visible .stagger-custom-up { 
            opacity: 1; 
            transform: translate(0, 0) scale(1) rotateY(0deg); 
        }
        
        /* Persistent Animations */
        @keyframes float {
            0% { transform: translateY(0px) rotate(0deg); }
            50% { transform: translateY(-15px) rotate(1deg); }
            100% { transform: translateY(0px) rotate(0deg); }
        }
        .animate-float { animation: float 6s ease-in-out infinite; }
        
        @keyframes bounceSlow {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-5px); }
        }
        .animate-bounce-slow { animation: bounceSlow 3s infinite; }
        
        @keyframes fadeInDown { 0% { opacity: 0; transform: translateY(-50px); } 100% { opacity: 1; transform: translateY(0); } }
        @keyframes fadeInUp { 0% { opacity: 0; transform: translateY(60px); } 100% { opacity: 1; transform: translateY(0); } }
        @keyframes fadeInLeft { 0% { opacity: 0; transform: translateX(-60px); } 100% { opacity: 1; transform: translateX(0); } }
        @keyframes fadeInRight { 0% { opacity: 0; transform: translateX(60px); } 100% { opacity: 1; transform: translateX(0); } }
        
        .animate-fade-in-down { animation: fadeInDown 1.2s cubic-bezier(0.19, 1, 0.22, 1) forwards; }
        .animate-fade-in-up { animation: fadeInUp 1.2s cubic-bezier(0.19, 1, 0.22, 1) forwards; }
        .animate-fade-in-left { animation: fadeInLeft 1.2s cubic-bezier(0.19, 1, 0.22, 1) forwards; }
        .animate-fade-in-right { animation: fadeInRight 1.2s cubic-bezier(0.19, 1, 0.22, 1) forwards; }
    </style>
</head>
<body class="${theme.bodyBg} ${isDark ? 'text-slate-200' : 'text-slate-800'} min-h-screen selection:bg-blue-500/30 overflow-hidden" style="font-family: ${fontFamilyStyle}; ${bgStyleStr}">
    
    ${frontpageHtml}

    ${globalBg ? '<div class="fixed inset-0 bg-black/60 backdrop-blur-[6px] z-[-1] pointer-events-none"></div>' : ''}

    ${navBarHtml}

    <main class="w-full max-w-7xl mx-auto px-4 md:px-8 pt-32 pb-24 space-y-8">
        ${sectionsHtml}
    </main>
    
    <footer class="w-full text-center py-12 text-sm text-slate-500 border-t ${theme.border} mt-20 bg-black/40 backdrop-blur-xl shadow-[0_-10px_20px_rgba(0,0,0,0.2)]">
        <p class="animate-bounce-slow">Deployed with AuraBuild Engine</p>
    </footer>

    <script>
        document.addEventListener('DOMContentLoaded', () => {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('is-visible');
                    }
                });
            }, { threshold: 0.1, rootMargin: "0px 0px -100px 0px" });

            document.querySelectorAll('.reveal-on-scroll').forEach(el => observer.observe(el));

            // Fix hash navigation on direct page load
            if (window.location.hash && window.location.hash.length > 1) {
                const overlay = document.getElementById('frontpage-overlay');
                if (overlay) {
                    overlay.style.display = 'none';
                    document.body.classList.remove('overflow-hidden');
                }
            }
        });

        function dismissFrontpage() {
            const overlay = document.getElementById('frontpage-overlay');
            if(overlay) {
                overlay.style.opacity = '0';
                document.body.classList.remove('overflow-hidden');
                setTimeout(() => { overlay.style.display = 'none'; }, 1000);
            }
        }
    </script>
</body>
</html>`;

    return fullHtmlDocument;
}

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
