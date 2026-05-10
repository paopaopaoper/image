import { searchSchools } from "@/server/services/school-asset-service";
import { z } from "zod";

export const dynamic = "force-dynamic";

const schema = z.object({
  q: z.string().max(200).optional(),
});

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const { q } = schema.parse({
      q: searchParams.get("q") ?? "",
    });

    const schools = await searchSchools(q ?? "");

    return Response.json({ schools });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json(
        { error: error.issues[0]?.message ?? "参数错误" },
        { status: 400 }
      );
    }
    const message =
      error instanceof Error ? error.message : "查询学校失败";
    return Response.json({ error: message }, { status: 500 });
  }
}
