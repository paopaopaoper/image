import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();

async function main() {
  // 标记超过 2 分钟的 processing 任务为 failed
  const r1 = await db.generationJob.updateMany({
    where: {
      status: "processing",
      updatedAt: { lt: new Date(Date.now() - 120_000) },
    },
    data: { status: "failed", errorReason: "任务超时（服务重启恢复）" },
  });
  // 标记超过 20 分钟的 queued 任务为 failed
  const r2 = await db.generationJob.updateMany({
    where: {
      status: "queued",
      retryCount: { gte: 3 },
    },
    data: { status: "failed", errorReason: "重试次数已用完" },
  });
  console.log(`Recovered processing: ${r1.count}, failed queued: ${r2.count}`);
  await db.$disconnect();
}
main();
