import re

# 1. Update PortfolioFrontpage.jsx
with open("frontend/src/components/portfolio/PortfolioFrontpage.jsx", "r", encoding="utf-8") as f:
    pfc = f.read()

# Fix double className and break-words
bad_h1_str = """className="font-black tracking-tight leading-tight w-full"
                            className={`font-black tracking-tight leading-tight w-full text-5xl sm:text-6xl lg:text-7xl break-words`}"""
good_h1_str = """className={`font-black tracking-tight leading-tight w-full text-4xl sm:text-5xl lg:text-6xl max-w-3xl`}"""
pfc = pfc.replace(bad_h1_str, good_h1_str)

# Fix missing onClick on Download Resume button
old_resume_btn = """<motion.button 
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="px-8 py-4 rounded-xl text-sm md:text-base font-bold transition-all bg-transparent hover:bg-white/10 border border-current shadow-sm hover:shadow-md flex items-center gap-2"
                        >
                            Download Resume <Download className="w-5 h-5" />
                        </motion.button>"""

new_resume_btn = """<motion.button 
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => alert("Please proceed to your main portfolio to download the dynamically generated PDF resume.")}
                            className="px-8 py-4 rounded-xl text-sm md:text-base font-bold transition-all bg-transparent hover:bg-white/10 border border-current shadow-sm hover:shadow-md flex items-center gap-2"
                        >
                            Download Resume <Download className="w-5 h-5" />
                        </motion.button>"""
pfc = pfc.replace(old_resume_btn, new_resume_btn)

with open("frontend/src/components/portfolio/PortfolioFrontpage.jsx", "w", encoding="utf-8") as f:
    f.write(pfc)


# 2. Update RenderPageContent.jsx
with open("frontend/src/canvas/RenderPageContent.jsx", "r", encoding="utf-8") as f:
    rpc = f.read()

# Fix Name Typography (remove break-words and reduce size)
old_name = """className={`font-black tracking-tight leading-tight w-full text-5xl sm:text-6xl lg:text-7xl break-words ${bgImage ? 'text-white' : textPrimary}`}"""
new_name = """className={`font-black tracking-tight leading-tight w-full max-w-3xl text-4xl sm:text-5xl lg:text-6xl ${bgImage ? 'text-white' : textPrimary}`}"""
rpc = rpc.replace(old_name, new_name)

# Fix the Links Layout to exactly match the two Dropdowns [See Live] and [Projects]
old_links = """{/* Dynamic Social & Project Links Dropdown */}
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

new_links = """{/* Sleek Side-by-Side Dropdowns */}
                                {(heroLiveOptions.length > 0 || heroDesignOptions.length > 0) && (
                                    <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 w-full mt-2">
                                        
                                        {/* See Live Dropdown */}
                                        {heroLiveOptions.length > 0 && (
                                            <div className="group relative z-50">
                                                <button className="px-5 py-2.5 rounded-xl text-sm font-bold transition-all border border-white/5 shadow-lg flex items-center gap-2 bg-[#0a0a0f] hover:bg-[#1a1a24] text-white">
                                                    See Live ▾
                                                </button>
                                                <div className="absolute top-full left-0 mt-2 w-48 rounded-xl border border-slate-800 bg-[#0a0a0f]/95 backdrop-blur-xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 flex flex-col p-2 overflow-hidden">
                                                    {heroLiveOptions.map((link, i) => (
                                                        <button
                                                            key={`social-${i}`}
                                                            onClick={(e) => { e.stopPropagation(); openExternal(link.url); }}
                                                            className="text-left px-4 py-2.5 rounded-lg text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/10 transition-all truncate flex items-center justify-between"
                                                        >
                                                            <span>{link.label}</span>
                                                            <span className="opacity-50 text-[10px]">↗</span>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                        
                                        {/* Projects Dropdown */}
                                        {heroDesignOptions.length > 0 && (
                                            <div className="group relative z-50">
                                                <button className="px-5 py-2.5 rounded-xl text-sm font-bold transition-all border border-white/5 shadow-lg flex items-center gap-2 bg-[#0a0a0f] hover:bg-[#1a1a24] text-white">
                                                    Projects ▾
                                                </button>
                                                <div className="absolute top-full left-0 mt-2 w-56 rounded-xl border border-slate-800 bg-[#0a0a0f]/95 backdrop-blur-xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 flex flex-col p-2 overflow-hidden">
                                                    {heroDesignOptions.map((link, i) => (
                                                        <button
                                                            key={`proj-${i}`}
                                                            onClick={(e) => { e.stopPropagation(); openExternal(link.url); }}
                                                            className="text-left px-4 py-2.5 rounded-lg text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/10 transition-all truncate flex items-center justify-between"
                                                        >
                                                            <span>{link.label}</span>
                                                            <span className="opacity-50 text-[10px]">↗</span>
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

print("Final UI fixes applied.")
