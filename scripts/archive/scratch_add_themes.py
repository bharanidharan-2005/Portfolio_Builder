import re

with open("frontend/src/canvas/themes.js", "r", encoding="utf-8") as f:
    themes = f.read()

new_themes = """
    abstract_particles: {
        id: 'abstract_particles',
        name: '6. 3D Particles',
        bodyBg: 'bg-black/80 bg-[url(/bg_3d_particles.jpg)] bg-cover bg-center bg-fixed bg-blend-multiply',
        border: 'border-blue-500/20',
        accentText: 'text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500',
        accentBg: 'bg-gradient-to-r from-blue-400 to-purple-500',
    },
    cyber_platform: {
        id: 'cyber_platform',
        name: '7. 3D Cyber Platform',
        bodyBg: 'bg-black/80 bg-[url(/bg_glow_platform.jpg)] bg-cover bg-center bg-fixed bg-blend-multiply',
        border: 'border-cyan-500/30',
        accentText: 'text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-emerald-400',
        accentBg: 'bg-gradient-to-r from-cyan-400 to-emerald-400',
    },
    dark_blocks: {
        id: 'dark_blocks',
        name: '8. 3D Dark Blocks',
        bodyBg: 'bg-black/80 bg-[url(/bg_dark_blocks.jpg)] bg-cover bg-center bg-fixed bg-blend-multiply',
        border: 'border-white/10',
        accentText: 'text-slate-100',
        accentBg: 'bg-slate-700',
    },
    vibrant_geo: {
        id: 'vibrant_geo',
        name: '9. 3D Vibrant Geo',
        bodyBg: 'bg-black/80 bg-[url(/bg_abstract_geo.jpg)] bg-cover bg-center bg-fixed bg-blend-multiply',
        border: 'border-fuchsia-500/30',
        accentText: 'text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-400 to-rose-400',
        accentBg: 'bg-gradient-to-r from-fuchsia-400 to-rose-400',
    }
};"""

themes = themes.replace("    }\n};", "    }," + new_themes)

with open("frontend/src/canvas/themes.js", "w", encoding="utf-8") as f:
    f.write(themes)

print("Themes updated.")
