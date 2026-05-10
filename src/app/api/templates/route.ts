import { listActiveTemplates } from "@/server/services/template-service";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const templates = await listActiveTemplates();
    return Response.json({ templates });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "获取模板列表失败";
    return Response.json({ error: message }, { status: 500 });
  }
}
