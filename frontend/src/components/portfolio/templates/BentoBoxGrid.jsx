import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Download, Mail, GitBranch, Link, MapPin, Briefcase } from 'lucide-react';
import { getRoleImage } from '../PortfolioFrontpage';

const BentoBoxGrid = ({ d }) => {
    const roleImage = getRoleImage(d.headline);
    
    const item = {
        hidden: { opacity: 0, scale: 0.95 },
        show: { opacity: 1, scale: 1, transition: { duration: 0.5 } }
    };

    return (
        <div className="min-h-screen w-full bg-zinc-100 text-zinc-900 p-4 md:p-8 flex items-center justify-center">
            <motion.div 
                initial="hidden"
                animate="show"
                variants={{
                    show: {
                        transition: {
                            staggerChildren: 0.1
                        }
                    }
                }}
                className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-6 auto-rows-[200px] md:auto-rows-[250px]"
            >
                {/* Main Intro Box */}
                <motion.div variants={item} className="col-span-1 md:col-span-2 row-span-2 bg-white rounded-3xl p-8 flex flex-col justify-between shadow-sm border border-zinc-200">
                    <div>
                        <div className="w-12 h-12 bg-zinc-900 text-white rounded-full flex items-center justify-center text-xl font-bold mb-6">
                            {d.initials}
                        </div>
                        <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
                            Hi, I'm {d.name}
                        </h1>
                        <p className="text-xl text-zinc-500 font-medium">
                            {d.headline}
                        </p>
                    </div>
                    <div className="flex gap-4">
                        <button onClick={d.onVisualize} className="px-6 py-3 bg-zinc-900 text-white rounded-full font-semibold hover:bg-zinc-800 transition-colors flex items-center gap-2">
                            View Work <ArrowRight className="w-4 h-4" />
                        </button>
                    </div>
                </motion.div>

                {/* Image Box */}
                <motion.div variants={item} className="col-span-1 md:col-span-1 row-span-1 md:row-span-2 bg-zinc-200 rounded-3xl overflow-hidden relative shadow-sm border border-zinc-200">
                    <img src={roleImage} alt="Profile" className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-500" />
                </motion.div>

                {/* About Box */}
                <motion.div variants={item} className="col-span-1 md:col-span-1 row-span-1 bg-white rounded-3xl p-6 flex flex-col shadow-sm border border-zinc-200">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-400 mb-2">About</h3>
                    <p className="text-sm font-medium text-zinc-700 line-clamp-5">
                        {d.bio}
                    </p>
                </motion.div>
                
                {/* Location Box */}
                <motion.div variants={item} className="col-span-1 md:col-span-1 row-span-1 bg-white rounded-3xl p-6 flex flex-col items-center justify-center text-center shadow-sm border border-zinc-200">
                    <MapPin className="w-8 h-8 text-zinc-300 mb-3" />
                    <span className="font-semibold text-zinc-600">Available Globally</span>
                    <span className="text-xs text-zinc-400 mt-1">Remote / Hybrid</span>
                </motion.div>

                {/* Status Box */}
                <motion.div variants={item} className="col-span-1 md:col-span-2 row-span-1 bg-indigo-600 text-white rounded-3xl p-8 flex items-center justify-between shadow-sm">
                    <div>
                        <h3 className="text-2xl font-bold mb-2">Let's build together</h3>
                        <p className="text-indigo-200 font-medium">Currently open for new opportunities</p>
                    </div>
                    <button className="w-12 h-12 bg-white text-indigo-600 rounded-full flex items-center justify-center hover:scale-110 transition-transform">
                        <Mail className="w-5 h-5" />
                    </button>
                </motion.div>

                {/* Socials Box */}
                <motion.div variants={item} className="col-span-1 md:col-span-1 row-span-1 bg-white rounded-3xl p-6 flex flex-col justify-center gap-4 shadow-sm border border-zinc-200">
                    <a href="#" className="flex items-center gap-3 p-3 rounded-2xl hover:bg-zinc-100 transition-colors">
                        <GitBranch className="w-5 h-5 text-zinc-700" />
                        <span className="font-semibold text-zinc-700 text-sm">GitHub</span>
                    </a>
                    <a href="#" className="flex items-center gap-3 p-3 rounded-2xl hover:bg-zinc-100 transition-colors">
                        <Link className="w-5 h-5 text-blue-600" />
                        <span className="font-semibold text-zinc-700 text-sm">LinkedIn</span>
                    </a>
                </motion.div>
                
                {/* Resume Box */}
                <motion.div variants={item} className="col-span-1 md:col-span-1 row-span-1 bg-zinc-900 text-white rounded-3xl p-6 flex flex-col items-center justify-center cursor-pointer hover:bg-zinc-800 transition-colors" onClick={() => alert("Proceed to portfolio")}>
                    <Download className="w-8 h-8 text-zinc-400 mb-3" />
                    <span className="font-semibold text-sm uppercase tracking-widest">Download CV</span>
                </motion.div>

            </motion.div>
        </div>
    );
};

export default BentoBoxGrid;
