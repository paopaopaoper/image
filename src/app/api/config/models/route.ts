/**
 * GET /api/config/models — 返回当前激活的模型名称，供前端展示
 */

import { getActiveModelConfig } from "@/config/models";

export const dynamic = "force-dynamic";

export async function GET() {
  const { provider, config } = getActiveModelConfig();
  return Response.json({ provider, label: config.label });
}
