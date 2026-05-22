import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req);

    const coupons = await prisma.coupon.findMany({
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      coupons: coupons.map((c) => ({
        id: c.id,
        code: c.code,
        type: c.type,
        value: c.value,
        maxUses: c.maxUses,
        usedCount: c.usedCount,
        validFrom: c.validFrom.toISOString(),
        validUntil: c.validUntil?.toISOString() || null,
        planRestriction: c.planRestriction,
        createdAt: c.createdAt.toISOString(),
      })),
    });
  } catch (error: any) {
    if (error.message === "Authentication required") {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }
    if (error.message === "Admin access required") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }
    logger.error("Admin coupons GET error:", { error });
    return NextResponse.json({ error: "Failed to fetch coupons" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAdmin(req);

    const body = await req.json();
    const { code, type, value, maxUses, validFrom, validUntil, planRestriction } = body;

    if (!code || !type || value === undefined || value === null) {
      return NextResponse.json(
        { error: "code, type, and value are required" },
        { status: 400 }
      );
    }

    if (!["percentage", "fixed"].includes(type)) {
      return NextResponse.json(
        { error: "type must be 'percentage' or 'fixed'" },
        { status: 400 }
      );
    }

    if (type === "percentage" && (value < 0 || value > 100)) {
      return NextResponse.json(
        { error: "percentage value must be between 0 and 100" },
        { status: 400 }
      );
    }

    const existing = await prisma.coupon.findUnique({
      where: { code: code.trim().toUpperCase() },
    });
    if (existing) {
      return NextResponse.json(
        { error: "Coupon code already exists" },
        { status: 409 }
      );
    }

    const coupon = await prisma.coupon.create({
      data: {
        code: code.trim().toUpperCase(),
        type,
        value: parseFloat(value),
        maxUses: maxUses ? parseInt(maxUses, 10) : null,
        validFrom: validFrom ? new Date(validFrom) : new Date(),
        validUntil: validUntil ? new Date(validUntil) : null,
        planRestriction: planRestriction || null,
      },
    });

    return NextResponse.json({ coupon }, { status: 201 });
  } catch (error: any) {
    if (error.message === "Authentication required") {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }
    if (error.message === "Admin access required") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }
    logger.error("Admin coupons POST error:", { error });
    return NextResponse.json({ error: "Failed to create coupon" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await requireAdmin(req);

    const code = req.nextUrl.searchParams.get("code");
    if (!code) {
      return NextResponse.json(
        { error: "code query parameter is required" },
        { status: 400 }
      );
    }

    const existing = await prisma.coupon.findUnique({
      where: { code },
    });
    if (!existing) {
      return NextResponse.json(
        { error: "Coupon not found" },
        { status: 404 }
      );
    }

    await prisma.coupon.delete({ where: { code } });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error.message === "Authentication required") {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }
    if (error.message === "Admin access required") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }
    logger.error("Admin coupons DELETE error:", { error });
    return NextResponse.json({ error: "Failed to delete coupon" }, { status: 500 });
  }
}
