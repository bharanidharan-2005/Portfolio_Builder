const fs = require('fs');
const path = require('path');

const sidebarPath = path.join(__dirname, 'src', 'components', 'layout', 'RightSidebar.jsx');
const toolsDir = path.join(__dirname, 'src', 'components', 'tools');
if (!fs.existsSync(toolsDir)) fs.mkdirSync(toolsDir, { recursive: true });

const content = fs.readFileSync(sidebarPath, 'utf8');

const components = {
    'renderContentGenerator': 'ContentGeneratorTool.jsx',
    'renderRoleMatcher': 'RoleMatcherTool.jsx',
    'renderImpactQuantifier': 'ImpactQuantifierTool.jsx',
    'renderPaletteStudio': 'PaletteStudioTool.jsx',
    'renderImageCustomizer': 'ImageCustomizerTool.jsx',
    'renderSeoAndPitch': 'SeoPitchTool.jsx',
    'renderStructureBuilder': 'StructureBuilderTool.jsx',
    'renderCodeExport': 'CodeExportTool.jsx',
    'renderActivityLog': 'ActivityLogTool.jsx'
};

const extractBlock = (text, startRegex) => {
    const match = text.match(startRegex);
    if (!match) return null;
    let startIdx = match.index;
    let openBrackets = 0;
    let endIdx = -1;
    let started = false;

    for (let i = startIdx; i < text.length; i++) {
        if (text[i] === '(' || text[i] === '{') {
            openBrackets++;
            started = true;
        }
        if (text[i] === ')' || text[i] === '}') {
            openBrackets--;
        }
        if (started && openBrackets === 0) {
            endIdx = i + 1;
            break;
        }
    }
    
    if (text[endIdx] === ';') endIdx++;
    return text.substring(startIdx, endIdx);
};

for (const [funcName, fileName] of Object.entries(components)) {
    console.log(`Extracting ${funcName}...`);
    // Find the arrow function body that starts with `() => (`
    let regex = new RegExp(`const ${funcName} = \\(\\) => \\([\\s\\S]*?\\);`);
    let blockMatch = content.match(regex);
    
    if (!blockMatch) {
        // Fallback for functions like renderActivityLog that might not end precisely with );
        console.log(`Fallback regex for ${funcName}`);
        let fbRegex = new RegExp(`const ${funcName} = \\(\\).*?(?:=>)\\s*\\(`);
        let block = extractBlock(content, fbRegex);
        if (!block) {
            console.log(`Failed to extract ${funcName}`);
            continue;
        }
        blockMatch = [block];
    }
    
    let block = blockMatch[0];
    
    let jsxBody = block.replace(new RegExp(`const ${funcName} = \\(\\) => \\(`), '').replace(/\);?$/, '');

    let fileContent = `import React from 'react';
import { Sparkles, User, GraduationCap, Zap, Rocket, Mail, Edit3, Globe, Loader2, Activity, Link2, ShieldCheck, Crosshair, TrendingUp, Palette, CheckCircle2, Image as ImageIcon, Send, Copy, Share2, Download, LayoutTemplate, PenTool } from 'lucide-react';
import { API } from '../../../api';
import { PORTFOLIO_THEMES, PORTFOLIO_FONTS } from '../../../canvas/themes';

export default function ${fileName.replace('.jsx', '')}(props) {
    const { 
        isLight, themeMode, activeTool, terminalLogs, setTerminalLogs, 
        sections, onUpdateSectionContent, onUpdateGlobalBg, onAddSection, onDeploy, onExportZip,
        activeTheme, onThemeChange, activeFont, onUpdateFont,
        
        genTab, setGenTab, selectedAiSection, setSelectedAiSection, refinePrompt, setRefinePrompt,
        vibeInput, setVibeInput, selectedTargetSection, setSelectedTargetSection, imagePrompt, setImagePrompt,
        jdInput, setJdInput, matchScore, setMatchScore, missingKeywords, setMissingKeywords,
        pitchTab, setPitchTab, pitchTarget, setPitchTarget, generatedPitchText, setGeneratedPitchText, seoData, setSeoData,
        imageTab, setImageTab, generatedImageUrl, setGeneratedImageUrl, uploadedImagePreview, setUploadedImagePreview,
        isProcessing, setIsProcessing, currentCompleteness,
        largeLogContainerRef,
        
        handleGenerateSection, handleRefineSection, executeAiAction, handleAnalyzeJD, handleInjectKeywords, handleImpactAction, handleGenerateVibe, handleApplyImage, handleGenerateSEO, handleGeneratePitch
    } = props;

    return (
${jsxBody}
    );
}
`;
    fs.writeFileSync(path.join(toolsDir, fileName), fileContent);
    console.log(`Saved ${fileName}`);
}

console.log("Extraction complete.");
