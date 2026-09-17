import os
from dotenv import load_dotenv
from google import genai

load_dotenv()

keys = os.environ.get("GEMINI_API_KEYS", "").split(",")
if not keys or not keys[0]:
    key = os.environ.get("GEMINI_API_KEY", "")
    if key:
        keys = [key]
    else:
        print("NO KEYS")
        exit()

client = genai.Client(api_key=keys[0].strip(), http_options={'api_version': 'v1alpha'})
try:
    for model in client.models.list():
        if "gemini" in model.name:
            print(model.name)
except Exception as e:
    print(f"Error: {e}")
