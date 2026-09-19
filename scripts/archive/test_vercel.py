import os
import requests
from dotenv import load_dotenv

load_dotenv("backend/.env")

token = os.getenv("VERCEL_TOKEN")
if not token:
    print("No VERCEL_TOKEN found in backend/.env")
else:
    print(f"Token found: {token[:5]}...{token[-5:]}")
    
    # Test authentication
    user_resp = requests.get('https://api.vercel.com/v2/user', headers={'Authorization': f'Bearer {token}'})
    if user_resp.status_code == 200:
        print("Token is valid! Authenticated as:", user_resp.json().get('user', {}).get('username'))
    else:
        print("Token is INVALID or EXPIRED:", user_resp.status_code, user_resp.text)
        
    # Try a dummy deployment request to see the exact 403 error
    payload = {
        'name': f'portfolio-{__import__("uuid").uuid4().hex[:8]}', 
        'files': [{'file': 'index.html', 'data': '<h1>Hello</h1>'}],
        'projectSettings': {
            'framework': None,
        },
        'target': 'production',
    }
    
    deploy_resp = requests.post(
        'https://api.vercel.com/v13/deployments',
        headers={'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'},
        json=payload
    )
    
    print("\nDeployment Response Code:", deploy_resp.status_code)
    print("Deployment Response Body:", deploy_resp.text)
