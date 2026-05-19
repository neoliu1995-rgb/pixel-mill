interface MemoryRateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, MemoryRateLimitEntry>();

export const rateLimiter = {
  check(ip: string, limit: number = 10, windowMs: number = 60_000) {
    const now = Date.now();

    for (const [key, entry] of rateLimitStore) {
      if (entry.resetAt <= now) {
        rateLimitStore.delete(key);
      }
    }

    const entry = rateLimitStore.get(ip);

    if (!entry || entry.resetAt <= now) {
      const resetAt = now + windowMs;
      rateLimitStore.set(ip, { count: 1, resetAt });
      return { allowed: true, remaining: limit - 1, resetAt };
    }

    if (entry.count >= limit) {
      return { allowed: false, remaining: 0, resetAt: entry.resetAt };
    }

    entry.count += 1;
    return { allowed: true, remaining: limit - entry.count, resetAt: entry.resetAt };
  },
};
