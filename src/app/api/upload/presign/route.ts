import { getSessionUserId } from "@/lib/auth/session";
import { createUploadTarget } from "@/lib/storage";

export async function POST() {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return Response.json({ error: "请先登录" }, { status: 401 });
    }

    const target = await createUploadTarget(userId);

    return Response.json(target);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "上传配置失败";
    return Response.json({ error: message }, { status: 500 });
  }
}
