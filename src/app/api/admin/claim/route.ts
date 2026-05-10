import { getSessionUserId } from "@/lib/auth/session";
import { db } from "@/lib/db/client";
import { z } from "zod";

const schema = z.object({
  secret: z.string().min(1, "密钥不能为空"),
});

export async function POST(request: Request) {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return Response.json({ error: "请先登录" }, { status: 401 });
    }

    const body = await request.json();
    const { secret } = schema.parse(body);

    const adminSecret = process.env.ADMIN_SECRET;
    if (!adminSecret || secret !== adminSecret) {
      return Response.json({ error: "密钥错误" }, { status: 403 });
    }

    await db.user.update({
      where: { id: userId },
      data: { role: "admin" },
    });

    return Response.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json({ error: error.issues[0]?.message ?? "参数错误" }, { status: 400 });
    }
    return Response.json({ error: "操作失败" }, { status: 500 });
  }
}
