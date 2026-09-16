import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { PORTFOLIO_THEMES } from '../canvas/themes';

export const exportProjectToZip = async (pages, activePageName, themeMode, portfolioTheme, globalBgImage) => {
    const zip = new JSZip();

    // 1. package.json
    const packageJson = {
        name: "my-portfolio",
        private: true,
        version: "1.0.0",
        type: "module",
        scripts: {
            dev: "vite",
            build: "vite build",
            preview: "vite preview"
        },
        dependencies: {
            "framer-motion": "^11.0.8",
            "lucide-react": "^0.344.0",
            "react": "^18.2.0",
            "react-dom": "^18.2.0"
        },
        devDependencies: {
            "@types/react": "^18.2.64",
            "@types/react-dom": "^18.2.21",
            "@vitejs/plugin-react": "^4.2.1",
            "autoprefixer": "^10.4.18",
            "postcss": "^8.4.35",
            "tailwindcss": "^3.4.1",
            "vite": "^5.1.6"
        }
    };
    zip.file("package.json", JSON.stringify(packageJson, null, 2));

    // 2. index.html
    const indexHtml = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>My Portfolio</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>`;
    zip.file("index.html", indexHtml);

    // 3. vite.config.js
    zip.file("vite.config.js", `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
})`);

    // 4. tailwind.config.js
    zip.file("tailwind.config.js", `/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}`);

    zip.file("postcss.config.js", `export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}`);

    // 5. src/main.jsx
    zip.file("src/main.jsx", `import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)`);

    // 6. src/index.css
    zip.file("src/index.css", `@tailwind base;
@tailwind components;
@tailwind utilities;

@layer utilities {
    .custom-scrollbar::-webkit-scrollbar {
        width: 4px;
        height: 4px;
    }
    .custom-scrollbar::-webkit-scrollbar-track {
        background: transparent;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb {
        background: rgba(100, 116, 139, 0.3);
        border-radius: 10px;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb:hover {
        background: rgba(100, 116, 139, 0.5);
    }
}`);

    // 7. src/themes.js
    zip.file("src/themes.js", `export const PORTFOLIO_THEMES = ${JSON.stringify(PORTFOLIO_THEMES, null, 2)};`);

    // 8. src/App.jsx (Main Container)
    const activePage = pages.find(p => p.name === activePageName) || pages[0] || { sections: [] };
    const sectionsJson = JSON.stringify(activePage.sections || [], null, 2);
    
    const appJsx = `import React from 'react';
import RenderPageContent from './RenderPageContent';
import { PORTFOLIO_THEMES } from './themes';

const SECTIONS = ${sectionsJson};
const PORTFOLIO_THEME = "${portfolioTheme}";
const GLOBAL_BG = "${globalBgImage || ''}";

export default function App() {
    const currentTheme = PORTFOLIO_THEMES[PORTFOLIO_THEME] || {};
    
    return (
        <div className="w-full min-h-screen flex flex-col items-center relative animate-in fade-in duration-500 bg-black text-white">
            <div className={\`relative w-full min-h-screen transition-all duration-500 ease-out overflow-hidden \${currentTheme.bodyBg || ''}\`}>
                
                {GLOBAL_BG && (
                    <div 
                        className="absolute inset-0 z-0 pointer-events-none"
                        style={{
                            backgroundImage: \`url('\${GLOBAL_BG}')\`,
                            backgroundSize: 'cover',
                            backgroundRepeat: 'no-repeat',
                            backgroundPosition: 'center',
                            opacity: 0.3
                        }}
                    />
                )}

                <div className="relative z-10 w-full p-4 sm:p-10 flex flex-col max-w-7xl mx-auto">
                    {SECTIONS.map((section) => (
                        <div key={section.id} className="w-full mb-8">
                            <RenderPageContent section={section} portfolioTheme={PORTFOLIO_THEME} />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
`;
    zip.file("src/App.jsx", appJsx);

    // 9. src/RenderPageContent.jsx
    const renderPageContentJsx = `import React from "react";
import { PORTFOLIO_THEMES } from "./themes";
import { motion } from "framer-motion";

export default function RenderPageContent({ section, portfolioTheme }) {
    if (!section) return null;
    const currentType = (section.section_type || "").toLowerCase().trim();
    const data = section.content_data || {};
    const bgImage = data.backgroundImage || null;

    const themeDef = PORTFOLIO_THEMES[portfolioTheme] || PORTFOLIO_THEMES.modern_glass || {};
    const borderClass = themeDef.border || "border-slate-700";
    const accentText = themeDef.accentText || "text-blue-400";
    const accentBg = accentText.replace('text-transparent', '').replace('bg-clip-text', '').replace(/text-/g, 'bg-').trim();
    const textPrimary = "text-slate-50"; 
    const textSecondary = "text-slate-300";
    const cardBg = "bg-white/[0.03] backdrop-blur-xl"; 
    const badgeClass = \`bg-black/40 text-slate-200 border \${borderClass} shadow-sm backdrop-blur-md\`;

    const sectionImageBanner = bgImage ? (
        <motion.img 
            initial={{ opacity: 0, scale: 0.98 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: false, amount: 0.1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            src={bgImage}
            alt="Section header"
            className={\`w-full h-32 md:h-40 object-cover rounded-2xl mb-6 border \${borderClass} shadow-lg\`}
        />
    ) : null;

    if (currentType === "hero") {
        return (
            <div className="min-h-[500px] flex items-center justify-center relative overflow-hidden py-16">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/50 z-0"></div>
                <div className="z-10 text-center space-y-8 max-w-4xl px-4 relative">
                    <motion.h1 
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: false, amount: 0.1 }}
                        transition={{ type: "spring", stiffness: 80, damping: 20 }}
                        className={\`text-5xl md:text-7xl font-black uppercase tracking-tight \${accentText}\`}
                    >
                        {data.heading || "Hero Heading"}
                    </motion.h1>
                    <motion.h2 
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: false, amount: 0.1 }}
                        transition={{ delay: 0.2, type: "spring", stiffness: 80, damping: 20 }}
                        className={\`text-xl md:text-2xl font-light tracking-wide \${textSecondary}\`}
                    >
                        {data.subheading || "Hero Subheading"}
                    </motion.h2>
                </div>
            </div>
        );
    }
    
    if (currentType === "about") {
        return (
            <div className="space-y-8 py-10 w-full max-w-4xl mx-auto px-4">
                {sectionImageBanner}
                <motion.h2 
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: false, amount: 0.1 }}
                    className={\`text-sm uppercase font-black tracking-widest mb-10 \${accentText}\`}
                >
                    About Me
                </motion.h2>
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: false, amount: 0.1 }}
                    className={\`text-lg md:text-xl leading-relaxed whitespace-pre-wrap font-light \${textSecondary}\`}
                >
                    {data.bio || "About me bio."}
                </motion.div>
            </div>
        );
    }
    
    if (currentType === "skills") {
        return (
            <div className="space-y-8 py-10 w-full max-w-4xl mx-auto px-4">
                {sectionImageBanner}
                <motion.h2 
                    initial={{ opacity: 0, y: -15 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: false, amount: 0.1 }}
                    className={\`text-sm uppercase font-black tracking-widest text-center mb-12 \${accentText}\`}
                >
                    Technical Arsenal
                </motion.h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                    {(data.items || []).map((skill, i) => (
                        <div key={i} className={\`p-6 rounded-2xl border flex flex-col gap-3 shadow-md backdrop-blur-xl \${cardBg} \${borderClass}\`}>
                            <div className="flex justify-between items-center px-1">
                                <span className={\`text-sm font-bold uppercase tracking-wider \${textPrimary}\`}>{skill.name}</span>
                                <span className={\`text-xs font-black \${accentText}\`}>{skill.level || 50}%</span>
                            </div>
                            <div className={\`w-full h-3.5 rounded-full overflow-hidden border \${borderClass} bg-black/40\`}>
                                <motion.div 
                                    className={\`h-full rounded-full \${accentBg}\`}
                                    initial={{ width: 0 }}
                                    whileInView={{ width: \`\${skill.level || 50}%\` }}
                                    viewport={{ once: false }}
                                    transition={{ duration: 1, ease: "easeOut" }}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }
    
    if (currentType === "projects_grid") {
        return (
            <div className="space-y-8 py-10 w-full max-w-5xl mx-auto px-4">
                {sectionImageBanner}
                <motion.h2 
                    initial={{ opacity: 0, y: -15 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: false, amount: 0.1 }}
                    className={\`text-sm uppercase font-black tracking-widest text-center mb-12 \${accentText}\`}
                >
                    {data.title || "Showcase"}
                </motion.h2>
                <div className="flex flex-col gap-10">
                    {(data.projects || []).map((project, i) => (
                        <div 
                            key={i}
                            onMouseMove={(e) => {
                                const card = e.currentTarget;
                                const rect = card.getBoundingClientRect();
                                const x = e.clientX - rect.left;
                                const y = e.clientY - rect.top;
                                const rotateX = ((y - (rect.height / 2)) / (rect.height / 2)) * -5; 
                                const rotateY = ((x - (rect.width / 2)) / (rect.width / 2)) * 5;
                                card.style.transform = \`perspective(1000px) rotateX(\${rotateX}deg) rotateY(\${rotateY}deg) scale3d(1.02, 1.02, 1.02)\`;
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = \`perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)\`;
                            }}
                            style={{ transition: "transform 0.1s ease-out" }}
                            className={\`relative p-8 md:p-10 rounded-[2rem] border flex flex-col space-y-6 shadow-md backdrop-blur-xl overflow-hidden \${cardBg} \${borderClass}\`}
                        >
                            <h3 className={\`text-2xl md:text-3xl font-black uppercase \${textPrimary}\`}>{project.title}</h3>
                            <div className={\`text-base leading-relaxed whitespace-pre-wrap \${textSecondary}\`}>{project.desc}</div>
                            {project.projectUrl && (
                                <div className="pt-2">
                                    <a href={project.projectUrl} target="_blank" rel="noopener noreferrer" className={\`inline-flex w-max items-center justify-center px-8 py-3.5 rounded-xl text-sm font-bold transition-all border \${badgeClass}\`}>
                                        View Live ->
                                    </a>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        );
    }
    
    // Fallback
    return (
        <div className={\`p-10 rounded-3xl border \${borderClass} \${cardBg} text-center\`}>
            <h3 className="text-xl font-bold mb-4">{currentType}</h3>
            <p className="text-slate-400">Content mapped.</p>
        </div>
    );
}
`;
    zip.file("src/RenderPageContent.jsx", renderPageContentJsx);

    // Generate ZIP
    const content = await zip.generateAsync({ type: "blob" });
    saveAs(content, "my-portfolio-source.zip");
};
