/**
 * 本地文件上传（开发模式，替代 S3 预签名上传）
 * 接收 PUT 请求的二进制文件流，与 S3 预签名 URL 行为一致
 */
import { getSessionUserId } from "@/lib/auth/session";
import { writeFile, mkdir } from "fs/promises";
import { join, dirname } from "path";
import { randomUUID } from "crypto";

export async function PUT(request: Request) {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return Response.json({ error: "请先登录" }, { status: 401 });
    }

    const buffer = Buffer.from(await request.arrayBuffer());
    if (buffer.length === 0) {
      return Response.json({ error: "文件为空" }, { status: 400 });
    }

    const maxSize = (Number(process.env.MAX_UPLOAD_MB) || 12) * 1024 * 1024;
    if (buffer.length > maxSize) {
      return Response.json({ error: `文件大小超过限制 ${process.env.MAX_UPLOAD_MB || 12}MB` }, { status: 400 });
    }

    /* 从 query 参数获取 objectKey，确保与 createUploadTarget 一致 */
    const url = new URL(request.url);
    const objectKey = url.searchParams.get("key") || `uploads/${userId}/${randomUUID()}.jpg`;
    const filePath = join(process.cwd(), "public", objectKey);
    await mkdir(join(process.cwd(), "public", dirname(objectKey)), { recursive: true });
    await writeFile(filePath, buffer);

    return Response.json({ objectKey });
  } catch (error) {
    const message = error instanceof Error ? error.message : "上传失败";
    return Response.json({ error: message }, { status: 500 });
  }
}
