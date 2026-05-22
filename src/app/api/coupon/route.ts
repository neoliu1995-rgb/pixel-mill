import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

export async function POST(req: NextRequest) {
  try {
    const { code, plan, billingPeriod } = await req.json();

    if (!code || typeof code !== "string") {
      return NextResponse.json(
        { valid: false, error: "请输入优惠码" },
        { status: 400 }
      );
    }

    const coupon = await prisma.coupon.findUnique({
      where: { code: code.trim().toUpperCase() },
    });

    if (!coupon) {
      return NextResponse.json(
        { valid: false, error: "优惠码不存在" },
        { status: 404 }
      );
    }

    const now = new Date();

    if (coupon.validFrom && now < coupon.validFrom) {
      return NextResponse.json(
        { valid: false, error: "优惠码尚未生效" },
        { status: 400 }
      );
    }

    if (coupon.validUntil && now > coupon.validUntil) {
      return NextResponse.json(
        { valid: false, error: "优惠码已过期" },
        { status: 400 }
      );
    }

    if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses) {
      return NextResponse.json(
        { valid: false, error: "优惠码已达到使用上限" },
        { status: 400 }
      );
    }

    if (coupon.planRestriction) {
      const restrictedPlans = coupon.planRestriction.split(",").map((p) => p.trim());
      if (plan && !restrictedPlans.includes(plan)) {
        return NextResponse.json(
          { valid: false, error: "该优惠码不适用于当前套餐" },
          { status: 400 }
        );
      }
    }

    return NextResponse.json({
      valid: true,
      discount: coupon.value,
      type: coupon.type,
    });
  } catch (error) {
    logger.error("Coupon validation error:", { error });
    return NextResponse.json(
      { valid: false, error: "优惠码验证失败，请重试" },
      { status: 500 }
    );
  }
}
