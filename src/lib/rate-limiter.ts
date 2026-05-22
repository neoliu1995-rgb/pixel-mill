import { prisma } from "@/lib/prisma";

export const rateLimiter = {
  async check(ip: string, limit: number = 10, windowMs: number = 60_000) {
    const key = `rl:${ip}:${Math.floor(windowMs / 1000)}`;
    const now = new Date();
    const resetAt = new Date(now.getTime() + windowMs);

    try {
      const existing = await prisma.rateLimitEntry.findUnique({ where: { key } });

      if (!existing || existing.resetAt <= now) {
        await prisma.rateLimitEntry.upsert({
          where: { key },
          update: { count: 1, resetAt },
          create: { key, count: 1, resetAt },
        });
        return { allowed: true, remaining: limit - 1, resetAt: resetAt.getTime() };
      }

      if (existing.count >= limit) {
        return { allowed: false, remaining: 0, resetAt: existing.resetAt.getTime() };
      }

      const updated = await prisma.rateLimitEntry.update({
        where: { key },
        data: { count: { increment: 1 } },
      });

      return {
        allowed: true,
        remaining: Math.max(0, limit - updated.count),
        resetAt: existing.resetAt.getTime(),
      };
    } catch {
      return { allowed: true, remaining: limit - 1, resetAt: resetAt.getTime() };
    }
  },

  async cleanup() {
    const now = new Date();
    try {
      await prisma.rateLimitEntry.deleteMany({
        where: { resetAt: { lte: now } },
      });
    } catch {}
  },
};
