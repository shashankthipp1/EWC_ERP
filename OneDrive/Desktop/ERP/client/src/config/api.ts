/** Live backend on Render */
export const RENDER_API_URL = "https://erp-1-3f4g.onrender.com/api";

/**
 * API base URL:
 * - VITE_API_URL in .env overrides everything
 * - Dev → local server
 * - Production on Render → same-origin /api
 * - Production elsewhere → Render API URL
 */
export function getApiBaseUrl(): string {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL.replace(/\/$/, "");
  }
  if (import.meta.env.DEV) {
    return "http://localhost:5000/api";
  }
  if (typeof window !== "undefined" && window.location.hostname.endsWith("onrender.com")) {
    return "/api";
  }
  return RENDER_API_URL;
}
