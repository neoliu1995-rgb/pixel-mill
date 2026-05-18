import Stripe from "stripe";

// Only create Stripe client if secret key is provided
export const stripe = process.env.STRIPE_SECRET_KEY && process.env.STRIPE_SECRET_KEY !== "sk_test_your_secret_key_here"
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2026-04-22.dahlia",
      typescript: true,
    })
  : null;

export const PRICES = {
  proMonthly: process.env.STRIPE_PRO_MONTHLY_PRICE_ID || "price_pro_monthly",
  proYearly: process.env.STRIPE_PRO_YEARLY_PRICE_ID || "price_pro_yearly",
  businessMonthly: process.env.STRIPE_BUSINESS_MONTHLY_PRICE_ID || "price_business_monthly",
  businessYearly: process.env.STRIPE_BUSINESS_YEARLY_PRICE_ID || "price_business_yearly",
};

export const PLANS = {
  free: {
    name: "免费版",
    price: 0,
    monthlyPrice: 0,
    yearlyPrice: 0,
    description: "适合个人创作者入门",
    features: [
      "10张/天",
      "Gemini模型",
      "有水印",
      "基础特效",
      "社区支持",
    ],
    popular: false,
    limits: {
      dailyGenerations: 10,
      maxResolution: "512x512",
      models: ["gemini"],
      apiAccess: false,
      commercialLicense: false,
      prioritySupport: false,
      watermark: true,
    },
  },
  pro: {
    name: "专业版",
    description: "最受欢迎的选择",
    monthlyPrice: 7.99,
    yearlyPrice: 59.99,
    features: [
      "300张/月",
      "FLUX.2 Pro + 通义万相",
      "无水印",
      "全部特效",
      "AI文案生成",
      "抠图20次/月",
      "API访问",
      "商业授权",
      "邮件客服支持",
    ],
    popular: true,
    limits: {
      monthlyGenerations: 300,
      maxResolution: "1024x1024",
      models: ["flux-schnell", "flux-dev", "sdxl", "turbo", "realistic", "anime"],
      apiAccess: true,
      commercialLicense: true,
      prioritySupport: false,
      watermark: false,
      monthlyBgRemoval: 20,
    },
  },
  business: {
    name: "企业版",
    description: "适合团队和企业",
    monthlyPrice: 14.99,
    yearlyPrice: 119.99,
    features: [
      "800张/月",
      "FLUX.2 Flex + Qwen-Image",
      "无水印",
      "全部功能无限使用",
      "电商工具套件",
      "优先技术支持",
      "无限API调用",
      "商业授权",
      "专属客户经理",
    ],
    popular: false,
    limits: {
      monthlyGenerations: 800,
      maxResolution: "2048x2048",
      models: ["flux-schnell", "flux-dev", "sdxl", "turbo", "realistic", "anime", "custom"],
      apiAccess: true,
      commercialLicense: true,
      prioritySupport: true,
      watermark: false,
      ecommerceTools: true,
    },
  },
};