import os

with open('api/views.py', 'r', encoding='utf-8') as f:
    lines = f.readlines()

def write_file(filename, ranges):
    with open(f'api/views/{filename}', 'w', encoding='utf-8') as f:
        f.writelines(lines[0:31]) # common imports
        
        # Cross imports to maintain functionality
        if filename == 'pages.py':
            f.write("from .utils import *\n")
        if filename == 'ai.py':
            f.write("from .utils import *\n")
        if filename == 'resume.py':
            f.write("from .utils import *\n")
            f.write("from .ai import *\n")
            
        for r in ranges:
            f.writelines(lines[r[0]-1:r[1]])

os.makedirs('api/views', exist_ok=True)

# utils.py: 111-180 (helpers), 302-396 (Contact, Deploy), 916-1052 (Media, Workspace Key)
write_file('utils.py', [(111, 180), (302, 396), (916, 1052)])

# ai.py: 32-110 (gemini), 413-504 (refinement), 659-915 (logs, template, review, image)
write_file('ai.py', [(32, 110), (413, 504), (659, 915)])

# pages.py: 181-301 (page crud, section crud), 397-412 (pagedetail delete)
write_file('pages.py', [(181, 301), (397, 412)])

# resume.py: 505-658 (resume parse)
write_file('resume.py', [(505, 658)])

# __init__.py
with open('api/views/__init__.py', 'w', encoding='utf-8') as f:
    f.write("from .utils import *\n")
    f.write("from .ai import *\n")
    f.write("from .pages import *\n")
    f.write("from .resume import *\n")

print("Successfully split views.py into api/views/")
