# AuraBuild — Frontend

AI-powered portfolio builder. React 19 + Vite + Tailwind CSS v4.

## Setup

```bash
npm install
npm run dev
```

The dev server runs on `http://localhost:5173`.

## Environment

| Variable         | Purpose                                                        | Default                                             |
| ---------------- | -------------------------------------------------------------- | --------------------------------------------------- |
| `VITE_API_URL`   | Base URL of the Django API (used by `src/api.js`)              | `https://aurabuild-backend.onrender.com/api/`        |

## Scripts

```bash
npm run dev      # start the Vite dev server
npm run build    # production build into dist/
npm run preview  # preview the production build
npm run lint     # run ESLint
```

## Project layout

```
src/
  api.js                      # axios instance + JWT refresh interceptor
  App.jsx                     # onboarding state machine + workspace shell
  components/
    LandingPage.jsx           # marketing landing page
    LeftNavSidebar.jsx        # pages tree + AI tool switcher
    AIRefinementPanel.jsx     # AI studio, property editor, HTML export
    PipelineBar.jsx           # onboarding step indicator
  canvas/
    CanvasContainer.jsx       # live responsive preview frame
    RenderPageContent.jsx     # section renderers (hero, about, skills, ...)
    themes.js                 # portfolio theme definitions
```

The app talks to the Django backend (`/api/`) using JWT auth. On login the user
receives an email + OTP on signup and a permanent "workspace code" used for
subsequent logins (email + code, or email + password).

## Deployment

Static host with SPA fallback (see `vercel.json`). The `api.js` base URL points
at the deployed Render backend; override with `VITE_API_URL` if needed.