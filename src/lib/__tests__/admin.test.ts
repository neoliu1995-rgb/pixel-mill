import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/auth", () => ({
  getCurrentUser: vi.fn(),
}));

import { requireAdmin, isAdminUser } from "@/lib/admin";
import { getCurrentUser } from "@/lib/auth";

describe("requireAdmin", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should throw 'Authentication required' when user is not logged in", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(null);

    await expect(requireAdmin(new Request("https://example.com"))).rejects.toThrow(
      "Authentication required"
    );
  });

  it("should throw 'Admin access required' when user is not admin", async () => {
    const originalEnv = process.env.ADMIN_EMAILS;
    process.env.ADMIN_EMAILS = "admin@example.com";

    vi.mocked(getCurrentUser).mockResolvedValue({
      id: "user-1",
      email: "regular@example.com",
      name: "Regular User",
      plan: "free",
    });

    await expect(requireAdmin(new Request("https://example.com"))).rejects.toThrow(
      "Admin access required"
    );

    process.env.ADMIN_EMAILS = originalEnv;
  });

  it("should return user when user is admin", async () => {
    const originalEnv = process.env.ADMIN_EMAILS;
    process.env.ADMIN_EMAILS = "admin@example.com";

    const adminUser = {
      id: "admin-1",
      email: "admin@example.com",
      name: "Admin User",
      plan: "pro",
    };
    vi.mocked(getCurrentUser).mockResolvedValue(adminUser);

    const result = await requireAdmin(new Request("https://example.com"));
    expect(result).toEqual(adminUser);

    process.env.ADMIN_EMAILS = originalEnv;
  });

  it("should pass the request to getCurrentUser", async () => {
    const originalEnv = process.env.ADMIN_EMAILS;
    process.env.ADMIN_EMAILS = "admin@example.com";

    vi.mocked(getCurrentUser).mockResolvedValue({
      id: "admin-1",
      email: "admin@example.com",
      name: "Admin User",
      plan: "pro",
    });

    const request = new Request("https://example.com/admin/dashboard");
    await requireAdmin(request);

    expect(getCurrentUser).toHaveBeenCalledWith(request);

    process.env.ADMIN_EMAILS = originalEnv;
  });
});

describe("isAdminUser", () => {
  it("should return true when email is in admin list", () => {
    const originalEnv = process.env.ADMIN_EMAILS;
    process.env.ADMIN_EMAILS = "admin@example.com,super@example.com";

    expect(isAdminUser("admin@example.com")).toBe(true);
    expect(isAdminUser("super@example.com")).toBe(true);

    process.env.ADMIN_EMAILS = originalEnv;
  });

  it("should return false when email is not in admin list", () => {
    const originalEnv = process.env.ADMIN_EMAILS;
    process.env.ADMIN_EMAILS = "admin@example.com";

    expect(isAdminUser("user@example.com")).toBe(false);

    process.env.ADMIN_EMAILS = originalEnv;
  });

  it("should be case insensitive", () => {
    const originalEnv = process.env.ADMIN_EMAILS;
    process.env.ADMIN_EMAILS = "Admin@Example.com";

    expect(isAdminUser("admin@example.com")).toBe(true);
    expect(isAdminUser("ADMIN@EXAMPLE.COM")).toBe(true);
    expect(isAdminUser("Admin@Example.Com")).toBe(true);

    process.env.ADMIN_EMAILS = originalEnv;
  });

  it("should return false when ADMIN_EMAILS is empty", () => {
    const originalEnv = process.env.ADMIN_EMAILS;
    process.env.ADMIN_EMAILS = "";

    expect(isAdminUser("admin@example.com")).toBe(false);

    process.env.ADMIN_EMAILS = originalEnv;
  });

  it("should return false when ADMIN_EMAILS is not set", () => {
    const originalEnv = process.env.ADMIN_EMAILS;
    delete process.env.ADMIN_EMAILS;

    expect(isAdminUser("admin@example.com")).toBe(false);

    process.env.ADMIN_EMAILS = originalEnv;
  });

  it("should handle whitespace around emails", () => {
    const originalEnv = process.env.ADMIN_EMAILS;
    process.env.ADMIN_EMAILS = "  admin@example.com  ,  super@example.com  ";

    expect(isAdminUser("admin@example.com")).toBe(true);
    expect(isAdminUser("super@example.com")).toBe(true);

    process.env.ADMIN_EMAILS = originalEnv;
  });

  it("should handle single admin email", () => {
    const originalEnv = process.env.ADMIN_EMAILS;
    process.env.ADMIN_EMAILS = "only-admin@example.com";

    expect(isAdminUser("only-admin@example.com")).toBe(true);
    expect(isAdminUser("other@example.com")).toBe(false);

    process.env.ADMIN_EMAILS = originalEnv;
  });

  it("should ignore empty entries from comma-separated list", () => {
    const originalEnv = process.env.ADMIN_EMAILS;
    process.env.ADMIN_EMAILS = "admin@example.com,,super@example.com,";

    expect(isAdminUser("admin@example.com")).toBe(true);
    expect(isAdminUser("super@example.com")).toBe(true);
    expect(isAdminUser("")).toBe(false);

    process.env.ADMIN_EMAILS = originalEnv;
  });
});
