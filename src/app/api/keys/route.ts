import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";
import { generateApiKey, hashApiKey } from "@/lib/apikey";
import { logger } from "@/lib/logger";

async function authenticate(request: Request) {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.substring(7);
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    logger.error("JWT_SECRET is not configured");
    return null;
  }

  try {
    const decoded = jwt.verify(token, secret) as { userId: string };
    return decoded.userId;
  } catch {
    logger.warn("JWT verification failed");
    return null;
  }
}

export async function GET(request: Request) {
  const userId = await authenticate(request);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { subscription: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const plan = user.subscription?.plan || "free";
    if (plan === "free") {
      return NextResponse.json(
        { error: "API keys are only available for Pro and Business users" },
        { status: 403 }
      );
    }

    const apiKeys = await prisma.apiKey.findMany({
      where: { userId },
      select: {
        id: true,
        name: true,
        key: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const keys = apiKeys.map((k) => ({
      id: k.id,
      name: k.name,
      keyPrefix: k.key.substring(0, 8),
      createdAt: k.createdAt.toISOString(),
    }));

    return NextResponse.json({ keys });
  } catch (error) {
    logger.error("Error fetching API keys:", { error });
    return NextResponse.json(
      { error: "Failed to fetch API keys" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const userId = await authenticate(request);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { subscription: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const plan = user.subscription?.plan || "free";
    if (plan === "free") {
      return NextResponse.json(
        { error: "API keys are only available for Pro and Business users" },
        { status: 403 }
      );
    }

    const { name } = await request.json();
    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      );
    }

    if (name.length > 50) {
      return NextResponse.json(
        { error: "Name must be 50 characters or less" },
        { status: 400 }
      );
    }

    const existingKeyCount = await prisma.apiKey.count({
      where: { userId },
    });

    if (existingKeyCount >= 10) {
      return NextResponse.json(
        { error: "Maximum of 10 API keys allowed" },
        { status: 400 }
      );
    }

    const rawKey = generateApiKey();
    const keyHash = hashApiKey(rawKey);

    const apiKey = await prisma.apiKey.create({
      data: {
        userId,
        key: keyHash,
        name: name.trim(),
      },
    });

    return NextResponse.json({
      key: {
        id: apiKey.id,
        name: apiKey.name,
        key: rawKey,
        keyPrefix: keyHash.substring(0, 8),
        createdAt: apiKey.createdAt.toISOString(),
      },
    });
  } catch (error) {
    logger.error("Error creating API key:", { error });
    return NextResponse.json(
      { error: "Failed to create API key" },
      { status: 500 }
    );
  }
}
