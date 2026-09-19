import re

# 1. Update CanvasContainer.jsx for Navbar alignment
with open("frontend/src/canvas/CanvasContainer.jsx", "r", encoding="utf-8") as f:
    canvas_content = f.read()

# Fix alignment on the name span in Navbar
old_span = """<span className={`font-black tracking-widest uppercase hidden sm:block text-sm md:text-base ${currentTheme.accentText || 'text-blue-400'}`}>"""
new_span = """<span className={`font-black tracking-widest uppercase hidden sm:block text-sm md:text-base leading-none translate-y-[1px] ${currentTheme.accentText || 'text-blue-400'}`}>"""
canvas_content = canvas_content.replace(old_span, new_span)

with open("frontend/src/canvas/CanvasContainer.jsx", "w", encoding="utf-8") as f:
    f.write(canvas_content)


# 2. Update RenderPageContent.jsx
with open("frontend/src/canvas/RenderPageContent.jsx", "r", encoding="utf-8") as f:
    rpc = f.read()

# Add getRoleImage helper
get_role_func = """
export const getRoleImage = (subheading) => {
    const role = (subheading || "").toLowerCase();
    if (role.includes('civil') || role.includes('construct') || role.includes('architect')) return '/3d_civil.jpg';
    if (role.includes('design') || role.includes('art') || role.includes('ui/ux') || role.includes('ux')) return '/3d_design.jpg';
    if (role.includes('data') || role.includes('ai') || role.includes('machine learning') || role.includes('ml')) return '/3d_data.jpg';
    if (role.includes('develop') || role.includes('software') || role.includes('engineer') || role.includes('program')) return '/3d_developer_workspace.jpg';
    return '/3d_generic.jpg';
};

const RenderPageContent = ({ section, portfolioTheme, sections, isPreview, activePage }) => {
"""
rpc = rpc.replace("const RenderPageContent = ({ section, portfolioTheme, sections, isPreview, activePage }) => {", get_role_func)


# Fix typography in Hero Name
old_clamp = """style={{ fontSize: 'clamp(40px, 5vw, 72px)', whiteSpace: 'normal', wordBreak: 'normal' }}"""
new_clamp = """style={{ fontSize: 'clamp(32px, 5vw, 56px)', whiteSpace: 'normal', wordBreak: 'break-word', lineHeight: '1.1' }}"""
rpc = rpc.replace(old_clamp, new_clamp)

# Remove cardBg from Hero
old_hero_wrapper = """className={`py-12 sm:py-24 px-4 sm:px-10 relative rounded-3xl ${!bgImage ? cardBg : ""} overflow-hidden`}"""
new_hero_wrapper = """className={`py-12 sm:py-24 px-4 sm:px-10 relative rounded-3xl bg-transparent overflow-hidden`}"""
rpc = rpc.replace(old_hero_wrapper, new_hero_wrapper)

# Restore Social Links in Hero
old_buttons = """<motion.div 
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
                            </motion.div>"""

new_buttons = """<motion.div 
                                initial={{ opacity: 0, y: 15 }} 
                                whileInView={{ opacity: 1, y: 0 }} 
                                viewport={{ once: false, amount: 0.1 }}
                                transition={{ ...springTransition, delay: 0.2 }}
                                className="flex flex-col items-center lg:items-start gap-6 pt-4 w-full"
                            >
                                <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 w-full">
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
                                            {({ blob, url, loading, error }) => (loading ? 'Preparing...' : 'Download Resume')}
                                        </PDFDownloadLink>
                                    )}
                                </div>
                                
                                {/* Dynamic Social Links */}
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
                                )}
                            </motion.div>"""

rpc = rpc.replace(old_buttons, new_buttons)

# Update the 3D Image logic to use getRoleImage
old_image = """<img 
                                    src="/3d_developer_workspace.jpg" 
                                    alt="3D Developer Workspace" 
                                    className="absolute inset-0 w-full h-full object-cover mix-blend-screen opacity-90 hover:opacity-100 transition-opacity duration-500 rounded-3xl"
                                    style={{ filter: "drop-shadow(0 0 30px rgba(59,130,246,0.3))" }}
                                />"""

new_image = """<img 
                                    src={getRoleImage(data.subheading || "")} 
                                    alt="3D Workspace" 
                                    className="absolute inset-0 w-full h-full object-cover mix-blend-screen opacity-90 hover:opacity-100 transition-opacity duration-500 rounded-3xl"
                                    style={{ filter: "drop-shadow(0 0 30px rgba(59,130,246,0.3))" }}
                                />"""

rpc = rpc.replace(old_image, new_image)

with open("frontend/src/canvas/RenderPageContent.jsx", "w", encoding="utf-8") as f:
    f.write(rpc)

print("RenderPageContent and CanvasContainer updated.")
