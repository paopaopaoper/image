import { getSessionUserId } from "@/lib/auth/session";
import { db } from "@/lib/db/client";
import { unlink } from "fs/promises";
import path from "path";

async function requireAdmin() {
  const userId = await getSessionUserId();
  if (!userId) throw new Error("请先登录");
  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user || user.role !== "admin") throw new Error("无权限");
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin();

    const template = await db.templatePreset.findUnique({
      where: { id: params.id },
    });
    if (!template) {
      return Response.json({ error: "模板不存在" }, { status: 404 });
    }

    /* 删除模板图片文件 */
    if (template.templateImageKey) {
      const filePath = path.join(process.cwd(), "public", template.templateImageKey);
      unlink(filePath).catch(() => {});
    }

    /* 先删除关联的生成任务，再删模板 */
    await db.generationJob.deleteMany({ where: { templatePresetId: params.id } });
    await db.templatePreset.delete({ where: { id: params.id } });

    return Response.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "删除失败";
    const status = message.includes("权限") ? 403 : 500;
    return Response.json({ error: message }, { status });
  }
}
