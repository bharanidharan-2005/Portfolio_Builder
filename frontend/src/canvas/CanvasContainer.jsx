import React, { useState, useEffect, useRef, useMemo } from 'react';
import { DndContext, PointerSensor, closestCenter, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy, horizontalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Undo2, Redo2, Layers, Sparkles, Menu, X, FileUp, Plus, GripVertical, Copy, Trash2 } from 'lucide-react';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { ResumePDF } from '../components/ResumePDF';
import RenderPageContent from './RenderPageContent';
import { PORTFOLIO_THEMES, PORTFOLIO_FONTS } from './themes';
import { notify } from '../toast';
import PortfolioSkeleton from '../components/portfolio/PortfolioSkeleton';


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

function SortableNavItem({ item, onClick, currentTheme, isActive }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });
    return (
        <button
            ref={setNodeRef}
            type="button"
            onClick={() => onClick(item.label)}
            {...attributes}
            {...listeners}
            className={`relative px-3 py-1.5 rounded-lg text-sm font-bold transition-all duration-300 whitespace-nowrap cursor-pointer ${
                isDragging ? 'cursor-grabbing opacity-50 scale-105 z-50' : 'cursor-grab'
            } ${
                isActive 
                    ? `${currentTheme.accentText || 'text-blue-400'} bg-white/10 shadow-xs` 
                    : `${currentTheme.textSecondary || 'text-slate-400'} hover:bg-white/5 hover:text-white`
            }`}
            style={{
                color: 'inherit',
                transform: CSS.Transform.toString(transform),
                transition
            }}
        >
            <span className={`transition-opacity ${isActive ? (currentTheme.accentText || 'text-blue-400') : (currentTheme.textPrimary || 'text-white')}`}>
                {item.label}
            </span>
            {isActive && (
                <span className={`absolute bottom-0 left-2.5 right-2.5 h-[2px] rounded-full ${currentTheme.accentBg || 'bg-blue-500'}`} />
            )}
        </button>
    );
}

function EmptyCanvasState({ onAddSection }) {
    const handleTriggerResume = () => {
        const fileInput = document.querySelector('input[type="file"][accept*=".pdf"]');
        if (fileInput) {
            fileInput.click();
        } else {
            notify("Select 'Upload Resume' from the Left Sidebar", "info");
        }
    };

    const handleTriggerStructure = () => {
        if (onAddSection) {
            onAddSection('hero');
        } else {
            notify("Choose a module from the Right Sidebar", "info");
        }
    };

    return (
        <div className="w-full max-w-xl mx-auto my-12 border border-slate-800/80 rounded-2xl p-8 sm:p-10 flex flex-col items-center justify-center text-center transition-all duration-300 bg-slate-900/60 backdrop-blur-xl relative z-10 shadow-2xl">
            {/* Subtle glow badge */}
            <div className="relative mb-5">
                <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shadow-[0_0_24px_rgba(37,99,235,0.25)]">
                    <Sparkles className="w-6 h-6 text-blue-400" />
                </div>
            </div>
            
            <h3 className="text-lg sm:text-xl font-bold mb-2 tracking-tight text-white font-sora">
                Start Building Your Portfolio
            </h3>
            <p className="text-xs sm:text-sm max-w-md mb-8 leading-relaxed text-slate-400">
                Let AI auto-generate your complete portfolio layout from your resume, or build it block by block using structural modules.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full max-w-md">
                <button
                    type="button"
                    onClick={handleTriggerResume}
                    className="w-full sm:flex-1 px-4 py-2.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white transition-all shadow-md shadow-blue-600/25 flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
                >
                    <FileUp className="w-4 h-4" />
                    <span>Generate from Resume</span>
                </button>
                <button
                    type="button"
                    onClick={handleTriggerStructure}
                    className="w-full sm:flex-1 px-4 py-2.5 rounded-lg text-xs font-semibold bg-slate-800/90 hover:bg-slate-700/90 text-slate-200 border border-slate-700/80 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
                >
                    <Plus className="w-4 h-4 text-blue-400" />
                    <span>Add Hero Block</span>
                </button>
            </div>
        </div>
    );
}

function CanvasContainer({
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
    globalFont = 'font-inter',
    onUndo,
    canUndo,
    onRedo,
    canRedo,
    activeHighlightSection,
    aiSuggestionPreview,
    onAddSection,
    isLoading = false
}) {
    const currentTheme = PORTFOLIO_THEMES[portfolioTheme] || {};
    const currentFontObj = PORTFOLIO_FONTS.find(f => f.id === globalFont) || PORTFOLIO_FONTS[0];
    const displaySections = sections || [];
    const pdfDocument = useMemo(() => isPreview ? <ResumePDF sections={sections} /> : null, [sections, isPreview]);

    const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [activeNavSection, setActiveNavSection] = useState('Home');

    // Derive dynamic nav items from displaySections
    const dynamicNavItems = useMemo(() => {
        if (!displaySections || displaySections.length === 0) return [];
        const ignoredTypes = ['footer', 'resume', 'banner'];
        
        const items = [];
        const seenLabels = new Set();
        
        // Put Home first if hero exists
        const heroSection = displaySections.find(s => (s.section_type || '').toLowerCase().trim() === 'hero');
        if (heroSection) {
            seenLabels.add('home');
            items.push({
                id: `nav-${heroSection.id}`,
                sectionId: heroSection.id,
                label: 'Home',
                type: 'hero'
            });
        }

        displaySections.forEach(s => {
            const rawType = (s.section_type || '').toLowerCase().trim();
            if (rawType && !ignoredTypes.includes(rawType) && rawType !== 'hero') {
                let label = rawType;
                if (label === 'projects_grid') label = 'projects';
                
                const formattedLabel = label.charAt(0).toUpperCase() + label.slice(1);
                if (!seenLabels.has(label)) {
                    seenLabels.add(label);
                    items.push({
                        id: `nav-${s.id}`,
                        sectionId: s.id,
                        label: formattedLabel,
                        type: rawType
                    });
                }
            }
        });
            
        return items;
    }, [displaySections]);

    // Handle Nav link click with smooth scroll offset and reduced motion check
    const handleNavClick = (navLabel) => {
        if (!displaySections.length) return;
        setActiveNavSection(navLabel);

        let targetType = navLabel.toLowerCase().trim();
        if (targetType === 'home') targetType = 'hero';
        if (targetType === 'projects') targetType = 'projects_grid';

        const foundSection = displaySections.find(s => {
            const stype = (s.section_type || '').toLowerCase().trim();
            return stype === targetType || 
                   (targetType === 'projects_grid' && stype === 'projects') ||
                   (targetType === 'projects' && stype === 'projects_grid') ||
                   (targetType === 'hero' && stype === 'home');
        });

        if (foundSection) {
            if (!isPreview && setActiveSectionId) {
                setActiveSectionId(foundSection.id);
            }
            setTimeout(() => {
                const targetId = isPreview ? `preview-node-block-${foundSection.id}` : `live-node-block-${foundSection.id}`;
                const targetElement = document.getElementById(targetId);
                
                if (targetElement) {
                    const previewContainer = document.getElementById('preview-scroll-container');
                    const workspaceContainer = document.getElementById('workspace-scroll-container');
                    const prefersReducedMotion = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
                    const scrollBehavior = prefersReducedMotion ? 'auto' : 'smooth';
                    
                    if (isPreview && previewContainer) {
                        const containerRect = previewContainer.getBoundingClientRect();
                        const targetRect = targetElement.getBoundingClientRect();
                        previewContainer.scrollTo({
                            top: previewContainer.scrollTop + (targetRect.top - containerRect.top) - 80,
                            behavior: scrollBehavior
                        });
                    } else if (workspaceContainer) {
                        const containerRect = workspaceContainer.getBoundingClientRect();
                        const targetRect = targetElement.getBoundingClientRect();
                        workspaceContainer.scrollTo({
                            top: workspaceContainer.scrollTop + (targetRect.top - containerRect.top) - 80,
                            behavior: scrollBehavior
                        });
                    } else {
                        const topPos = targetElement.getBoundingClientRect().top + window.scrollY;
                        window.scrollTo({
                            top: topPos - 80,
                            behavior: scrollBehavior
                        });
                    }
                }
            }, 50);
        }
    };

    // Scroll-Spy: Automatically highlight active section on manual scrolling
    useEffect(() => {
        const handleScroll = () => {
            if (!displaySections || displaySections.length === 0 || dynamicNavItems.length === 0) return;

            const previewContainer = document.getElementById('preview-scroll-container');
            const workspaceContainer = document.getElementById('workspace-scroll-container');
            const container = isPreview 
                ? (previewContainer || window) 
                : (workspaceContainer || window);

            const isWin = container === window;
            const scrollTop = isWin ? window.scrollY : container.scrollTop;
            const scrollHeight = isWin ? document.documentElement.scrollHeight : container.scrollHeight;
            const clientHeight = isWin ? window.innerHeight : container.clientHeight;

            // If at the very top, activate Home or the first item
            if (scrollTop < 80) {
                const firstItem = dynamicNavItems[0];
                if (firstItem && activeNavSection !== firstItem.label) {
                    setActiveNavSection(firstItem.label);
                }
                return;
            }

            // If at the very bottom, activate the last item
            if (scrollTop + clientHeight >= scrollHeight - 60) {
                const lastItem = dynamicNavItems[dynamicNavItems.length - 1];
                if (lastItem && activeNavSection !== lastItem.label) {
                    setActiveNavSection(lastItem.label);
                }
                return;
            }

            // Find the active section based on top offset
            let currentActive = null;
            for (const navItem of dynamicNavItems) {
                const targetId = isPreview 
                    ? `preview-node-block-${navItem.sectionId}` 
                    : `live-node-block-${navItem.sectionId}`;
                const el = document.getElementById(targetId);
                if (el) {
                    const rect = el.getBoundingClientRect();
                    const containerTop = isWin ? 0 : container.getBoundingClientRect().top;
                    const relativeTop = rect.top - containerTop;
                    
                    if (relativeTop <= 160 && rect.bottom - containerTop > 100) {
                        currentActive = navItem.label;
                    }
                }
            }

            if (currentActive && currentActive !== activeNavSection) {
                setActiveNavSection(currentActive);
            }
        };

        const previewContainer = document.getElementById('preview-scroll-container');
        const workspaceContainer = document.getElementById('workspace-scroll-container');

        window.addEventListener('scroll', handleScroll, { passive: true });
        if (previewContainer) previewContainer.addEventListener('scroll', handleScroll, { passive: true });
        if (workspaceContainer) workspaceContainer.addEventListener('scroll', handleScroll, { passive: true });

        return () => {
            window.removeEventListener('scroll', handleScroll);
            if (previewContainer) previewContainer.removeEventListener('scroll', handleScroll);
            if (workspaceContainer) workspaceContainer.removeEventListener('scroll', handleScroll);
        };
    }, [displaySections, dynamicNavItems, isPreview, activeNavSection]);

    // Close mobile menu on Escape key
    useEffect(() => {
        if (!isMobileMenuOpen) return;
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                setIsMobileMenuOpen(false);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isMobileMenuOpen]);

    // Auto-scroll when activeHighlightSection changes
    useEffect(() => {
        if (activeHighlightSection) {
            handleNavClick(activeHighlightSection);
        }
    }, [activeHighlightSection]);

    const handleDragEnd = ({ active, over }) => {
        if (over && active.id !== over.id && onDropSection) {
            onDropSection(active.id, over.id);
        }
    };

    const handleNavDragEnd = ({ active, over }) => {
        if (over && active.id !== over.id && onDropSection) {
            const activeId = String(active.id).replace('nav-', '');
            const overId = String(over.id).replace('nav-', '');
            onDropSection(activeId, overId);
        }
    };

    const heroSectionData = displaySections.find(s => (s.section_type || '').toLowerCase().trim() === 'hero');
    const heroName = heroSectionData?.content_data?.heading || 'BHARANIDHARAN MARIAPPAN';
    const initials = heroName.split(' ').filter(Boolean).map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'BM';

    return ( 
        <div className="w-full min-w-0 max-w-full flex flex-col items-center relative animate-in fade-in duration-500"> 

            {/* Main Outer Container: when isPreview or !isPreview, overflow-visible enables position: sticky on browser/workspace scroll */}
            <div className={`dark relative w-full min-w-0 max-w-full min-h-[700px] transition-all duration-500 ease-out ${
                !isPreview ? `shadow-2xl rounded-[2rem] border ${currentTheme.border || 'border-slate-800/80'}` : 'min-h-screen overflow-visible'
            } bg-[#080D1C] [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]`} style={{ ...currentFontObj.style }}>
                
                {/* --- PREMIUM GLOBAL BACKGROUND --- */}
                <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden rounded-[2rem]">
                    <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-900/20 blur-[120px]"></div>
                    <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-violet-900/20 blur-[120px]"></div>
                    <div className="absolute top-[40%] right-[20%] w-[30%] h-[30%] rounded-full bg-indigo-900/10 blur-[100px]"></div>
                </div>

                {/* --- FULL WIDTH NAVIGATION NAVBAR (Persistent Sticky on Desktop and Mobile) --- */}
                <div className={`sticky top-0 z-50 w-full backdrop-blur-2xl ${currentTheme.cardBg || 'bg-black/40'} border-b ${currentTheme.border || 'border-slate-700/30'} shadow-lg transition-all duration-300 ${!isPreview ? 'rounded-t-[2rem]' : ''}`}>
                    <div className="w-full px-3 sm:px-6 py-2.5 sm:py-4 flex items-center justify-between gap-2 sm:gap-3">
                        {/* Logo / Initials */}
                        <div className="flex items-center gap-2 sm:gap-3 shrink-0 cursor-pointer" onClick={() => handleNavClick('Home')}>
                            <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center font-black text-sm sm:text-lg shadow-inner ${currentTheme.accentBg || 'bg-blue-600'} text-white`}>
                                {initials}
                            </div>
                            <span className={`font-black tracking-widest uppercase hidden sm:block text-sm md:text-base leading-none translate-y-[1px] ${currentTheme.accentText || 'text-blue-400'}`}> 
                                {heroName.split(' ')[0]} 
                            </span> 
                        </div>

                        {/* Navigation Links */}
                        <div className="flex items-center justify-center gap-1 xl:gap-2.5 opacity-90 hidden xl:flex overflow-x-auto custom-scrollbar"> 
                            {!isPreview ? (
                                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleNavDragEnd}>
                                    <SortableContext items={dynamicNavItems.map(item => item.id)} strategy={horizontalListSortingStrategy}>
                                        {dynamicNavItems.map((navItem) => {
                                            const isActive = activeNavSection.toLowerCase() === navItem.label.toLowerCase();
                                            return (
                                                <SortableNavItem 
                                                    key={navItem.id} 
                                                    item={navItem} 
                                                    onClick={handleNavClick} 
                                                    currentTheme={currentTheme}
                                                    isActive={isActive}
                                                />
                                            );
                                        })}
                                    </SortableContext>
                                </DndContext>
                            ) : (
                                dynamicNavItems.map((navItem) => {
                                    const isActive = activeNavSection.toLowerCase() === navItem.label.toLowerCase();
                                    return ( 
                                        <button 
                                            key={navItem.id} 
                                            type="button" 
                                            onClick={() => handleNavClick(navItem.label)} 
                                            className={`relative px-3 py-1.5 rounded-lg text-xs xl:text-sm font-bold transition-all duration-300 whitespace-nowrap cursor-pointer ${
                                                isActive 
                                                    ? `${currentTheme.accentText || 'text-blue-400'} bg-white/10 shadow-xs` 
                                                    : `${currentTheme.textSecondary || 'text-slate-400'} hover:bg-white/5 hover:text-white`
                                            }`}
                                        > 
                                            <span className={`transition-opacity ${isActive ? (currentTheme.accentText || 'text-blue-400') : (currentTheme.textPrimary || 'text-white')}`}>
                                                {navItem.label}
                                            </span>
                                            {isActive && (
                                                <span className={`absolute bottom-0 left-2.5 right-2.5 h-[2px] rounded-full ${currentTheme.accentBg || 'bg-blue-500'}`} />
                                            )}
                                        </button>
                                    );
                                })
                            )}
                        </div>

                        {/* Right Side - Resume & Mobile Toggle */}
                        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
                            {isPreview ? (
                                <PDFDownloadLink
                                    document={pdfDocument}
                                    fileName="Portfolio_Resume.pdf"
                                    className={`px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs font-bold transition-all shadow-md hover:shadow-lg ${currentTheme.accentBg || 'bg-blue-600'} text-white flex items-center gap-1.5 whitespace-nowrap`}
                                >
                                    {({ loading }) => (loading ? 'Preparing...' : <><span className="hidden sm:inline">Download </span>Resume</>)}
                                </PDFDownloadLink>
                            ) : (
                                <button 
                                    onClick={() => notify("Please test Resume Download in the Live Preview.", "info")}
                                    className={`px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs font-bold transition-all shadow-md hover:shadow-lg ${currentTheme.accentBg || 'bg-blue-600'} text-white flex items-center gap-1.5 whitespace-nowrap cursor-pointer`}
                                >
                                    <span className="hidden sm:inline">Download </span>Resume
                                </button>
                            )}

                            {/* Mobile / Compact Menu Toggle Button */}
                            <button 
                                className="xl:hidden p-2 text-slate-300 hover:text-white transition-colors cursor-pointer rounded-lg hover:bg-white/10 min-w-[38px] min-h-[38px] flex items-center justify-center"
                                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                                aria-label="Toggle navigation menu"
                                aria-expanded={isMobileMenuOpen}
                            >
                                {isMobileMenuOpen ? <X className="w-5 h-5 sm:w-6 sm:h-6" /> : <Menu className="w-5 h-5 sm:w-6 sm:h-6" />}
                            </button>
                        </div>
                    </div>

                    {/* Mobile Dropdown Menu with Accessible Backdrop & Auto-Close */}
                    {isMobileMenuOpen && (
                        <>
                            <div 
                                className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 xl:hidden"
                                onClick={() => setIsMobileMenuOpen(false)}
                                aria-hidden="true"
                            />
                            <div className={`xl:hidden absolute top-full left-0 w-full border-b ${currentTheme.border || 'border-slate-800/80'} ${currentTheme.cardBg || 'bg-slate-950/98'} backdrop-blur-3xl shadow-2xl overflow-y-auto max-h-[75vh] animate-in slide-in-from-top-2 duration-300 z-50 custom-scrollbar`}>
                                <div className="flex flex-col py-3 px-4 sm:px-6 gap-1.5">
                                    {dynamicNavItems.map((navItem) => {
                                        const isActive = activeNavSection.toLowerCase() === navItem.label.toLowerCase();
                                        return (
                                            <button
                                                key={`mobile-${navItem.id}`}
                                                type="button"
                                                onClick={() => {
                                                    handleNavClick(navItem.label);
                                                    setIsMobileMenuOpen(false);
                                                }}
                                                className={`w-full text-left px-4 py-3 rounded-xl font-bold transition-all flex items-center justify-between cursor-pointer ${
                                                    isActive 
                                                        ? `${currentTheme.accentText || 'text-blue-400'} bg-white/15 shadow-xs` 
                                                        : `${currentTheme.textPrimary || 'text-white'} hover:bg-white/10 active:bg-white/20`
                                                }`}
                                            >
                                                <span>{navItem.label}</span>
                                                {isActive && <div className={`w-2 h-2 rounded-full ${currentTheme.accentBg || 'bg-blue-500'}`} />}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {/* --- MAIN CONTENT WRAPPER --- */}
                <div className={`relative z-10 w-full min-w-0 max-w-full p-2 sm:p-5 md:p-8 flex flex-col ${isPreview ? 'max-w-7xl mx-auto' : ''}`}>

                    {isPreview ? (
                        <div key={activePage} className="space-y-12 sm:space-y-16 w-full animate-in slide-in-from-bottom-4 duration-700 ease-out">
                            {displaySections.length > 0 ? (
                                displaySections.map((section, idx) => (
                                    <div 
                                        key={section.id} 
                                        id={`preview-node-block-${section.id}`} 
                                        className="w-full overflow-visible scroll-mt-24 relative"
                                        style={{ zIndex: displaySections.length - idx }}
                                    >
                                        <RenderPageContent 
                                            section={section} 
                                            portfolioTheme={portfolioTheme} 
                                            sections={displaySections} 
                                            isPreview={true}
                                        />
                                    </div>
                                ))
                            ) : isLoading ? (
                                <PortfolioSkeleton isPreview={true} themeMode={themeMode} />
                            ) : (
                                <div className="w-full max-w-xl mx-auto my-12 border border-slate-800/80 rounded-2xl p-8 sm:p-10 text-center bg-slate-900/60 backdrop-blur-xl shadow-2xl">
                                    <h3 className="text-lg sm:text-xl font-bold mb-2 text-white font-sora">
                                        Live Portfolio Updating
                                    </h3>
                                    <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                                        The portfolio owner is currently curating their showcase. Please check back shortly.
                                    </p>
                                </div>
                            )}
                        </div>
                    ) : (
                        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                            <SortableContext items={displaySections.map(s => s.id)} strategy={verticalListSortingStrategy}>
                                <div key={activePage} className="space-y-4 sm:space-y-6 w-full pb-20"> 
                                    {displaySections.length > 0 ? (
                                        displaySections.map((section, idx) => {
                                            const isActive = section.id === activeSectionId;
                                            return ( 
                                                <SortableSection key={section.id} section={section}> 
                                                    {({ listeners, attributes, isDragging }) => {
                                                        const isHighlighted = activeHighlightSection && (String(section.id) === String(activeHighlightSection) || section.section_type === activeHighlightSection);
                                                        const isDimmed = activeHighlightSection && !isHighlighted;
                                                        
                                                        return (
                                                        <div 
                                                            id={`live-node-block-${section.id}`} 
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setActiveSectionId(section.id);
                                                            }} 
                                                            style={{ zIndex: isActive ? 60 : (displaySections.length - idx) }}
                                                            className={`relative group rounded-2xl sm:rounded-3xl border p-2.5 sm:p-4 md:p-6 transition-all duration-300 cursor-pointer w-full overflow-visible scroll-mt-24 ${
                                                                isActive
                                                                    ? 'border-blue-500/50 bg-blue-500/5 shadow-[0_0_30px_rgba(59,130,246,0.15)] ring-1 ring-blue-500/20'
                                                                    : globalBgImage
                                                                        ? 'border-white/10 bg-black/20 hover:bg-black/30 backdrop-blur-sm'
                                                                        : 'border-transparent hover:border-slate-700/50 bg-slate-900/30 hover:bg-slate-900/60'
                                                            } ${isDragging ? 'border-dashed border-blue-400 bg-blue-900/20' : ''} ${isDimmed ? 'opacity-30 scale-[0.98] grayscale-[30%]' : 'opacity-100'} ${isHighlighted ? 'ring-2 ring-blue-500/50 shadow-[0_0_40px_rgba(59,130,246,0.2)]' : ''}`}
                                                        >
                                                            {/* Floating Action Menu */}
                                                            <div 
                                                                className={`absolute -top-3 right-3 sm:right-6 z-20 flex items-center gap-1 rounded-xl shadow-2xl p-1 text-[11px] font-bold transition-all duration-300 ease-out bg-slate-800/90 backdrop-blur-md border border-slate-700 text-slate-300 ${
                                                                    isActive ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0'
                                                                }`} 
                                                                onClick={(e) => e.stopPropagation()}
                                                            >
                                                                <button type="button" {...listeners} {...attributes} className="cursor-grab hover:bg-slate-700/80 p-1.5 rounded-lg transition-colors hover:text-white" title="Drag to reorder">
                                                                    <GripVertical className="w-3.5 h-3.5" />
                                                                </button> 
                                                                <div className="w-px h-3 bg-slate-600/60"></div>
                                                                <button type="button" onClick={() => onDuplicateSection && onDuplicateSection(section.id)} className="cursor-pointer hover:bg-slate-700/80 p-1.5 rounded-lg transition-colors hover:text-blue-400" title="Duplicate Block">
                                                                    <Copy className="w-3.5 h-3.5" />
                                                                </button> 
                                                                <div className="w-px h-3 bg-slate-600/60"></div>
                                                                <button type="button" onClick={() => onDeleteSection && onDeleteSection(section.id)} className="cursor-pointer hover:bg-red-500/20 p-1.5 rounded-lg transition-colors hover:text-red-400" title="Delete Block">
                                                                    <Trash2 className="w-3.5 h-3.5" />
                                                                </button> 
                                                            </div>

                                                            <div className="w-full">
                                                                <RenderPageContent 
                                                                    section={section} 
                                                                    portfolioTheme={portfolioTheme} 
                                                                    sections={displaySections} 
                                                                    onInlineEdit={onInlineEdit} 
                                                                    isPreview={false}
                                                                    aiSuggestionPreview={aiSuggestionPreview}
                                                                /> 
                                                            </div>
                                                        </div>
                                                    )}} 
                                                </SortableSection>
                                            );
                                        })
                                    ) : isLoading ? (
                                        <PortfolioSkeleton isPreview={false} themeMode={themeMode} />
                                    ) : ( 
                                        <EmptyCanvasState onAddSection={onAddSection} />
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

export default React.memo(CanvasContainer);