import { db } from "@/lib/db/client";

export async function listActiveTemplates() {
  return db.templatePreset.findMany({
    where: { isActive: true },
    select: {
      id: true,
      slug: true,
      title: true,
      styleCategory: true,
      templateImageKey: true,
    },
    orderBy: { createdAt: "asc" },
  });
}
