import { NextRequest, NextResponse } from "next/server";
import { routeCopywriting } from "@/lib/providers/router";
import { getCurrentUser } from "@/lib/auth";
import { logger } from "@/lib/logger";

interface CopywritingRequest {
  productName: string;
  category?: string;
  sellingPoints?: string[];
  targetAudience?: string;
  style?: "professional" | "lively" | "literary" | "promotional";
  platform?: "taobao" | "jd" | "pinduoduo" | "amazon" | "shopify" | "xiaohongshu" | "douyin";
  userTier?: "free" | "pro" | "business";
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const {
      productName,
      category,
      sellingPoints,
      targetAudience,
      style = "professional",
      platform = "taobao",
      userTier: requestUserTier,
    }: CopywritingRequest = await req.json();

    const userTier = requestUserTier || (user.plan as "free" | "pro" | "business");

    if (!productName || typeof productName !== "string") {
      return NextResponse.json(
        { success: false, error: "产品名称为必填项" },
        { status: 400 }
      );
    }

    const result = await routeCopywriting({
      productName,
      category,
      sellingPoints,
      targetAudience,
      style,
      platform,
    });

    return NextResponse.json({
      success: true,
      title: result.title,
      bulletPoints: result.bulletPoints,
      description: result.description,
      socialCopy: result.socialCopy,
      adSlogan: result.adSlogan,
      provider: result.provider,
      model: result.model,
      cost: result.cost,
    });
  } catch (error) {
    logger.error("Copywriting error:", { error });
    return NextResponse.json(
      { success: false, error: "文案生成失败，请重试。" },
      { status: 500 }
    );
  }
}
