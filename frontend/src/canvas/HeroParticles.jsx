import { motion } from "framer-motion";

const STATIC_PARTICLES = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    x: ((i * 37 + 13) % 94) + 3,
    y: ((i * 53 + 7) % 92) + 4,
    size: 2 + (i % 4),
    duration: 12 + ((i * 7) % 16),
    delay: (i * 0.6) % 5,
}));

export const HeroParticles = ({ isDark }) => {
    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
            {STATIC_PARTICLES.map((p) => (
                <motion.div
                    key={p.id}
                    className={`absolute rounded-full ${isDark ? 'bg-white/10' : 'bg-black/5'} blur-[1px]`}
                    style={{
                        width: p.size,
                        height: p.size,
                        left: `${p.x}%`,
                        top: `${p.y}%`,
                    }}
                    animate={{
                        y: [0, -30, 0],
                        x: [0, 20, 0],
                        opacity: [0.2, 0.8, 0.2],
                    }}
                    transition={{
                        duration: p.duration,
                        repeat: Infinity,
                        delay: p.delay,
                        ease: "linear",
                    }}
                />
            ))}
            {/* Glow Orbs */}
            <motion.div 
                className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-blue-500/10 blur-[100px]"
                animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
                transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div 
                className="absolute -bottom-[20%] -right-[10%] w-[50%] h-[50%] rounded-full bg-purple-500/10 blur-[100px]"
                animate={{ scale: [1, 1.3, 1], opacity: [0.4, 0.7, 0.4] }}
                transition={{ duration: 20, repeat: Infinity, ease: "easeInOut", delay: 2 }}
            />
        </div>
    );
};
