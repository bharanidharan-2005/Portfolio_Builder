import re

# 1. Update CanvasContainer.jsx (Fix Lag & Navigator)
with open("frontend/src/canvas/CanvasContainer.jsx", "r", encoding="utf-8") as f:
    cc = f.read()

# Fix Lag: Only generate PDF if isPreview is true
old_pdf = "const pdfDocument = useMemo(() => <ResumePDF sections={sections} />, [sections]);"
new_pdf = "const pdfDocument = useMemo(() => isPreview ? <ResumePDF sections={sections} /> : null, [sections, isPreview]);"
cc = cc.replace(old_pdf, new_pdf)

# Fix Navigator: Handle Preview window scrolling
old_scroll = """const scrollContainer = document.getElementById('workspace-scroll-container') || window;
                    const topOffset = targetElement.getBoundingClientRect().top + (scrollContainer.scrollTop || window.scrollY) - 100;
                    if (scrollContainer.scrollTo) {
                        scrollContainer.scrollTo({ top: topOffset, behavior: 'smooth' });
                    } else {
                        targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }"""
new_scroll = """const isPreviewScroll = isPreview || !document.getElementById('workspace-scroll-container');
                    const scrollContainer = isPreviewScroll ? window : document.getElementById('workspace-scroll-container');
                    const topOffset = targetElement.getBoundingClientRect().top + (isPreviewScroll ? window.scrollY : scrollContainer.scrollTop) - 100;
                    
                    if (scrollContainer.scrollTo) {
                        scrollContainer.scrollTo({ top: topOffset, behavior: 'smooth' });
                    } else {
                        targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }"""
cc = cc.replace(old_scroll, new_scroll)

with open("frontend/src/canvas/CanvasContainer.jsx", "w", encoding="utf-8") as f:
    f.write(cc)


# 2. Update RenderPageContent.jsx (Fix Name, Lag, and Dropdown Scroll)
with open("frontend/src/canvas/RenderPageContent.jsx", "r", encoding="utf-8") as f:
    rpc = f.read()

# Fix Lag: Only generate PDF if isPreview is true
rpc = rpc.replace("const pdfDocument = useMemo(() => <ResumePDF sections={sections} />, [sections]);", "const pdfDocument = useMemo(() => isPreview ? <ResumePDF sections={sections} /> : null, [sections, isPreview]);")

# Fix Name Alignment: Reduce font size and avoid awkward breaks
old_name = """className={`font-black tracking-tight leading-tight w-full max-w-3xl text-4xl sm:text-5xl lg:text-6xl ${bgImage ? 'text-white' : textPrimary}`}"""
new_name = """className={`font-black tracking-tight leading-tight w-full max-w-3xl text-3xl sm:text-4xl lg:text-5xl xl:text-6xl break-words ${bgImage ? 'text-white' : textPrimary}`}"""
rpc = rpc.replace(old_name, new_name)

# Fix Dropdown height (add max-h and overflow-y-auto)
# Social Links Dropdown
old_social_drop = """<div className="absolute top-full left-0 mt-2 w-48 rounded-xl border border-slate-800 bg-[#0a0a0f]/95 backdrop-blur-xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 flex flex-col p-2 overflow-hidden">"""
new_social_drop = """<div className="absolute top-full left-0 mt-2 w-48 rounded-xl border border-slate-800 bg-[#0a0a0f]/95 backdrop-blur-xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 flex flex-col p-2 max-h-60 overflow-y-auto custom-scrollbar">"""
rpc = rpc.replace(old_social_drop, new_social_drop)

# Projects Dropdown
old_proj_drop = """<div className="absolute top-full left-0 mt-2 w-56 rounded-xl border border-slate-800 bg-[#0a0a0f]/95 backdrop-blur-xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 flex flex-col p-2 overflow-hidden">"""
new_proj_drop = """<div className="absolute top-full left-0 mt-2 w-56 rounded-xl border border-slate-800 bg-[#0a0a0f]/95 backdrop-blur-xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 flex flex-col p-2 max-h-60 overflow-y-auto custom-scrollbar">"""
rpc = rpc.replace(old_proj_drop, new_proj_drop)


# Projects Array logic bug: if section type is "projects" (sometimes not "projects_grid")
old_proj_logic = """const pg = sections.find((s) => (s.section_type || "").toLowerCase().trim() === "projects_grid");"""
new_proj_logic = """const pg = sections.find((s) => { const st = (s.section_type || "").toLowerCase().trim(); return st === "projects_grid" || st === "projects"; });"""
rpc = rpc.replace(old_proj_logic, new_proj_logic)


with open("frontend/src/canvas/RenderPageContent.jsx", "w", encoding="utf-8") as f:
    f.write(rpc)

print("Fixes applied.")
