export const SECTION_LABELS = {
    hero: "Hero",
    about: "About Me",
    education: "Education",
    skills: "Skills",
    projects_grid: "Projects",
    contact: "Contact",
    experience: "Experience",
    services: "Services",
    testimonials: "Testimonials",
    certifications: "Certifications",
    stats: "Statistics",
    blog: "Blog",
};

export const SECTION_ORDER_WEIGHTS = {
    hero: 10,
    about: 20,
    education: 30,
    skills: 40,
    experience: 50,
    projects_grid: 60,
    services: 70,
    certifications: 80,
    testimonials: 90,
    stats: 100,
    blog: 110,
    contact: 120,
};

export const DEFAULT_BLOCK_DATA = {
    hero: { heading: "Your Name", subheading: "Professional Headline" },
    about: { bio: "Write about yourself..." },
    education: { schools: [] },
    skills: { items: [] },
    projects_grid: { title: "Showcase of Innovations", projects: [] },
    contact: { text: "Let's connect — reach me via email or any of my channels below." },
    experience: { items: [] },
    services: { items: [] },
    testimonials: { items: [] },
    certifications: { items: [] },
    stats: { items: [] },
    blog: { articles: [] }
};
