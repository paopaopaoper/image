import { PrismaClient } from "@prisma/client";

async function main() {
  const db = new PrismaClient();
  const j = await db.generationJob.findUnique({
    where: { id: "cmoyiv2xg000c7cbvxei0depb" },
  });
  console.log(JSON.stringify(j, null, 2));
  await db.$disconnect();
}
main();
