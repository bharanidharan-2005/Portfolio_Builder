import re

with open('api/tests.py', 'r', encoding='utf-8') as f:
    content = f.read()

content = re.sub(r"patch\('api\.views\.send_mail'\)", r"patch('api.views.utils.send_mail')", content)
content = re.sub(r"patch\('api\.views\.get_gemini_clients'\)", r"patch('api.views.ai.get_gemini_clients')", content)
content = re.sub(r"patch\('api\.views\.generate_text_with_fallback'\)", r"patch('api.views.ai.generate_text_with_fallback')", content)
content = re.sub(r"patch\('api\.views\.extract_clean_json_payload'\)", r"patch('api.views.ai.extract_clean_json_payload')", content)
content = re.sub(r"patch\('api\.views\._generate_gemini_image'\)", r"patch('api.views.ai._generate_gemini_image')", content)
content = re.sub(r"patch\('api\.views\._generate_imagen_image'\)", r"patch('api.views.ai._generate_imagen_image')", content)
content = re.sub(r"patch\('api\.views\._save_generated_image'\)", r"patch('api.views.ai._save_generated_image')", content)

with open('api/tests.py', 'w', encoding='utf-8') as f:
    f.write(content)

print("Tests patched successfully!")
