export const FRONTPAGE_LAYOUTS = [
  {
    id: "template1",
    name: "Minimalist Centered",
    tag: "Minimalist",
    description:
      "Centered typography with generous whitespace and a focused call to action.",
    accent: "#6366F1",
  },
  {
    id: "template2",
    name: "Split Screen",
    tag: "Modern Split",
    description:
      "Asymmetric two-column hero pairing structured bio copy with portrait visual framing.",
    accent: "#06B6D4",
  },
  {
    id: "template3",
    name: "Glassmorphism",
    tag: "Translucent",
    description:
      "Frosted translucent surfaces over subtle ambient glow and layered contrast.",
    accent: "#8B5CF6",
  },
  {
    id: "template4",
    name: "Neo-Brutalism",
    tag: "Bold Frame",
    description:
      "High-contrast hard edges, bold display typography, and sharp geometric blocks.",
    accent: "#F59E0B",
  },
  {
    id: "template5",
    name: "Cyberpunk / Sci-Fi",
    tag: "Neon Grid",
    description:
      "Futuristic dark HUD aesthetic with crisp cyan accents and structured technical framing.",
    accent: "#22D3EE",
  },
  {
    id: "template6",
    name: "Bento Box Grid",
    tag: "Bento Tiles",
    description:
      "Modular bento card grid highlighting identity, role headline, and visual focus.",
    accent: "#3B82F6",
  },
  {
    id: "template7",
    name: "Elegant Serif",
    tag: "Editorial",
    description:
      "Classic magazine-inspired serif typography with balanced warm spacing.",
    accent: "#B45309",
  },
  {
    id: "template8",
    name: "Dark Gradient Mesh",
    tag: "Mesh Glow",
    description:
      "Deep indigo and slate radial mesh backdrop built for modern software builders.",
    accent: "#7C3AED",
  },
  {
    id: "template9",
    name: "Typography Hero",
    tag: "Type First",
    description:
      "Oversized expressive headline composition putting name and positioning upfront.",
    accent: "#0F172A",
  },
  {
    id: "template10",
    name: "Card Flip 3D",
    tag: "Interactive",
    description:
      "Perspective-driven showcase card with dimensional depth and clean profile reveal.",
    accent: "#2563EB",
  },
  {
    id: "template11",
    name: "Wave / Organic",
    tag: "Organic Curve",
    description:
      "Soft organic contours and approachable composition for product and creative roles.",
    accent: "#0EA5E9",
  },
  {
    id: "template12",
    name: "Particle Network",
    tag: "Data Mesh",
    description:
      "Connected node backdrop tailored for AI, ML, and distributed systems engineers.",
    accent: "#06B6D4",
  },
  {
    id: "template13",
    name: "Retro Arcade",
    tag: "Playful Retro",
    description:
      "Pixel-spirited high-energy hero layout for indie makers and creative technologists.",
    accent: "#EC4899",
  },
  {
    id: "template14",
    name: "Photography Focus",
    tag: "Visual Story",
    description:
      "Full-bleed visual composition foregrounding imagery with an overlay bio band.",
    accent: "#475569",
  },
  {
    id: "template15",
    name: "3D Floating Elements",
    tag: "Depth Layer",
    description:
      "Layered geometric depth elements framing your headline and primary portfolio link.",
    accent: "#F43F5E",
  },
  {
    id: "template16",
    name: "Editorial Magazine",
    tag: "Publication",
    description:
      "Print-inspired cover layout pairing italic serif masthead typography with framed imagery.",
    accent: "#92400E",
  },
  {
    id: "template17",
    name: "Terminal Shell",
    tag: "Developer CLI",
    description:
      "Command-line window framing whoami, role spec, and direct shell entry into the canvas.",
    accent: "#10B981",
  },
  {
    id: "template18",
    name: "Swiss Grid Architect",
    tag: "International",
    description:
      "Strict hairline grid structure with asymmetric typographic hierarchy and red focal accents.",
    accent: "#DC2626",
  },
  {
    id: "template19",
    name: "Gradient Aurora Glass",
    tag: "Aurora Card",
    description:
      "Centered frosted showcase card floating over controlled indigo and cyan aurora lighting.",
    accent: "#6366F1",
  },
  {
    id: "template20",
    name: "Minimalist Resume Sheet",
    tag: "Executive CV",
    description:
      "Crisp document-style introduction card structured for recruiters and hiring managers.",
    accent: "#4F46E5",
  },
  {
    id: "template21",
    name: "Dark Monolith",
    tag: "Monochrome",
    description:
      "High-contrast monochrome studio cover with oversized stacked name typography.",
    accent: "#52525B",
  },
  {
    id: "template22",
    name: "Research Academic",
    tag: "Scholar Dossier",
    description:
      "Two-pane academic dossier crafted for university students, researchers, and fellowships.",
    accent: "#0D9488",
  },
];

export const CAREER_TRACKS = [
  {
    id: "software_developer",
    label: "Software Developer",
    category: "Engineering",
    frontpageTemplate: "template17",
    palette: {
      theme: "dark-obsidian",
      primary: "#6366F1",
      secondary: "#06B6D4",
      background: "#0B0D12",
      surface: "#12151C",
    },
    font: "'Space Grotesk', sans-serif",
    headline: "Software Engineer & Systems Builder",
    summary:
      "Built for backend, systems, and application engineers with repository links, architecture notes, and technical skills.",
    recommendedSections: ["hero", "about", "projects_grid", "skills", "experience", "education", "contact"],
  },
  {
    id: "fullstack_developer",
    label: "Full-Stack Developer",
    category: "Engineering",
    frontpageTemplate: "template2",
    palette: {
      theme: "midnight-blue",
      primary: "#3B82F6",
      secondary: "#10B981",
      background: "#0A0F1C",
      surface: "#111827",
    },
    font: "'Plus Jakarta Sans', sans-serif",
    headline: "Full-Stack Developer | React & Django",
    summary:
      "Highlights end-to-end web products, REST APIs, deployment pipelines, and live product demos.",
    recommendedSections: ["hero", "about", "projects_grid", "experience", "skills", "certifications", "contact"],
  },
  {
    id: "data_engineer",
    label: "Data Engineer",
    category: "Data & Analytics",
    frontpageTemplate: "template6",
    palette: {
      theme: "dark-emerald",
      primary: "#10B981",
      secondary: "#38BDF8",
      background: "#091110",
      surface: "#101B19",
    },
    font: "'IBM Plex Sans', sans-serif",
    headline: "Data Engineer | ETL, Warehousing & Streaming",
    summary:
      "Focused on data pipelines, warehouse schemas, Spark/Airflow orchestration, and measurable throughput wins.",
    recommendedSections: ["hero", "stats", "projects_grid", "skills", "experience", "certifications", "contact"],
  },
  {
    id: "ai_ml_developer",
    label: "AI / ML Developer",
    category: "Artificial Intelligence",
    frontpageTemplate: "template12",
    palette: {
      theme: "neural-violet",
      primary: "#8B5CF6",
      secondary: "#22D3EE",
      background: "#0B0A14",
      surface: "#141225",
    },
    font: "'Sora', sans-serif",
    headline: "AI / ML Engineer | Applied LLMs & Computer Vision",
    summary:
      "Showcases model evaluations, RAG architectures, research papers, benchmarks, and inference services.",
    recommendedSections: ["hero", "about", "projects_grid", "skills", "blog", "achievements", "contact"],
  },
  {
    id: "designer",
    label: "Product & UI/UX Designer",
    category: "Design",
    frontpageTemplate: "template16",
    palette: {
      theme: "editorial-stone",
      primary: "#EC4899",
      secondary: "#F59E0B",
      background: "#FAF8F5",
      surface: "#FFFFFF",
    },
    font: "'Playfair Display', serif",
    headline: "Product & UI/UX Designer",
    summary:
      "Editorial spacing for case studies, user research process, design systems, and visual prototypes.",
    recommendedSections: ["hero", "about", "services", "projects_grid", "experience", "contact"],
  },
  {
    id: "engineering_student",
    label: "Engineering Student",
    category: "Students & Grads",
    frontpageTemplate: "template20",
    palette: {
      theme: "dark-obsidian",
      primary: "#4F46E5",
      secondary: "#0EA5E9",
      background: "#0B0D12",
      surface: "#131722",
    },
    font: "'Inter', sans-serif",
    headline: "B.E. / B.Tech Engineering Student & Builder",
    summary:
      "Structured for internships and placements with coursework, hackathon wins, academic projects, and certifications.",
    recommendedSections: ["hero", "education", "projects_grid", "skills", "achievements", "certifications", "contact"],
  },
  {
    id: "arts_science_student",
    label: "Arts & Science Student",
    category: "Students & Grads",
    frontpageTemplate: "template22",
    palette: {
      theme: "warm-parchment",
      primary: "#0D9488",
      secondary: "#6366F1",
      background: "#F8FAFC",
      surface: "#FFFFFF",
    },
    font: "'Lora', serif",
    headline: "Arts & Science Undergraduate | Research & Creative Portfolio",
    summary:
      "Adapted for B.A., B.Sc., and liberal arts students showcasing research papers, publications, honors, and campus leadership.",
    recommendedSections: ["hero", "about", "education", "blog", "achievements", "skills", "contact"],
  },
];

export function getCareerTrackById(id) {
  return CAREER_TRACKS.find((t) => t.id === id) || CAREER_TRACKS[0];
}
