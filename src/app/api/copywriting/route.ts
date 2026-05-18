import { NextRequest, NextResponse } from "next/server";
import { routeCopywriting } from "@/lib/providers/router";

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
    const {
      productName,
      category,
      sellingPoints,
      targetAudience,
      style = "professional",
      platform = "taobao",
      userTier = "free",
    }: CopywritingRequest = await req.json();

    if (!productName || typeof productName !== "string") {
      return NextResponse.json(
        { success: false, error: "产品名称为必填项" },
        { status: 400 }
      );
    }

    if (userTier === "free") {
      console.log("Free tier: queuing...");
      await new Promise(resolve => setTimeout(resolve, 3000));
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
    console.error("Copywriting error:", error);
    return NextResponse.json(
      { success: false, error: "文案生成失败，请重试。" },
      { status: 500 }
    );
  }
}
