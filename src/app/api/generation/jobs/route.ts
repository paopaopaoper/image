import { getSessionUserId } from "@/lib/auth/session";
import { createGenerationJob } from "@/server/services/generation-service";
import { z } from "zod";

export const dynamic = "force-dynamic";

const schema = z.object({
  portraitObjectKeys: z.array(z.string()).min(1, "请先上传照片"),
  templateId: z.string().min(1, "请选择模板"),
  schoolId: z.string().optional(),
  customSchoolElements: z.string().max(200).optional(),
  customPrompt: z.string().max(500).optional(),
});

export async function POST(request: Request) {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return Response.json({ error: "请先登录" }, { status: 401 });
    }

    const body = await request.json();
    const input = schema.parse(body);

    const result = await createGenerationJob({
      userId,
      portraitObjectKeys: input.portraitObjectKeys,
      templateId: input.templateId,
      schoolId: input.schoolId,
      customSchoolElements: input.customSchoolElements,
      customPrompt: input.customPrompt,
    });

    return Response.json(result, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json(
        { error: error.issues[0]?.message ?? "参数校验失败" },
        { status: 400 }
      );
    }
    const message =
      error instanceof Error ? error.message : "创建生成任务失败";
    const status =
      message.includes("配额") || message.includes("频繁") ? 429 : 500;
    return Response.json({ error: message }, { status });
  }
}
