import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();

async function main() {
  const jobs = await db.generationJob.findMany({
    orderBy: { createdAt: "desc" },
    take: 5,
    select: { id: true, status: true, errorReason: true, createdAt: true, updatedAt: true },
  });
  console.log(JSON.stringify(jobs, null, 2));
  await db.$disconnect();
}
main();
