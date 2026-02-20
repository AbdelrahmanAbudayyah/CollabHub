import { describe, it, expect } from "vitest";
import { registerSchema, loginSchema } from "@/lib/utils/validators";

describe("registerSchema", () => {
  const validData = {
    firstName: "John",
    lastName: "Doe",
    email: "john@example.com",
    password: "Test1234",
    confirmPassword: "Test1234",
  };

  it("accepts valid registration data", () => {
    const result = registerSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it("rejects empty first name", () => {
    const result = registerSchema.safeParse({ ...validData, firstName: "" });
    expect(result.success).toBe(false);
  });

  it("rejects empty last name", () => {
    const result = registerSchema.safeParse({ ...validData, lastName: "" });
    expect(result.success).toBe(false);
  });

  it("rejects invalid email", () => {
    const result = registerSchema.safeParse({ ...validData, email: "not-an-email" });
    expect(result.success).toBe(false);
  });

  it("rejects empty email", () => {
    const result = registerSchema.safeParse({ ...validData, email: "" });
    expect(result.success).toBe(false);
  });

  it("rejects password shorter than 8 characters", () => {
    const result = registerSchema.safeParse({
      ...validData,
      password: "Ab1",
      confirmPassword: "Ab1",
    });
    expect(result.success).toBe(false);
  });

  it("rejects password without uppercase letter", () => {
    const result = registerSchema.safeParse({
      ...validData,
      password: "alllower1",
      confirmPassword: "alllower1",
    });
    expect(result.success).toBe(false);
  });

  it("rejects password without lowercase letter", () => {
    const result = registerSchema.safeParse({
      ...validData,
      password: "ALLUPPER1",
      confirmPassword: "ALLUPPER1",
    });
    expect(result.success).toBe(false);
  });

  it("rejects password without digit", () => {
    const result = registerSchema.safeParse({
      ...validData,
      password: "NoDigitsHere",
      confirmPassword: "NoDigitsHere",
    });
    expect(result.success).toBe(false);
  });

  it("rejects mismatched passwords", () => {
    const result = registerSchema.safeParse({
      ...validData,
      confirmPassword: "Different1",
    });
    expect(result.success).toBe(false);
  });

  it("rejects first name exceeding 100 characters", () => {
    const result = registerSchema.safeParse({
      ...validData,
      firstName: "A".repeat(101),
    });
    expect(result.success).toBe(false);
  });
});

describe("loginSchema", () => {
  const validData = {
    email: "john@example.com",
    password: "Test1234",
  };

  it("accepts valid login data", () => {
    const result = loginSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it("rejects empty email", () => {
    const result = loginSchema.safeParse({ ...validData, email: "" });
    expect(result.success).toBe(false);
  });

  it("rejects invalid email format", () => {
    const result = loginSchema.safeParse({ ...validData, email: "bad-email" });
    expect(result.success).toBe(false);
  });

  it("rejects empty password", () => {
    const result = loginSchema.safeParse({ ...validData, password: "" });
    expect(result.success).toBe(false);
  });
});
