import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";
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

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        plan: user.subscription?.plan || "free",
        subscriptionStatus: user.subscription?.status || "inactive",
        createdAt: user.createdAt.toISOString(),
      },
    });
  } catch (error) {
    logger.error("Error fetching user:", { error });
    return NextResponse.json({ error: "Failed to fetch user" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const userId = await authenticate(request);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { name } = await request.json();

    const user = await prisma.user.update({
      where: { id: userId },
      data: { name },
      include: { subscription: true },
    });

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        plan: user.subscription?.plan || "free",
        subscriptionStatus: user.subscription?.status || "inactive",
        createdAt: user.createdAt.toISOString(),
      },
    });
  } catch (error) {
    logger.error("Error updating user:", { error });
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
  }
}