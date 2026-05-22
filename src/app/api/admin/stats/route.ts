import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

export async function GET(req: NextRequest) {
  try {
    const admin = await requireAdmin(req);

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      activeSubscriptions,
      planBreakdown,
      monthlyGenerations,
      totalGenerations,
      recentSignups,
      dailyGenerations,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.subscription.count({ where: { status: "active" } }),
      prisma.subscription.groupBy({
        by: ["plan"],
        _count: { plan: true },
        where: { status: "active" },
      }),
      prisma.generationHistory.count({
        where: { createdAt: { gte: startOfMonth } },
      }),
      prisma.generationHistory.count(),
      prisma.user.findMany({
        orderBy: { createdAt: "desc" },
        take: 10,
        select: { email: true, name: true, createdAt: true },
      }),
      prisma.generationHistory.groupBy({
        by: ["createdAt"],
        _count: { _all: true },
        where: { createdAt: { gte: sevenDaysAgo } },
      }),
    ]);

    const planMap: Record<string, number> = {};
    planBreakdown.forEach((p) => {
      planMap[p.plan] = p._count.plan;
    });

    const dailyMap: Record<string, number> = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const key = d.toISOString().slice(0, 10);
      dailyMap[key] = 0;
    }

    dailyGenerations.forEach((g) => {
      const key = new Date(g.createdAt).toISOString().slice(0, 10);
      if (key in dailyMap) {
        dailyMap[key] += g._count._all;
      }
    });

    const dailyArray = Object.entries(dailyMap).map(([date, count]) => ({
      date,
      count,
    }));

    const activePlanPrices: Record<string, number> = {
      pro: 9.99,
      business: 29.99,
    };
    const monthlyRevenue = planBreakdown.reduce((sum, p) => {
      return sum + (activePlanPrices[p.plan] || 0) * p._count.plan;
    }, 0);

    return NextResponse.json({
      totalUsers,
      activeSubscriptions,
      monthlyRevenue: Math.round(monthlyRevenue * 100) / 100,
      totalGenerations,
      planBreakdown: planMap,
      recentSignups: recentSignups.map((u) => ({
        email: u.email,
        name: u.name,
        createdAt: u.createdAt.toISOString(),
      })),
      recentPayments: [],
      dailyGenerations: dailyArray,
      adminEmail: admin.email,
    });
  } catch (error: any) {
    if (error.message === "Authentication required") {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }
    if (error.message === "Admin access required") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }
    logger.error("Admin stats error:", { error });
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}
