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
    experience: 30,
    education: 40,
    skills: 50,
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

export const DEFAULT_SHOWCASE_SECTIONS = [
    {
        id: "showcase-hero",
        section_type: "hero",
        order: 10,
        content_data: {
            heading: "BHARANIDHARAN MARIAPPAN",
            subheading: "FULL STACK DEVELOPER",
            liveUrl: "",
            linkedin: "https://linkedin.com",
            github: "https://github.com"
        }
    },
    {
        id: "showcase-about",
        section_type: "about",
        order: 20,
        content_data: {
            bio: "Final-year Computer Science Engineering student and Python Full-Stack Developer with hands-on experience building interactive web applications, scalable backends, and AI-powered interfaces."
        }
    },
    {
        id: "showcase-experience",
        section_type: "experience",
        order: 30,
        content_data: {
            items: [
                {
                    title: "Junior Full Stack Developer",
                    company: "Tech Innovations",
                    dates: "2023 - 2024",
                    description: "Developed modern responsive React interfaces, optimized Django REST APIs, and managed full-stack deployment pipelines."
                }
            ]
        }
    },
    {
        id: "showcase-education",
        section_type: "education",
        order: 40,
        content_data: {
            schools: [
                {
                    institution: "MOUNT ZION COLLEGE OF ENGINEERING",
                    degree: "B.E. COMPUTER SCIENCE AND ENGINEERING",
                    dates: "2021 - 2025"
                }
            ]
        }
    },
    {
        id: "showcase-skills",
        section_type: "skills",
        order: 50,
        content_data: {
            items: [
                { name: "Python", level: 90 },
                { name: "JavaScript", level: 85 },
                { name: "React", level: 85 },
                { name: "Django", level: 80 },
                { name: "HTML5 & CSS3", level: 90 },
                { name: "Tailwind CSS", level: 85 },
                { name: "REST APIs", level: 80 }
            ]
        }
    },
    {
        id: "showcase-projects",
        section_type: "projects_grid",
        order: 60,
        content_data: {
            title: "Showcase of Innovations",
            projects: [
                {
                    title: "Bharani's Bistro",
                    desc: "Interactive restaurant web platform with dynamic menu ordering, table booking, and real-time order tracking.",
                    tags: ["React", "Django", "Tailwind CSS"],
                    projectUrl: "",
                    githubUrl: "https://github.com"
                },
                {
                    title: "AuraBuild Portfolio Engine",
                    desc: "Intelligent portfolio builder with multi-agent layout generation, live canvas editing, and dynamic ATS resume export.",
                    tags: ["React", "Python", "Vite"],
                    projectUrl: "",
                    githubUrl: "https://github.com"
                }
            ]
        }
    },
    {
        id: "showcase-contact",
        section_type: "contact",
        order: 120,
        content_data: {
            text: "Let's connect — reach me via email or any of my channels below.",
            email: "bharanidharan2005@gmail.com",
            phone: "",
            linkedin: "https://linkedin.com",
            github: "https://github.com"
        }
    }
];

