import type { CorsOptions } from "cors";

/** Default dev + preview origins (Vite). */
const DEFAULT_DEV_ORIGINS = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:4173",
  "http://127.0.0.1:4173",
  "http://localhost:5000",
  "http://127.0.0.1:5000"
];

/** Production API host — keep in sync with client PRODUCTION_API_HOST. */
export const PRODUCTION_APP_URL = "https://ewc-erp.onrender.com";

/** Known Netlify frontends (also allow any https://*.netlify.app). */
const DEFAULT_NETLIFY_ORIGINS = ["https://astonishing-kashata-db13f8.netlify.app"];

function normalizeOrigin(origin: string): string {
  return origin.trim().replace(/\/$/, "");
}

function parseOriginsFromEnv(): string[] {
  const raw = [process.env.CLIENT_URL, process.env.CORS_ORIGINS]
    .filter(Boolean)
    .join(",");

  return raw
    .split(",")
    .map(normalizeOrigin)
    .filter(Boolean);
}

export function buildAllowedOrigins(): Set<string> {
  const allowed = new Set<string>([
    ...DEFAULT_DEV_ORIGINS,
    PRODUCTION_APP_URL,
    ...DEFAULT_NETLIFY_ORIGINS,
    ...parseOriginsFromEnv()
  ]);
  return allowed;
}

export function logCorsPolicy(allowed: Set<string>): void {
  const fromEnv = parseOriginsFromEnv();
  console.info("[startup] CORS policy", {
    explicitOrigins: allowed.size,
    fromEnv: fromEnv.length ? fromEnv : "(none)",
    allowRenderSubdomains: true,
    allowNetlifySubdomains: true,
    netlifyDefaults: DEFAULT_NETLIFY_ORIGINS
  });
}

function isOnRenderHost(origin: string): boolean {
  try {
    const { hostname, protocol } = new URL(origin);
    return protocol === "https:" && (hostname.endsWith(".onrender.com") || hostname === "onrender.com");
  } catch {
    return false;
  }
}

/** Netlify preview/production deploys (e.g. *.netlify.app). */
function isNetlifyHost(origin: string): boolean {
  try {
    const { hostname, protocol } = new URL(origin);
    return protocol === "https:" && (hostname.endsWith(".netlify.app") || hostname === "netlify.app");
  } catch {
    return false;
  }
}

export function isOriginAllowed(origin: string | undefined, allowed: Set<string>): boolean {
  if (!origin) return true;
  const normalized = normalizeOrigin(origin);
  if (allowed.has(normalized)) return true;
  if (isOnRenderHost(normalized)) return true;
  if (isNetlifyHost(normalized)) return true;
  return false;
}

export function createCorsOptions(allowed: Set<string>): CorsOptions {
  return {
    origin(origin, callback) {
      if (!origin) {
        return callback(null, true);
      }

      const normalized = normalizeOrigin(origin);

      if (isOriginAllowed(normalized, allowed)) {
        return callback(null, normalized);
      }

      console.warn("[CORS] Blocked request from origin:", normalized, {
        allowedCount: allowed.size,
        hint: "Add this URL to CLIENT_URL on Render (comma-separated)"
      });
      return callback(new Error(`CORS: origin not allowed — ${normalized}`));
    },
    credentials: true,
    methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    exposedHeaders: ["Content-Length", "Content-Type"],
    optionsSuccessStatus: 204,
    maxAge: 86400
  };
}
