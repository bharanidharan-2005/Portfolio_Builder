import re

with open("frontend/src/canvas/CanvasContainer.jsx", "r", encoding="utf-8") as f:
    cc = f.read()

old_nav = """                    const scrollContainer = isPreview 
                        ? document.getElementById('preview-scroll-container') 
                        : document.getElementById('workspace-scroll-container');

                    if (scrollContainer) {
                        const containerRect = scrollContainer.getBoundingClientRect();
                        const elementRect = targetElement.getBoundingClientRect();
                        const relativeTop = elementRect.top - containerRect.top;
                        scrollContainer.scrollTo({ top: scrollContainer.scrollTop + relativeTop - 100, behavior: 'smooth' });
                    } else {
                        // Public Live View (window scrolling)
                        const topOffset = targetElement.getBoundingClientRect().top + window.scrollY - 100;
                        window.scrollTo({ top: topOffset, behavior: 'smooth' });
                    }"""

new_nav = """                    const getScrollContainer = () => {
                        const p = document.getElementById('preview-scroll-container');
                        if (p) return p;
                        const w = document.getElementById('workspace-scroll-container');
                        if (w) return w;
                        return null;
                    };
                    
                    const scrollContainer = getScrollContainer();
                    
                    if (scrollContainer) {
                        const containerRect = scrollContainer.getBoundingClientRect();
                        const elementRect = targetElement.getBoundingClientRect();
                        const relativeTop = elementRect.top - containerRect.top;
                        scrollContainer.scrollTo({ top: scrollContainer.scrollTop + relativeTop - 100, behavior: 'smooth' });
                    } else {
                        const topOffset = targetElement.getBoundingClientRect().top + window.scrollY - 100;
                        window.scrollTo({ top: topOffset, behavior: 'smooth' });
                    }"""

if old_nav in cc:
    cc = cc.replace(old_nav, new_nav)
else:
    print("WARNING: old_nav not found in CanvasContainer")

with open("frontend/src/canvas/CanvasContainer.jsx", "w", encoding="utf-8") as f:
    f.write(cc)

print("CanvasContainer navigation fixed.")
