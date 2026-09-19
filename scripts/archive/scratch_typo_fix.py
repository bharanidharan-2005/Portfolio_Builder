import re

# 1. Update WorkspaceLayout.jsx to pass globalFont to PreviewModal
with open("frontend/src/components/workspace/WorkspaceLayout.jsx", "r", encoding="utf-8") as f:
    wl = f.read()

old_pm_tag = """                    themeMode={themeMode}
                    globalBg={globalBg}
                    setTerminalLogs={setTerminalLogs}
                />
            )}"""

new_pm_tag = """                    themeMode={themeMode}
                    globalBg={globalBg}
                    globalFont={globalFont}
                    setTerminalLogs={setTerminalLogs}
                />
            )}"""

if old_pm_tag in wl:
    wl = wl.replace(old_pm_tag, new_pm_tag)
else:
    print("WARNING: old_pm_tag not found in WorkspaceLayout.jsx")

with open("frontend/src/components/workspace/WorkspaceLayout.jsx", "w", encoding="utf-8") as f:
    f.write(wl)

# 2. Update PreviewModal.jsx to accept globalFont and pass to CanvasContainer
with open("frontend/src/components/workspace/PreviewModal.jsx", "r", encoding="utf-8") as f:
    pm = f.read()

old_props = """    sections,
    themeMode,
    globalBg,
    setTerminalLogs
}) {"""

new_props = """    sections,
    themeMode,
    globalBg,
    globalFont,
    setTerminalLogs
}) {"""

if old_props in pm:
    pm = pm.replace(old_props, new_props)
else:
    print("WARNING: old_props not found in PreviewModal.jsx")

old_cc = """                                themeMode={themeMode}
                                globalBgImage={globalBg} 
                                isPreview={true} 
                            />"""

new_cc = """                                themeMode={themeMode}
                                globalBgImage={globalBg} 
                                globalFont={globalFont}
                                isPreview={true} 
                            />"""

if old_cc in pm:
    pm = pm.replace(old_cc, new_cc)
else:
    print("WARNING: old_cc not found in PreviewModal.jsx")

with open("frontend/src/components/workspace/PreviewModal.jsx", "w", encoding="utf-8") as f:
    f.write(pm)

# 3. Update exportWebsiteHtml.js to apply the globalFont
with open("frontend/src/utils/exportWebsiteHtml.js", "r", encoding="utf-8") as f:
    ex = f.read()

# Add PORTFOLIO_FONTS import
if "PORTFOLIO_FONTS" not in ex:
    ex = ex.replace("import { PORTFOLIO_THEMES } from '../canvas/themes';", "import { PORTFOLIO_THEMES, PORTFOLIO_FONTS } from '../canvas/themes';")

old_html_gen = """    const fullHtmlDocument = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <script src="https://cdn.tailwindcss.com"></script>
    <title>Portfolio Site</title>
</head>
<body class="${theme.bodyBg} min-h-screen p-6 md:p-12 font-sans selection:bg-blue-500/30">
    <main class="max-w-3xl mx-auto">${sectionsHtml}</main>
</body>
</html>`;"""

new_html_gen = """    const fontId = (userData && userData.globalFont) || 'font-inter';
    const fontObj = PORTFOLIO_FONTS.find(f => f.id === fontId) || PORTFOLIO_FONTS.find(f => f.id === 'font-inter');
    const fontFamilyStyle = fontObj ? fontObj.style.fontFamily : "'Inter', sans-serif";

    const fullHtmlDocument = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <!-- Google Fonts for Portfolio Typography -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Archivo:wght@400;500;600;700&family=Bebas+Neue&family=DM+Sans:wght@400;500;600;700&family=Fira+Code:wght@400;500;600;700&family=Geist:wght@400;500;600;700&family=IBM+Plex+Sans:wght@400;500;600;700&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&family=Lora:wght@400;500;600;700&family=Manrope:wght@400;500;600;700&family=Montserrat:wght@400;500;600;700&family=Oswald:wght@400;500;600;700&family=Outfit:wght@400;500;600;700&family=Playfair+Display:wght@400;700&family=Plus+Jakarta+Sans:wght@400;500;600;700&family=Poppins:wght@400;500;600;700&family=Raleway:wght@400;500;600;700&family=Roboto:wght@400;500;700&family=Sora:wght@400;500;600;700&family=Space+Grotesk:wght@400;500;600;700&family=Space+Mono:wght@400;700&family=Syne:wght@400;500;600;700&family=Urbanist:wght@400;500;600;700&display=swap" rel="stylesheet">
    <script src="https://cdn.tailwindcss.com"></script>
    <title>Portfolio Site</title>
</head>
<body class="${theme.bodyBg} min-h-screen p-6 md:p-12 selection:bg-blue-500/30" style="font-family: ${fontFamilyStyle};">
    <main class="max-w-3xl mx-auto">${sectionsHtml}</main>
</body>
</html>`;"""

if old_html_gen in ex:
    ex = ex.replace(old_html_gen, new_html_gen)
else:
    print("WARNING: old_html_gen not found in exportWebsiteHtml.js")

with open("frontend/src/utils/exportWebsiteHtml.js", "w", encoding="utf-8") as f:
    f.write(ex)

print("Typography sync fixes applied.")
