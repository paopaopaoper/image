import { getSessionUserId } from "@/lib/auth/session";
import { getGenerationJob } from "@/server/services/generation-service";
import { wakeupQueuedJobs } from "@/server/jobs/generation-queue";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: { jobId: string };
};

export async function GET(_request: Request, { params }: RouteContext) {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return Response.json({ error: "请先登录" }, { status: 401 });
    }

    const job = await getGenerationJob(params.jobId, userId);

    if (!job) {
      return Response.json({ error: "任务不存在" }, { status: 404 });
    }

    /* 发现 queued 任务时触发唤醒（fire-and-forget） */
    if (job.status === "queued") {
      wakeupQueuedJobs();
    }

    /* 仅返回安全的字段 */
    return Response.json({
      id: job.id,
      status: job.status,
      templateTitle: job.templatePreset.title,
      outputObjectKey: job.outputObjectKey,
      errorReason: job.errorReason,
      createdAt: job.createdAt,
      updatedAt: job.updatedAt,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "查询任务失败";
    const status = message.includes("无权") ? 403 : 500;
    return Response.json({ error: message }, { status });
  }
}
