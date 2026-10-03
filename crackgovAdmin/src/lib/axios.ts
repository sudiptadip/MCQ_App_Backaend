import axios from "axios";
import { storage } from "../utils/storage";
import { STORAGE_KEYS } from "../constants";
import { getDeviceFingerprint } from "../utils/deviceFingerprint";

// Create a custom axios instance
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor: Attach Auth Token if it exists
api.interceptors.request.use(
  async (config) => {
    const token = storage.get<string>(STORAGE_KEYS.TOKEN);
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;

      const fingerprint = await getDeviceFingerprint();

      config.headers["X-Device-Fingerprint"] = fingerprint;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Response interceptor: Handle common errors (like 401 Unauthorized)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Logic for logout or refreshing token
      storage.remove(STORAGE_KEYS.TOKEN);
      storage.remove(STORAGE_KEYS.USER);
      window.location.href = "/login";
    } else if (error.response?.status === 403) {
      window.location.href = "/403";
    }
    return Promise.reject(error);
  },
);

export default api;
