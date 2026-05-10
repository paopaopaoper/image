import { db } from "@/lib/db/client";

export async function assertDailyGenerationQuota(userId: string) {
  const dateKey = new Date().toISOString().slice(0, 10); // "2026-05-09"
  const freeLimit = Number(process.env.FREE_DAILY_GENERATIONS ?? 3);

  const quota = await db.dailyQuota.upsert({
    where: { userId_dateKey: { userId, dateKey } },
    update: {},
    create: { userId, dateKey, usedCount: 0 },
  });

  if (quota.usedCount >= freeLimit) {
    throw new Error(`今日免费生成次数已用完（${freeLimit}次/天），请明天再来`);
  }

  return quota;
}

export async function consumeDailyGenerationQuota(userId: string) {
  const dateKey = new Date().toISOString().slice(0, 10);

  /* 乐观锁扣减 */
  const result = await db.dailyQuota.update({
    where: { userId_dateKey: { userId, dateKey } },
    data: {
      usedCount: { increment: 1 },
      version: { increment: 1 },
    },
  });

  return result;
}
