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

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await authenticate(request);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;

    const apiKey = await prisma.apiKey.findUnique({
      where: { id },
    });

    if (!apiKey) {
      return NextResponse.json(
        { error: "API key not found" },
        { status: 404 }
      );
    }

    if (apiKey.userId !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    await prisma.apiKey.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Error deleting API key:", { error });
    return NextResponse.json(
      { error: "Failed to delete API key" },
      { status: 500 }
    );
  }
}
