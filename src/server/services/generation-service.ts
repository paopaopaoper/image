import type { CreateGenerationJobInput } from "@/types/generation";
import { db } from "@/lib/db/client";
import { assertDailyGenerationQuota } from "@/lib/quota/daily-limit";
import { enqueueGenerationJob } from "@/server/jobs/generation-queue";
import { sanitizeSchoolInput, sanitizeCustomPrompt } from "@/lib/safety/moderation";
import { rateLimit } from "@/lib/rate-limit";

export async function createGenerationJob(input: CreateGenerationJobInput) {
  /* 验证用户状态 */
  const user = await db.user.findUnique({ where: { id: input.userId } });
  if (!user || !user.isActive || user.isBanned) {
    throw new Error("账户不可用");
  }

  /* 限流：每用户每 20 秒最多创建 1 个任务 */
  const cooldown = Number(process.env.GENERATION_COOLDOWN_SECONDS ?? 20);
  await rateLimit(`generation:create:${input.userId}`, 1, cooldown);

  /* 检查配额 */
  await assertDailyGenerationQuota(input.userId);

  /* 幂等检查：同用户同模板已存在非终态任务 */
  const existing = await db.generationJob.findFirst({
    where: {
      userId: input.userId,
      templatePresetId: input.templateId,
      status: { in: ["queued", "processing"] },
    },
  });
  if (existing) {
    return { jobId: existing.id, status: existing.status };
  }

  /* 清洗学校自定义文本与自定义提示词 */
  const safeSchoolContext = input.customSchoolElements
    ? sanitizeSchoolInput(input.customSchoolElements)
    : undefined;

  const safeCustomPrompt = input.customPrompt
    ? sanitizeCustomPrompt(input.customPrompt)
    : undefined;

  /* 创建任务 */
  const job = await db.generationJob.create({
    data: {
      userId: input.userId,
      portraitObjectKeys: JSON.stringify(input.portraitObjectKeys),
      templatePresetId: input.templateId,
      schoolId: input.schoolId,
      customSchoolContext: safeSchoolContext,
      customPrompt: safeCustomPrompt,
    },
  });

  /* 入队异步处理 */
  enqueueGenerationJob(job.id).catch((e) => {
    console.error(`[生成] 入队失败 jobId=${job.id}:`, e);
  });

  return { jobId: job.id, status: job.status };
}

export async function getGenerationJob(jobId: string, userId?: string) {
  const job = await db.generationJob.findUnique({
    where: { id: jobId },
    include: {
      templatePreset: {
        select: { title: true, slug: true },
      },
    },
  });

  if (!job) return null;

  /* 仅任务所有者或服务端可查看 */
  if (userId && job.userId !== userId) {
    throw new Error("无权查看该任务");
  }

  return job;
}
