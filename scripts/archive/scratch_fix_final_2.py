import re
import uuid

# 1. Update CanvasContainer.jsx (Fix Navigator for Preview)
with open("frontend/src/canvas/CanvasContainer.jsx", "r", encoding="utf-8") as f:
    cc = f.read()

old_scroll = """const isPreviewScroll = isPreview || !document.getElementById('workspace-scroll-container');
                    const scrollContainer = isPreviewScroll ? window : document.getElementById('workspace-scroll-container');
                    const topOffset = targetElement.getBoundingClientRect().top + (isPreviewScroll ? window.scrollY : scrollContainer.scrollTop) - 100;
                    
                    if (scrollContainer.scrollTo) {
                        scrollContainer.scrollTo({ top: topOffset, behavior: 'smooth' });
                    } else {
                        targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }"""

new_scroll = """if (isPreview) {
                        targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    } else {
                        const scrollContainer = document.getElementById('workspace-scroll-container');
                        if (scrollContainer && scrollContainer.scrollTo) {
                            const topOffset = targetElement.getBoundingClientRect().top + scrollContainer.scrollTop - 100;
                            scrollContainer.scrollTo({ top: topOffset, behavior: 'smooth' });
                        } else {
                            targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }
                    }"""

cc = cc.replace(old_scroll, new_scroll)

with open("frontend/src/canvas/CanvasContainer.jsx", "w", encoding="utf-8") as f:
    f.write(cc)


# 2. Update utils.py (Fix Vercel Deploy 403)
with open("backend/api/views/utils.py", "r", encoding="utf-8") as f:
    py_utils = f.read()

old_payload = """'name': 'published-user-portfolio', 
                'files': [{'file': 'index.html', 'data': html_content}],"""

new_payload = """import uuid
            unique_id = uuid.uuid4().hex[:8]
            payload = {
                'name': f'portfolio-{unique_id}', 
                'files': [{'file': 'index.html', 'data': html_content}],"""

# Remove the inner `import uuid` if we want to put it at the top, or just use it inline.
# Let's just use it inline inside the try block.

py_utils = py_utils.replace(old_payload, """'name': f'portfolio-{__import__("uuid").uuid4().hex[:8]}', 
                'files': [{'file': 'index.html', 'data': html_content}],""")

with open("backend/api/views/utils.py", "w", encoding="utf-8") as f:
    f.write(py_utils)

print("Final fixes applied.")
