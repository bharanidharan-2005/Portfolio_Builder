import os

file_path = "frontend/src/canvas/RenderPageContent.jsx"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Update Section Headers to be Sticky and larger
# The pattern is typically `<h2 className={`text-sm uppercase font-black tracking-widest ${accentText}`}>`
# Or `<h2 className={`text-sm uppercase font-black tracking-widest text-center mb-12 ${accentText}`}>`
content = content.replace(
    "<h2 className={`text-sm uppercase font-black tracking-widest ${accentText}`}",
    "<h2 className={`sticky top-[100px] z-30 py-4 backdrop-blur-xl bg-transparent text-2xl md:text-3xl uppercase font-black tracking-widest ${accentText}`}"
)

content = content.replace(
    "<h2 className={`text-sm uppercase font-black tracking-widest text-center mb-12 ${accentText}`}",
    "<h2 className={`sticky top-[100px] z-30 py-4 backdrop-blur-xl bg-transparent text-2xl md:text-3xl uppercase font-black tracking-widest text-center mb-12 ${accentText}`}"
)

# Replace any generic ones that we missed just in case (e.g. mb-6, mb-8)
import re
content = re.sub(
    r'<h2 className=\{`text-sm uppercase font-black tracking-widest (.*?)\$\{accentText\}`\}',
    r'<h2 className={`sticky top-[100px] z-30 py-4 backdrop-blur-xl bg-transparent text-2xl md:text-3xl uppercase font-black tracking-widest \1${accentText}`}',
    content
)

# 2. Increase base fonts
content = content.replace("text-base md:text-lg", "text-lg md:text-xl")
content = content.replace("text-base sm:text-lg", "text-lg md:text-xl")
content = content.replace("text-sm font-medium", "text-base font-medium")
content = content.replace("text-xs font-mono", "text-sm font-mono")
content = content.replace("text-xs uppercase", "text-sm uppercase")
content = content.replace("text-base font-bold uppercase", "text-lg font-bold uppercase")
content = content.replace("text-sm font-bold opacity-50", "text-base font-bold opacity-50")
content = content.replace("text-sm text-slate-400 font-medium", "text-base text-slate-400 font-medium")

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Done replacing.")
