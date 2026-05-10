import { db } from "@/lib/db/client";
import { generateGraduationArtwork } from "@/lib/openai/images";
import { consumeDailyGenerationQuota } from "@/lib/quota/daily-limit";

const RETRY_BACKOFF_MS = [30_000, 120_000, 480_000]; // 30s, 2min, 8min

/**
 * 将任务标记为 PROCESSING 并异步执行
 */
export async function enqueueGenerationJob(jobId: string) {
  await db.generationJob.update({
    where: { id: jobId },
    data: { status: "processing" },
  });

  /* 异步执行，内部有完整的重试循环 */
  processWithRetry(jobId).catch((e) => {
    console.error(`[队列] 任务彻底失败 jobId=${jobId}:`, e);
  });
}

/**
 * 带内部重试的处理循环
 * 不需要外部 cron 来接盘失败任务
 */
async function processWithRetry(jobId: string) {
  const job = await db.generationJob.findUnique({
    where: { id: jobId },
    include: { templatePreset: true },
  });

  if (!job) {
    console.warn(`[队列] 任务不存在 jobId=${jobId}`);
    return;
  }

  if (job.status === "succeeded" || job.status === "canceled") {
    console.log(`[队列] 任务已完成, 跳过 jobId=${jobId}`);
    return;
  }

  let retryCount = job.retryCount;

  while (retryCount <= job.maxRetries) {
    try {
      console.log(`[队列] 调用 Seedream jobId=${jobId} (第${retryCount + 1}次)`);
      const result = await generateGraduationArtwork({
        jobId: job.id,
        portraitObjectKeys: JSON.parse(job.portraitObjectKeys || "[]") as string[],
        templateId: job.templatePresetId,
        schoolPromptContext: job.customSchoolContext ?? "",
        customPrompt: job.customPrompt ?? undefined,
      });

      /* 成功 */
      await db.generationJob.update({
        where: { id: job.id },
        data: {
          status: "succeeded",
          outputObjectKey: result.outputObjectKey,
        },
      });

      await consumeDailyGenerationQuota(job.userId).catch((e) => {
        console.error(`[队列] 扣减配额失败 jobId=${jobId}:`, e);
      });

      console.log(`[队列] 生成成功 jobId=${jobId}`);
      return;
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : "未知错误";
      const nextRetry = retryCount + 1;

      if (isNonRetryable(errMsg) || nextRetry > job.maxRetries) {
        await db.generationJob.update({
          where: { id: job.id },
          data: {
            status: "failed",
            errorReason: errMsg,
            retryCount,
          },
        });
        console.error(`[队列] 生成失败(终局) jobId=${jobId}: ${errMsg}`);
        return;
      }

      /* 可重试：等待 backoff 后继续循环 */
      const delay = RETRY_BACKOFF_MS[retryCount] ?? RETRY_BACKOFF_MS[RETRY_BACKOFF_MS.length - 1];
      console.error(`[队列] 第${nextRetry}次失败, ${delay / 1000}s 后重试 jobId=${jobId}: ${errMsg}`);

      await db.generationJob.update({
        where: { id: job.id },
        data: {
          retryCount: nextRetry,
          errorReason: `[第${nextRetry}次] ${errMsg}`,
        },
      });

      await sleep(delay);
      retryCount = nextRetry;
    }
  }
}

/* ── Cron 轮询入口 ──────────────────────────────── */

const STUCK_THRESHOLD_MS = 120_000;

/**
 * 供 Vercel Cron / 外部定时器调用
 * 回收卡死的 processing 任务并处理新的 queued 任务
 */
export async function pollAndProcess() {
  let recovered = 0;

  const stuckJobs = await db.generationJob.findMany({
    where: {
      status: "processing",
      updatedAt: { lt: new Date(Date.now() - STUCK_THRESHOLD_MS) },
    },
    take: 5,
  });

  for (const job of stuckJobs) {
    await db.generationJob.update({
      where: { id: job.id },
      data: {
        status: "queued",
        errorReason: "任务超时，自动重试",
      },
    });
    recovered++;
  }

  const jobs = await db.generationJob.findMany({
    where: { status: "queued" },
    orderBy: { createdAt: "asc" },
    take: 5,
  });

  for (const job of jobs) {
    processWithRetry(job.id).catch((e) => {
      console.error(`[Cron] 任务失败 jobId=${job.id}:`, e);
    });
  }

  return { processed: jobs.length, recovered };
}

/**
 * 供查询端点触发：当发现有 queued 任务时唤醒处理
 */
export function wakeupQueuedJobs() {
  pollAndProcess().catch((e) => {
    console.error("[唤醒] 轮询失败:", e);
  });
}

/* ── 辅助 ──────────────────────────────────────── */

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isNonRetryable(errorMsg: string): boolean {
  const lower = errorMsg.toLowerCase();
  return (
    lower.includes("safety") ||
    lower.includes("content policy") ||
    lower.includes("invalid_request_error") ||
    lower.includes("model_not_found") ||
    lower.includes("insufficient") ||
    lower.includes("账户不可用") ||
    lower.includes("配额") ||
    lower.includes("余额")
  );
}
