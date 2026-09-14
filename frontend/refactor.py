import sys

file_path = 'src/components/workspace/WorkspaceLayout.jsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

import1 = 'import HelpModal from "./HelpModal.jsx";\nimport PreviewModal from "./PreviewModal.jsx";\n'
content = content.replace('import SettingsModal from "./SettingsModal.jsx";', 'import SettingsModal from "./SettingsModal.jsx";\n' + import1)

preview_start = content.find('            {/* --- UPGRADED FULL-SCREEN PREVIEW MODAL (ONLY IN EDITOR MODE) --- */}')
preview_end = content.find('            {/* HIDE HELP & SETTINGS MODALS IN PUBLIC PREVIEW */}')

if preview_start != -1 and preview_end != -1:
    replacement = '''            {!isPublicPreview && (
                <PreviewModal
                    isOpen={isInternalPreviewOpen}
                    onClose={() => setIsInternalPreviewOpen(false)}
                    isLight={isLight}
                    previewViewport={previewViewport}
                    setPreviewViewport={setPreviewViewport}
                    isLandscape={isLandscape}
                    setIsLandscape={setIsLandscape}
                    currentTheme={currentTheme}
                    userData={userData}
                    setUserData={setUserData}
                    activePage={activePage}
                    sections={sections}
                    themeMode={themeMode}
                    globalBg={globalBg}
                    setTerminalLogs={setTerminalLogs}
                />
            )}

'''
    content = content[:preview_start] + replacement + content[preview_end:]

help_start = content.find('            {/* HIDE HELP & SETTINGS MODALS IN PUBLIC PREVIEW */}')
help_end = content.find('            {!isPublicPreview && (\\n                <SettingsModal')
if help_end == -1:
    help_end = content.find('            {!isPublicPreview && (\n                <SettingsModal')

if help_start != -1 and help_end != -1:
    replacement = '''            {!isPublicPreview && (
                <HelpModal
                    isOpen={isHelpModalOpen}
                    onClose={() => setIsHelpModalOpen(false)}
                    isLight={isLight}
                />
            )}

'''
    content = content[:help_start] + replacement + content[help_end:]
else:
    print("Could not find HelpModal boundaries.")

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print('Done!')
