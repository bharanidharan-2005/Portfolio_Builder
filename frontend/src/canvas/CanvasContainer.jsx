import { DndContext, PointerSensor, closestCenter, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Undo2, Redo2, Layers, Sparkles } from 'lucide-react';
import RenderPageContent from './RenderPageContent';
import { PORTFOLIO_THEMES } from './themes';

function SortableSection({ section, children }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: section.id });
    return ( 
        <div 
            ref={setNodeRef} 
            style={{ 
                transform: CSS.Transform.toString(transform), 
                transition, 
                zIndex: isDragging ? 50 : 1 
            }}
            className={`transition-opacity duration-300 ${isDragging ? 'opacity-80 scale-[1.02] shadow-2xl' : 'opacity-100'}`}
        > 
            {children({ listeners, attributes, isDragging })} 
        </div>
    );
}

function EmptyCanvasState() {
    return (
        <div className="w-full border-2 border-dashed rounded-3xl p-8 sm:p-12 flex flex-col items-center justify-center min-h-[500px] text-center transition-all duration-500 ease-out border-slate-700/50 bg-gradient-to-b from-slate-900/40 to-black/40 backdrop-blur-xl relative z-10 group hover:border-blue-500/50">
            
            {/* Animated Floating Icon */}
            <div className="relative mb-6">
                <div className="absolute inset-0 bg-blue-500/20 blur-xl rounded-full group-hover:bg-blue-500/40 transition-all duration-700"></div>
                <div className="p-4 rounded-2xl shadow-xl bg-gradient-to-b from-slate-800 to-slate-900 border border-slate-700 relative animate-[bounce_4s_infinite_ease-in-out]">
                    <Layers className="w-8 h-8 text-blue-400" />
                </div>
            </div>
            
            <h3 className="text-xl font-extrabold mb-3 tracking-tight text-white bg-clip-text">
                Your Canvas is Empty
            </h3>
            <p className="text-sm max-w-md mb-10 leading-relaxed text-slate-400 font-medium">
                Start building your portfolio by adding layout blocks manually, or let our AI generate the entire structure from your resume.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-5 w-full max-w-xl">
                <div className="flex-1 p-6 rounded-2xl border text-left relative overflow-hidden bg-slate-900/50 border-slate-800 hover:border-blue-500/50 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(59,130,246,0.15)] group/card cursor-default">
                    <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-blue-400 to-blue-600"></div>
                    <span className="flex items-center gap-2 font-bold text-sm mb-2 text-blue-400">
                        <span className="w-5 h-5 rounded-full bg-blue-500/10 flex items-center justify-center text-[10px]">1</span>
                        Structure Builder
                    </span>
                    <span className="text-xs text-slate-400 leading-relaxed block group-hover/card:text-slate-300 transition-colors">
                        Click the quick insert modules in the <strong>Right Sidebar</strong> to manually snap sections (Hero, About, Projects) into place.
                    </span>
                </div>
                
                <div className="flex-1 p-6 rounded-2xl border text-left relative overflow-hidden bg-slate-900/50 border-slate-800 hover:border-fuchsia-500/50 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(217,70,239,0.15)] group/card cursor-default">
                    <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-fuchsia-400 to-fuchsia-600"></div>
                    <span className="flex items-center gap-2 font-bold text-sm mb-2 text-fuchsia-400">
                        <span className="w-5 h-5 rounded-full bg-fuchsia-500/10 flex items-center justify-center text-[10px]">2</span>
                        Auto-Generate
                    </span>
                    <span className="text-xs text-slate-400 leading-relaxed block group-hover/card:text-slate-300 transition-colors">
                        Open the <strong>Upload Resume</strong> tool in the Left Sidebar to automatically parse your data and build the layout.
                    </span>
                </div>
            </div>
        </div>
    );
}

export default function CanvasContainer({
    activePage,
    sections,
    activeSectionId,
    setActiveSectionId,
    portfolioTheme,
    globalBgImage,
    onDropSection,
    onDuplicateSection,
    onDeleteSection,
    onInlineEdit,
    themeMode,
    isPreview = false,
    onUndo,
    canUndo,
    onRedo,
    canRedo
}) {
    const currentTheme = PORTFOLIO_THEMES[portfolioTheme] || {};
    const displaySections = sections || [];

    const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

    const handleNavClick = (navLabel) => {
        if (!displaySections.length) return;
        let targetType = navLabel.toLowerCase().trim();
        if (targetType === 'projects') targetType = 'projects_grid';

        const foundSection = displaySections.find(s => (s.section_type || '').toLowerCase().trim() === targetType);
        if (foundSection) {
            if (!isPreview && setActiveSectionId) {
                setActiveSectionId(foundSection.id);
            }
            setTimeout(() => {
                const targetId = isPreview ? `preview-node-block-${foundSection.id}` : `live-node-block-${foundSection.id}`;
                const targetElement = document.getElementById(targetId);
                if (targetElement) {
                    targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            }, 50);
        }
    };

    const handleDragEnd = ({ active, over }) => {
        if (over && active.id !== over.id && onDropSection) {
            onDropSection(active.id, over.id);
        }
    };

    return ( 
        <div className="w-full flex flex-col items-center relative animate-in fade-in duration-500"> 

            {/* Main Outer Container */}
            <div className={`dark relative w-full shadow-2xl rounded-[2rem] min-h-[700px] transition-all duration-500 ease-out border overflow-hidden [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] ${currentTheme.border || 'border-slate-800/80'} ${
                globalBgImage ? 'bg-[#0B0C10]/40 backdrop-blur-2xl' : 'bg-[#0B0C10] ' + (currentTheme.bodyBg || '')
            }`}>
                
                {/* --- STICKY HISTORY TOOLBAR --- */}
                {!isPreview && (onUndo || onRedo) && (
                    <div className="absolute top-6 right-6 z-50 pointer-events-none animate-in slide-in-from-top-4 duration-500">
                        <div className="pointer-events-auto flex items-center gap-1 p-1.5 rounded-2xl bg-slate-900/80 backdrop-blur-xl border border-slate-700/80 shadow-[0_8px_30px_rgb(0,0,0,0.4)]">
                            <button 
                                onClick={onUndo} 
                                disabled={!canUndo} 
                                className={`p-2.5 rounded-xl transition-all duration-200 ${!canUndo ? 'opacity-30 cursor-not-allowed text-slate-500' : 'text-slate-200 hover:text-white hover:bg-slate-700 active:scale-95 cursor-pointer'} `}
                                title="Undo (Ctrl+Z)"
                            >
                                <Undo2 className="w-4 h-4" />
                            </button>
                            <div className="w-px h-5 bg-slate-700/50 mx-1"></div>
                            <button 
                                onClick={onRedo} 
                                disabled={!canRedo} 
                                className={`p-2.5 rounded-xl transition-all duration-200 ${!canRedo ? 'opacity-30 cursor-not-allowed text-slate-500' : 'text-slate-200 hover:text-white hover:bg-slate-700 active:scale-95 cursor-pointer'} `}
                                title="Redo (Ctrl+Y)"
                            >
                                <Redo2 className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}
                
                {/* --- GLOBAL ROTATING PARALLAX BACKGROUND LAYER --- */}
                {globalBgImage && (
                    <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
                        <div 
                            className="absolute top-1/2 left-1/2 w-[160%] h-[160%] -translate-x-1/2 -translate-y-1/2 opacity-60 animate-[spin_150s_linear_infinite]"
                            style={{
                                backgroundImage: `url('${globalBgImage}')`,
                                backgroundSize: 'cover',
                                backgroundPosition: 'center',
                                filter: 'blur(4px)'
                            }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-[#0B0C10]/90 backdrop-blur-[2px]" />
                    </div>
                )}

                {/* --- MAIN CONTENT WRAPPER --- */}
                <div className="relative z-10 w-full p-4 sm:p-10 flex flex-col">
                    
                    {/* Navigation Header */}
                    <div className={`sticky top-0 z-40 backdrop-blur-xl bg-black/10 border-b pb-4 pt-4 -mt-4 mb-10 flex flex-col md:flex-row flex-wrap gap-4 justify-between items-center text-xs select-none border-slate-700/30 rounded-t-[1.5rem]`}>
                        <div className="flex items-center gap-2 pl-2">
                            <Sparkles className={`w-4 h-4 ${currentTheme.accentText ? '' : 'text-blue-400'}`} />
                            <span className={`font-black tracking-widest uppercase text-[10px] text-center ${currentTheme.accentText || 'text-blue-400'}`}> 
                                {portfolioTheme ? portfolioTheme.replace('_', ' ') : 'Modern Glass'} 
                            </span> 
                        </div>
                        <div className="flex flex-wrap justify-center gap-1 md:gap-2 opacity-90 pr-2"> 
                            {["About", "Education", "Skills", "Projects", "Contact"].map((navItem) => ( 
                                <button 
                                    key={navItem} 
                                    type="button" 
                                    onClick={() => handleNavClick(navItem)} 
                                    className="bg-transparent px-3 py-1.5 rounded-full text-[11px] font-semibold transition-all whitespace-nowrap cursor-pointer text-slate-400 hover:text-white hover:bg-white/10"
                                > 
                                    {navItem} 
                                </button>
                            ))} 
                        </div> 
                    </div>

                    {isPreview ? (
                        <div key={activePage} className="space-y-8 w-full animate-in slide-in-from-bottom-4 duration-700 ease-out">
                            {displaySections.length > 0 ? (
                                displaySections.map((section) => (
                                    <div key={section.id} id={`preview-node-block-${section.id}`} className="w-full overflow-hidden">
                                        <RenderPageContent 
                                            section={section} 
                                            portfolioTheme={portfolioTheme} 
                                            sections={displaySections} 
                                            isPreview={true}
                                        />
                                    </div>
                                ))
                            ) : (
                                <EmptyCanvasState />
                            )}
                        </div>
                    ) : (
                        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                            <SortableContext items={displaySections.map(s => s.id)} strategy={verticalListSortingStrategy}>
                                <div key={activePage} className="space-y-6 w-full pb-20"> 
                                    {displaySections.length > 0 ? (
                                        displaySections.map((section) => {
                                            const isActive = section.id === activeSectionId;
                                            return ( 
                                                <SortableSection key={section.id} section={section}> 
                                                    {({ listeners, attributes, isDragging }) => ( 
                                                        <div 
                                                            id={`live-node-block-${section.id}`} 
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setActiveSectionId(section.id);
                                                            }} 
                                                            className={`relative group rounded-3xl border p-4 sm:p-6 transition-all duration-300 cursor-pointer w-full overflow-hidden ${
                                                                isActive
                                                                    ? 'border-blue-500/50 bg-blue-500/5 shadow-[0_0_30px_rgba(59,130,246,0.15)] ring-1 ring-blue-500/20'
                                                                    : globalBgImage
                                                                        ? 'border-white/5 bg-white/[0.02] hover:bg-white/[0.04] backdrop-blur-xl'
                                                                        : 'border-transparent hover:border-slate-700/50 bg-slate-900/30 hover:bg-slate-900/60'
                                                            } ${isDragging ? 'border-dashed border-blue-400 bg-blue-900/20' : ''}`}
                                                        >
                                                            {/* Floating Action Menu */}
                                                            <div 
                                                                className={`absolute -top-3 right-6 z-20 flex items-center gap-1 rounded-xl shadow-2xl p-1 text-[11px] font-bold transition-all duration-300 ease-out bg-slate-800/90 backdrop-blur-md border border-slate-700 text-slate-300 ${
                                                                    isActive ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0'
                                                                }`} 
                                                                onClick={(e) => e.stopPropagation()}
                                                            >
                                                                <button type="button" {...listeners} {...attributes} className="cursor-grab hover:bg-slate-700 px-2 py-1 rounded-lg transition-colors hover:text-white" title="Drag to reorder"> ⋮⋮ </button> 
                                                                <div className="w-px h-3 bg-slate-600"></div>
                                                                <button type="button" onClick={() => onDuplicateSection && onDuplicateSection(section.id)} className="cursor-pointer hover:bg-slate-700 px-2 py-1 rounded-lg transition-colors hover:text-blue-400" title="Duplicate Block"> ⧉ </button> 
                                                                <div className="w-px h-3 bg-slate-600"></div>
                                                                <button type="button" onClick={() => onDeleteSection && onDeleteSection(section.id)} className="cursor-pointer hover:bg-red-500/20 px-2 py-1 rounded-lg transition-colors hover:text-red-400" title="Delete Block"> ✕ </button> 
                                                            </div>

                                                            <div className={isActive ? '' : 'pointer-events-none'}>
                                                                <RenderPageContent 
                                                                    section={section} 
                                                                    portfolioTheme={portfolioTheme} 
                                                                    sections={displaySections} 
                                                                    onInlineEdit={onInlineEdit} 
                                                                    isPreview={false}
                                                                /> 
                                                            </div>
                                                        </div>
                                                    )} 
                                                </SortableSection>
                                            );
                                        })
                                    ) : ( 
                                        <EmptyCanvasState />
                                    )} 
                                </div> 
                            </SortableContext> 
                        </DndContext>
                    )}
                </div>
            </div> 
        </div>
    );
}