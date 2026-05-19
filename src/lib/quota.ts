import { prisma } from "@/lib/prisma";

export interface QuotaConfig {
  dailyGenerations: number;
  monthlyGenerations: number;
  monthlyBgRemoval: number;
  monthlyCopywriting: number;
}

export const QUOTA_LIMITS: Record<string, QuotaConfig> = {
  free: { dailyGenerations: 10, monthlyGenerations: 300, monthlyBgRemoval: 0, monthlyCopywriting: 3 },
  pro: { dailyGenerations: 50, monthlyGenerations: 300, monthlyBgRemoval: 20, monthlyCopywriting: 100 },
  business: { dailyGenerations: 999, monthlyGenerations: 800, monthlyBgRemoval: 999, monthlyCopywriting: 999 },
};

type UsageType = "dailyGenerations" | "monthlyGenerations" | "monthlyBgRemoval" | "monthlyCopywriting";

function getPeriodKey(usageType: string): string {
  const now = new Date();
  if (usageType.startsWith("daily")) {
    return now.toISOString().split("T")[0];
  }
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export function checkQuota(
  tier: string,
  usageType: string,
  currentUsage: number
): { allowed: boolean; remaining: number } {
  const config = QUOTA_LIMITS[tier] || QUOTA_LIMITS.free;
  const limit = config[usageType as UsageType];

  if (limit === undefined) {
    return { allowed: true, remaining: 999 };
  }

  const remaining = Math.max(0, limit - currentUsage);
  return {
    allowed: currentUsage < limit,
    remaining,
  };
}

export async function getUsage(userId: string, usageType: string): Promise<number> {
  const periodKey = getPeriodKey(usageType);
  const record = await prisma.usageRecord.findUnique({
    where: {
      userId_usageType_periodKey: {
        userId,
        usageType,
        periodKey,
      },
    },
  });
  if (!record) return 0;
  return record.count;
}

export async function incrementUsage(userId: string, usageType: string): Promise<number> {
  const periodKey = getPeriodKey(usageType);
  const record = await prisma.usageRecord.upsert({
    where: {
      userId_usageType_periodKey: {
        userId,
        usageType,
        periodKey,
      },
    },
    update: {
      count: { increment: 1 },
    },
    create: {
      userId,
      usageType,
      periodKey,
      count: 1,
    },
  });
  return record.count;
}

export async function getQuotaInfo(userId: string, tier: string) {
  const config = QUOTA_LIMITS[tier] || QUOTA_LIMITS.free;
  const dailyUsage = await getUsage(userId, "dailyGenerations");
  const monthlyUsage = await getUsage(userId, "monthlyGenerations");
  const bgRemovalUsage = await getUsage(userId, "monthlyBgRemoval");
  const copywritingUsage = await getUsage(userId, "monthlyCopywriting");

  return {
    daily: {
      used: dailyUsage,
      limit: config.dailyGenerations,
      remaining: Math.max(0, config.dailyGenerations - dailyUsage),
    },
    monthly: {
      used: monthlyUsage,
      limit: config.monthlyGenerations,
      remaining: Math.max(0, config.monthlyGenerations - monthlyUsage),
    },
    bgRemoval: {
      used: bgRemovalUsage,
      limit: config.monthlyBgRemoval,
      remaining: Math.max(0, config.monthlyBgRemoval - bgRemovalUsage),
    },
    copywriting: {
      used: copywritingUsage,
      limit: config.monthlyCopywriting,
      remaining: Math.max(0, config.monthlyCopywriting - copywritingUsage),
    },
  };
}
