import { useState } from "react"

export function CenterCanvas({ blocks, onBlockClick }) {
  const [theme, setTheme] = useState("light")
  const isMobile = window.innerWidth < 768

  // Sample placeholder data with actual styled components
  const placeholderSections = [
    {
      id: "hero",
      title: "Alex Johnson",
      subtitle: "Full-Stack Developer & Designer",
      tagline: "Building intelligent digital experiences",
    },
    {
      id: "education",
      title: "Educational Background",
      degree: "M.S. Computer Science",
      institution: "Stanford University",
      year: "2021",
    },
    {
      id: "expertise",
      title: "Core Expertise",
      areas: ["React & Vue", "Tailwind CSS", "Node.js", "AI & ML", "Figma"],
    },
    {
      id: "experience",
      title: "Professional Experience",
      roles: [
        {
          company: "TechCorp Inc.",
          position: "Senior Developer",
          duration: "2022 - Present",
          description: "Leading team of 5 in building scalable web applications.",
        },
        {
          company: "StartupXYZ",
          position: "Junior Developer",
          duration: "2020 - 2022",
          description: "Built responsive interfaces and optimized performance.",
        },
      ],
    },
    {
      id: "projects",
      title: "Featured Projects",
      items: [
        { name: "Aurora UI", link: "#", tag: "React + Tailwind" },
        { name: "Nexus Dashboard", link: "#", tag: "Next.js + Drizzle" },
        { name: "MetaFlow", link: "#", tag: "Node.js + PostgreSQL" },
      ],
    },
    {
      id: "contact",
      title: "Get in Touch",
      fields: [
        { label: "Email", type: "email", placeholder: "you@email.com" },
        { label: "GitHub", type: "text", placeholder: "github.com/username" },
        { label: "LinkedIn", type: "text", placeholder: "linkedin.com/in/..." },
      ],
    },
  ]

  const renderedSections = placeholderSections.map((section) => {
    switch (section.id) {
      case "hero": {
        return (
          <div
            key={section.id}
            className="p-6 mb-6 rounded-xl border border-border bg-card/50 backdrop-blur transition-all hover:shadow-lg cursor-pointer"
            onClick={() => onBlockClick(section.id)}
          >
            <h2 className="text-2xl font-bold mb-1">{section.title}</h2>
            <p className="text-sm text-muted-foreground mb-2">{section.subtitle}</p>
            <p className="text-sm capitalize">{section.tagline}</p>
          </div>
        )
      }
      case "education": {
        return (
          <div
            key={section.id}
            className="p-6 mb-6 rounded-xl border border-border bg-card/50 backdrop-blur transition-all hover:shadow-lg cursor-pointer"
            onClick={() => onBlockClick(section.id)}
          >
            <h2 className="text-2xl font-bold mb-4">{section.title}</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium">Degree</p>
                <p className="text-lg font-bold">{section.degree}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Institution</p>
                <p className="text-lg font-bold">{section.institution}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Graduation</p>
                <p className="text-lg font-bold">{section.year}</p>
              </div>
            </div>
          </div>
        )
      }
      case "expertise": {
        return (
          <div
            key={section.id}
            className="p-6 mb-6 rounded-xl border border-border bg-card/50 backdrop-blur transition-all hover:shadow-lg cursor-pointer"
            onClick={() => onBlockClick(section.id)}
          >
            <h2 className="text-2xl font-bold mb-4">{section.title}</h2>
            <div className="grid grid-cols-2 gap-2">
              {section.areas.map((area) => (
                <span
                  key={area}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded bg-primary/10 text-sm text-primary"
                >
                  {area}
                </span>
              ))}
            </div>
          </div>
        )
      }
      case "experience": {
        return (
          <div
            key={section.id}
            className="p-6 mb-6 rounded-xl border border-border bg-card/50 backdrop-blur transition-all hover:shadow-lg cursor-pointer"
            onClick={() => onBlockClick(section.id)}
          >
            <h2 className="text-2xl font-bold mb-4">{section.title}</h2>
            <div className="space-y-3">
              {section.roles.map((role) => (
                <div className="p-3 rounded bg-secondary/5 border-b">
                  <div className="flex justify-between text-sm mb-1">
                    <span>{role.company}</span>
                    <span>{role.position}</span>
                  </div>
                  <p className="text-muted-foreground text-sm">{role.duration}</p>
                  <p className="text-sm">{role.description}</p>
                </div>
              ))}
            </div>
          </div>
        )
      }
      case "projects": {
        return (
          <div
            key={section.id}
            className="p-6 mb-6 rounded-xl border border-border bg-card/50 backdrop-blur transition-all hover:shadow-lg cursor-pointer"
            onClick={() => onBlockClick(section.id)}
          >
            <h2 className="text-2xl font-bold mb-4">{section.title}</h2>
            <div className="grid grid-cols-2 gap-3">
              {section.items.map((item) => (
                <div
                  key={item.name}
                  className="p-4 rounded bg-secondary border hover:border-primary transition-colors"
                >
                  <h3 className="font-medium">{item.name}</h3>
                  <p className="text-xs text-muted-foreground">{item.tag}</p>
                </div>
              ))}
            </div>
          </div>
        )
      }
      case "contact": {
        return (
          <div
            key={section.id}
            className="p-6 mb-6 rounded-xl border border-border bg-card/50 backdrop-blur transition-all hover:shadow-lg cursor-pointer"
            onClick={() => onBlockClick(section.id)}
          >
            <h2 className="text-2xl font-bold mb-4">{section.title}</h2>
            <div className="grid grid-cols-2 gap-4">
              {section.fields.map((field) => (
                <div key={field.label} className="space-y-1">
                  <p className="text-sm font-medium">{field.label}</p>
                  <input
                    type={field.type}
                    placeholder={field.placeholder}
                    readOnly
                    className="w-full px-3 py-1.5 rounded bg-secondary border"
                  />
                </div>
              ))}
            </div>
          </div>
        )
      }
      default:
        return null
    }
  })

  // Main canvas with page container
  return (
    <div
      className="relative flex-1 min-h-[calc(100vh_-_104px)] bg-gray-50 overflow-y-auto"
    >
      <div
        className="min-h-[calc(100vh_-_104px)] bg-white shadow-lg"
        style={{
          boxShadow: isMobile
            ? "0 4px 20px rgba(0,0,0,0.1)"
            : "0 4px 30px rgba(0,0,0,0.15)",
        }}
      >
        {/* Top padding for viewport header */}
        <div className="h-16" />

        {/* Canvas content */}
        <main className="px-6 py-8">
          {/* viewport info */}
          <div className="mb-6 text-sm text-muted-foreground flex items-center gap-2">
            <span>View: {viewport === "desktop" ? "Desktop" : viewport === "tablet" ? "Tablet" : "Mobile"}</span>
          </div>

          {/* Render placeholder sections - these replace the voids */}
          {renderedSections}

          {/* Add block button */}
          <button
            onClick={() => onBlockAdd("hero")}
            className="fixed bottom-6 right-6 bg-primary text-primary-foreground rounded-full p-2 hover:bg-primary/90 transition-colors"
            aria-label="Add new block"
          >
            +
          </button>
        </main>
      </div>
    </div>
  )
}