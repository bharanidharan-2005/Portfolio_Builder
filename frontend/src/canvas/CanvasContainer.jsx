import React, { useState, useEffect, useRef, useMemo } from 'react';
import { DndContext, PointerSensor, closestCenter, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Undo2, Redo2, Layers, Sparkles } from 'lucide-react';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { ResumePDF } from '../components/ResumePDF';
import RenderPageContent from './RenderPageContent';
import { PORTFOLIO_THEMES, PORTFOLIO_FONTS } from './themes';

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
    globalFont = 'font-inter',
    onUndo,
    canUndo,
    onRedo,
    canRedo
}) {
    const currentTheme = PORTFOLIO_THEMES[portfolioTheme] || {};
    const currentFontObj = PORTFOLIO_FONTS.find(f => f.id === globalFont) || PORTFOLIO_FONTS[0];
    const displaySections = sections || [];
    const pdfDocument = useMemo(() => isPreview ? <ResumePDF sections={sections} /> : null, [sections, isPreview]);

    const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

    const [scrollRotation, setScrollRotation] = useState(0);

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

        const foundSection = displaySections.find(s => (s.section_type || '').toLowerCase().trim() === targetType);
        if (foundSection) {
            if (!isPreview && setActiveSectionId) {
                setActiveSectionId(foundSection.id);
            }
            setTimeout(() => {
                const targetId = isPreview ? `preview-node-block-${foundSection.id}` : `live-node-block-${foundSection.id}`;
                const targetElement = document.getElementById(targetId);
                if (targetElement) {
                    if (isPreview) {
                        targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    } else {
                        const scrollContainer = document.getElementById('workspace-scroll-container');
                        if (scrollContainer && scrollContainer.scrollTo) {
                            const topOffset = targetElement.getBoundingClientRect().top + scrollContainer.scrollTop - 100;
                            scrollContainer.scrollTo({ top: topOffset, behavior: 'smooth' });
                        } else {
                            targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }
                    }
                }
            }, 50);
        }
    };

    const handleDragEnd = ({ active, over }) => {
        if (over && active.id !== over.id && onDropSection) {
            onDropSection(active.id, over.id);
        }
    };

    // Derive dynamic nav items from displaySections
    const dynamicNavItems = useMemo(() => {
        if (!displaySections) return [];
        const ignoredTypes = ['hero', 'footer', 'resume', 'banner'];
        
        const types = displaySections
            .filter(s => s.section_type && !ignoredTypes.includes(s.section_type))
            .map(s => {
                let name = s.section_type;
                if (name === 'projects_grid') return 'Projects';
                // Capitalize first letter
                return name.charAt(0).toUpperCase() + name.slice(1);
            });
            
        // Return unique items
        return [...new Set(types)];
    }, [displaySections]);

    const heroSectionData = displaySections.find(s => (s.section_type || '').toLowerCase().trim() === 'hero');
    const heroName = heroSectionData?.content_data?.heading || 'DEV';
    const initials = heroName.split(' ').filter(Boolean).map(n => n[0]).join('').substring(0, 2).toUpperCase();

    return ( 
        <div className="w-full flex flex-col items-center relative animate-in fade-in duration-500"> 

            {/* Main Outer Container */}
            <div className={`dark relative w-full min-h-[700px] transition-all duration-500 ease-out overflow-x-clip [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] ${
                !isPreview ? `shadow-2xl rounded-[2rem] border ${currentTheme.border || 'border-slate-800/80'}` : 'min-h-screen'
            } ${
                globalBgImage ? 'bg-[#0B0C10]/40 backdrop-blur-2xl' : 'bg-[#0B0C10] ' + (currentTheme.bodyBg || '')
            }`} style={{ ...currentFontObj.style }}>
                
                {/* --- GLOBAL BACKGROUND LAYER --- */}
                {globalBgImage === 'PARTICLES_3D' ? (
                    <ParticleNetwork />
                ) : globalBgImage ? (
                    <div 
                        className="absolute inset-0 z-0 pointer-events-none rounded-[2rem] overflow-hidden"
                        style={{
                            backgroundImage: `url('${globalBgImage}')`,
                            backgroundSize: 'cover',
                            backgroundRepeat: 'no-repeat',
                            backgroundPosition: 'center',
                            backgroundAttachment: 'fixed',
                            opacity: 0.3
                        }}
                    />
                ) : null}

                {/* --- FULL WIDTH NAVIGATION NAVBAR --- */}
                <div className={`sticky top-0 z-50 w-full backdrop-blur-2xl ${currentTheme.cardBg || 'bg-black/20'} border-b ${currentTheme.border || 'border-slate-700/30'} shadow-lg transition-all duration-500`}>
                    <div className="w-full px-6 py-4 flex items-center justify-between">
                        {/* Logo / Initials */}
                        <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-lg shadow-inner ${currentTheme.accentBg || 'bg-blue-600'} text-white`}>
                                {initials}
                            </div>
                            <span className={`font-black tracking-widest uppercase hidden sm:block text-sm md:text-base leading-none translate-y-[1px] ${currentTheme.accentText || 'text-blue-400'}`}> 
                                {heroName.split(' ')[0]} 
                            </span> 
                        </div>

                        {/* Navigation Links */}
                        <div className="flex flex-wrap items-center justify-center gap-1 md:gap-4 opacity-90 hidden lg:flex"> 
                            {dynamicNavItems.map((navItem) => ( 
                                <button 
                                    key={navItem} 
                                    type="button" 
                                    onClick={() => handleNavClick(navItem)} 
                                    className={`bg-transparent px-3 py-1.5 rounded-lg text-sm font-bold transition-all duration-300 whitespace-nowrap cursor-pointer ${currentTheme.textSecondary || 'text-slate-400'} hover:bg-white/10`}
                                    style={{ color: 'inherit' }}
                                > 
                                    <span className={`opacity-80 hover:opacity-100 transition-opacity ${currentTheme.textPrimary || 'text-white'}`}>
                                        {navItem}
                                    </span>
                                </button>
                            ))} 
                        </div>

                        {/* Right Side - Resume */}
                        <div>
                            {isPreview ? (
                                <PDFDownloadLink
                                    document={pdfDocument}
                                    fileName="Portfolio_Resume.pdf"
                                    className={`px-4 py-2 rounded-lg text-xs font-bold transition-all shadow-md hover:shadow-lg ${currentTheme.accentBg || 'bg-blue-600'} text-white flex items-center gap-2`}
                                >
                                    {({ loading }) => (loading ? 'Preparing...' : 'Download Resume')}
                                </PDFDownloadLink>
                            ) : (
                                <button 
                                    onClick={() => alert("Please test Resume Download in the Live Preview.")}
                                    className={`px-4 py-2 rounded-lg text-xs font-bold transition-all shadow-md hover:shadow-lg ${currentTheme.accentBg || 'bg-blue-600'} text-white flex items-center gap-2`}
                                >
                                    Download Resume
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* --- MAIN CONTENT WRAPPER --- */}
                <div className="relative z-10 w-full p-4 sm:p-10 flex flex-col">

                    {isPreview ? (
                        <div key={activePage} className="space-y-8 w-full animate-in slide-in-from-bottom-4 duration-700 ease-out">
                            {displaySections.length > 0 ? (
                                displaySections.map((section) => (
                                    <div key={section.id} id={`preview-node-block-${section.id}`} className="w-full overflow-visible">
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
                                                            className={`relative group rounded-3xl border p-4 sm:p-6 transition-all duration-300 cursor-pointer w-full overflow-visible ${
                                                                isActive
                                                                    ? 'border-blue-500/50 bg-blue-500/5 shadow-[0_0_30px_rgba(59,130,246,0.15)] ring-1 ring-blue-500/20 z-50'
                                                                    : globalBgImage
                                                                        ? 'border-white/10 bg-black/20 hover:bg-black/30 backdrop-blur-sm z-10'
                                                                        : 'border-transparent hover:border-slate-700/50 bg-slate-900/30 hover:bg-slate-900/60 z-10'
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