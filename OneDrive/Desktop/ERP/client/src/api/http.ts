import axios from "axios";
import { getApiBaseUrl } from "../config/api";

export const api = axios.create({
  baseURL: getApiBaseUrl()
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("erp_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("erp_token");
      localStorage.removeItem("erp_user");
      window.dispatchEvent(new Event("erp:session-expired"));
    }
    return Promise.reject(error);
  }
);
