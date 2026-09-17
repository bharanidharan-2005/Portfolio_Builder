import { PORTFOLIO_THEMES, PORTFOLIO_FONTS } from '../canvas/themes';
import { notify } from '../toast';
import { getRoleImage } from '../components/portfolio/PortfolioFrontpage';

const escapeHtml = (value) => {
    if (value === null || value === undefined) return '';
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
};

// Make sure local images from the builder resolve correctly on the deployed site
const getAbsoluteUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
        return url;
    }
    // Hardcode the main builder platform origin so static assets work on external Vercel deployments
    return 'https://portfolio-builder-one-brown.vercel.app' + (url.startsWith('/') ? '' : '/') + url;
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
    const isDark = theme.bodyBg?.includes('black') || theme.bodyBg?.includes('#0');

    // Extract Hero data for Frontpage
    const heroSec = activeSections.find(s => (s.section_type || '').toLowerCase().trim() === 'hero');
    const heroData = heroSec?.content_data || {};
    
    const fullName = heroData.heading || 'Developer';
    const frontName = escapeHtml(fullName);
    const frontHeadline = escapeHtml(heroData.subheading || 'Professional Portfolio');
    const frontBio = escapeHtml(heroData.text || '');
    
    const frontInitials = fullName.split(' ').filter(Boolean).map(n => n[0]).join('').substring(0, 2).toUpperCase();
    const frontFirstName = escapeHtml(fullName.split(' ')[0]);
    const roleImageUrl = getAbsoluteUrl(getRoleImage(heroData.subheading || ""));

    // 1. Build Frontpage Overlay
    const frontpageHtml = `
    <div id="frontpage-overlay" class="fixed inset-0 z-[100] flex flex-col ${theme.bodyBg} transition-opacity duration-1000 ease-in-out" style="${globalBg ? `background-image: url('${globalBg}'); background-size: cover; background-position: center; background-attachment: fixed;` : ''}">
        ${globalBg ? '<div class="absolute inset-0 bg-black/60 backdrop-blur-md z-0 pointer-events-none"></div>' : ''}
        
        <!-- Header -->
        <header class="w-full relative z-10 animate-fade-in-down" style="animation-delay: 0.1s">
            <div class="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-xl flex items-center justify-center font-black text-lg shadow-inner ${theme.accentBg || 'bg-blue-600'} text-white">
                        ${frontInitials}
                    </div>
                    <span class="font-black tracking-widest uppercase hidden sm:block text-sm md:text-base ${theme.textPrimary}"> 
                        ${frontFirstName}
                    </span>
                </div>
                <div class="hidden lg:flex items-center gap-8 font-semibold text-sm ${theme.textSecondary}">
                    <span class="hover:opacity-100 cursor-pointer transition-opacity">About</span>
                    <span class="hover:opacity-100 cursor-pointer transition-opacity">Skills</span>
                    <span class="hover:opacity-100 cursor-pointer transition-opacity">Projects</span>
                    <span class="hover:opacity-100 cursor-pointer transition-opacity">Contact</span>
                </div>
                <button class="px-6 py-2.5 rounded-lg text-sm font-bold transition-all shadow-lg text-white flex items-center gap-2 ${theme.accentBg || 'bg-blue-600'}">
                    Resume
                </button>
            </div>
        </header>

        <!-- Main Frontpage Split Content -->
        <main class="flex-1 flex flex-col lg:flex-row items-center justify-center p-6 lg:p-12 xl:p-24 gap-12 lg:gap-20 max-w-7xl mx-auto w-full relative z-10">
            <!-- Left Text Column -->
            <div class="flex-1 w-full space-y-8 flex flex-col lg:items-start text-center lg:text-left items-center animate-fade-in-up" style="animation-delay: 0.2s">
                <div class="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold border ${theme.border} bg-white/5 backdrop-blur-md shadow-sm">
                    <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span class="${theme.textSecondary}">Open to opportunities</span>
                </div>
                
                <h1 class="text-5xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-tight ${theme.textPrimary} drop-shadow-xl">
                    ${frontName}
                </h1>
                
                <p class="text-xl md:text-2xl font-bold ${theme.accentText}">
                    ${frontHeadline}
                </p>
                
                <p class="text-lg md:text-xl leading-relaxed w-full max-w-xl font-medium ${theme.textSecondary}">
                    ${frontBio}
                </p>

                <div class="flex flex-wrap items-center gap-4 pt-4 justify-center lg:justify-start">
                    <button onclick="dismissFrontpage()" class="px-8 py-4 rounded-xl text-sm md:text-base font-bold transition-all shadow-lg shadow-blue-500/20 hover:shadow-2xl text-white flex items-center gap-2 ${theme.accentBg || 'bg-blue-600'} hover:scale-105 hover:-translate-y-1">
                        View My Work &rarr;
                    </button>
                    <button class="px-8 py-4 rounded-xl text-sm md:text-base font-bold transition-all bg-transparent hover:bg-white/10 border ${theme.border} ${theme.textPrimary} shadow-sm hover:shadow-md flex items-center gap-2 hover:scale-105">
                        Download Resume
                    </button>
                </div>
            </div>

            <!-- Right Visual Column -->
            <div class="flex-1 w-full flex justify-center relative animate-fade-in-up" style="animation-delay: 0.4s">
                <div class="relative w-[250px] h-[250px] sm:w-[350px] sm:h-[350px] lg:w-[500px] lg:h-[500px]">
                    <div class="absolute inset-0 bg-blue-500/20 rounded-full blur-[80px] animate-pulse"></div>
                    <img src="${roleImageUrl}" alt="Hero Visual" class="absolute inset-0 w-full h-full object-cover mix-blend-screen opacity-90 rounded-3xl drop-shadow-2xl hover:scale-105 transition-transform duration-700 hover:rotate-2" />
                </div>
            </div>
        </main>
    </div>
    `;

    // 2. Build Navigation Bar (Inner Content)
    const navLinks = activeSections
        .filter(s => s.section_type !== 'hero' && s.section_type !== 'footer')
        .map(s => {
            const label = s.section_type === 'projects_grid' ? 'Projects' : s.section_type.charAt(0).toUpperCase() + s.section_type.slice(1);
            return `<li><a href="#section-${s.id}" class="text-sm font-bold hover:text-blue-400 transition-colors">${escapeHtml(label)}</a></li>`;
        }).join('');
        
    const navBarHtml = `
    <nav class="fixed top-0 w-full z-50 backdrop-blur-xl bg-black/30 border-b ${theme.border} py-4 px-6 md:px-12 flex justify-between items-center transition-all duration-300">
        <div class="text-lg font-black tracking-widest flex items-center gap-3">
            <div class="w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm shadow-inner ${theme.accentBg || 'bg-blue-600'} text-white">
                ${frontInitials}
            </div>
            <span class="${theme.textPrimary}">${frontFirstName}</span>
        </div>
        <ul class="hidden md:flex gap-8 ${theme.textSecondary}">
            ${navLinks}
        </ul>
        <a href="#section-${activeSections[0]?.id || ''}" class="px-5 py-2.5 text-xs font-bold ${theme.accentBg || 'bg-blue-600'} text-white rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all">Back to Top</a>
    </nav>`;

    // 3. Build Inner Sections
    let sectionsHtml = '';

    activeSections.forEach((sec, idx) => {
        const type = (sec.section_type || '').toLowerCase().trim();
        const data = (selectedSection && sec.id === selectedSection.id) ? { ...sec.content_data, ...localContent } : (sec.content_data || {});
        
        // Add staggered animation delay based on index so they cascade nicely
        const animDelay = (idx % 3) * 0.2;
        sectionsHtml += `<div id="section-${sec.id}" class="scroll-mt-32 reveal-on-scroll opacity-0 translate-y-12 transition-all duration-1000 ease-out" style="transition-delay: ${animDelay}s">`;

        if (type === 'hero') {
            const bgImage = getAbsoluteUrl(data.backgroundImage || '');
            const bgInlineStyle = bgImage
                ? `style="background-image: linear-gradient(rgba(0,0,0,0.7), rgba(0,0,0,0.9)), url('${bgImage}'); background-size: cover; background-position: center;"`
                : '';

            const liveMenuHtml = data.liveUrl ? `<a href="${escapeHtml(data.liveUrl)}" target="_blank" class="px-8 py-3.5 rounded-xl font-bold ${theme.accentBg || 'bg-blue-600'} text-white shadow-lg shadow-blue-500/20 transition-all hover:scale-105 hover:-translate-y-1">View Live Site</a>` : '';
            const designMenuHtml = data.designUrl ? `<a href="${escapeHtml(data.designUrl)}" target="_blank" class="px-8 py-3.5 rounded-xl font-bold border ${theme.border} ${theme.textPrimary} hover:bg-white/10 transition-all hover:scale-105 hover:-translate-y-1">View Code/Design</a>` : '';

            // Inner Hero Split Layout
            sectionsHtml += `
            <section class="py-16 sm:py-24 px-6 sm:px-12 relative rounded-3xl overflow-visible border ${theme.border} ${!bgImage ? theme.cardBg || 'bg-black/40 backdrop-blur-xl' : ''} mb-16 shadow-2xl" ${bgInlineStyle}>
                <div class="relative z-10 w-full max-w-7xl mx-auto flex flex-col-reverse lg:flex-row items-center gap-12 lg:gap-20">
                    <!-- Left Column: Text -->
                    <div class="flex-1 space-y-8 flex flex-col items-center lg:items-start text-center lg:text-left">
                        <div class="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold border ${theme.border} bg-white/5 backdrop-blur-md shadow-sm">
                            <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                            <span class="${theme.textSecondary}">Open to opportunities</span>
                        </div>
                        
                        <div class="space-y-4 w-full">
                            <h1 class="font-black tracking-tight leading-tight w-full max-w-3xl text-4xl sm:text-5xl lg:text-6xl break-words ${bgImage ? 'text-white' : theme.textPrimary}">
                                ${escapeHtml(data.heading) || 'YOUR NAME'}
                            </h1>
                            <p class="text-xl md:text-2xl font-bold w-full ${theme.accentText}">
                                ${escapeHtml(data.subheading) || 'Professional Headline'}
                            </p>
                            <p class="text-lg leading-relaxed w-full max-w-xl font-medium ${bgImage ? 'text-white/80' : theme.textSecondary}">
                                ${escapeHtml(data.text) || 'Introduction...'}
                            </p>
                        </div>
                        
                        <div class="flex flex-wrap items-center gap-4 pt-4 w-full justify-center lg:justify-start">
                            ${liveMenuHtml}
                            ${designMenuHtml}
                        </div>
                    </div>

                    <!-- Right Column: Visual -->
                    <div class="flex-1 w-full max-w-md lg:max-w-none relative aspect-square flex justify-center items-center">
                        <div class="absolute inset-0 bg-gradient-to-tr from-blue-500/20 to-purple-500/20 rounded-full blur-[80px] animate-pulse"></div>
                        <img src="${roleImageUrl}" alt="Hero Visual" class="absolute inset-0 w-full h-full object-cover mix-blend-screen opacity-90 rounded-3xl drop-shadow-2xl hover:scale-105 transition-transform duration-700" />
                    </div>
                </div>
            </section>`;
        } else if (type === 'about') {
            const aboutImg = getAbsoluteUrl(data.backgroundImage);
            sectionsHtml += `
            <section class="py-16 px-6 md:px-12 mb-16 rounded-3xl border ${theme.border} ${theme.cardBg || 'bg-black/40 backdrop-blur-xl'} shadow-2xl">
                <div class="flex flex-col lg:flex-row gap-12 items-center">
                    ${aboutImg ? `
                    <div class="flex-1 w-full relative group perspective-1000">
                        <div class="absolute inset-0 bg-blue-500/10 rounded-3xl blur-[40px] group-hover:bg-blue-500/30 transition-all duration-700"></div>
                        <img src="${aboutImg}" alt="About Me" class="w-full object-cover rounded-3xl shadow-2xl border ${theme.border} transform transition-all duration-700 group-hover:scale-105 group-hover:rotate-y-6" />
                    </div>
                    ` : ''}
                    <div class="flex-1 w-full space-y-8">
                        <h2 class="text-sm md:text-base uppercase font-black tracking-[0.2em] ${theme.accentText}">${escapeHtml(data.title) || 'About Me'}</h2>
                        <div class="prose prose-lg prose-invert max-w-none text-slate-300 leading-relaxed font-medium">
                            ${escapeHtml(data.bio) || 'Introduction...'}
                        </div>
                    </div>
                </div>
            </section>`;
        } else if (type === 'education') {
            const itemsHtml = (data.schools || []).map(s => `
                <div class="p-8 rounded-2xl border ${theme.border} bg-white/5 hover:bg-white/10 transition-all shadow-sm hover:shadow-xl hover:-translate-y-1">
                    <div class="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-4">
                        <h3 class="text-xl font-bold ${theme.textPrimary}">${escapeHtml(s.school)}</h3>
                        <span class="px-4 py-1.5 text-xs font-bold rounded-full border ${theme.border} bg-black/40 text-slate-300">${escapeHtml(s.duration)}</span>
                    </div>
                    <div class="text-sm font-bold ${theme.accentText} mb-4">${escapeHtml(s.degree)}</div>
                    <div class="text-sm text-slate-400 font-mono leading-relaxed">${escapeHtml(s.details)}</div>
                </div>
            `).join('');
            sectionsHtml += `<section class="py-16 px-6 md:px-12 mb-16 rounded-3xl border ${theme.border} ${theme.cardBg || 'bg-black/40 backdrop-blur-xl'} shadow-2xl"><h2 class="text-sm md:text-base uppercase font-black tracking-[0.2em] mb-10 ${theme.accentText}">${escapeHtml(data.title) || 'Education'}</h2><div class="grid grid-cols-1 gap-6">${itemsHtml}</div></section>`;
        } else if (type === 'skills') {
            const itemsHtml = (data.items || []).map(s => `
                <div class="group p-6 rounded-2xl border ${theme.border} bg-white/5 hover:bg-white/10 transition-all shadow-sm hover:shadow-xl">
                    <div class="flex justify-between text-sm font-bold mb-4 ${theme.textPrimary}">
                        <span class="tracking-wide">${escapeHtml(s.name)}</span>
                        <span class="${theme.accentText}">${escapeHtml(s.level)}%</span>
                    </div>
                    <div class="h-2.5 w-full rounded-full bg-black/50 overflow-hidden shadow-inner border ${theme.border}">
                        <div class="h-full rounded-full ${theme.accentBg || 'bg-blue-500'} transition-all duration-1000 ease-out group-hover:brightness-125" style="width: ${escapeHtml(s.level)}%"></div>
                    </div>
                </div>
            `).join('');
            sectionsHtml += `<section class="py-16 px-6 md:px-12 mb-16 rounded-3xl border ${theme.border} ${theme.cardBg || 'bg-black/40 backdrop-blur-xl'} shadow-2xl"><h2 class="text-sm md:text-base uppercase font-black tracking-[0.2em] mb-10 ${theme.accentText}">${escapeHtml(data.title) || 'Skills'}</h2><div class="grid grid-cols-1 md:grid-cols-2 gap-6">${itemsHtml}</div></section>`;
        } else if (type === 'projects_grid') {
            const projectsHtml = (data.projects || []).map(p => `
                <div class="group relative flex flex-col rounded-3xl border ${theme.border} bg-white/5 overflow-hidden hover:shadow-2xl transition-all duration-700 hover:-translate-y-3">
                    <div class="p-8 flex-1 space-y-4 relative z-10">
                        <div class="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                        <h3 class="text-2xl font-bold ${theme.textPrimary}">${escapeHtml(p.title)}</h3>
                        <p class="text-sm text-slate-400 leading-relaxed">${escapeHtml(p.description)}</p>
                        <div class="flex flex-wrap gap-2 pt-4">
                            ${escapeHtml(p.tags).split(',').map(tag => `<span class="px-3 py-1 text-xs font-mono rounded-full bg-black/40 border ${theme.border} text-slate-300">${tag.trim()}</span>`).join('')}
                        </div>
                    </div>
                    <div class="p-6 border-t ${theme.border} bg-black/40 backdrop-blur-sm flex gap-4 relative z-10">
                        ${p.projectUrl ? `<a href="${escapeHtml(p.projectUrl)}" target="_blank" class="flex-1 text-center py-3.5 text-sm font-bold rounded-xl bg-white/10 hover:bg-white/20 transition-colors ${theme.textPrimary}">View Project details &rarr;</a>` : ''}
                    </div>
                </div>
            `).join('');
            sectionsHtml += `<section class="py-16 px-6 md:px-12 mb-16 rounded-3xl border ${theme.border} ${theme.cardBg || 'bg-black/40 backdrop-blur-xl'} shadow-2xl"><h2 class="text-sm md:text-base uppercase font-black tracking-[0.2em] mb-10 ${theme.accentText}">${escapeHtml(data.title) || 'Projects'}</h2><div class="grid grid-cols-1 lg:grid-cols-2 gap-8">${projectsHtml}</div></section>`;
        } else if (type === 'contact') {
            // Render the actual form elements to match the preview exactly!
            const formHtml = `
            <form class="max-w-xl mx-auto space-y-6 mt-12 bg-black/30 p-8 rounded-3xl border ${theme.border} shadow-2xl text-left" onsubmit="event.preventDefault(); alert('Form submitted! (Demo only in static export)');">
                <div>
                    <label class="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Name</label>
                    <input type="text" placeholder="Your name" class="w-full px-5 py-4 rounded-xl border ${theme.border} bg-black/50 ${theme.textPrimary} focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all shadow-inner" />
                </div>
                <div>
                    <label class="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Email</label>
                    <input type="email" placeholder="you@email.com" class="w-full px-5 py-4 rounded-xl border ${theme.border} bg-black/50 ${theme.textPrimary} focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all shadow-inner" />
                </div>
                <div>
                    <label class="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Message</label>
                    <textarea placeholder="Tell me about your project..." rows="5" class="w-full px-5 py-4 rounded-xl border ${theme.border} bg-black/50 ${theme.textPrimary} focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all shadow-inner resize-none"></textarea>
                </div>
                <button class="w-full px-6 py-4 rounded-xl ${theme.accentBg || 'bg-blue-600'} text-white font-bold hover:shadow-lg hover:-translate-y-1 transition-all flex items-center justify-center gap-2 text-lg mt-4">
                    Send Message
                </button>
            </form>
            `;
            
            const linksHtml = [
                data.email ? `<a href="mailto:${escapeHtml(data.email)}" class="px-6 py-3 rounded-full text-sm font-bold border ${theme.border} bg-white/5 hover:scale-105 hover:bg-white/10 transition-all shadow-lg text-slate-300 hover:text-white">✉ ${escapeHtml(data.email)}</a>` : '',
                data.phone ? `<a href="tel:${escapeHtml(data.phone)}" class="px-6 py-3 rounded-full text-sm font-bold border ${theme.border} bg-white/5 hover:scale-105 hover:bg-white/10 transition-all shadow-lg text-slate-300 hover:text-white">☏ ${escapeHtml(data.phone)}</a>` : '',
                data.linkedin ? `<a href="${escapeHtml(data.linkedin)}" target="_blank" class="px-6 py-3 rounded-full text-sm font-bold border ${theme.border} bg-white/5 hover:scale-105 hover:bg-white/10 transition-all shadow-lg text-slate-300 hover:text-white">LinkedIn</a>` : '',
                data.github ? `<a href="${escapeHtml(data.github)}" target="_blank" class="px-6 py-3 rounded-full text-sm font-bold border ${theme.border} bg-white/5 hover:scale-105 hover:bg-white/10 transition-all shadow-lg text-slate-300 hover:text-white">GitHub</a>` : '',
            ].filter(Boolean).join('');
            
            sectionsHtml += `<section class="py-20 px-6 md:px-12 mb-16 text-center rounded-3xl border ${theme.border} ${theme.cardBg || 'bg-black/40 backdrop-blur-xl'} shadow-2xl"><h2 class="text-sm md:text-base uppercase font-black tracking-[0.2em] mb-6 ${theme.accentText}">Get In Touch</h2><p class="text-lg text-slate-400 max-w-lg mx-auto mb-10 leading-relaxed">${escapeHtml(data.text) || 'Reach out.'}</p><div class="flex flex-wrap justify-center gap-4 mb-8">${linksHtml}</div>${formHtml}</section>`;
        } else {
            sectionsHtml += `<section class="py-16 px-6 md:px-12 mb-16 rounded-3xl border ${theme.border} ${theme.cardBg || 'bg-black/40 backdrop-blur-xl'} shadow-2xl"><h2 class="text-sm uppercase font-black tracking-[0.2em] mb-4 ${theme.accentText}">${escapeHtml(sec.section_type)}</h2><p class="text-slate-400">Content block rendered.</p></section>`;
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
<html lang="en" class="scroll-smooth">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Archivo:wght@400;500;600;700&family=Bebas+Neue&family=DM+Sans:wght@400;500;600;700&family=Fira+Code:wght@400;500;600;700&family=Geist:wght@400;500;600;700&family=IBM+Plex+Sans:wght@400;500;600;700&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&family=Lora:wght@400;500;600;700&family=Manrope:wght@400;500;600;700&family=Montserrat:wght@400;500;600;700&family=Oswald:wght@400;500;600;700&family=Outfit:wght@400;500;600;700&family=Playfair+Display:wght@400;700&family=Plus+Jakarta+Sans:wght@400;500;600;700&family=Poppins:wght@400;500;600;700&family=Raleway:wght@400;500;600;700&family=Roboto:wght@400;500;700&family=Sora:wght@400;500;600;700&family=Space+Grotesk:wght@400;500;600;700&family=Space+Mono:wght@400;700&family=Syne:wght@400;500;600;700&family=Urbanist:wght@400;500;600;700&display=swap" rel="stylesheet">
    <script src="https://cdn.tailwindcss.com"></script>
    <title>${frontName} | Portfolio</title>
    <style>
        body { font-family: ${fontFamilyStyle}; }
        ::-webkit-scrollbar { width: 10px; }
        ::-webkit-scrollbar-track { background: rgba(0,0,0,0.2); }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.2); border-radius: 10px; border: 2px solid rgba(0,0,0,0.2); }
        ::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.4); }
        
        .reveal-on-scroll.is-visible {
            opacity: 1;
            transform: translateY(0);
        }
        
        @keyframes fadeInDown {
            0% { opacity: 0; transform: translateY(-30px); }
            100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeInUp {
            0% { opacity: 0; transform: translateY(40px); }
            100% { opacity: 1; transform: translateY(0); }
        }
        
        .animate-fade-in-down { animation: fadeInDown 1s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .animate-fade-in-up { animation: fadeInUp 1s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        
        .perspective-1000 { perspective: 1000px; }
        .rotate-y-6 { transform: rotateY(6deg); }
    </style>
</head>
<body class="${theme.bodyBg} ${isDark ? 'text-slate-200' : 'text-slate-800'} min-h-screen selection:bg-blue-500/30 overflow-hidden" style="${bgStyleStr}">
    
    ${frontpageHtml}

    ${globalBg ? '<div class="fixed inset-0 bg-black/60 backdrop-blur-[4px] z-[-1] pointer-events-none"></div>' : ''}

    ${navBarHtml}

    <main class="w-full max-w-7xl mx-auto px-4 md:px-8 pt-32 pb-24">
        ${sectionsHtml}
    </main>
    
    <footer class="w-full text-center py-8 text-sm text-slate-500 border-t ${theme.border} mt-12 bg-black/30 backdrop-blur-lg">
        <p>Deployed with AuraBuild Engine</p>
    </footer>

    <script>
        document.addEventListener('DOMContentLoaded', () => {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('is-visible');
                    }
                });
            }, { threshold: 0.15, rootMargin: "0px 0px -50px 0px" });

            document.querySelectorAll('.reveal-on-scroll').forEach(el => observer.observe(el));
        });

        function dismissFrontpage() {
            const overlay = document.getElementById('frontpage-overlay');
            overlay.style.opacity = '0';
            document.body.classList.remove('overflow-hidden');
            setTimeout(() => {
                overlay.style.display = 'none';
            }, 1000);
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
