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

const getAbsoluteUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) return url;
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://aurabuild.io';
    return baseUrl + (url.startsWith('/') ? '' : '/') + url;
};

const getTechIconHtml = (techName) => {
    if (!techName) return '';
    const nameMap = {
        'reactjs': 'react', 'node': 'nodedotjs', 'nodejs': 'nodedotjs', 'js': 'javascript', 
        'ts': 'typescript', 'sql': 'postgresql', 'postgres': 'postgresql', 'cpp': 'cplusplus',
        'c#': 'csharp', 'vue': 'vuedotjs', 'vuejs': 'vuedotjs', 'aws': 'amazonaws'
    };
    let normalized = String(techName).toLowerCase().replace(/[^a-z0-9+#-]/g, '');
    normalized = nameMap[normalized] || normalized;
    return `<img src="https://cdn.simpleicons.org/${normalized}/white" alt="" class="w-4 h-4 inline-block mr-1.5 opacity-80 group-hover:opacity-100 transition-opacity drop-shadow-md" onerror="this.outerHTML='<span class=\\'w-1.5 h-1.5 rounded-full bg-blue-400 inline-block mr-1.5\\'></span>'" />`;
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

    // 1. Build Frontpage Overlay
    const frontpageHtml = `
    <div id="frontpage-overlay" class="fixed inset-0 z-[100] flex flex-col ${theme.bodyBg} transition-opacity duration-1000 ease-in-out" style="${globalBg ? `background-image: url('${globalBg}'); background-size: cover; background-position: center; background-attachment: fixed;` : ''}">
        ${globalBg ? '<div class="absolute inset-0 bg-black/60 backdrop-blur-md z-0 pointer-events-none"></div>' : ''}
        
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
                <button onclick="dismissFrontpage()" class="px-6 py-2.5 rounded-lg text-sm font-bold transition-all shadow-lg text-white flex items-center gap-2 ${theme.accentBg || 'bg-blue-600'} hover:scale-105 hover:-translate-y-1">
                    Resume
                </button>
            </div>
        </header>

        <main class="flex-1 flex flex-col lg:flex-row items-center justify-center p-6 lg:p-12 xl:p-24 gap-12 lg:gap-20 max-w-7xl mx-auto w-full relative z-10">
            <div class="flex-1 w-full space-y-8 flex flex-col lg:items-start text-center lg:text-left items-center animate-fade-in-left" style="animation-delay: 0.2s">
                <div class="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold border ${theme.border} bg-white/5 backdrop-blur-md shadow-sm">
                    <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span class="${theme.textSecondary}">Open to opportunities</span>
                </div>
                
                <h1 class="text-5xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-tight ${theme.textPrimary} drop-shadow-xl hover:scale-[1.01] transition-transform duration-500">
                    ${frontName}
                </h1>
                
                <p class="text-xl md:text-2xl font-bold ${theme.accentText}">
                    ${frontHeadline}
                </p>
                
                <p class="text-lg md:text-xl leading-relaxed w-full max-w-xl font-medium ${theme.textSecondary} ${!frontBio ? 'opacity-60 italic' : ''}">
                    ${frontBio || 'Introduction...'}
                </p>

                <div class="flex flex-wrap items-center gap-4 pt-4 justify-center lg:justify-start">
                    <button onclick="dismissFrontpage()" class="px-8 py-4 rounded-xl text-sm md:text-base font-bold transition-all shadow-lg shadow-blue-500/20 hover:shadow-2xl hover:shadow-blue-500/40 text-white flex items-center gap-2 ${theme.accentBg || 'bg-blue-600'} hover:scale-110 hover:-translate-y-1">
                        View My Work &rarr;
                    </button>
                    <button onclick="dismissFrontpage()" class="px-8 py-4 rounded-xl text-sm md:text-base font-bold transition-all bg-transparent hover:bg-white/10 border ${theme.border} ${theme.textPrimary} shadow-sm hover:shadow-md flex items-center gap-2 hover:scale-110 hover:-translate-y-1">
                        Download Resume
                    </button>
                </div>
            </div>

            <div class="flex-1 w-full flex justify-center relative animate-fade-in-right" style="animation-delay: 0.4s">
                <div class="relative w-[250px] h-[250px] sm:w-[350px] sm:h-[350px] lg:w-[500px] lg:h-[500px] animate-float">
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

            const liveMenuHtml = data.liveUrl ? `<a href="${escapeHtml(data.liveUrl)}" target="_blank" class="px-5 py-2.5 rounded-xl font-bold border border-white/5 shadow-lg bg-[#0a0a0f] hover:bg-[#1a1a24] text-white transition-all hover:scale-105 hover:-translate-y-1">See Live &nearr;</a>` : '';
            const githubMenuHtml = data.github ? `<a href="${escapeHtml(data.github)}" target="_blank" class="px-5 py-2.5 rounded-xl font-bold border border-white/5 shadow-lg bg-[#0a0a0f] hover:bg-[#1a1a24] text-white transition-all hover:scale-105 hover:-translate-y-1">GitHub &nearr;</a>` : '';
            const linkedinMenuHtml = data.linkedin ? `<a href="${escapeHtml(data.linkedin)}" target="_blank" class="px-5 py-2.5 rounded-xl font-bold border border-white/5 shadow-lg bg-[#0a0a0f] hover:bg-[#1a1a24] text-white transition-all hover:scale-105 hover:-translate-y-1">LinkedIn &nearr;</a>` : '';

            sectionsHtml += `
            <section class="py-16 sm:py-24 px-6 sm:px-12 relative rounded-3xl overflow-visible border ${theme.border} ${!bgImage ? theme.cardBg || 'bg-black/40 backdrop-blur-xl' : ''} mb-16 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)]" ${bgInlineStyle}>
                <div class="relative z-10 w-full max-w-7xl mx-auto flex flex-col-reverse lg:flex-row items-center gap-12 lg:gap-20">
                    <div class="flex-1 space-y-8 flex flex-col items-center lg:items-start text-center lg:text-left stagger-item stagger-fade-left">
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
                            <p class="text-lg leading-relaxed w-full max-w-xl font-medium ${bgImage ? 'text-white/80' : theme.textSecondary} ${!(data.description || data.text) ? 'opacity-60 italic' : ''}">
                                ${escapeHtml(data.description || data.text) || 'Introduction...'}
                            </p>
                        </div>
                        
                        <div class="flex flex-col items-center lg:items-start gap-6 pt-4 w-full">
                            <div class="flex flex-wrap items-center justify-center lg:justify-start gap-4 w-full">
                                <button onclick="document.getElementById('section-${activeSections.find(s=>s.section_type==='projects_grid')?.id||''}').scrollIntoView({behavior:'smooth'})" class="px-8 py-4 rounded-xl text-sm md:text-base font-bold transition-all shadow-lg hover:shadow-[0_20px_40px_rgba(59,130,246,0.3)] ${theme.accentBg || 'bg-blue-600'} text-white flex items-center gap-2 hover:scale-110 hover:-translate-y-2">
                                    View My Work &rarr;
                                </button>
                                <button class="px-8 py-4 rounded-xl text-sm md:text-base font-bold transition-all bg-transparent hover:bg-white/10 border shadow-sm hover:shadow-lg hover:shadow-white/10 ${theme.textPrimary} ${theme.border} hover:scale-110 hover:-translate-y-2">
                                    Download Resume
                                </button>
                            </div>
                            
                            <div class="flex flex-wrap items-center justify-center lg:justify-start gap-3 w-full mt-2">
                                ${liveMenuHtml}
                                ${githubMenuHtml}
                                ${linkedinMenuHtml}
                                <a href="#section-${activeSections.find(s=>s.section_type==='projects_grid')?.id||''}" class="px-5 py-2.5 rounded-xl font-bold border border-white/5 shadow-lg bg-[#0a0a0f] hover:bg-[#1a1a24] text-white transition-all hover:scale-105 hover:-translate-y-1">Projects &nearr;</a>
                            </div>
                        </div>
                    </div>

                    <div class="flex-1 w-full max-w-md lg:max-w-none relative aspect-square flex justify-center items-center stagger-item stagger-fade-right animate-float" style="transition-delay: 0.2s">
                        <div class="absolute inset-0 bg-gradient-to-tr from-blue-500/20 to-purple-500/20 rounded-full blur-[80px] animate-pulse"></div>
                        <img src="${roleImageUrl}" alt="Hero Visual" class="absolute inset-0 w-full h-full object-cover mix-blend-screen opacity-90 rounded-3xl drop-shadow-2xl hover:scale-110 transition-transform duration-700 hover:rotate-6" />
                    </div>
                </div>
            </section>`;
        } else if (type === 'about') {
            const aboutImg = getAbsoluteUrl(data.backgroundImage);
            sectionsHtml += `
            <section class="py-16 px-6 md:px-12 mb-16 rounded-3xl border ${theme.border} ${theme.cardBg || 'bg-black/40 backdrop-blur-xl'} shadow-[0_20px_40px_-15px_rgba(0,0,0,0.4)] hover:border-white/20 transition-all duration-700">
                <div class="flex flex-wrap justify-center items-center gap-10">
                    ${aboutImg ? `
                    <div class="shrink-0 relative group w-48 h-48 md:w-64 md:h-64 mx-auto md:mx-0 stagger-item stagger-fade-left">
                        <div class="absolute inset-0 rounded-2xl md:rounded-full blur-[30px] opacity-40 bg-gradient-to-tr from-blue-500 to-purple-500 group-hover:opacity-80 transition-opacity duration-700"></div>
                        <img src="${aboutImg}" alt="About Me" class="relative w-full h-full object-cover rounded-2xl md:rounded-[3rem] border-4 ${theme.border} shadow-2xl transform transition-transform duration-700 group-hover:scale-110 group-hover:rotate-3" />
                    </div>
                    ` : ''}
                    <div class="flex-[1_1_300px] space-y-5 w-full text-center min-[600px]:text-left stagger-item stagger-fade-right" style="transition-delay: 0.2s">
                        <h2 class="text-3xl sm:text-4xl uppercase font-black tracking-widest mb-10 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">${escapeHtml(data.title) || 'About Me'}</h2>
                        <div class="text-lg md:text-xl leading-relaxed break-words max-w-full font-medium ${theme.textSecondary}">
                            ${escapeHtml(data.bio) || 'Introduction...'}
                        </div>
                    </div>
                </div>
            </section>`;
        } else if (type === 'education') {
            const itemsHtml = (data.schools || []).map((s, i) => `
                <div class="stagger-item stagger-fade-up p-8 rounded-3xl border ${theme.border} bg-white/5 hover:bg-white/10 transition-all shadow-md hover:shadow-[0_15px_30px_rgba(0,0,0,0.3)] hover:-translate-y-2 hover:border-white/20 group" style="transition-delay: ${(i%4)*0.1}s">
                    <div class="flex flex-wrap justify-between items-start gap-4">
                        <div class="space-y-2 w-full sm:w-auto flex-1">
                            <h3 class="text-xl font-bold uppercase tracking-wide break-words max-w-full ${theme.textPrimary} group-hover:text-blue-400 transition-colors">${escapeHtml(s.institution || 'Unknown College')}</h3>
                            <p class="text-base font-medium break-words max-w-full ${theme.textSecondary}">${escapeHtml(s.degree || 'Degree')}</p>
                        </div>
                        <span class="text-sm font-mono px-5 py-2 rounded-xl border ${theme.border} bg-black/40 ${theme.textSecondary} shadow-inner">${escapeHtml(s.years || '2020 - 2024')}</span>
                    </div>
                    <div class="mt-6 pt-6 border-t border-white/10 flex items-center gap-2 text-sm">
                        <span class="${theme.textSecondary}">Performance:</span>
                        <span class="font-mono font-bold text-lg ${theme.accentText}">${escapeHtml(s.score || 'GPA')}</span>
                    </div>
                </div>
            `).join('');
            sectionsHtml += `<section class="py-16 px-6 md:px-12 mb-16 rounded-3xl border ${theme.border} ${theme.cardBg || 'bg-black/40 backdrop-blur-xl'} shadow-2xl stagger-container"><h2 class="text-3xl sm:text-4xl uppercase font-black tracking-widest mb-12 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500 stagger-item stagger-fade-down">${escapeHtml(data.title) || 'Education'}</h2><div class="space-y-6">${itemsHtml}</div></section>`;
        } else if (type === 'skills') {
            const itemsHtml = (data.items || []).map((s, i) => `
                <div class="stagger-item stagger-fade-up p-6 md:p-8 rounded-3xl transition-all duration-500 w-full md:w-[70%] border shadow-md ${theme.border} bg-white/5 hover:bg-white/10 hover:shadow-[0_20px_40px_rgba(0,0,0,0.3)] hover:-translate-y-2 hover:border-white/20 ${i % 2 === 0 ? 'self-start' : 'self-end'} group" style="transition-delay: ${(i%4)*0.1}s">
                    <div class="flex justify-between items-center text-lg font-bold mb-4">
                        <div class="flex items-center gap-3">
                            ${s.customIcon ? `<img src="${s.customIcon}" alt="${escapeHtml(s.name)}" class="w-8 h-8 object-contain drop-shadow-lg" />` : ''}
                            <span class="tracking-wide ${theme.textPrimary} group-hover:text-white transition-colors">${escapeHtml(s.name)}</span>
                        </div>
                        <span class="${theme.accentText} font-mono text-sm px-4 py-2 rounded-xl border ${theme.border} bg-black/40 shadow-inner group-hover:bg-black/60 transition-colors">${escapeHtml(s.level)}%</span>
                    </div>
                    <div class="h-4 w-full rounded-full bg-black/50 overflow-hidden shadow-inner border ${theme.border}">
                        <div class="h-full rounded-full ${theme.accentBg || 'bg-blue-500'} transition-all duration-[1.5s] ease-out group-hover:brightness-125" style="width: ${escapeHtml(s.level)}%; box-shadow: inset 0 1px 3px rgba(255,255,255,0.2);"></div>
                    </div>
                </div>
            `).join('');
            sectionsHtml += `<section class="py-16 px-6 md:px-12 mb-16 rounded-3xl border ${theme.border} ${theme.cardBg || 'bg-black/40 backdrop-blur-xl'} shadow-2xl stagger-container"><h2 class="text-3xl sm:text-4xl uppercase font-black tracking-widest mb-12 text-center text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500 stagger-item stagger-fade-down">${escapeHtml(data.title) || 'Skills'}</h2><div class="flex flex-col gap-8 pt-2 w-full max-w-5xl mx-auto px-2">${itemsHtml}</div></section>`;
        } else if (type === 'projects_grid') {
            const projectsHtml = (data.projects || []).map((p, i) => `
                <div class="group relative flex flex-col lg:flex-row items-center gap-10 rounded-[2.5rem] border ${theme.border} bg-white/5 overflow-hidden hover:shadow-[0_20px_40px_rgba(0,0,0,0.4)] transition-all duration-700 hover:bg-white/10 p-10 hover:-translate-y-3 hover:border-white/20">
                    <div class="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-1 transition-all duration-700 group-hover:w-full ${theme.accentBg || 'bg-blue-500'} shadow-[0_0_15px_rgba(59,130,246,0.8)]"></div>
                    
                    ${p.projectImage ? `
                    <div class="w-full lg:w-2/5 shrink-0 relative aspect-video rounded-2xl overflow-hidden shadow-xl border ${theme.border} group-hover:border-white/30 transition-all duration-500 stagger-custom-left" style="transition-delay: ${(i*0.2) + 0.1}s">
                        <div class="absolute inset-0 bg-blue-500/20 group-hover:opacity-0 transition-opacity z-10 mix-blend-overlay"></div>
                        <img src="${p.projectImage}" alt="${escapeHtml(p.title)}" class="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700" />
                    </div>
                    ` : ''}
                    
                    <div class="flex-1 space-y-8 ${p.projectImage ? 'lg:pl-6' : ''}">
                        <h3 class="text-3xl sm:text-4xl font-black ${theme.textPrimary} stagger-custom-left group-hover:text-white transition-colors" style="transition-delay: ${(i*0.2) + 0.1}s">${escapeHtml(p.title)}</h3>
                        <!-- FIX: Use p.desc instead of p.description to pull the exact project data! -->
                        <p class="text-lg sm:text-xl text-slate-400 leading-relaxed font-medium stagger-custom-right group-hover:text-slate-300 transition-colors" style="transition-delay: ${(i*0.2) + 0.2}s">${escapeHtml(p.desc)}</p>
                        <div class="flex flex-wrap gap-3 pt-4 stagger-custom-up" style="transition-delay: ${(i*0.2) + 0.3}s">
                            ${escapeHtml(p.tags).split(',').map(tag => `<span class="px-5 py-2.5 text-xs font-mono font-bold rounded-xl bg-black/40 border ${theme.border} ${theme.accentText} shadow-sm group-hover:shadow-md transition-shadow flex items-center">${getTechIconHtml(tag.trim())} ${tag.trim()}</span>`).join('')}
                        </div>
                        ${p.projectUrl ? `<div class="pt-8 stagger-fade-up" style="transition-delay: ${(i*0.2) + 0.4}s"><a href="${escapeHtml(p.projectUrl)}" target="_blank" class="inline-flex px-8 py-4 text-sm font-bold rounded-xl ${theme.accentBg || 'bg-blue-600'} text-white hover:scale-110 hover:-translate-y-2 transition-all shadow-lg hover:shadow-[0_15px_30px_rgba(59,130,246,0.4)]">View Project &rarr;</a></div>` : ''}
                    </div>
                </div>
            `).join('');
            sectionsHtml += `<section class="py-16 px-6 md:px-12 mb-16 rounded-3xl border ${theme.border} ${theme.cardBg || 'bg-black/40 backdrop-blur-xl'} shadow-2xl stagger-container"><h2 class="text-3xl sm:text-4xl uppercase font-black tracking-widest mb-12 text-center text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500 stagger-item stagger-fade-down">${escapeHtml(data.title) || 'Projects'}</h2><div class="flex flex-col gap-12 w-full max-w-5xl mx-auto">${projectsHtml}</div></section>`;
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
            
            sectionsHtml += `<section class="py-20 px-6 md:px-12 mb-16 text-center rounded-3xl border ${theme.border} ${theme.cardBg || 'bg-black/40 backdrop-blur-xl'} shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)] stagger-container"><h2 class="text-3xl sm:text-4xl uppercase font-black tracking-widest mb-6 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500 stagger-item stagger-fade-down">${escapeHtml(data.title) || 'Get In Touch'}</h2><p class="text-xl text-slate-400 max-w-lg mx-auto mb-12 leading-relaxed stagger-item stagger-fade-up">${escapeHtml(data.text) || 'Reach out.'}</p><div class="flex flex-wrap justify-center gap-6 mb-10">${linksHtml}</div>${formHtml}</section>`;
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
