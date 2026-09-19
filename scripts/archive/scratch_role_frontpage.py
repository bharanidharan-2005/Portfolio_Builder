import re

with open("frontend/src/components/portfolio/PortfolioFrontpage.jsx", "r", encoding="utf-8") as f:
    pfc = f.read()

# Add getRoleImage helper at the top
get_role_func = """import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles, Download, Database, Code2, Layers, Cpu, Globe, Cloud, LayoutTemplate, Activity } from 'lucide-react';

export const getRoleImage = (subheading) => {
    const role = (subheading || "").toLowerCase();
    if (role.includes('civil') || role.includes('construct') || role.includes('architect')) return '/3d_civil.jpg';
    if (role.includes('design') || role.includes('art') || role.includes('ui/ux') || role.includes('ux')) return '/3d_design.jpg';
    if (role.includes('data') || role.includes('ai') || role.includes('machine learning') || role.includes('ml')) return '/3d_data.jpg';
    if (role.includes('develop') || role.includes('software') || role.includes('engineer') || role.includes('program')) return '/3d_developer_workspace.jpg';
    return '/3d_generic.jpg';
};
"""

pfc = pfc.replace("import React, { useMemo } from 'react';\nimport { motion } from 'framer-motion';\nimport { ArrowRight, Sparkles, Download, Database, Code2, Layers, Cpu, Globe, Cloud, LayoutTemplate, Activity } from 'lucide-react';", get_role_func)

# Fix the ImageVisual component
old_img = """const ImageVisual = () => (
    <motion.div animate={{ y: [-15, 15, -15], rotateZ: [-2, 2, -2] }} transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }} className="relative w-[300px] h-[300px] md:w-[450px] md:h-[450px] lg:w-[500px] lg:h-[500px]">
        <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-[100px]"></div>
        <img src="/3d_developer_workspace.jpg" alt="Developer Workspace" className="absolute inset-0 w-full h-full object-cover mix-blend-screen opacity-90 rounded-3xl drop-shadow-2xl" />
    </motion.div>
);"""

new_img = """const ImageVisual = ({ d }) => (
    <motion.div animate={{ y: [-15, 15, -15], rotateZ: [-2, 2, -2] }} transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }} className="relative w-[300px] h-[300px] md:w-[450px] md:h-[450px] lg:w-[500px] lg:h-[500px]">
        <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-[100px]"></div>
        <img src={getRoleImage(d?.headline || "")} alt="Workspace Concept" className="absolute inset-0 w-full h-full object-cover mix-blend-screen opacity-90 rounded-3xl drop-shadow-2xl" />
    </motion.div>
);"""

pfc = pfc.replace(old_img, new_img)

# Fix the name typography in PremiumHero
old_name = """style={{ fontSize: 'clamp(40px, 5vw, 72px)' }}"""
new_name = """style={{ fontSize: 'clamp(32px, 5vw, 56px)', wordBreak: 'break-word', lineHeight: '1.1' }}"""
pfc = pfc.replace(old_name, new_name)

with open("frontend/src/components/portfolio/PortfolioFrontpage.jsx", "w", encoding="utf-8") as f:
    f.write(pfc)

print("PortfolioFrontpage updated.")
