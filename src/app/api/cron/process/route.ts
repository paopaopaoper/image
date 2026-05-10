import { pollAndProcess } from "@/server/jobs/generation-queue";

export const dynamic = "force-dynamic";

/**
 * Cron 轮询端点
 * 供 Vercel Cron Jobs 每 30 秒调用一次
 * 或通过外部 cron 服务 (cron-job.org / 阿里云 SchedulerX) 调用
 */
export async function GET() {
  try {
    /* 简单的鉴权：检查 cron secret */
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret) {
      // Vercel Cron 会自带 Authorization header，这里简化处理
      // 生产环境应校验 header
    }

    const result = await pollAndProcess();
    return Response.json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Cron 处理失败";
    return Response.json({ error: message }, { status: 500 });
  }
}
