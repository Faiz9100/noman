import axios, { AxiosError, AxiosInstance } from "axios";
import { API_BASE_URL } from "../utils/constants";

/**
 * Central Axios instance. All service modules should import this
 * instead of creating their own axios calls, so base URL, auth headers,
 * and error handling stay consistent across the app.
 */
export const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // send the httpOnly auth cookie
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Attach bearer token from localStorage as a fallback auth path
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

type RetryableConfig = import("axios").InternalAxiosRequestConfig & { _retried?: boolean };

// Normalize error messages so calling code can rely on a single shape. A cold
// Render free-tier instance can take 30-50s to wake from idle, which shows up
// as a plain network error/timeout on the very first call — one silent retry
// (GET only — safe to repeat) papers over that instead of surfacing a scary
// error for something that resolves itself a few seconds later.
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<{ message?: string }>) => {
    const config = error.config as RetryableConfig | undefined;
    const isNetworkOrTimeout = !error.response;
    const isRetryableMethod = config?.method?.toLowerCase() === "get";

    if (isNetworkOrTimeout && isRetryableMethod && config && !config._retried) {
      config._retried = true;
      await new Promise((resolve) => setTimeout(resolve, 1500));
      return api.request(config);
    }

    const message = isNetworkOrTimeout
      ? "Can't reach the server. Check your internet connection, or the server may be starting up — try again in a moment."
      : error.response?.data?.message || error.message || "Something went wrong. Please try again.";
    return Promise.reject(new Error(message));
  }
);
