import { getSessionUserId } from "@/lib/auth/session";
import { db } from "@/lib/db/client";
import { z } from "zod";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

/* ── 管理员鉴权 ────────────────────────────── */

async function requireAdmin() {
  const userId = await getSessionUserId();
  if (!userId) throw new Error("请先登录");

  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user || user.role !== "admin") throw new Error("无权限");
  return user;
}

/* ── GET: 获取所有模板 ───────────────────────────── */

export async function GET() {
  try {
    await requireAdmin();
    const templates = await db.templatePreset.findMany({
      orderBy: { createdAt: "desc" },
    });
    return Response.json({ templates });
  } catch (error) {
    const message = error instanceof Error ? error.message : "获取失败";
    return Response.json({ error: message }, { status: 403 });
  }
}

/* ── POST: 新建模板 ──────────────────────────────── */

export async function POST(request: Request) {
  try {
    await requireAdmin();

    const formData = await request.formData();
    const title = formData.get("title") as string;
    const prompt = formData.get("prompt") as string;
    const imageFile = formData.get("image") as File | null;

    if (!title || !prompt) {
      return Response.json({ error: "标题和提示词不能为空" }, { status: 400 });
    }

    /* 生成 slug */
    const slug = title
      .trim()
      .replace(/\s+/g, "-")
      .replace(/[^\w一-鿿-]/g, "")
      .toLowerCase()
      .slice(0, 50) || `template-${Date.now()}`;

    /* 保存模板图片 */
    let templateImageKey: string | null = null;
    if (imageFile) {
      const ext = imageFile.name.split(".").pop()?.toLowerCase() ?? "png";
      const filename = `${slug}.${ext}`;
      const outputDir = path.join(process.cwd(), "public", "templates");
      await mkdir(outputDir, { recursive: true });

      const buffer = Buffer.from(await imageFile.arrayBuffer());
      await writeFile(path.join(outputDir, filename), buffer);
      templateImageKey = `templates/${filename}`;
    }

    const template = await db.templatePreset.create({
      data: {
        slug,
        title,
        prompt,
        templateImageKey,
        styleCategory: "photographic",
        isActive: true,
      },
    });

    return Response.json({ template }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "创建失败";
    const status = message.includes("权限") || message.includes("登录") ? 403 : 500;
    return Response.json({ error: message }, { status });
  }
}
