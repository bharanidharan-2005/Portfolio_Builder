import React from 'react';
import MinimalistCentered from './templates/MinimalistCentered';
import SplitScreen from './templates/SplitScreen';
import Glassmorphism from './templates/Glassmorphism';
import NeoBrutalism from './templates/NeoBrutalism';
import Cyberpunk from './templates/Cyberpunk';
import BentoBoxGrid from './templates/BentoBoxGrid';
import ElegantSerif from './templates/ElegantSerif';
import DarkGradientMesh from './templates/DarkGradientMesh';
import TypographyHero from './templates/TypographyHero';
import CardFlip3D from './templates/CardFlip3D';
import WaveOrganic from './templates/WaveOrganic';
import ParticleNetwork from './templates/ParticleNetwork';
import RetroArcade from './templates/RetroArcade';
import PhotographyFocus from './templates/PhotographyFocus';
import FloatingElements3D from './templates/FloatingElements3D';

export const getRoleImage = (subheading) => {
    const role = (subheading || "").toLowerCase();
    if (role.includes('civil') || role.includes('construct') || role.includes('architect')) return 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=1000&q=80';
    if (role.includes('design') || role.includes('art') || role.includes('ui/ux') || role.includes('ux')) return 'https://images.unsplash.com/photo-1561070791-2526d30994b5?auto=format&fit=crop&w=1000&q=80';
    if (role.includes('data') || role.includes('ai') || role.includes('machine learning') || role.includes('ml')) return 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1000&q=80';
    if (role.includes('develop') || role.includes('software') || role.includes('engineer') || role.includes('program')) return 'https://images.unsplash.com/photo-1542831371-29b0f74f9713?auto=format&fit=crop&w=1000&q=80';
    return 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1000&q=80';
};

const PortfolioFrontpage = ({ userData, sections, themeMode, onVisualize }) => {
    const templateId = userData?.frontpageTemplate || "template1";

    const heroSec = sections.find(s => s.section_type === 'hero');
    const aboutSec = sections.find(s => s.section_type === 'about');

    const name = heroSec?.content_data?.heading || userData?.name || "Professional Developer";
    const headline = heroSec?.content_data?.subheading || "Software Engineer | Tech Enthusiast";
    const bio = aboutSec?.content_data?.bio || "Building intelligent applications with modern web technologies and creating scalable solutions.";
    const firstName = name.split(' ')[0];
    const lastName = name.split(' ').slice(1).join(' ');
    const initials = name.split(' ').filter(Boolean).map(n => n[0]).join('').substring(0, 2).toUpperCase();

    const d = { name, headline, bio, firstName, lastName, initials, onVisualize };

    switch (templateId) {
        case 'template1': return <MinimalistCentered d={d} />;
        case 'template2': return <SplitScreen d={d} />;
        case 'template3': return <Glassmorphism d={d} />;
        case 'template4': return <NeoBrutalism d={d} />;
        case 'template5': return <Cyberpunk d={d} />;
        case 'template6': return <BentoBoxGrid d={d} />;
        case 'template7': return <ElegantSerif d={d} />;
        case 'template8': return <DarkGradientMesh d={d} />;
        case 'template9': return <TypographyHero d={d} />;
        case 'template10': return <CardFlip3D d={d} />;
        case 'template11': return <WaveOrganic d={d} />;
        case 'template12': return <ParticleNetwork d={d} />;
        case 'template13': return <RetroArcade d={d} />;
        case 'template14': return <PhotographyFocus d={d} />;
        case 'template15': return <FloatingElements3D d={d} />;
        default: return <MinimalistCentered d={d} />;
    }
};

export default PortfolioFrontpage;
