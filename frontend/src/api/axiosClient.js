// src/api/axiosClient.js
import axios from "axios";
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000",
  withCredentials: true
});

api.interceptors.request.use(
  (config) => {
    if (config.url && config.url.startsWith("/api/auth/")) {
      return config;
    }

    const stored = localStorage.getItem("auth"); 
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed.token) {
          config.headers.Authorization = `Bearer ${parsed.token}`;
        }
      } catch (e) {
        console.error("Failed to parse auth from localStorage", e);
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.warn("Token expired or invalid. Clearing auth and redirecting to login.");
      localStorage.removeItem("auth");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default api;