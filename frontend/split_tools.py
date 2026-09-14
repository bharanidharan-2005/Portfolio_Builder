import os

file_path = 'src/components/AIRefinementPanel.jsx'
with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

def get_block(start_idx, end_idx):
    return "".join(lines[start_idx:end_idx])

theme_block = get_block(290, 325)
image_block = get_block(325, 404)
export_block = get_block(404, 439)
review_block = get_block(439, 807)
property_block = get_block(809, 1528)

# Now we will rewrite AIRefinementPanel.jsx to use these components.
# We'll just define the components in the same file to avoid passing 50 props across files for now.
# OR we can put them in separate files and pass a generic `props` object.

tools_dir = 'src/components/workspace/tools'
os.makedirs(tools_dir, exist_ok=True)

def write_tool(name, block):
    # we need to inject `props` and extract variables
    content = f"""import React from 'react';
import {{ PORTFOLIO_THEMES }} from '../../../canvas/themes';

export default function {name}(props) {{
    const {{
        localContent, setLocalContent, activeTool, currentType,
        handleFieldChange, handleArrayItemChange, themeMode, currentTheme,
        setUserData, userData, renderMobileHeader, renderActivityBar, renderPromptBar,
        panelRootClass, imagePrompt, setImagePrompt, handleGenerateImage,
        isGeneratingImage, imageTarget, setImageTarget, SECTION_LABELS, applyImageToSection,
        triggerDeploy, deploying, triggerPdfDownload, triggerHtmlWebsiteDownload,
        studioSubTab, setStudioSubTab, reviewData, loadingReview,
        selectedSection, onDeleteSection, onUndo, onRedo, saveState,
        githubUsername, setGithubUsername, handleGithubImport, isImportingGithub
    }} = props;

    return (
{block}    );
}}
"""
    # Fix the return statements inside the blocks
    content = content.replace("return ( <", "return ( <")
    
    with open(f'{tools_dir}/{name}.jsx', 'w', encoding='utf-8') as f:
        f.write(content)

write_tool('ThemeTool', theme_block.replace('if (safeToolKey.includes("THEME")) {\n            return (', '').replace('            );\n        }', ''))
write_tool('ImageTool', image_block.replace('if (safeToolKey.includes("IMAGE") || safeToolKey.includes("CUSTOMIZER")) {\n            return (', '').replace('            );\n        }', ''))
write_tool('ExportTool', export_block.replace('if (safeToolKey.includes("CODE") || safeToolKey.includes("EXPORT")) {\n            return (', '').replace('            );\n        }', ''))
write_tool('ReviewTool', review_block.replace('if (safeToolKey.includes("GENERATOR")) {\n            return (', '').replace('            );\n        }', ''))
write_tool('PropertyEditor', property_block.replace('return ( <\n        div className={panelRootClass}>', '        <div className={panelRootClass}>').replace('        </div>\n    );\n}', '        </div>\n'))

# Now rewrite AIRefinementPanel.jsx
# It should import these 5 tools and return them
new_ai_panel = "".join(lines[:290]) + """
        const toolProps = {
            localContent, setLocalContent, activeTool, currentType,
            handleFieldChange, handleArrayItemChange, themeMode, currentTheme: userData?.theme || 'modern_glass',
            setUserData, userData, renderMobileHeader, renderActivityBar, renderPromptBar,
            panelRootClass, imagePrompt, setImagePrompt, handleGenerateImage,
            isGeneratingImage, imageTarget, setImageTarget, SECTION_LABELS, applyImageToSection,
            triggerDeploy, deploying, triggerPdfDownload, triggerHtmlWebsiteDownload,
            studioSubTab, setStudioSubTab, reviewData, loadingReview,
            selectedSection, onDeleteSection, onUndo, onRedo, saveState,
            githubUsername, setGithubUsername, handleGithubImport, isImportingGithub
        };

        if (safeToolKey.includes("THEME")) return <ThemeTool {...toolProps} />;
        if (safeToolKey.includes("IMAGE") || safeToolKey.includes("CUSTOMIZER")) return <ImageTool {...toolProps} />;
        if (safeToolKey.includes("CODE") || safeToolKey.includes("EXPORT")) return <ExportTool {...toolProps} />;
        if (safeToolKey.includes("GENERATOR")) return <ReviewTool {...toolProps} />;
        
        return <PropertyEditor {...toolProps} />;
}
"""

imports = """import ThemeTool from './workspace/tools/ThemeTool';
import ImageTool from './workspace/tools/ImageTool';
import ExportTool from './workspace/tools/ExportTool';
import ReviewTool from './workspace/tools/ReviewTool';
import PropertyEditor from './workspace/tools/PropertyEditor';
"""

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(imports + new_ai_panel)

print("Split completed successfully!")
