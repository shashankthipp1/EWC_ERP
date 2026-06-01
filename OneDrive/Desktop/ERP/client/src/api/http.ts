import axios, { isAxiosError } from "axios";
import { getApiBaseUrl, logApiConfig } from "../config/api";

const baseURL = getApiBaseUrl();
logApiConfig();

export const api = axios.create({
  baseURL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json"
  }
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("erp_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (isAxiosError(error)) {
      const isNetwork = !error.response;
      const isCorsLikely =
        isNetwork &&
        typeof window !== "undefined" &&
        Boolean(error.config?.baseURL) &&
        !error.config?.baseURL?.startsWith(window.location.origin);

      if (isCorsLikely || (isNetwork && import.meta.env.DEV)) {
        console.error("[api] request failed", {
          baseURL: error.config?.baseURL,
          url: error.config?.url,
          method: error.config?.method,
          pageOrigin: typeof window !== "undefined" ? window.location.origin : "(ssr)",
          hint: isCorsLikely
            ? "Possible CORS or wrong API URL. Set CLIENT_URL on the server and VITE_API_URL on the client build."
            : "Network error — check API is running and reachable."
        });
      }
    }

    if (error.response?.status === 401) {
      localStorage.removeItem("erp_token");
      localStorage.removeItem("erp_user");
      window.dispatchEvent(new Event("erp:session-expired"));
    }
    return Promise.reject(error);
  }
);
