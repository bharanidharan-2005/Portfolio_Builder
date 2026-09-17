import os
import re

SIDEBAR_PATH = r"c:\Users\M.BHARANIDHARAN\OneDrive\Documents\Portfolio_Builder\frontend\src\components\layout\RightSidebar.jsx"

def modify():
    with open(SIDEBAR_PATH, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Add Imports
    imports = """import ContentGeneratorTool from '../tools/ContentGeneratorTool';
import RoleMatcherTool from '../tools/RoleMatcherTool';
import ImpactQuantifierTool from '../tools/ImpactQuantifierTool';
import PaletteStudioTool from '../tools/PaletteStudioTool';
import ImageCustomizerTool from '../tools/ImageCustomizerTool';
import SeoPitchTool from '../tools/SeoPitchTool';
import StructureBuilderTool from '../tools/StructureBuilderTool';
import CodeExportTool from '../tools/CodeExportTool';
import ActivityLogTool from '../tools/ActivityLogTool';
"""
    # Insert after the last import
    last_import_idx = content.rfind("import ")
    end_of_last_import = content.find("\n", last_import_idx) + 1
    content = content[:end_of_last_import] + imports + content[end_of_last_import:]

    # 2. Remove all renderXXX functions
    render_funcs = [
        "renderContentGenerator", "renderRoleMatcher", "renderImpactQuantifier",
        "renderPaletteStudio", "renderImageCustomizer", "renderSeoAndPitch",
        "renderCodeExport", "renderActivityLog"
    ]
    
    # We will just strip them using regex
    for func in render_funcs:
        pattern = re.compile(rf"const {func} = \(\) => \([\s\S]*?\);\n", re.MULTILINE)
        content = pattern.sub("", content)

    # For renderStructureBuilder (uses {})
    pattern = re.compile(r"const renderStructureBuilder = \(\) => \{[\s\S]*?return \([\s\S]*?\);\n    \};\n", re.MULTILINE)
    content = pattern.sub("", content)

    # 3. Add toolProps just before the return statement of RightSidebar
    # Find the main return (
    main_return_idx = content.rfind("    return (\n        <div className={`h-full w-full flex flex-col")
    if main_return_idx == -1:
        print("Could not find main return")
        return

    tool_props_str = """
    const toolProps = {
        isLight, themeMode, activeTool, terminalLogs, setTerminalLogs,
        sections, onUpdateSectionContent, onUpdateGlobalBg, onAddSection, onDeploy, onExportZip,
        activeTheme, onThemeChange, activeFont, onUpdateFont,
        genTab, setGenTab, selectedAiSection, setSelectedAiSection, refinePrompt, setRefinePrompt,
        vibeInput, setVibeInput, selectedTargetSection, setSelectedTargetSection, imagePrompt, setImagePrompt,
        jdInput, setJdInput, matchScore, setMatchScore, missingKeywords, setMissingKeywords,
        pitchTab, setPitchTab, pitchTarget, setPitchTarget, generatedPitchText, setGeneratedPitchText, seoData, setSeoData,
        imageTab, setImageTab, generatedImageUrl, setGeneratedImageUrl, uploadedImagePreview, setUploadedImagePreview,
        isProcessing, setIsProcessing, currentCompleteness,
        largeLogContainerRef, activeSectionId,
        handleGenerateSection, handleRefineSection, executeAiAction, handleAnalyzeJD, handleInjectKeywords, handleImpactAction, handleGenerateVibe, handleApplyImage, handleGenerateSEO, handleGeneratePitch
    };

"""
    content = content[:main_return_idx] + tool_props_str + content[main_return_idx:]

    # 4. Replace the old render function calls with the new components
    replacements = {
        "{activeTool === \"generator\" && renderContentGenerator()}": "{activeTool === \"generator\" && <ContentGeneratorTool {...toolProps} />}",
        "{activeTool === \"matcher\" && renderRoleMatcher()}": "{activeTool === \"matcher\" && <RoleMatcherTool {...toolProps} />}",
        "{activeTool === \"impact\" && renderImpactQuantifier()}": "{activeTool === \"impact\" && <ImpactQuantifierTool {...toolProps} />}",
        "{activeTool === \"palette\" && renderPaletteStudio()}": "{activeTool === \"palette\" && <PaletteStudioTool {...toolProps} />}",
        "{activeTool === \"image\" && renderImageCustomizer()}": "{activeTool === \"image\" && <ImageCustomizerTool {...toolProps} />}",
        "{activeTool === \"seo_pitch\" && renderSeoAndPitch()}": "{activeTool === \"seo_pitch\" && <SeoPitchTool {...toolProps} />}",
        "{activeTool === \"export\" && renderCodeExport()}": "{activeTool === \"export\" && <CodeExportTool {...toolProps} />}",
        "{activeTool === \"activity_log\" && renderActivityLog()}": "{activeTool === \"activity_log\" && <ActivityLogTool {...toolProps} />}",
        "{(activeTool === \"structure\" || (!activeTool && activeTool !== \"activity_log\")) && renderStructureBuilder()}": "{(activeTool === \"structure\" || (!activeTool && activeTool !== \"activity_log\")) && <StructureBuilderTool {...toolProps} />}"
    }

    for old, new in replacements.items():
        content = content.replace(old, new)

    # 5. Remove the `// --- RENDERERS ---` comment if it exists
    content = content.replace("    // --- RENDERERS ---\n", "")

    with open(SIDEBAR_PATH, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print("RightSidebar successfully modified!")

if __name__ == "__main__":
    modify()
