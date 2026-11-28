import { API } from "../api";

const SESSION_KEY_STORAGE = "aurabuild_session_id";

/**
 * Emit validated, allowlisted client activity events only when a user session exists.
 * Never throws or blocks UX.
 */
export function trackClientActivity(eventName, metadata = {}) {
  try {
    if (typeof window === "undefined") return;
    if (!localStorage.getItem("aurabuild_is_logged_in")) return;
    API.post("activity/track/", {
      event_name: eventName,
      metadata,
    }).catch(() => {});
  } catch {
    // Non-blocking telemetry
  }
}

export function getOrCreateSessionKey() {
  try {
    if (typeof window === "undefined") return "";
    let existing = sessionStorage.getItem(SESSION_KEY_STORAGE);
    if (existing && /^[a-zA-Z0-9_-]{8,64}$/.test(existing)) {
      return existing;
    }
    const generated =
      typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : `ab_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    sessionStorage.setItem(SESSION_KEY_STORAGE, generated);
    return generated;
  } catch {
    return `ab_${Date.now()}`;
  }
}

export function clearSessionKey() {
  try {
    sessionStorage.removeItem(SESSION_KEY_STORAGE);
  } catch {
    // Ignore storage failures
  }
}

export function sendSessionHeartbeat({ sessionKey, activeSeconds = 0, pagePath = "", keepalive = false }) {
  try {
    if (typeof window === "undefined") return;
    if (!localStorage.getItem("aurabuild_is_logged_in")) return;
    if (!sessionKey) return;

    const payload = {
      session_key: sessionKey,
      active_seconds: Math.max(0, Math.min(90, Math.round(activeSeconds))),
      page_path: pagePath || window.location.pathname || "/",
    };

    if (keepalive && typeof fetch === "function") {
      const base = (API.defaults.baseURL || "/api/").replace(/\/?$/, "/");
      const headers = { "Content-Type": "application/json" };
      try {
        const token = sessionStorage.getItem("aurabuild_access_token");
        if (token) headers.Authorization = `Bearer ${token}`;
      } catch {
        // Ignore storage errors
      }
      fetch(`${base}activity/heartbeat/`, {
        method: "POST",
        credentials: "include",
        keepalive: true,
        headers,
        body: JSON.stringify(payload),
      }).catch(() => {});
      return;
    }

    API.post("activity/heartbeat/", payload).catch(() => {});
  } catch {
    // Non-blocking telemetry
  }
}
