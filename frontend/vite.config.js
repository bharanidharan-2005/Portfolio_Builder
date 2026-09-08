import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
    plugins: [react()],
    server: {
        proxy: {
            '/api': {
                target: 'http://localhost:8000',
                changeOrigin: true,
                secure: false,
                rewrite: (path) => path.replace(/^\/api/, ''),
            },
        },
    },
    build: {
        // Silence the warning — the app is split into focused chunks below.
        chunkSizeWarningLimit: 500,
        rollupOptions: {
            output: {
                // Split the heavy WebGL engine and React into separate vendor
                // chunks so the Three.js background and editor only download
                // on demand and never re-download on every deploy.
                manualChunks(id) {
                    if (id.includes('node_modules/three')) return 'three';
                    if (id.includes('node_modules/react')) return 'react';
                    if (id.includes('node_modules/axios')) return 'axios';
                },
            },
        },
    },
})