import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const page = parseInt(req.nextUrl.searchParams.get("page") || "1", 10);
    const limit = parseInt(req.nextUrl.searchParams.get("limit") || "10", 10);
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      prisma.generationHistory.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.generationHistory.count({
        where: { userId: user.id },
      }),
    ]);

    return NextResponse.json({
      items: items.map((item) => ({
        id: item.id,
        prompt: item.prompt,
        model: item.model,
        imageUrl: item.imageUrl,
        createdAt: item.createdAt.toISOString(),
      })),
      total,
      page,
      limit,
      hasMore: skip + items.length < total,
    });
  } catch (error) {
    logger.error("Error fetching history:", { error });
    return NextResponse.json({ error: "Failed to fetch history" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const body = await req.json();
    const { prompt, model, imageUrl } = body;

    if (!prompt || !model || !imageUrl) {
      return NextResponse.json({ error: "prompt, model, and imageUrl are required" }, { status: 400 });
    }

    const item = await prisma.generationHistory.create({
      data: {
        userId: user.id,
        prompt,
        model,
        imageUrl,
      },
    });

    return NextResponse.json({
      id: item.id,
      prompt: item.prompt,
      model: item.model,
      imageUrl: item.imageUrl,
      createdAt: item.createdAt.toISOString(),
    }, { status: 201 });
  } catch (error) {
    logger.error("Error saving history:", { error });
    return NextResponse.json({ error: "Failed to save history" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const id = req.nextUrl.searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "id query parameter is required" }, { status: 400 });
    }

    const existing = await prisma.generationHistory.findUnique({
      where: { id },
    });

    if (!existing || existing.userId !== user.id) {
      return NextResponse.json({ error: "History entry not found" }, { status: 404 });
    }

    await prisma.generationHistory.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Error deleting history:", { error });
    return NextResponse.json({ error: "Failed to delete history" }, { status: 500 });
  }
}
