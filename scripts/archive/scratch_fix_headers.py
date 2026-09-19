import re

with open("frontend/src/canvas/RenderPageContent.jsx", "r", encoding="utf-8") as f:
    content = f.read()

# Define the new sticky header template
header_template = """<div className={`sticky top-0 sm:top-[60px] z-40 w-[calc(100%+2rem)] -ml-4 sm:w-[calc(100%+4rem)] sm:-ml-8 px-4 sm:px-8 py-4 mb-8 backdrop-blur-2xl bg-black/40 border-b shadow-lg transition-all ${borderClass}`}>
                        <motion.h2 
                            initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: false }}
                            className={`text-xl md:text-2xl uppercase font-black tracking-widest ${accentText}`}
                        >
                            %%TEXT%%
                        </motion.h2>
                    </div>"""

center_header_template = """<div className={`sticky top-0 sm:top-[60px] z-40 w-[calc(100%+2rem)] -ml-4 sm:w-[calc(100%+4rem)] sm:-ml-8 px-4 sm:px-8 py-4 mb-12 backdrop-blur-2xl bg-black/40 border-b shadow-lg transition-all ${borderClass}`}>
                        <motion.h2 
                            initial={{ opacity: 0, y: -20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: false }}
                            className={`text-xl md:text-2xl uppercase font-black tracking-widest text-center ${accentText}`}
                        >
                            %%TEXT%%
                        </motion.h2>
                    </div>"""

# 1. About Me
content = content.replace(
    """<h2 className={`sticky top-[100px] z-30 py-4 backdrop-blur-xl bg-transparent text-2xl md:text-3xl uppercase font-black tracking-widest ${accentText}`}>
                                About Me
                            </h2>""",
    header_template.replace("%%TEXT%%", "About Me")
)

# 2. Educational Background
content = content.replace(
    """<h2 className={`sticky top-[100px] z-30 py-4 backdrop-blur-xl bg-transparent text-2xl md:text-3xl uppercase font-black tracking-widest ${accentText}`}>
                        Educational Background
                    </h2>""",
    header_template.replace("%%TEXT%%", "Educational Background")
)

# 3. Core Expertise
content = content.replace(
    """<h2 className={`sticky top-[100px] z-30 py-4 backdrop-blur-xl bg-transparent text-2xl md:text-3xl uppercase font-black tracking-widest text-center mb-12 ${accentText}`}>
                        Core Expertise
                    </h2>""",
    center_header_template.replace("%%TEXT%%", "Core Expertise")
)

# 4. Projects Section
content = re.sub(
    r'<motion\.h2[^>]*>\s*\{data\.title \|\| "Showcase of Innovations"\}\s*</motion\.h2>',
    center_header_template.replace("%%TEXT%%", '{data.title || "Showcase of Innovations"}'),
    content
)


with open("frontend/src/canvas/RenderPageContent.jsx", "w", encoding="utf-8") as f:
    f.write(content)

print("Headers updated.")
