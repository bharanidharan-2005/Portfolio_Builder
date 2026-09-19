import re

# FIX 1: CanvasContainer.jsx Navigation
with open("frontend/src/canvas/CanvasContainer.jsx", "r", encoding="utf-8") as f:
    cc = f.read()

old_nav = """                    if (isPreview) {
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

new_nav = """                    const scrollContainer = isPreview 
                        ? (document.getElementById('preview-scroll-container') || window) 
                        : (document.getElementById('workspace-scroll-container') || window);

                    if (scrollContainer && scrollContainer.scrollTo) {
                        const currentScroll = scrollContainer === window ? window.scrollY : scrollContainer.scrollTop;
                        const topOffset = targetElement.getBoundingClientRect().top + currentScroll - 100;
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


# FIX 2: PreviewModal.jsx ID
with open("frontend/src/components/workspace/PreviewModal.jsx", "r", encoding="utf-8") as f:
    pm = f.read()

old_pm = """<div className="flex-1 overflow-y-auto w-full h-full relative z-10 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">"""
new_pm = """<div id="preview-scroll-container" className="flex-1 overflow-y-auto w-full h-full relative z-10 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">"""

if old_pm in pm:
    pm = pm.replace(old_pm, new_pm)
else:
    print("WARNING: Could not find old_pm in PreviewModal")

with open("frontend/src/components/workspace/PreviewModal.jsx", "w", encoding="utf-8") as f:
    f.write(pm)


# FIX 3: WorkspaceLayout.jsx Deploy Alert
with open("frontend/src/components/workspace/WorkspaceLayout.jsx", "r", encoding="utf-8") as f:
    wl = f.read()

old_wl = """    const triggerDeployment = async () => {
        setTerminalLogs(prev => [...prev, { type: "system", text: "[SYSTEM] Initiating secure backend deployment..." }]);
        const result = await deployAnimatedSite({ pages, activePage, userData });
        if (result.success) {
            setTerminalLogs(prev => [...prev, { type: "success", text: `[SUCCESS] Deployed successfully to ${result.data.projectUrl}` }]);
        } else {
            setTerminalLogs(prev => [...prev, { type: "error", text: `[ERROR] ${result.error}` }]);
        }
    };"""

new_wl = """    const triggerDeployment = async () => {
        setTerminalLogs(prev => [...prev, { type: "system", text: "[SYSTEM] Initiating secure backend deployment..." }]);
        alert("Deploying your portfolio to Vercel edge... This may take up to 20 seconds.");
        const result = await deployAnimatedSite({ pages, activePage, userData });
        if (result.success) {
            setTerminalLogs(prev => [...prev, { type: "success", text: `[SUCCESS] Deployed successfully to ${result.data.projectUrl}` }]);
            alert(`Deployed successfully! View it here: ${result.data.projectUrl}`);
            window.open(result.data.projectUrl, '_blank');
        } else {
            setTerminalLogs(prev => [...prev, { type: "error", text: `[ERROR] ${result.error}` }]);
            alert(`Deployment Failed: ${result.error}`);
        }
    };"""

if old_wl in wl:
    wl = wl.replace(old_wl, new_wl)
else:
    print("WARNING: Could not find old_wl in WorkspaceLayout")

with open("frontend/src/components/workspace/WorkspaceLayout.jsx", "w", encoding="utf-8") as f:
    f.write(wl)

print("All fixes applied.")
