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

interface UsageRecord {
  count: number;
  date: string;
}

const usageStore = new Map<string, UsageRecord>();

function getDailyKey(userId: string, usageType: string): string {
  const today = new Date().toISOString().split("T")[0];
  return `${userId}:${usageType}:${today}`;
}

function getMonthlyKey(userId: string, usageType: string): string {
  const now = new Date();
  const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  return `${userId}:${usageType}:${monthKey}`;
}

function getStorageKey(userId: string, usageType: string): string {
  if (usageType.startsWith("daily")) {
    return getDailyKey(userId, usageType);
  }
  return getMonthlyKey(userId, usageType);
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

export function getUsage(userId: string, usageType: string): number {
  const key = getStorageKey(userId, usageType);
  const record = usageStore.get(key);
  if (!record) return 0;
  return record.count;
}

export function incrementUsage(userId: string, usageType: string): number {
  const key = getStorageKey(userId, usageType);
  const record = usageStore.get(key);
  if (!record) {
    usageStore.set(key, { count: 1, date: new Date().toISOString() });
    return 1;
  }
  record.count += 1;
  return record.count;
}

export function getQuotaInfo(userId: string, tier: string) {
  const config = QUOTA_LIMITS[tier] || QUOTA_LIMITS.free;
  const dailyUsage = getUsage(userId, "dailyGenerations");
  const monthlyUsage = getUsage(userId, "monthlyGenerations");
  const bgRemovalUsage = getUsage(userId, "monthlyBgRemoval");
  const copywritingUsage = getUsage(userId, "monthlyCopywriting");

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
