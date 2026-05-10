import { Redis } from "ioredis";

let redis: Redis | null = null;

function getRedis(): Redis {
  if (!redis) {
    const url = process.env.REDIS_URL;
    if (!url) {
      /* 无 Redis 时回退到内存 Map——仅适用于单实例开发环境 */
      console.warn("[RATE-LIMIT] REDIS_URL 未设置，使用内存限流（不适用于生产环境）");
      throw new Error("REDIS_URL 未设置");
    }
    redis = new Redis(url, { maxRetriesPerRequest: 2 });
  }
  return redis;
}

/**
 * 滑动窗口限流
 * @param key 限流键（建议格式: "模块:操作:标识"）
 * @param maxRequests 窗口内允许的最大请求数
 * @param windowSeconds 窗口大小（秒）
 */
export async function rateLimit(
  key: string,
  maxRequests: number,
  windowSeconds: number
) {
  try {
    const r = getRedis();
    const now = Date.now();
    const windowStart = now - windowSeconds * 1000;

    const lua = `
      local count = redis.call('zcount', KEYS[1], ARGV[1], '+inf')
      if count >= tonumber(ARGV[2]) then
        return 0
      end
      redis.call('zadd', KEYS[1], ARGV[3], ARGV[3])
      redis.call('expire', KEYS[1], ARGV[4])
      return 1
    `;

    const result = await r.eval(
      lua,
      1,
      `ratelimit:${key}`,
      windowStart,
      maxRequests,
      now,
      windowSeconds + 1
    );

    if (result === 0) {
      throw new Error("请求过于频繁，请稍后再试");
    }
  } catch (e) {
    if (e instanceof Error && e.message === "REDIS_URL 未设置") {
      /* 开发环境无 Redis 时跳过限流 */
      return;
    }
    throw e;
  }
}
