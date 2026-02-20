import axios from "axios";

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1",
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

// In-memory access token storage
let accessToken: string | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
}

export function getAccessToken(): string | null {
  return accessToken;
}

// Request interceptor: attach access token
apiClient.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

/**
 * Response interceptor: handle 401 → refresh → retry.
 *
 * When any API call returns 401 (access token expired), we:
 * 1. Call refreshToken() to get a new access token
 * 2. Retry the original request with the new token
 *
 * We import refreshToken lazily (inside the handler) to avoid a
 * circular dependency: client.ts ← auth.ts ← client.ts.
 * The dynamic import() only runs when a 401 actually happens,
 * and JavaScript caches modules so it's effectively free.
 */
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes("/auth/")
    ) {
      originalRequest._retry = true;

      try {
        // Lazy import avoids circular dependency (client → auth → client)
        const { refreshToken } = await import("./auth");
        const data = await refreshToken();

        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
        return apiClient(originalRequest);
      } catch {
        setAccessToken(null);
        window.location.href = "/login";
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
