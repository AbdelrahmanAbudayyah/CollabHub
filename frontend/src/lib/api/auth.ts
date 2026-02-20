import apiClient, { setAccessToken } from "./client";
import { ApiResponse } from "../types/api";

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface UserData {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  profilePicUrl: string | null;
}

export interface AuthResponseData {
  accessToken: string;
  expiresIn: number;
  user: UserData;
}

export async function register(data: RegisterData): Promise<ApiResponse<UserData>> {
  const response = await apiClient.post<ApiResponse<UserData>>("/auth/register", data);
  return response.data;
}

export async function login(email: string, password: string): Promise<AuthResponseData> {
  const response = await apiClient.post<ApiResponse<AuthResponseData>>("/auth/login", {
    email,
    password,
  });
  const data = response.data.data;
  setAccessToken(data.accessToken);
  return data;
}

/**
 * Module-level variable that holds the in-flight refresh promise.
 *
 * Why? React 18 Strict Mode double-mounts components in development,
 * so the AuthContext useEffect fires tryRefresh() TWICE almost at the
 * same time. Both calls send the SAME refresh token cookie. The backend
 * uses token rotation — the first call revokes the old token and issues
 * a new one. The second call then fails because the old token is already
 * revoked → "Invalid or expired refresh token".
 *
 * By storing the in-flight promise, the second call reuses the first
 * call's result instead of making a separate API request. When the
 * first call resolves, both callers get the same response.
 */
let inflightRefresh: Promise<AuthResponseData> | null = null;

export async function refreshToken(): Promise<AuthResponseData> {
  // If a refresh is already in progress, return the same promise
  // so both callers share one API call
  if (inflightRefresh) {
    return inflightRefresh;
  }

  inflightRefresh = apiClient
    .post<ApiResponse<AuthResponseData>>("/auth/refresh")
    .then((response) => {
      const data = response.data.data;
      setAccessToken(data.accessToken);
      return data;
    })
    .finally(() => {
      // Clear the ref so future refreshes make a new request
      inflightRefresh = null;
    });

  return inflightRefresh;
}

export async function logout(): Promise<void> {
  try {
    await apiClient.post("/auth/logout");
  } finally {
    setAccessToken(null);
  }
}
