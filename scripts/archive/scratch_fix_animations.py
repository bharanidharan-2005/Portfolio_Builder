import re

with open("frontend/src/utils/exportWebsiteHtml.js", "r", encoding="utf-8") as f:
    ex = f.read()

# Enhance the CSS definitions
old_css = """        .reveal-on-scroll.is-visible {
            opacity: 1;
            transform: translateY(0);
        }
        
        @keyframes fadeInDown {"""

new_css = """        /* Staggered Children Animations */
        .reveal-on-scroll { opacity: 0; transform: translateY(30px); transition: all 1s cubic-bezier(0.16, 1, 0.3, 1); }
        .reveal-on-scroll.is-visible { opacity: 1; transform: translateY(0); }
        
        /* Stagger elements inside sections */
        .stagger-container .stagger-item { opacity: 0; transform: translateY(20px); transition: all 0.8s cubic-bezier(0.16, 1, 0.3, 1); }
        .reveal-on-scroll.is-visible.stagger-container .stagger-item, 
        .reveal-on-scroll.is-visible .stagger-item { opacity: 1; transform: translateY(0); }
        
        .stagger-delay-1 { transition-delay: 0.1s; }
        .stagger-delay-2 { transition-delay: 0.2s; }
        .stagger-delay-3 { transition-delay: 0.3s; }
        .stagger-delay-4 { transition-delay: 0.4s; }

        @keyframes fadeInDown {"""

ex = ex.replace(old_css, new_css)

# Update sections to use stagger
old_section_start = """<div id="section-${sec.id}" class="scroll-mt-32 reveal-on-scroll opacity-0 translate-y-12 transition-all duration-1000 ease-out" style="transition-delay: ${animDelay}s">"""
new_section_start = """<div id="section-${sec.id}" class="scroll-mt-32 reveal-on-scroll stagger-container" style="transition-delay: ${animDelay}s">"""
ex = ex.replace(old_section_start, new_section_start)

# Update Frontpage Animations (These run on page load, not scroll)
old_front_left = """<div class="flex-1 w-full space-y-8 flex flex-col lg:items-start text-center lg:text-left items-center animate-fade-in-up" style="animation-delay: 0.2s">"""
new_front_left = """<div class="flex-1 w-full space-y-8 flex flex-col lg:items-start text-center lg:text-left items-center animate-fade-in-up" style="animation-delay: 0.2s">"""

# Update inner content Hero
old_inner_hero_left = """<div class="flex-1 space-y-8 flex flex-col items-center lg:items-start text-center lg:text-left">"""
new_inner_hero_left = """<div class="flex-1 space-y-8 flex flex-col items-center lg:items-start text-center lg:text-left stagger-item stagger-delay-1">"""
ex = ex.replace(old_inner_hero_left, new_inner_hero_left)

old_inner_hero_right = """<div class="flex-1 w-full max-w-md lg:max-w-none relative aspect-square flex justify-center items-center">"""
new_inner_hero_right = """<div class="flex-1 w-full max-w-md lg:max-w-none relative aspect-square flex justify-center items-center stagger-item stagger-delay-2">"""
ex = ex.replace(old_inner_hero_right, new_inner_hero_right)

# Update About
old_about_left = """<div class="flex-1 w-full relative group perspective-1000">"""
new_about_left = """<div class="flex-1 w-full relative group perspective-1000 stagger-item stagger-delay-1">"""
ex = ex.replace(old_about_left, new_about_left)

old_about_right = """<div class="flex-1 w-full space-y-8">"""
new_about_right = """<div class="flex-1 w-full space-y-8 stagger-item stagger-delay-2">"""
ex = ex.replace(old_about_right, new_about_right)

# Update Education/Skills grids
old_edu_item = """<div class="p-8 rounded-2xl border ${theme.border} bg-white/5 hover:bg-white/10 transition-all shadow-sm hover:shadow-xl hover:-translate-y-1">"""
new_edu_item = """<div class="stagger-item p-8 rounded-2xl border ${theme.border} bg-white/5 hover:bg-white/10 transition-all shadow-sm hover:shadow-xl hover:-translate-y-1">"""
ex = ex.replace(old_edu_item, new_edu_item)

old_skill_item = """<div class="group p-6 rounded-2xl border ${theme.border} bg-white/5 hover:bg-white/10 transition-all shadow-sm hover:shadow-xl">"""
new_skill_item = """<div class="stagger-item group p-6 rounded-2xl border ${theme.border} bg-white/5 hover:bg-white/10 transition-all shadow-sm hover:shadow-xl">"""
ex = ex.replace(old_skill_item, new_skill_item)

old_proj_item = """<div class="group relative flex flex-col rounded-3xl border ${theme.border} bg-white/5 overflow-hidden hover:shadow-2xl transition-all duration-700 hover:-translate-y-3">"""
new_proj_item = """<div class="stagger-item group relative flex flex-col rounded-3xl border ${theme.border} bg-white/5 overflow-hidden hover:shadow-2xl transition-all duration-700 hover:-translate-y-3">"""
ex = ex.replace(old_proj_item, new_proj_item)

# Add cascading delay to mapped items
ex = ex.replace("""sectionsHtml += `<section class="py-16 px-6 md:px-12 mb-16 rounded-3xl border ${theme.border} ${theme.cardBg || 'bg-black/40 backdrop-blur-xl'} shadow-2xl"><h2 class="text-sm md:text-base uppercase font-black tracking-[0.2em] mb-10 ${theme.accentText}">${escapeHtml(data.title) || 'Education'}</h2><div class="grid grid-cols-1 gap-6">${itemsHtml}</div></section>`;""", 
"""// Add staggered delays for grid items
const delayEduHtml = itemsHtml.split('stagger-item').map((part, i) => i === 0 ? part : `stagger-item stagger-delay-${(i % 4) + 1}` + part).join('');
sectionsHtml += `<section class="py-16 px-6 md:px-12 mb-16 rounded-3xl border ${theme.border} ${theme.cardBg || 'bg-black/40 backdrop-blur-xl'} shadow-2xl stagger-container"><h2 class="text-sm md:text-base uppercase font-black tracking-[0.2em] mb-10 ${theme.accentText} stagger-item stagger-delay-1">${escapeHtml(data.title) || 'Education'}</h2><div class="grid grid-cols-1 gap-6">${delayEduHtml}</div></section>`;""")

ex = ex.replace("""sectionsHtml += `<section class="py-16 px-6 md:px-12 mb-16 rounded-3xl border ${theme.border} ${theme.cardBg || 'bg-black/40 backdrop-blur-xl'} shadow-2xl"><h2 class="text-sm md:text-base uppercase font-black tracking-[0.2em] mb-10 ${theme.accentText}">${escapeHtml(data.title) || 'Skills'}</h2><div class="grid grid-cols-1 md:grid-cols-2 gap-6">${itemsHtml}</div></section>`;""", 
"""// Add staggered delays for grid items
const delaySkillHtml = itemsHtml.split('stagger-item').map((part, i) => i === 0 ? part : `stagger-item stagger-delay-${(i % 4) + 1}` + part).join('');
sectionsHtml += `<section class="py-16 px-6 md:px-12 mb-16 rounded-3xl border ${theme.border} ${theme.cardBg || 'bg-black/40 backdrop-blur-xl'} shadow-2xl stagger-container"><h2 class="text-sm md:text-base uppercase font-black tracking-[0.2em] mb-10 ${theme.accentText} stagger-item stagger-delay-1">${escapeHtml(data.title) || 'Skills'}</h2><div class="grid grid-cols-1 md:grid-cols-2 gap-6">${delaySkillHtml}</div></section>`;""")

ex = ex.replace("""sectionsHtml += `<section class="py-16 px-6 md:px-12 mb-16 rounded-3xl border ${theme.border} ${theme.cardBg || 'bg-black/40 backdrop-blur-xl'} shadow-2xl"><h2 class="text-sm md:text-base uppercase font-black tracking-[0.2em] mb-10 ${theme.accentText}">${escapeHtml(data.title) || 'Projects'}</h2><div class="grid grid-cols-1 lg:grid-cols-2 gap-8">${projectsHtml}</div></section>`;""", 
"""// Add staggered delays for grid items
const delayProjHtml = projectsHtml.split('stagger-item').map((part, i) => i === 0 ? part : `stagger-item stagger-delay-${(i % 4) + 1}` + part).join('');
sectionsHtml += `<section class="py-16 px-6 md:px-12 mb-16 rounded-3xl border ${theme.border} ${theme.cardBg || 'bg-black/40 backdrop-blur-xl'} shadow-2xl stagger-container"><h2 class="text-sm md:text-base uppercase font-black tracking-[0.2em] mb-10 ${theme.accentText} stagger-item stagger-delay-1">${escapeHtml(data.title) || 'Projects'}</h2><div class="grid grid-cols-1 lg:grid-cols-2 gap-8">${delayProjHtml}</div></section>`;""")

# Intersection observer logic is already fine because it adds `.is-visible` to `.reveal-on-scroll`, which cascades down to the children now!

with open("frontend/src/utils/exportWebsiteHtml.js", "w", encoding="utf-8") as f:
    f.write(ex)

print("Export HTML animations enhanced to Staggered Children Animations (Framer Motion replica).")
