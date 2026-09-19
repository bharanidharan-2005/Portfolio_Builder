import re

# --- 1. Update CanvasContainer.jsx ---
with open("frontend/src/canvas/CanvasContainer.jsx", "r", encoding="utf-8") as f:
    cc = f.read()

# Add imports
if "PDFDownloadLink" not in cc:
    cc = cc.replace("import { Undo2, Redo2, Layers, Sparkles } from 'lucide-react';", "import { Undo2, Redo2, Layers, Sparkles } from 'lucide-react';\nimport { PDFDownloadLink } from '@react-pdf/renderer';\nimport { ResumePDF } from '../components/ResumePDF';")

# Add pdfDocument memo
if "const pdfDocument" not in cc:
    cc = cc.replace("const displaySections = sections || [];", "const displaySections = sections || [];\n    const pdfDocument = useMemo(() => <ResumePDF sections={sections} />, [sections]);")

# Replace Print Resume button
old_resume_btn = """<button 
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

new_resume_btn = """{isPreview ? (
                                <PDFDownloadLink
                                    document={pdfDocument}
                                    fileName="Portfolio_Resume.pdf"
                                    className={`px-4 py-2 rounded-lg text-xs font-bold transition-all shadow-md hover:shadow-lg ${currentTheme.accentBg || 'bg-blue-600'} text-white flex items-center gap-2`}
                                >
                                    {({ loading }) => (loading ? 'Preparing...' : 'Download Resume')}
                                </PDFDownloadLink>
                            ) : (
                                <button 
                                    onClick={() => alert("Please test Resume Download in the Live Preview.")}
                                    className={`px-4 py-2 rounded-lg text-xs font-bold transition-all shadow-md hover:shadow-lg ${currentTheme.accentBg || 'bg-blue-600'} text-white flex items-center gap-2`}
                                >
                                    Download Resume
                                </button>
                            )}"""
cc = cc.replace(old_resume_btn, new_resume_btn)

# Fix Navigator Scroll
old_scroll = """targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });"""
new_scroll = """const scrollContainer = document.getElementById('workspace-scroll-container') || window;
                    const topOffset = targetElement.getBoundingClientRect().top + (scrollContainer.scrollTop || window.scrollY) - 100;
                    if (scrollContainer.scrollTo) {
                        scrollContainer.scrollTo({ top: topOffset, behavior: 'smooth' });
                    } else {
                        targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }"""
cc = cc.replace(old_scroll, new_scroll)

with open("frontend/src/canvas/CanvasContainer.jsx", "w", encoding="utf-8") as f:
    f.write(cc)


# --- 2. Update RenderPageContent.jsx ---
with open("frontend/src/canvas/RenderPageContent.jsx", "r", encoding="utf-8") as f:
    rpc = f.read()

# Make animations sharper
rpc = rpc.replace('stiffness: 80, damping: 20', 'stiffness: 250, damping: 25')
rpc = rpc.replace('duration: 0.8', 'duration: 0.4')
rpc = rpc.replace('duration: 8', 'duration: 4') # Speed up 3D visual bobbing

# Fix Hero overflow so dropdowns don't cut off
old_hero = """className={`py-12 sm:py-24 px-4 sm:px-10 relative rounded-3xl bg-transparent overflow-hidden`}"""
new_hero = """className={`py-12 sm:py-24 px-4 sm:px-10 relative rounded-3xl bg-transparent overflow-visible`}"""
rpc = rpc.replace(old_hero, new_hero)

# Apply overflow-hidden ONLY to the particles so they don't spill
old_particles = """<div className="absolute inset-0 pointer-events-none">
                        {!bgImage && <HeroParticles isDark={themeDef.bodyBg?.includes('black') || themeDef.bodyBg?.includes('#0')} />}
                    </div>"""
new_particles = """<div className="absolute inset-0 pointer-events-none overflow-hidden rounded-3xl">
                        {!bgImage && <HeroParticles isDark={themeDef.bodyBg?.includes('black') || themeDef.bodyBg?.includes('#0')} />}
                    </div>"""
rpc = rpc.replace(old_particles, new_particles)

with open("frontend/src/canvas/RenderPageContent.jsx", "w", encoding="utf-8") as f:
    f.write(rpc)

print("All fixes applied successfully.")
