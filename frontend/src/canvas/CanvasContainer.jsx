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

function ParticleNetwork() {
    const canvasRef = useRef(null);
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        let width = canvas.width = canvas.parentElement.offsetWidth;
        let height = canvas.height = canvas.parentElement.offsetHeight;
        let particles = [];
        const mouse = { x: null, y: null, radius: 150 };

        const handleMouseMove = (e) => {
            const rect = canvas.getBoundingClientRect();
            mouse.x = e.clientX - rect.left;
            mouse.y = e.clientY - rect.top;
        };
        canvas.addEventListener('mousemove', handleMouseMove);

        class Particle {
            constructor() {
                this.x = Math.random() * width;
                this.y = Math.random() * height;
                this.vx = (Math.random() - 0.5) * 1;
                this.vy = (Math.random() - 0.5) * 1;
                this.size = Math.random() * 2 + 1;
            }
            update() {
                this.x += this.vx;
                this.y += this.vy;
                if (this.x < 0 || this.x > width) this.vx *= -1;
                if (this.y < 0 || this.y > height) this.vy *= -1;
                
                if (mouse.x) {
                    const dx = mouse.x - this.x;
                    const dy = mouse.y - this.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < mouse.radius) {
                        const force = (mouse.radius - dist) / mouse.radius;
                        this.vx -= (dx / dist) * force * 0.2;
                        this.vy -= (dy / dist) * force * 0.2;
                    }
                }
            }
            draw() {
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(59, 130, 246, 0.5)';
                ctx.fill();
            }
        }

        for (let i = 0; i < 80; i++) particles.push(new Particle());

        const animate = () => {
            ctx.clearRect(0, 0, width, height);
            particles.forEach((p, i) => {
                p.update();
                p.draw();
                for (let j = i; j < particles.length; j++) {
                    const p2 = particles[j];
                    const dist = Math.sqrt((p.x - p2.x)**2 + (p.y - p2.y)**2);
                    if (dist < 120) {
                        ctx.beginPath();
                        ctx.moveTo(p.x, p.y);
                        ctx.lineTo(p2.x, p2.y);
                        ctx.strokeStyle = `rgba(59, 130, 246, ${1 - dist/120})`;
                        ctx.lineWidth = 0.5;
                        ctx.stroke();
                    }
                }
            });
            requestAnimationFrame(animate);
        };
        animate();

        const handleResize = () => {
            width = canvas.width = canvas.parentElement.offsetWidth;
            height = canvas.height = canvas.parentElement.offsetHeight;
        };
        window.addEventListener('resize', handleResize);
        return () => {
            canvas.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('resize', handleResize);
        };
    }, []);
    return <canvas ref={canvasRef} className="absolute inset-0 z-0 opacity-40 pointer-events-auto" />;
}

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

function SortableNavItem({ item, onClick, currentTheme }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });
    return (
        <button
            ref={setNodeRef}
            type="button"
            onClick={() => onClick(item.label)}
            {...attributes}
            {...listeners}
            className={`bg-transparent px-3 py-1.5 rounded-lg text-sm font-bold transition-all duration-300 whitespace-nowrap ${isDragging ? 'cursor-grabbing opacity-50 scale-105 z-50' : 'cursor-grab'} ${currentTheme.textSecondary || 'text-slate-400'} hover:bg-white/10`}
            style={{
                color: 'inherit',
                transform: CSS.Transform.toString(transform),
                transition
            }}
        >
            <span className={`transition-opacity ${currentTheme.textPrimary || 'text-white'}`}>
                {item.label}
            </span>
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
    globalFont = 'font-inter',
    onUndo,
    canUndo,
    onRedo,
    canRedo,
    activeHighlightSection,
    aiSuggestionPreview,
    onAddSection
}) {
    const currentTheme = PORTFOLIO_THEMES[portfolioTheme] || {};
    const currentFontObj = PORTFOLIO_FONTS.find(f => f.id === globalFont) || PORTFOLIO_FONTS[0];
    const displaySections = sections || [];
    const pdfDocument = useMemo(() => isPreview ? <ResumePDF sections={sections} /> : null, [sections, isPreview]);

    const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

    const [scrollRotation, setScrollRotation] = useState(0);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    useEffect(() => {
        // Try both internal workspace scroll and window scroll (if deployed)
        const scrollContainer = document.getElementById('workspace-scroll-container') || window;
        
        const handleScroll = () => {
            const currentScroll = scrollContainer.scrollTop || window.scrollY;
            const maxScroll = (scrollContainer.scrollHeight || document.body.scrollHeight) - (scrollContainer.clientHeight || window.innerHeight);
            if (maxScroll <= 0) return;
            
            // Spin slowly as user scrolls down
            const rotation = (currentScroll / maxScroll) * 360;
            setScrollRotation(rotation);
        };

        scrollContainer.addEventListener('scroll', handleScroll);
        // Initial setup
        handleScroll();
        
        return () => scrollContainer.removeEventListener('scroll', handleScroll);
    }, []);

    const handleNavClick = (navLabel) => {
        if (!displaySections.length) return;
        let targetType = navLabel.toLowerCase().trim();
        if (targetType === 'projects') targetType = 'projects_grid';

        const foundSection = displaySections.find(s => {
            const stype = (s.section_type || '').toLowerCase().trim();
            return stype === targetType || 
                   (targetType === 'projects_grid' && stype === 'projects') ||
                   (targetType === 'projects' && stype === 'projects_grid');
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
                    
                    if (isPreview && previewContainer) {
                        const containerRect = previewContainer.getBoundingClientRect();
                        const targetRect = targetElement.getBoundingClientRect();
                        previewContainer.scrollTo({
                            top: previewContainer.scrollTop + (targetRect.top - containerRect.top) - 90,
                            behavior: 'smooth'
                        });
                    } else if (workspaceContainer) {
                        const containerRect = workspaceContainer.getBoundingClientRect();
                        const targetRect = targetElement.getBoundingClientRect();
                        workspaceContainer.scrollTo({
                            top: workspaceContainer.scrollTop + (targetRect.top - containerRect.top) - 90,
                            behavior: 'smooth'
                        });
                    } else {
                        const topPos = targetElement.getBoundingClientRect().top + window.scrollY;
                        window.scrollTo({
                            top: topPos - 90,
                            behavior: 'smooth'
                        });
                    }
                }
            }, 50);
        }
    };

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

    // Derive dynamic nav items from displaySections
    const dynamicNavItems = useMemo(() => {
        if (!displaySections) return [];
        const ignoredTypes = ['hero', 'footer', 'resume', 'banner'];
        
        const items = [];
        const seenTypes = new Set();
        
        displaySections.forEach(s => {
            if (s.section_type && !ignoredTypes.includes(s.section_type)) {
                let name = s.section_type;
                if (name === 'projects_grid') name = 'projects';
                
                // Only add unique types to avoid multiple nav links for the same section type
                if (!seenTypes.has(name)) {
                    seenTypes.add(name);
                    items.push({
                        id: `nav-${s.id}`, // prefix ID to avoid collision with section DnD
                        sectionId: s.id,
                        label: name.charAt(0).toUpperCase() + name.slice(1)
                    });
                }
            }
        });
            
        return items;
    }, [displaySections]);

    const handleNavDragEnd = ({ active, over }) => {
        if (over && active.id !== over.id && onDropSection) {
            const activeId = String(active.id).replace('nav-', '');
            const overId = String(over.id).replace('nav-', '');
            onDropSection(activeId, overId);
        }
    };

    const heroSectionData = displaySections.find(s => (s.section_type || '').toLowerCase().trim() === 'hero');
    const heroName = heroSectionData?.content_data?.heading || 'DEV';
    const initials = heroName.split(' ').filter(Boolean).map(n => n[0]).join('').substring(0, 2).toUpperCase();

    return ( 
        <div className="w-full min-w-0 max-w-full flex flex-col items-center relative animate-in fade-in duration-500"> 

            {/* Main Outer Container */}
            <div className={`dark relative w-full min-w-0 max-w-full min-h-[700px] transition-all duration-500 ease-out overflow-x-hidden [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] ${
                !isPreview ? `shadow-2xl rounded-[2rem] border ${currentTheme.border || 'border-slate-800/80'}` : 'min-h-screen'
            } bg-[#080D1C]`} style={{ ...currentFontObj.style }}>
                
                {/* --- PREMIUM GLOBAL BACKGROUND --- */}
                <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
                    <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-900/20 blur-[120px]"></div>
                    <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-violet-900/20 blur-[120px]"></div>
                    <div className="absolute top-[40%] right-[20%] w-[30%] h-[30%] rounded-full bg-indigo-900/10 blur-[100px]"></div>
                </div>

                {/* --- FULL WIDTH NAVIGATION NAVBAR --- */}
                <div className={`sticky top-0 z-50 w-full backdrop-blur-2xl ${currentTheme.cardBg || 'bg-black/20'} border-b ${currentTheme.border || 'border-slate-700/30'} shadow-lg transition-all duration-500 overflow-hidden`}>
                    <div className="w-full px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between gap-3">
                        {/* Logo / Initials */}
                        <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
                            <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center font-black text-base sm:text-lg shadow-inner ${currentTheme.accentBg || 'bg-blue-600'} text-white`}>
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
                                        {dynamicNavItems.map((navItem) => (
                                            <SortableNavItem 
                                                key={navItem.id} 
                                                item={navItem} 
                                                onClick={handleNavClick} 
                                                currentTheme={currentTheme} 
                                            />
                                        ))}
                                    </SortableContext>
                                </DndContext>
                            ) : (
                                dynamicNavItems.map((navItem) => ( 
                                    <button 
                                        key={navItem.id} 
                                        type="button" 
                                        onClick={() => handleNavClick(navItem.label)} 
                                        className={`bg-transparent px-2.5 py-1.5 rounded-lg text-xs xl:text-sm font-bold transition-all duration-300 whitespace-nowrap cursor-pointer ${currentTheme.textSecondary || 'text-slate-400'} hover:bg-white/10`}
                                        style={{ color: 'inherit' }}
                                    > 
                                        <span className={`opacity-80 hover:opacity-100 transition-opacity ${currentTheme.textPrimary || 'text-white'}`}>
                                            {navItem.label}
                                        </span>
                                    </button>
                                ))
                            )}
                        </div>

                        {/* Right Side - Resume & Mobile Toggle */}
                        <div className="flex items-center gap-2 sm:gap-4 shrink-0">
                            {isPreview ? (
                                <PDFDownloadLink
                                    document={pdfDocument}
                                    fileName="Portfolio_Resume.pdf"
                                    className={`px-3 sm:px-4 py-2 rounded-lg text-xs font-bold transition-all shadow-md hover:shadow-lg ${currentTheme.accentBg || 'bg-blue-600'} text-white flex items-center gap-2 whitespace-nowrap`}
                                >
                                    {({ loading }) => (loading ? 'Preparing...' : 'Download Resume')}
                                </PDFDownloadLink>
                            ) : (
                                <button 
                                    onClick={() => notify("Please test Resume Download in the Live Preview.", "info")}
                                    className={`px-3 sm:px-4 py-2 rounded-lg text-xs font-bold transition-all shadow-md hover:shadow-lg ${currentTheme.accentBg || 'bg-blue-600'} text-white flex items-center gap-2 whitespace-nowrap cursor-pointer`}
                                >
                                    Download Resume
                                </button>
                            )}

                            {/* Mobile / Compact Menu Toggle Button */}
                            <button 
                                className="xl:hidden p-1.5 text-slate-300 hover:text-white transition-colors cursor-pointer"
                                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                                aria-label="Toggle navigation menu"
                            >
                                {isMobileMenuOpen ? <X className="w-5 h-5 sm:w-6 sm:h-6" /> : <Menu className="w-5 h-5 sm:w-6 sm:h-6" />}
                            </button>
                        </div>
                    </div>

                    {/* Mobile Dropdown Menu */}
                    {isMobileMenuOpen && (
                        <div className="xl:hidden absolute top-full left-0 w-full border-b border-slate-800/50 bg-slate-900/95 backdrop-blur-3xl shadow-2xl overflow-hidden animate-in slide-in-from-top-2 duration-300 z-50">
                            <div className="flex flex-col py-4 px-6 gap-2">
                                {dynamicNavItems.map((navItem) => (
                                    <button
                                        key={`mobile-${navItem.id}`}
                                        type="button"
                                        onClick={() => {
                                            handleNavClick(navItem.label);
                                            setIsMobileMenuOpen(false);
                                        }}
                                        className={`w-full text-left px-4 py-3 rounded-xl font-bold transition-all ${currentTheme.textPrimary || 'text-white'} hover:bg-white/10 active:bg-white/20`}
                                    >
                                        {navItem.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* --- MAIN CONTENT WRAPPER --- */}
                <div className={`relative z-10 w-full p-2 sm:p-6 md:p-10 flex flex-col ${isPreview ? 'max-w-7xl mx-auto' : ''}`}>

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
                            ) : (
                                <EmptyCanvasState onAddSection={onAddSection} />
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