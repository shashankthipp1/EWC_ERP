/** Production backend (fallback when VITE_API_URL is unset in production builds). */
export const PRODUCTION_API_HOST = "https://ewc-erp.onrender.com";

/**
 * Ensures the base URL ends with `/api` (Express mounts routes under /api).
 */
function normalizeApiBaseUrl(url: string): string {
  const trimmed = url.replace(/\/$/, "");
  return trimmed.endsWith("/api") ? trimmed : `${trimmed}/api`;
}

/**
 * API base URL for axios and fetch wrappers.
 * - VITE_API_URL in .env.development / .env.production / .env.local overrides everything
 * - Production fallback → PRODUCTION_API_HOST
 */
export function getApiBaseUrl(): string {
  const fromEnv = import.meta.env.VITE_API_URL?.trim();
  if (fromEnv) {
    return normalizeApiBaseUrl(fromEnv);
  }
  if (import.meta.env.PROD) {
    return normalizeApiBaseUrl(PRODUCTION_API_HOST);
  }
  throw new Error(
    "VITE_API_URL is not set. Use client/.env.development (local) or client/.env.local."
  );
}
