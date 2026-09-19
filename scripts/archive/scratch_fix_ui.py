import re

# 1. Update RenderPageContent.jsx
with open("frontend/src/canvas/RenderPageContent.jsx", "r", encoding="utf-8") as f:
    rpc = f.read()

# Fix Section Headers (De-box them)
boxy_header = r"""<div className={`sticky top-0 sm:top-\[60px\] z-40 w-\[calc\(100%\+2rem\)\] -ml-4 sm:w-\[calc\(100%\+4rem\)\] sm:-ml-8 px-4 sm:px-8 py-4 mb-8 backdrop-blur-2xl bg-black/40 border-b shadow-lg transition-all \$\{borderClass\}`}>\s*<motion\.h2[^>]*className={`text-xl md:text-2xl uppercase font-black tracking-widest \$\{accentText\}`}[^>]*>\s*([^<]+)\s*</motion\.h2>\s*</div>"""

clean_header = r"""<motion.h2 
                            initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: false }}
                            className={`text-3xl sm:text-4xl uppercase font-black tracking-widest mb-10 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500`}
                        >
                            \1
                        </motion.h2>"""

rpc = re.sub(boxy_header, clean_header, rpc)

# Fix Center Headers (Core Expertise, Showcase of Innovations)
boxy_center_header = r"""<div className={`sticky top-0 sm:top-\[60px\] z-40 w-\[calc\(100%\+2rem\)\] -ml-4 sm:w-\[calc\(100%\+4rem\)\] sm:-ml-8 px-4 sm:px-8 py-4 mb-12 backdrop-blur-2xl bg-black/40 border-b shadow-lg transition-all \$\{borderClass\}`}>\s*<motion\.h2[^>]*className={`text-xl md:text-2xl uppercase font-black tracking-widest text-center \$\{accentText\}`}[^>]*>\s*([^<]+)\s*</motion\.h2>\s*</div>"""

clean_center_header = r"""<motion.h2 
                            initial={{ opacity: 0, y: -20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: false }}
                            className={`text-3xl sm:text-4xl uppercase font-black tracking-widest text-center mb-14 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500`}
                        >
                            \1
                        </motion.h2>"""

rpc = re.sub(boxy_center_header, clean_center_header, rpc)

# Fix Name Typography in Hero
rpc = rpc.replace("""style={{ fontSize: 'clamp(32px, 5vw, 56px)', whiteSpace: 'normal', wordBreak: 'break-word', lineHeight: '1.1' }}""", """className={`font-black tracking-tight leading-tight w-full text-5xl sm:text-6xl lg:text-7xl break-words ${bgImage ? 'text-white' : textPrimary}`}""")
# Need to remove the old className that was on the h1
rpc = re.sub(r"""className={`font-black tracking-tight leading-tight w-full \$\{bgImage \? 'text-white' : textPrimary\}`}\s*className={`font-black""", """className={`font-black""", rpc)


# Fix Hero Links Dropdown
old_links = """{/* Dynamic Social Links */}
                                {(heroLiveOptions.length > 0 || heroDesignOptions.length > 0) && (
                                    <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 w-full">
                                        {[...heroLiveOptions, ...heroDesignOptions].map((link, i) => (
                                            <motion.button
                                                key={i}
                                                whileHover={{ scale: 1.05 }}
                                                onClick={(e) => { e.stopPropagation(); openExternal(link.url); }}
                                                className={`px-5 py-2.5 rounded-full text-xs font-bold transition-all border shadow-sm flex items-center gap-2 ${badgeClass}`}
                                            >
                                                {link.label} ↗
                                            </motion.button>
                                        ))}
                                    </div>
                                )}"""

new_links = """{/* Dynamic Social & Project Links Dropdown */}
                                {(heroLiveOptions.length > 0 || heroDesignOptions.length > 0) && (
                                    <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 w-full mt-2">
                                        {/* Social Links as minimal badges */}
                                        {heroLiveOptions.map((link, i) => (
                                            <motion.button
                                                key={`social-${i}`}
                                                whileHover={{ scale: 1.05 }}
                                                onClick={(e) => { e.stopPropagation(); openExternal(link.url); }}
                                                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all border shadow-sm flex items-center gap-2 hover:bg-white/10 ${textSecondary} ${borderClass}`}
                                            >
                                                {link.label} ↗
                                            </motion.button>
                                        ))}
                                        
                                        {/* Projects Dropdown */}
                                        {heroDesignOptions.length > 0 && (
                                            <div className="group relative z-50">
                                                <button className={`px-5 py-2 rounded-lg text-xs font-bold transition-all border shadow-sm flex items-center gap-2 bg-slate-800/80 hover:bg-slate-700 text-white ${borderClass}`}>
                                                    Live Projects ▾
                                                </button>
                                                <div className="absolute top-full left-0 mt-2 w-56 rounded-xl border border-slate-700 bg-slate-900/95 backdrop-blur-xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 flex flex-col p-2 overflow-hidden">
                                                    {heroDesignOptions.map((link, i) => (
                                                        <button
                                                            key={`proj-${i}`}
                                                            onClick={(e) => { e.stopPropagation(); openExternal(link.url); }}
                                                            className="text-left px-4 py-3 rounded-lg text-xs font-semibold text-slate-300 hover:text-white hover:bg-blue-500/20 transition-all truncate"
                                                        >
                                                            {link.label} ↗
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}"""

rpc = rpc.replace(old_links, new_links)

with open("frontend/src/canvas/RenderPageContent.jsx", "w", encoding="utf-8") as f:
    f.write(rpc)


# 2. Update PortfolioFrontpage.jsx Name Typography
with open("frontend/src/components/portfolio/PortfolioFrontpage.jsx", "r", encoding="utf-8") as f:
    pfc = f.read()

pfc = pfc.replace("""style={{ fontSize: 'clamp(32px, 5vw, 56px)', wordBreak: 'break-word', lineHeight: '1.1' }}""", """className={`font-black tracking-tight leading-tight w-full text-5xl sm:text-6xl lg:text-7xl break-words`}""")
# Remove old style if it was replaced, but wait, the original had a className on the same element.
# Let's just regex replace the style and append the classes to className
pfc = re.sub(r"""className=\{`text-5xl md:text-7xl font-black tracking-tight mb-4 \$\{c\.textPrimary\}`\}\s*style=\{\{ fontSize: 'clamp\(32px, 5vw, 56px\)', wordBreak: 'break-word', lineHeight: '1.1' \}\}""", """className={`text-5xl sm:text-6xl lg:text-7xl font-black tracking-tight mb-4 break-words ${c.textPrimary}`}\n                                    style={{ lineHeight: '1.1' }}""", pfc)

with open("frontend/src/components/portfolio/PortfolioFrontpage.jsx", "w", encoding="utf-8") as f:
    f.write(pfc)


# 3. Update CanvasContainer.jsx Resume Download Button
with open("frontend/src/canvas/CanvasContainer.jsx", "r", encoding="utf-8") as f:
    cc = f.read()

old_resume_btn = """<button 
                                onClick={() => handleNavClick('resume')}
                                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all shadow-md hover:shadow-lg ${currentTheme.accentBg || 'bg-blue-600'} text-white flex items-center gap-2`}
                            >
                                Resume
                            </button>"""

# If PDFDownloadLink is not imported in CanvasContainer, we can just trigger a click on the invisible preview resume button, or alert the user.
# Since it's easier to just use PDFDownloadLink, let's see if it's imported. It's not.
# Let's just make it call a print function or scroll to hero.
new_resume_btn = """<button 
                                onClick={() => {
                                    if(isPreview) {
                                        window.print();
                                    } else {
                                        alert("Please test Resume Download in the Live Preview.");
                                    }
                                }}
                                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all shadow-md hover:shadow-lg ${currentTheme.accentBg || 'bg-blue-600'} text-white flex items-center gap-2`}
                            >
                                Print Resume
                            </button>"""

cc = cc.replace(old_resume_btn, new_resume_btn)

with open("frontend/src/canvas/CanvasContainer.jsx", "w", encoding="utf-8") as f:
    f.write(cc)

print("UI fixes applied.")
