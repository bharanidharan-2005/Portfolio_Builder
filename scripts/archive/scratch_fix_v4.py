import re

with open("backend/api/views/utils.py", "r", encoding="utf-8") as f:
    up = f.read()

old_err = """            if resp.status_code >= 400:
                logger.warning("Vercel deployment rejected: %s", resp.text[:300])
                return Response(
                    {'error': f'Vercel rejected the deployment ({resp.status_code}). Check your token/project configuration.'},
                    status=502,
                )"""

new_err = """            if resp.status_code >= 400:
                logger.warning("Vercel deployment rejected: %s", resp.text[:300])
                err_msg = f'Vercel rejected the deployment ({resp.status_code}). '
                if resp.status_code == 403:
                    err_msg += 'Your VERCEL_TOKEN in backend/.env is invalid or restricted. Please create a new Vercel token with "Full Account" scope.'
                else:
                    err_msg += 'Check your token/project configuration.'
                return Response({'error': err_msg}, status=502)"""

if old_err in up:
    up = up.replace(old_err, new_err)
else:
    print("WARNING: old_err not found in utils.py")

with open("backend/api/views/utils.py", "w", encoding="utf-8") as f:
    f.write(up)

print("Backend error message updated.")
