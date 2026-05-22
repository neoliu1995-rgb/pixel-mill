import { NextRequest, NextResponse } from "next/server";
import { SiliconFlowTextProvider } from "@/lib/providers/siliconflow";
import { getCurrentUser } from "@/lib/auth";
import { logger } from "@/lib/logger";

interface DetailPageRequest {
  productName: string;
  productImageUrl: string;
  category: string;
  sellingPoints: string[];
  style: "professional" | "lively" | "luxury" | "minimal";
  userTier?: "free" | "pro" | "business";
}

const STYLE_MAP: Record<string, string> = {
  professional: "专业商务",
  lively: "活泼生动",
  luxury: "奢华高端",
  minimal: "极简清新",
};

function generateDetailPageHTML(
  productName: string,
  category: string,
  sellingPoints: string[],
  style: string,
  copyData: {
    title: string;
    bulletPoints: string[];
    description: string;
    adSlogan: string;
  }
): string {
  const styleVars: Record<string, string> = {
    professional: `
      --primary: #1a365d;
      --secondary: #2d3748;
      --accent: #3182ce;
      --bg: #ffffff;
      --text: #1a202c;
      --text-secondary: #4a5568;
      --border: #e2e8f0;
      --gradient: linear-gradient(135deg, #1a365d 0%, #2d3748 100%);
    `,
    lively: `
      --primary: #e53e3e;
      --secondary: #dd6b20;
      --accent: #d69e2e;
      --bg: #fffaf0;
      --text: #1a202c;
      --text-secondary: #4a5568;
      --border: #fed7d7;
      --gradient: linear-gradient(135deg, #e53e3e 0%, #dd6b20 100%);
    `,
    luxury: `
      --primary: #1a1a2e;
      --secondary: #16213e;
      --accent: #c9a96e;
      --bg: #0f0f1a;
      --text: #f5f5f5;
      --text-secondary: #b0b0b0;
      --border: #2a2a3e;
      --gradient: linear-gradient(135deg, #1a1a2e 0%, #c9a96e 100%);
    `,
    minimal: `
      --primary: #2d3748;
      --secondary: #4a5568;
      --accent: #718096;
      --bg: #ffffff;
      --text: #1a202c;
      --text-secondary: #718096;
      --border: #e2e8f0;
      --gradient: linear-gradient(135deg, #2d3748 0%, #4a5568 100%);
    `,
  };

  const vars = styleVars[style] || styleVars.professional;

  const pointsHTML = sellingPoints
    .map(
      (point, i) => `
      <div style="flex:1;min-width:200px;padding:20px;background:var(--bg);border:1px solid var(--border);border-radius:12px;text-align:center;">
        <div style="width:48px;height:48px;margin:0 auto 12px;background:var(--gradient);border-radius:50%;display:flex;align-items:center;justify-content:center;color:#fff;font-size:20px;font-weight:bold;">
          ${i + 1}
        </div>
        <p style="margin:0;color:var(--text);font-size:14px;line-height:1.6;">${point}</p>
      </div>
    `
    )
    .join("");

  const bulletPointsHTML = copyData.bulletPoints
    .map(
      (point) => `
      <li style="padding:8px 0;border-bottom:1px solid var(--border);color:var(--text);font-size:14px;line-height:1.6;">
        ${point}
      </li>
    `
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>${productName} - 详情页</title>
<style>
*{margin:0;padding:0;box-sizing:border-box;}
body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif;background:var(--bg);color:var(--text);line-height:1.6;}
:root{${vars}}
.container{max-width:750px;margin:0 auto;}
.header{background:var(--gradient);padding:60px 24px;text-align:center;color:#fff;}
.header h1{font-size:28px;margin-bottom:8px;font-weight:700;}
.header p{font-size:16px;opacity:0.9;}
.slogan{background:var(--accent);color:#fff;text-align:center;padding:16px 24px;font-size:18px;font-weight:600;}
.section{padding:32px 24px;border-bottom:1px solid var(--border);}
.section-title{font-size:20px;font-weight:700;color:var(--primary);margin-bottom:20px;padding-bottom:8px;border-bottom:2px solid var(--accent);display:inline-block;}
.points-grid{display:flex;flex-wrap:wrap;gap:16px;}
.features-list{list-style:none;padding:0;}
.features-list li{position:relative;padding-left:24px;}
.features-list li::before{content:"✓";position:absolute;left:0;color:var(--accent);font-weight:bold;}
.scenario{background:var(--gradient);padding:40px 24px;text-align:center;color:#fff;}
.scenario h2{font-size:22px;margin-bottom:12px;}
.scenario p{font-size:14px;opacity:0.9;max-width:500px;margin:0 auto;}
.params{padding:32px 24px;}
.params table{width:100%;border-collapse:collapse;}
.params td{padding:12px 16px;border:1px solid var(--border);font-size:14px;}
.params td:first-child{color:var(--text-secondary);background:rgba(0,0,0,0.02);width:30%;font-weight:500;}
.guarantee{background:var(--bg);padding:32px 24px;text-align:center;border-top:1px solid var(--border);}
.guarantee-items{display:flex;justify-content:center;gap:32px;flex-wrap:wrap;margin-top:16px;}
.guarantee-item{text-align:center;}
.guarantee-item .icon{font-size:28px;margin-bottom:8px;}
.guarantee-item p{font-size:13px;color:var(--text-secondary);}
</style>
</head>
<body>
<div class="container">
  <div class="header">
    <h1>${copyData.title || productName}</h1>
    <p>${category}</p>
  </div>
  ${copyData.adSlogan ? `<div class="slogan">${copyData.adSlogan}</div>` : ""}
  <div class="section">
    <h2 class="section-title">核心卖点</h2>
    <div class="points-grid">${pointsHTML}</div>
  </div>
  <div class="section">
    <h2 class="section-title">产品详情</h2>
    <p style="color:var(--text);font-size:14px;line-height:1.8;margin-bottom:16px;">${copyData.description}</p>
    <ul class="features-list">${bulletPointsHTML}</ul>
  </div>
  <div class="scenario">
    <h2>适用场景</h2>
    <p>${sellingPoints.join("、")}</p>
  </div>
  <div class="params">
    <h2 class="section-title">产品参数</h2>
    <table>
      <tr><td>产品名称</td><td>${productName}</td></tr>
      <tr><td>品类</td><td>${category}</td></tr>
      ${sellingPoints.map((sp) => `<tr><td>特点</td><td>${sp}</td></tr>`).join("")}
    </table>
  </div>
  <div class="guarantee">
    <h2 class="section-title" style="display:block;text-align:center;">服务保障</h2>
    <div class="guarantee-items">
      <div class="guarantee-item"><div class="icon">🔒</div><p>正品保障</p></div>
      <div class="guarantee-item"><div class="icon">🚚</div><p>极速发货</p></div>
      <div class="guarantee-item"><div class="icon">↩️</div><p>七天退换</p></div>
      <div class="guarantee-item"><div class="icon">💬</div><p>在线客服</p></div>
    </div>
  </div>
</div>
</body>
</html>`;
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
      productImageUrl,
      category,
      sellingPoints = [],
      style = "professional",
      userTier: requestUserTier,
    }: DetailPageRequest = await req.json();

    const userTier = requestUserTier || (user.plan as "free" | "pro" | "business");

    if (!productName || typeof productName !== "string") {
      return NextResponse.json(
        { success: false, error: "产品名称为必填项" },
        { status: 400 }
      );
    }

    if (!category || typeof category !== "string") {
      return NextResponse.json(
        { success: false, error: "品类为必填项" },
        { status: 400 }
      );
    }

    const textProvider = new SiliconFlowTextProvider();
    if (!textProvider.isAvailable()) {
      const fallbackCopy = {
        title: productName,
        bulletPoints: sellingPoints.length > 0 ? sellingPoints : ["品质保证", "性价比高", "用户好评"],
        description: `${productName}，${category}类目优质好物，${sellingPoints.join("、")}。`,
        adSlogan: `${productName}，值得拥有`,
      };
      const html = generateDetailPageHTML(productName, category, sellingPoints, style, fallbackCopy);
      return NextResponse.json({
        success: true,
        copywriting: fallbackCopy,
        html,
        provider: "fallback",
        model: "fallback",
        cost: 0,
      });
    }

    const styleName = STYLE_MAP[style] || "专业商务";

    const apiKey = process.env.SILICONFLOW_API_KEY!;
    const messages = [
      {
        role: "system" as const,
        content: `You are an expert e-commerce detail page copywriter. Generate product detail page content in valid JSON format with the following fields:
- "title": product title for detail page (string)
- "bulletPoints": array of 4-6 detailed feature strings
- "description": product description paragraph (string)
- "adSlogan": advertising slogan (string)

Output ONLY the JSON object, no other text.`,
      },
      {
        role: "user" as const,
        content: [
          `产品名称: ${productName}`,
          `品类: ${category}`,
          `核心卖点: ${sellingPoints.join("、")}`,
          `风格: ${styleName}`,
        ].join("\n"),
      },
    ];

    const res = await fetch("https://api.siliconflow.cn/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "deepseek-ai/DeepSeek-V3",
        messages,
      }),
    });

    if (!res.ok) {
      throw new Error(`DeepSeek 请求失败: ${res.status}`);
    }

    const data = await res.json();
    const content = data?.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error("DeepSeek 未返回有效内容");
    }

    let parsed: Record<string, unknown>;
    try {
      const jsonStr = content.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
      parsed = JSON.parse(jsonStr);
    } catch {
      throw new Error(`文案内容无法解析为JSON: ${content.slice(0, 200)}`);
    }

    const copyData = {
      title: typeof parsed.title === "string" ? parsed.title : productName,
      bulletPoints: Array.isArray(parsed.bulletPoints)
        ? parsed.bulletPoints.filter((v): v is string => typeof v === "string")
        : sellingPoints,
      description: typeof parsed.description === "string" ? parsed.description : "",
      adSlogan: typeof parsed.adSlogan === "string" ? parsed.adSlogan : "",
    };

    const html = generateDetailPageHTML(productName, category, sellingPoints, style, copyData);

    return NextResponse.json({
      success: true,
      copywriting: copyData,
      html,
      provider: "siliconflow",
      model: "deepseek-ai/DeepSeek-V3",
      cost: 0,
    });
  } catch (error) {
    logger.error("Detail page generation error:", { error });
    return NextResponse.json(
      { success: false, error: "详情页生成失败，请重试。" },
      { status: 500 }
    );
  }
}
