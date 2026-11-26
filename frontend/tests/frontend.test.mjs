import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  CAREER_TRACKS,
  FRONTPAGE_LAYOUTS,
  getCareerTrackById,
} from "../src/utils/templatesCatalog.js";
import {
  DEFAULT_BLOCK_DATA,
  getRoleImage,
} from "../src/utils/constants.js";
import { PORTFOLIO_THEMES, PORTFOLIO_FONTS } from "../src/canvas/themes.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FRONTEND_ROOT = path.resolve(__dirname, "..");

test("career tracks catalog covers dev, design, and student paths with valid layouts", () => {
  const trackIds = new Set(CAREER_TRACKS.map((t) => t.id));
  const layoutIds = new Set(FRONTPAGE_LAYOUTS.map((l) => l.id));

  for (const required of [
    "software_developer",
    "fullstack_developer",
    "data_engineer",
    "ai_ml_developer",
    "designer",
    "engineering_student",
    "arts_science_student",
  ]) {
    assert.ok(trackIds.has(required), `Missing career track: ${required}`);
  }

  for (const track of CAREER_TRACKS) {
    assert.ok(track.label && track.summary);
    assert.ok(layoutIds.has(track.frontpageTemplate));
    assert.ok(Array.isArray(track.recommendedSections) && track.recommendedSections.length >= 5);
  }

  assert.equal(getCareerTrackById("unknown").id, CAREER_TRACKS[0].id);
});

test("constants provide block defaults including achievements and role images", () => {
  assert.ok("achievements" in DEFAULT_BLOCK_DATA);
  assert.ok("certifications" in DEFAULT_BLOCK_DATA);
  assert.ok(getRoleImage("AI / Machine Learning Engineer").includes("unsplash.com"));
  assert.ok(getRoleImage("UI/UX Product Designer").includes("unsplash.com"));
  assert.notEqual(
    getRoleImage("Software Engineer"),
    getRoleImage("UI/UX Designer")
  );
});

test("themes and fonts catalogs expose consistent entries", () => {
  assert.ok(PORTFOLIO_THEMES.modern_glass);
  assert.ok(Array.isArray(PORTFOLIO_FONTS) && PORTFOLIO_FONTS.length >= 10);
});

test("frontpage templates catalog exposes >= 20 layouts wired in PortfolioFrontpage and RightSidebar", () => {
  assert.ok(FRONTPAGE_LAYOUTS.length >= 20, `Expected >= 20 layouts, got ${FRONTPAGE_LAYOUTS.length}`);
  const frontpageSrc = fs.readFileSync(
    path.join(FRONTEND_ROOT, "src/components/portfolio/PortfolioFrontpage.jsx"),
    "utf8"
  );
  const sidebarSrc = fs.readFileSync(
    path.join(FRONTEND_ROOT, "src/components/layout/RightSidebar.jsx"),
    "utf8"
  );
  const leftSidebarSrc = fs.readFileSync(
    path.join(FRONTEND_ROOT, "src/components/LeftSidebar.jsx"),
    "utf8"
  );

  for (const layout of FRONTPAGE_LAYOUTS) {
    assert.ok(frontpageSrc.includes(`case '${layout.id}':`), `Missing case in PortfolioFrontpage: ${layout.id}`);
    assert.ok(sidebarSrc.includes(`id: "${layout.id}"`), `Missing template card in RightSidebar: ${layout.id}`);
  }
  assert.ok(/\bImage\b/.test(leftSidebarSrc.split('\n').slice(0, 12).join('\n')), "LeftSidebar must import Image icon from lucide-react");
});

test("App router defines dashboard, parameterized workspace, preview, and OAuth routes", () => {
  const appSrc = fs.readFileSync(path.join(FRONTEND_ROOT, "src/App.jsx"), "utf8");
  for (const expectedRoute of [
    'path="/dashboard"',
    'path="/workspace"',
    'path="/workspace/:portfolioId"',
    'path="/preview/:username"',
    'path="/github/callback"',
    "isAuthLoading",
  ]) {
    assert.ok(appSrc.includes(expectedRoute), `Missing in App.jsx: ${expectedRoute}`);
  }

  const githubCallbackSrc = fs.readFileSync(
    path.join(FRONTEND_ROOT, "src/components/GithubCallback.jsx"),
    "utf8"
  );
  assert.ok(githubCallbackSrc.includes("API.post('auth/social/'"), "GithubCallback should use shared API client");
  assert.ok(githubCallbackSrc.includes("exchangedCodeRef"), "GithubCallback should guard against StrictMode double exchange");

  const canvasSrc = fs.readFileSync(
    path.join(FRONTEND_ROOT, "src/canvas/CanvasContainer.jsx"),
    "utf8"
  );
  const indexCss = fs.readFileSync(
    path.join(FRONTEND_ROOT, "src/index.css"),
    "utf8"
  );
  assert.ok(canvasSrc.includes("aurabuild-canvas"), "CanvasContainer must isolate preview colors with .aurabuild-canvas");
  assert.ok(indexCss.includes(".aurabuild-canvas.aurabuild-canvas-light"), "index.css must support light canvas isolation");
  assert.equal(Boolean(PORTFOLIO_THEMES.minimal_executive.isLight), true);
  assert.equal(Boolean(PORTFOLIO_THEMES.modern_glass.isLight), false);
});

