import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

export async function GET(req: NextRequest) {
  try {
    const admin = await requireAdmin(req);

    const page = parseInt(req.nextUrl.searchParams.get("page") || "1", 10);
    const limit = parseInt(req.nextUrl.searchParams.get("limit") || "20", 10);
    const search = req.nextUrl.searchParams.get("search") || "";
    const skip = (page - 1) * limit;

    const where = search
      ? {
          OR: [
            { email: { contains: search, mode: "insensitive" as const } },
            { name: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {};

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: {
          subscription: true,
          _count: { select: { generationHistory: true } },
        },
      }),
      prisma.user.count({ where }),
    ]);

    return NextResponse.json({
      users: users.map((u) => ({
        id: u.id,
        email: u.email,
        name: u.name,
        avatar: u.avatar,
        plan: u.subscription?.plan || "free",
        subscriptionStatus: u.subscription?.status || "inactive",
        currentPeriodEnd: u.subscription?.currentPeriodEnd?.toISOString() || null,
        generationCount: u._count.generationHistory,
        createdAt: u.createdAt.toISOString(),
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error: any) {
    if (error.message === "Authentication required") {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }
    if (error.message === "Admin access required") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }
    logger.error("Admin users error:", { error });
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}
