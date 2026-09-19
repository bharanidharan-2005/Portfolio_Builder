import os
import re

file_path = "frontend/src/canvas/RenderPageContent.jsx"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

hero_pattern = re.compile(
    r'\{\/\* 1\. HERO SECTION \*\/\}.*?(?=\{\/\* 2\. ABOUT SECTION \*\/\})',
    re.DOTALL
)

new_hero = """{/* 1. HERO SECTION */}
            {currentType === "hero" && (
                <motion.div 
                    {...fadeUpConfig}
                    className={`py-12 sm:py-24 px-4 sm:px-10 relative rounded-3xl ${!bgImage ? cardBg : ""} overflow-hidden`}
                    style={bgImage ? {
                        backgroundImage: `linear-gradient(rgba(0,0,0,0.7), rgba(0,0,0,0.8)), url('${bgImage}')`,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                    } : undefined}
                >
                    <div className="absolute inset-0 pointer-events-none">
                        {!bgImage && <HeroParticles isDark={themeDef.bodyBg?.includes('black') || themeDef.bodyBg?.includes('#0')} />}
                    </div>
                    
                    <div className="relative z-10 w-full max-w-7xl mx-auto flex flex-col-reverse lg:flex-row items-center gap-12 lg:gap-20">
                        
                        {/* LEFT COLUMN: TEXT */}
                        <div className="flex-1 space-y-8 flex flex-col items-center lg:items-start text-center lg:text-left">
                            
                            {/* Status Indicator */}
                            <motion.div 
                                initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}
                                className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold ${borderClass} border shadow-sm ${cardBg} backdrop-blur-md`}
                            >
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                <span className={textSecondary}>Open to opportunities</span>
                            </motion.div>

                            <div className="space-y-4 w-full">
                                <motion.h1
                                    initial={{ opacity: 0, y: 15 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: false, amount: 0.1 }}
                                    transition={springTransition}
                                    className={`font-black tracking-tight leading-tight w-full ${bgImage ? 'text-white' : textPrimary}`}
                                    style={{ fontSize: 'clamp(40px, 5vw, 72px)', whiteSpace: 'normal', wordBreak: 'normal' }}
                                >
                                    <TextElement
                                        value={data.heading || "YOUR NAME"}
                                        placeholder="Your Name"
                                        onCommit={(v) => updateScalar("heading", v)}
                                    />
                                </motion.h1>
                                
                                <motion.p 
                                    initial={{ opacity: 0, y: 15 }} 
                                    whileInView={{ opacity: 1, y: 0 }} 
                                    viewport={{ once: false, amount: 0.1 }}
                                    transition={{ ...springTransition, delay: 0.1 }}
                                    className={`text-xl md:text-2xl font-bold w-full max-w-full ${accentText}`}
                                >
                                    <TextElement 
                                        value={data.subheading || "Junior Data Engineer (GenAI) | Python Developer"}
                                        placeholder="Professional Headline"
                                        onCommit={(v) => updateScalar("subheading", v)}
                                    />
                                </motion.p>
                                
                                <motion.p 
                                    initial={{ opacity: 0, y: 15 }} 
                                    whileInView={{ opacity: 1, y: 0 }} 
                                    viewport={{ once: false, amount: 0.1 }}
                                    transition={{ ...springTransition, delay: 0.15 }}
                                    className={`text-lg md:text-xl leading-relaxed w-full max-w-xl font-medium ${bgImage ? 'text-white/90' : textSecondary}`}
                                >
                                    Building intelligent applications with Python, AI, data, and modern web technologies.
                                </motion.p>
                            </div>

                            <motion.div 
                                initial={{ opacity: 0, y: 15 }} 
                                whileInView={{ opacity: 1, y: 0 }} 
                                viewport={{ once: false, amount: 0.1 }}
                                transition={{ ...springTransition, delay: 0.2 }}
                                className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-4 w-full"
                            >
                                <motion.button 
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        const projectsSection = document.getElementById('preview-node-block-' + (sections.find(s => s.section_type === 'projects_grid')?.id || ''));
                                        if (projectsSection) projectsSection.scrollIntoView({ behavior: 'smooth' });
                                    }}
                                    className={`px-8 py-4 rounded-xl text-sm md:text-base font-bold transition-all shadow-lg hover:shadow-xl ${accentBg} text-white flex items-center gap-2`}
                                >
                                    View My Work &rarr;
                                </motion.button>
                                
                                {isPreview && (
                                    <PDFDownloadLink
                                        document={pdfDocument}
                                        fileName={`${data.heading?.replace(/\s+/g, '_') || 'Portfolio'}_Resume.pdf`}
                                        className={`px-8 py-4 rounded-xl text-sm md:text-base font-bold transition-all bg-transparent hover:bg-white/5 border shadow-sm hover:shadow-md ${textPrimary} ${borderClass}`}
                                    >
                                        {({ blob, url, loading, error }) => (loading ? 'Preparing PDF...' : 'Download Resume')}
                                    </PDFDownloadLink>
                                )}
                            </motion.div>
                        </div>

                        {/* RIGHT COLUMN: 3D VISUAL */}
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.8, rotateY: -15 }}
                            whileInView={{ opacity: 1, scale: 1, rotateY: 0 }}
                            transition={{ type: "spring", damping: 20, stiffness: 40, delay: 0.3 }}
                            className="flex-1 w-full flex justify-center lg:justify-end relative"
                        >
                            <motion.div 
                                animate={{ y: [-15, 15, -15], rotateZ: [-2, 2, -2] }}
                                transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                                className="relative w-[300px] h-[300px] md:w-[450px] md:h-[450px] lg:w-[500px] lg:h-[500px]"
                            >
                                <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-[100px]"></div>
                                <img 
                                    src="/3d_developer_workspace.jpg" 
                                    alt="3D Developer Workspace" 
                                    className="absolute inset-0 w-full h-full object-cover mix-blend-screen opacity-90 hover:opacity-100 transition-opacity duration-500 rounded-3xl"
                                    style={{ filter: "drop-shadow(0 0 30px rgba(59,130,246,0.3))" }}
                                />
                            </motion.div>
                        </motion.div>
                    </div>
                </motion.div>
            )}

            """

match = hero_pattern.search(content)
if not match:
    print("Could not find hero pattern!")
else:
    new_content = content[:match.start()] + new_hero + content[match.end():]
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(new_content)
    print("Hero section updated successfully.")
