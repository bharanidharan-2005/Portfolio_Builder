const CORE_LOADED_FONTS = new Set([
  "Inter",
  "JetBrains Mono",
  "Plus Jakarta Sans",
  "Space Grotesk",
  "system-ui",
]);

const requestedFonts = new Set();

export function ensureGoogleFontLoaded(fontValue) {
  if (typeof document === "undefined" || !fontValue) return;
  const match = String(fontValue).match(/^['"]?([^,'"]+)['"]?/);
  const family = match?.[1]?.trim();
  if (!family || CORE_LOADED_FONTS.has(family) || requestedFonts.has(family)) {
    return;
  }
  requestedFonts.add(family);
  const slug = encodeURIComponent(family).replace(/%20/g, "+");
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = `https://fonts.googleapis.com/css2?family=${slug}:wght@400;500;600;700&display=swap`;
  document.head.appendChild(link);
}

