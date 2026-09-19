import re

with open("frontend/src/components/layout/RightSidebar.jsx", "r", encoding="utf-8") as f:
    rsb = f.read()

old_gallery_start = """const UNSPLASH_GALLERY = [
    { id: 'particles_3d', url: 'PARTICLES_3D', label: '✨ Interactive Particles' },"""

new_gallery_start = """const UNSPLASH_GALLERY = [
    { id: 'particles_3d', url: 'PARTICLES_3D', label: '✨ Interactive Particles' },
    { id: 'abs_particles', url: '/bg_3d_particles.jpg', label: '3D Particles' },
    { id: 'abs_platform', url: '/bg_glow_platform.jpg', label: 'Cyber Platform' },
    { id: 'abs_blocks', url: '/bg_dark_blocks.jpg', label: 'Dark Blocks' },
    { id: 'abs_geo', url: '/bg_abstract_geo.jpg', label: 'Vibrant Geo' },"""

rsb = rsb.replace(old_gallery_start, new_gallery_start)

with open("frontend/src/components/layout/RightSidebar.jsx", "w", encoding="utf-8") as f:
    f.write(rsb)

print("Gallery updated.")
