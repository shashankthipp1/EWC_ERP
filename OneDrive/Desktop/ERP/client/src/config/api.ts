/** Production API host when UI and API are on different origins. */
export const PRODUCTION_API_HOST = "https://ewc-erp.onrender.com";

/**
 * Ensures the base URL ends with `/api` (Express mounts routes under /api).
 */
function normalizeApiBaseUrl(url: string): string {
  const trimmed = url.trim().replace(/\/$/, "");
  if (!trimmed) return "/api";
  if (trimmed.startsWith("/")) {
    return trimmed.endsWith("/api") ? trimmed : `${trimmed}/api`.replace("//api", "/api");
  }
  return trimmed.endsWith("/api") ? trimmed : `${trimmed}/api`;
}

function sameOriginApiBase(): string | null {
  if (typeof window === "undefined") return null;
  return `${window.location.origin}/api`;
}

/**
 * API base URL for axios.
 * Priority:
 * 1. VITE_API_URL from env
 * 2. Production same-origin `/api` (monolith on Render — avoids CORS)
 * 3. PRODUCTION_API_HOST fallback
 */
export function getApiBaseUrl(): string {
  const fromEnv = import.meta.env.VITE_API_URL?.trim();
  if (fromEnv) {
    return normalizeApiBaseUrl(fromEnv);
  }

  if (import.meta.env.PROD) {
    const sameOrigin = sameOriginApiBase();
    if (sameOrigin) return sameOrigin;
    return normalizeApiBaseUrl(PRODUCTION_API_HOST);
  }

  throw new Error(
    "VITE_API_URL is not set. Use client/.env.development (local) or client/.env.local."
  );
}

/** Logged once in dev tools to verify deployment API target. */
export function logApiConfig(): void {
  if (!import.meta.env.DEV) return;
  console.info("[api] baseURL:", getApiBaseUrl());
}
