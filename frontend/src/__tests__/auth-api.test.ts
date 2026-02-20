import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock axios before importing the modules that use it
vi.mock("axios", () => {
  const mockInstance = {
    post: vi.fn(),
    get: vi.fn(),
    defaults: { baseURL: "http://localhost:8080/api/v1" },
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() },
    },
  };
  return {
    default: {
      create: vi.fn(() => mockInstance),
      post: vi.fn(),
    },
  };
});

// Import after mocking
import apiClient, { setAccessToken, getAccessToken } from "@/lib/api/client";
import { register, login, logout } from "@/lib/api/auth";

describe("auth API functions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setAccessToken(null);
  });

  describe("register", () => {
    it("calls POST /auth/register with correct data", async () => {
      const mockResponse = {
        data: {
          status: "success",
          data: { id: 1, email: "test@example.com", firstName: "Test", lastName: "User", profilePicUrl: null },
          message: "Registration successful",
        },
      };
      (apiClient.post as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);

      const result = await register({
        email: "test@example.com",
        password: "Test1234",
        firstName: "Test",
        lastName: "User",
      });

      expect(apiClient.post).toHaveBeenCalledWith("/auth/register", {
        email: "test@example.com",
        password: "Test1234",
        firstName: "Test",
        lastName: "User",
      });
      expect(result.data.email).toBe("test@example.com");
      expect(result.message).toBe("Registration successful");
    });

    it("propagates API errors", async () => {
      (apiClient.post as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error("Request failed with status code 409")
      );

      await expect(
        register({ email: "dup@example.com", password: "Test1234", firstName: "T", lastName: "U" })
      ).rejects.toThrow("409");
    });
  });

  describe("login", () => {
    it("calls POST /auth/login and stores access token", async () => {
      const mockResponse = {
        data: {
          status: "success",
          data: {
            accessToken: "mock-access-token",
            expiresIn: 900,
            user: { id: 1, email: "test@example.com", firstName: "Test", lastName: "User", profilePicUrl: null },
          },
        },
      };
      (apiClient.post as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);

      const result = await login("test@example.com", "Test1234");

      expect(apiClient.post).toHaveBeenCalledWith("/auth/login", {
        email: "test@example.com",
        password: "Test1234",
      });
      expect(result.accessToken).toBe("mock-access-token");
      expect(result.user.email).toBe("test@example.com");
      expect(getAccessToken()).toBe("mock-access-token");
    });
  });

  describe("logout", () => {
    it("calls POST /auth/logout and clears access token", async () => {
      setAccessToken("some-token");
      (apiClient.post as ReturnType<typeof vi.fn>).mockResolvedValue({ data: { status: "success" } });

      await logout();

      expect(apiClient.post).toHaveBeenCalledWith("/auth/logout");
      expect(getAccessToken()).toBeNull();
    });

    it("clears access token even if API call fails", async () => {
      setAccessToken("some-token");
      (apiClient.post as ReturnType<typeof vi.fn>).mockRejectedValue(new Error("Network error"));

      // logout() uses try/finally so the error still propagates, but the token is cleared
      try {
        await logout();
      } catch {
        // expected
      }

      expect(getAccessToken()).toBeNull();
    });
  });
});

describe("access token management", () => {
  it("setAccessToken stores and getAccessToken retrieves", () => {
    setAccessToken("my-token");
    expect(getAccessToken()).toBe("my-token");
  });

  it("setAccessToken(null) clears the token", () => {
    setAccessToken("my-token");
    setAccessToken(null);
    expect(getAccessToken()).toBeNull();
  });
});
