import { db } from "@/lib/db/client";
import { sanitizeSchoolInput } from "@/lib/safety/moderation";

const assetSelect = {
  id: true,
  displayName: true,
  type: true,
  objectKey: true,
} as const;

export async function searchSchools(query: string) {
  const baseQuery = {
    take: 20,
    orderBy: { name: "asc" as const },
    include: {
      assets: { select: assetSelect },
    },
  };

  if (!query || query.trim().length === 0) {
    return db.school.findMany(baseQuery);
  }

  const cleaned = sanitizeSchoolInput(query);
  if (!cleaned) return [];

  return db.school.findMany({
    ...baseQuery,
    where: {
      OR: [
        { name: { contains: cleaned } },
        { aliases: { has: cleaned } },
      ],
    },
  });
}

export async function listSchoolAssets(query: string) {
  const schools = await searchSchools(query);
  return schools.flatMap((s) => s.assets);
}
