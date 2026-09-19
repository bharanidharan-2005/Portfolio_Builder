import re

# 1. FIX CANVAS CONTAINER NAVIGATION
with open("frontend/src/canvas/CanvasContainer.jsx", "r", encoding="utf-8") as f:
    cc = f.read()

old_nav = """                    const scrollContainer = isPreview 
                        ? (document.getElementById('preview-scroll-container') || window) 
                        : (document.getElementById('workspace-scroll-container') || window);

                    if (scrollContainer && scrollContainer.scrollTo) {
                        const currentScroll = scrollContainer === window ? window.scrollY : scrollContainer.scrollTop;
                        const topOffset = targetElement.getBoundingClientRect().top + currentScroll - 100;
                        scrollContainer.scrollTo({ top: topOffset, behavior: 'smooth' });
                    } else {
                        targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }"""

new_nav = """                    // Find the active scroll container reliably
                    const getScrollContainer = () => {
                        const previewModal = document.getElementById('preview-scroll-container');
                        if (previewModal) return previewModal;
                        const workspace = document.getElementById('workspace-scroll-container');
                        if (workspace) return workspace;
                        return window;
                    };
                    const scrollContainer = getScrollContainer();

                    if (scrollContainer && scrollContainer.scrollTo) {
                        const currentScroll = scrollContainer === window ? window.scrollY : scrollContainer.scrollTop;
                        const topOffset = targetElement.getBoundingClientRect().top + currentScroll - 80;
                        scrollContainer.scrollTo({ top: topOffset, behavior: 'smooth' });
                    } else {
                        targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }"""

if old_nav in cc:
    cc = cc.replace(old_nav, new_nav)
else:
    print("WARNING: Could not find old_nav in CanvasContainer")

with open("frontend/src/canvas/CanvasContainer.jsx", "w", encoding="utf-8") as f:
    f.write(cc)


# 2. FIX TYPO ENGINE (WORD BREAK) IN RENDERPAGECONTENT
with open("frontend/src/canvas/RenderPageContent.jsx", "r", encoding="utf-8") as f:
    rpc = f.read()

# Remove the deprecated word-break attribute that causes letters to break
rpc = rpc.replace("[word-break:break-word]", "break-words")

with open("frontend/src/canvas/RenderPageContent.jsx", "w", encoding="utf-8") as f:
    f.write(rpc)


# 3. FIX EDITABLE TEXT INLINE BLOCK TO AVOID SQUISHING
with open("frontend/src/canvas/EditableText.jsx", "r", encoding="utf-8") as f:
    et = f.read()

old_et_class = "inline-block rounded cursor-text"
new_et_class = "block w-full max-w-full rounded cursor-text"

if old_et_class in et:
    et = et.replace(old_et_class, new_et_class)
else:
    print("WARNING: Could not find old_et_class in EditableText")

with open("frontend/src/canvas/EditableText.jsx", "w", encoding="utf-8") as f:
    f.write(et)

print("Bugs fixed in frontend files.")
