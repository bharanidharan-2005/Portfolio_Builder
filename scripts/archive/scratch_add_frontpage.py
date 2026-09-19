import re

with open("frontend/src/utils/exportWebsiteHtml.js", "r", encoding="utf-8") as f:
    ex = f.read()

# We need to insert the Frontpage Overlay HTML right after the <body> tag opens.

# We'll extract the necessary data for the frontpage
old_bg_setup = """    let bgStyleStr = '';
    if (globalBg) {
        bgStyleStr = `background-image: url('${globalBg}'); background-size: cover; background-position: center; background-attachment: fixed;`;
    }"""

new_bg_setup = """    let bgStyleStr = '';
    if (globalBg) {
        bgStyleStr = `background-image: url('${globalBg}'); background-size: cover; background-position: center; background-attachment: fixed;`;
    }

    // Extract Hero data for Frontpage
    const heroSec = activeSections.find(s => (s.section_type || '').toLowerCase().trim() === 'hero');
    const heroData = heroSec?.content_data || {};
    const frontName = escapeHtml(heroData.heading || userData?.name || 'Developer');
    const frontHeadline = escapeHtml(heroData.subheading || 'Professional Portfolio');
    const frontBio = escapeHtml(heroData.text || '');
    const frontInitials = (userData?.name || 'DEV').split(' ').filter(Boolean).map(n => n[0]).join('').substring(0, 2).toUpperCase();
    const frontFirstName = (userData?.name || 'Developer').split(' ')[0];

    const frontpageHtml = `
    <div id="frontpage-overlay" class="fixed inset-0 z-[100] flex flex-col ${theme.bodyBg} transition-opacity duration-700 ease-in-out" style="${bgStyleStr}">
        ${globalBg ? '<div class="absolute inset-0 bg-black/60 backdrop-blur-md z-0 pointer-events-none"></div>' : ''}
        
        <header class="w-full relative z-10 p-6 md:p-8 flex items-center justify-between animate-fade-in-down">
            <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-xl flex items-center justify-center font-black text-lg shadow-inner ${theme.accentBg || 'bg-blue-600'} text-white">
                    ${escapeHtml(frontInitials)}
                </div>
                <span class="font-black tracking-widest uppercase hidden sm:block text-sm md:text-base ${theme.textPrimary}"> 
                    ${escapeHtml(frontFirstName)} 
                </span>
            </div>
        </header>

        <main class="flex-1 flex flex-col items-center justify-center p-6 text-center z-10 max-w-4xl mx-auto space-y-8 animate-fade-in-up">
            <div class="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold border ${theme.border} bg-white/5 backdrop-blur-md shadow-sm">
                <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span class="${theme.textSecondary}">Open to opportunities</span>
            </div>
            
            <h1 class="text-5xl md:text-7xl font-black tracking-tight leading-tight ${theme.textPrimary} drop-shadow-xl">
                ${frontName}
            </h1>
            
            <p class="text-xl md:text-2xl font-bold ${theme.accentText}">
                ${frontHeadline}
            </p>

            <button onclick="dismissFrontpage()" class="mt-8 px-8 py-4 rounded-xl text-sm md:text-base font-bold transition-all shadow-lg hover:shadow-2xl text-white flex items-center gap-2 ${theme.accentBg || 'bg-blue-600'} hover:scale-105 hover:-translate-y-1">
                View My Work &rarr;
            </button>
        </main>
    </div>
    `;"""

ex = ex.replace(old_bg_setup, new_bg_setup)

old_body = """<body class="${theme.bodyBg} ${isDark ? 'text-slate-200' : 'text-slate-800'} min-h-screen selection:bg-blue-500/30" style="${bgStyleStr}">
    
    <!-- Background Overlay for readability if image exists -->
    ${globalBg ? '<div class="fixed inset-0 bg-black/60 backdrop-blur-[2px] z-[-1] pointer-events-none"></div>' : ''}"""

new_body = """<body class="${theme.bodyBg} ${isDark ? 'text-slate-200' : 'text-slate-800'} min-h-screen selection:bg-blue-500/30 overflow-hidden" style="${bgStyleStr}">
    
    ${frontpageHtml}

    <!-- Background Overlay for readability if image exists -->
    ${globalBg ? '<div class="fixed inset-0 bg-black/60 backdrop-blur-[2px] z-[-1] pointer-events-none"></div>' : ''}"""

ex = ex.replace(old_body, new_body)

old_script = """            document.querySelectorAll('.reveal-on-scroll').forEach(el => observer.observe(el));
        });
    </script>"""

new_script = """            document.querySelectorAll('.reveal-on-scroll').forEach(el => observer.observe(el));
        });

        // Frontpage Dismissal Logic
        function dismissFrontpage() {
            const overlay = document.getElementById('frontpage-overlay');
            overlay.style.opacity = '0';
            // Enable scrolling on body
            document.body.classList.remove('overflow-hidden');
            setTimeout(() => {
                overlay.style.display = 'none';
            }, 700);
        }
    </script>"""

ex = ex.replace(old_script, new_script)

old_css = """        .reveal-on-scroll.is-visible {
            opacity: 1;
            transform: translateY(0);
        }"""

new_css = """        .reveal-on-scroll.is-visible {
            opacity: 1;
            transform: translateY(0);
        }
        @keyframes fadeInDown {
            from { opacity: 0; transform: translateY(-20px); }
            to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeInUp {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-down { animation: fadeInDown 0.8s ease-out forwards; }
        .animate-fade-in-up { animation: fadeInUp 0.8s ease-out forwards; }"""

ex = ex.replace(old_css, new_css)

with open("frontend/src/utils/exportWebsiteHtml.js", "w", encoding="utf-8") as f:
    f.write(ex)

print("Frontpage overlay logic added to exportWebsiteHtml.js")
