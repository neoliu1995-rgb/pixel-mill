import crypto from "crypto";
import { prisma } from "@/lib/prisma";

export function generateApiKey(): string {
  const randomBytes = crypto.randomBytes(24).toString("hex");
  return `pm_sk_${randomBytes}`;
}

export function hashApiKey(key: string): string {
  return crypto.createHash("sha256").update(key).digest("hex");
}

export function verifyApiKey(key: string, hash: string): boolean {
  return hashApiKey(key) === hash;
}

export async function authenticateApiKey(request: Request): Promise<{
  userId: string;
  plan: string;
} | null> {
  let apiKey: string | null = null;

  const xApiKey = request.headers.get("x-api-key");
  if (xApiKey && xApiKey.startsWith("pm_")) {
    apiKey = xApiKey;
  }

  if (!apiKey) {
    const authHeader = request.headers.get("Authorization");
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.substring(7);
      if (token.startsWith("pm_")) {
        apiKey = token;
      }
    }
  }

  if (!apiKey) {
    return null;
  }

  const keyHash = hashApiKey(apiKey);

  const apiKeyRecord = await prisma.apiKey.findUnique({
    where: { key: keyHash },
    include: {
      user: {
        include: { subscription: true },
      },
    },
  });

  if (!apiKeyRecord) {
    return null;
  }

  return {
    userId: apiKeyRecord.userId,
    plan: apiKeyRecord.user.subscription?.plan || "free",
  };
}
