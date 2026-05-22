import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock("@/lib/logger", () => ({
  logger: {
    warn: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

vi.mock("bcryptjs", () => ({
  default: {
    compare: vi.fn(),
  },
}));

vi.mock("next-auth/providers/google", () => ({
  default: vi.fn(() => ({ id: "google" })),
}));

vi.mock("next-auth/providers/github", () => ({
  default: vi.fn(() => ({ id: "github" })),
}));

import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import bcrypt from "bcryptjs";
import { authOptions } from "@/lib/auth";

describe("authorize function", () => {
  let authorize: (credentials: Record<string, string> | undefined) => Promise<any>;

  beforeEach(() => {
    vi.clearAllMocks();
    const credentialsProvider = authOptions.providers.find(
      (p: any) => p.id === "credentials"
    );
    authorize = (credentialsProvider as any).authorize;
  });

  it("should return null when credentials are missing", async () => {
    const result = await authorize(undefined);
    expect(result).toBeNull();
    expect(logger.warn).toHaveBeenCalledWith("Auth: missing credentials");
  });

  it("should return null when email is missing", async () => {
    const result = await authorize({ password: "secret" } as any);
    expect(result).toBeNull();
    expect(logger.warn).toHaveBeenCalledWith("Auth: missing credentials");
  });

  it("should return null when password is missing", async () => {
    const result = await authorize({ email: "test@example.com" } as any);
    expect(result).toBeNull();
    expect(logger.warn).toHaveBeenCalledWith("Auth: missing credentials");
  });

  it("should return null when user not found", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
    const result = await authorize({ email: "nobody@example.com", password: "secret" });
    expect(result).toBeNull();
    expect(logger.warn).toHaveBeenCalledWith(
      "Auth: user not found or no password",
      { email: "nobody@example.com" }
    );
  });

  it("should return null when user has no password set", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: "1",
      email: "test@example.com",
      password: null,
    } as any);
    const result = await authorize({ email: "test@example.com", password: "secret" });
    expect(result).toBeNull();
    expect(logger.warn).toHaveBeenCalledWith(
      "Auth: user not found or no password",
      { email: "test@example.com" }
    );
  });

  it("should return null when password is invalid", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: "1",
      email: "test@example.com",
      password: "hashedpassword",
    } as any);
    vi.mocked(bcrypt.compare).mockResolvedValue(false as any);
    const result = await authorize({ email: "test@example.com", password: "wrong" });
    expect(result).toBeNull();
    expect(logger.warn).toHaveBeenCalledWith(
      "Auth: invalid password",
      { email: "test@example.com" }
    );
  });

  it("should return user object when credentials are valid", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: "user-1",
      email: "test@example.com",
      password: "hashedpassword",
      name: "Test User",
    } as any);
    vi.mocked(bcrypt.compare).mockResolvedValue(true as any);
    const result = await authorize({ email: "test@example.com", password: "correct" });
    expect(result).toEqual({
      id: "user-1",
      email: "test@example.com",
      name: "Test User",
    });
  });
});

describe("authOptions structure", () => {
  it("should have providers array", () => {
    expect(Array.isArray(authOptions.providers)).toBe(true);
    expect(authOptions.providers.length).toBeGreaterThanOrEqual(1);
  });

  it("should have credentials provider", () => {
    const credentialsProvider = authOptions.providers.find(
      (p: any) => p.id === "credentials"
    );
    expect(credentialsProvider).toBeDefined();
    expect((credentialsProvider as any).name).toBe("Credentials");
    expect((credentialsProvider as any).type).toBe("credentials");
  });

  it("should use JWT session strategy", () => {
    expect(authOptions.session).toBeDefined();
    expect((authOptions.session as any).strategy).toBe("jwt");
  });

  it("should have custom sign-in page", () => {
    expect(authOptions.pages).toBeDefined();
    expect(authOptions.pages?.signIn).toBe("/auth/signin");
  });

  it("should have callbacks defined", () => {
    expect(authOptions.callbacks).toBeDefined();
    expect(authOptions.callbacks?.signIn).toBeDefined();
    expect(authOptions.callbacks?.jwt).toBeDefined();
    expect(authOptions.callbacks?.session).toBeDefined();
  });
});

describe("signIn callback", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return true for non-OAuth sign-in", async () => {
    const result = await authOptions.callbacks!.signIn!({
      user: { id: "1", email: "test@example.com" },
      account: { type: "credentials" } as any,
      profile: undefined as any,
    } as any);
    expect(result).toBe(true);
  });

  it("should create new user for OAuth sign-in when user does not exist", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.user.create).mockResolvedValue({
      id: "new-user",
      email: "oauth@example.com",
      name: "OAuth User",
      avatar: "https://avatar.url",
    } as any);
    const user = { id: "old-id", email: "oauth@example.com", name: "OAuth User", image: "https://avatar.url" };
    const result = await authOptions.callbacks!.signIn!({
      user,
      account: { type: "oauth" } as any,
      profile: {} as any,
    } as any);
    expect(result).toBe(true);
    expect(user.id).toBe("new-user");
    expect(prisma.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          email: "oauth@example.com",
          name: "OAuth User",
          avatar: "https://avatar.url",
        }),
      })
    );
  });

  it("should update avatar for existing OAuth user without avatar", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: "existing-user",
      email: "oauth@example.com",
      avatar: null,
      subscription: { plan: "free" },
    } as any);
    vi.mocked(prisma.user.update).mockResolvedValue({} as any);
    const user = { id: "old-id", email: "oauth@example.com", image: "https://new-avatar.url" };
    const result = await authOptions.callbacks!.signIn!({
      user,
      account: { type: "oauth" } as any,
      profile: {} as any,
    } as any);
    expect(result).toBe(true);
    expect(user.id).toBe("existing-user");
    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "existing-user" },
        data: { avatar: "https://new-avatar.url" },
      })
    );
  });

  it("should return false on database error during OAuth sign-in", async () => {
    vi.mocked(prisma.user.findUnique).mockRejectedValue(new Error("DB error"));
    const result = await authOptions.callbacks!.signIn!({
      user: { id: "1", email: "oauth@example.com" },
      account: { type: "oauth" } as any,
      profile: {} as any,
    } as any);
    expect(result).toBe(false);
    expect(logger.error).toHaveBeenCalledWith(
      "Auth: OAuth sign-in database error",
      expect.objectContaining({ error: expect.any(Error) })
    );
  });
});

describe("jwt callback", () => {
  it("should add user id to token when user is present", async () => {
    const token = { id: "" } as any;
    const result = await authOptions.callbacks!.jwt!({
      token,
      user: { id: "user-1" } as any,
      account: null as any,
      profile: undefined as any,
      isNewUser: undefined as any,
    });
    expect(result.id).toBe("user-1");
  });

  it("should return token unchanged when user is not present", async () => {
    const token = { id: "existing-id" } as any;
    const result = await authOptions.callbacks!.jwt!({
      token,
      user: undefined as any,
      account: null as any,
      profile: undefined as any,
      isNewUser: undefined as any,
    });
    expect(result.id).toBe("existing-id");
  });
});

describe("session callback", () => {
  it("should add user id from token to session", async () => {
    const session = { user: { id: "", email: "test@example.com", name: "Test" } } as any;
    const result = await authOptions.callbacks!.session!({
      session,
      token: { id: "user-1" } as any,
      user: {} as any,
    } as any);
    expect((result.user as any).id).toBe("user-1");
  });

  it("should return session unchanged when user is not in session", async () => {
    const session = {} as any;
    const result = await authOptions.callbacks!.session!({
      session,
      token: { id: "user-1" } as any,
      user: {} as any,
    } as any);
    expect(result).toEqual(session);
  });
});
