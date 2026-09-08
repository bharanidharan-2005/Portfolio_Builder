import { useEffect, useRef } from 'react';
import * as THREE from 'three';

// Full-screen WebGL particle field used as the landing backdrop.
// Purple/blue/teal "constellation" with mouse parallax, slow drift and a
// twinkle pass. Respects prefers-reduced-motion by rendering one static frame.
export default function ThreeBackground({ density = 1500, className = '' }) {
    const mountRef = useRef(null);

    useEffect(() => {
        const mount = mountRef.current;
        if (!mount) return;

        const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(
            70,
            window.innerWidth / window.innerHeight,
            0.1,
            100
        );
        camera.position.z = 9;

        const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.setSize(window.innerWidth, window.innerHeight);
        mount.appendChild(renderer.domElement);

        // --- Constellation particles (vertex-coloured) ---------------------
        const colors = [new THREE.Color('#a855f7'), new THREE.Color('#3b82f6'), new THREE.Color('#2dd4bf')];
        const positions = new Float32Array(density * 3);
        const colData = new Float32Array(density * 3);
        for (let i = 0; i < density; i += 1) {
            positions[i * 3] = (Math.random() - 0.5) * 26;
            positions[i * 3 + 1] = (Math.random() - 0.5) * 16;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 14;
            const c = colors[Math.floor(Math.random() * colors.length)];
            colData[i * 3] = c.r;
            colData[i * 3 + 1] = c.g;
            colData[i * 3 + 2] = c.b;
        }
        const particleGeo = new THREE.BufferGeometry();
        particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        particleGeo.setAttribute('color', new THREE.BufferAttribute(colData, 3));

        const particleMat = new THREE.PointsMaterial({
            size: 0.055,
            vertexColors: true,
            transparent: true,
            opacity: 0.9,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            sizeAttenuation: true,
        });
        const particles = new THREE.Points(particleGeo, particleMat);
        scene.add(particles);

        // --- Second sparse layer of larger glowing sparks ------------------
        const sparkCount = Math.round(density / 8);
        const sparkPos = new Float32Array(sparkCount * 3);
        const sparkCol = new Float32Array(sparkCount * 3);
        for (let i = 0; i < sparkCount; i += 1) {
            sparkPos[i * 3] = (Math.random() - 0.5) * 26;
            sparkPos[i * 3 + 1] = (Math.random() - 0.5) * 16;
            sparkPos[i * 3 + 2] = (Math.random() - 0.5) * 14;
            const c = colors[Math.floor(Math.random() * colors.length)];
            sparkCol[i * 3] = c.r;
            sparkCol[i * 3 + 1] = c.g;
            sparkCol[i * 3 + 2] = c.b;
        }
        const sparkGeo = new THREE.BufferGeometry();
        sparkGeo.setAttribute('position', new THREE.BufferAttribute(sparkPos, 3));
        sparkGeo.setAttribute('color', new THREE.BufferAttribute(sparkCol, 3));
        const sparkMat = new THREE.PointsMaterial({
            size: 0.14,
            vertexColors: true,
            transparent: true,
            opacity: 0.55,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            sizeAttenuation: true,
        });
        const sparks = new THREE.Points(sparkGeo, sparkMat);
        scene.add(sparks);

        // --- Mouse parallax -------------------------------------------------
        let targetX = 0;
        let targetY = 0;
        const onPointerMove = (e) => {
            targetX = (e.clientX / window.innerWidth) * 2 - 1;
            targetY = (e.clientY / window.innerHeight) * 2 - 1;
        };
        const onResize = () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        };
        window.addEventListener('pointermove', onPointerMove);
        window.addEventListener('resize', onResize);

        // --- Render loop ------------------------------------------------------
        let rafId = null;
        const clock = new THREE.Clock();
        const animate = () => {
            rafId = requestAnimationFrame(animate);
            const t = clock.getElapsedTime();

            particles.rotation.y += 0.0006;
            particles.rotation.x = THREE.MathUtils.lerp(particles.rotation.x, targetY * 0.12, 0.04);
            particles.rotation.y = THREE.MathUtils.lerp(particles.rotation.y, targetX * 0.3, 0.04);
            sparks.rotation.copy(particles.rotation);

            // Gentle breathing "twinkle" of the spark layer.
            sparkMat.opacity = 0.45 + Math.sin(t * 1.4) * 0.12;

            renderer.render(scene, camera);
        };

        if (reduceMotion) {
            renderer.render(scene, camera);
        } else {
            animate();
        }

        return () => {
            if (rafId) cancelAnimationFrame(rafId);
            window.removeEventListener('pointermove', onPointerMove);
            window.removeEventListener('resize', onResize);
            particleGeo.dispose();
            particleMat.dispose();
            sparkGeo.dispose();
            sparkMat.dispose();
            renderer.dispose();
            if (renderer.domElement.parentNode === mount) {
                mount.removeChild(renderer.domElement);
            }
        };
    }, [density]);

    return (
        <div
            ref={mountRef}
            aria-hidden="true"
            className={`fixed inset-0 z-0 pointer-events-none ${className}`}
        />
    );
}