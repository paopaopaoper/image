import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { createHmac } from "crypto";

async function main() {
  const db = new PrismaClient();
  const phoneSecret = "dev-secret-graduation-art-2026-change-in-production";
  const phoneHash = createHmac("sha256", phoneSecret).update("13800138000").digest("hex");
  const code = "000000";
  const hash = bcrypt.hashSync(code, 10);

  console.log("hash:", hash);
  console.log("phoneHash:", phoneHash);

  await db.otpCode.deleteMany({ where: { phoneHash } });
  await db.otpCode.create({
    data: { phoneHash, codeHash: hash, expiresAt: new Date(Date.now() + 300000) },
  });

  const record = await db.otpCode.findFirst({ where: { phoneHash, consumedAt: null } });
  console.log("DB record:", record?.codeHash?.slice(0, 20) + "...");
  console.log("verify:", bcrypt.compareSync(code, record?.codeHash ?? ""));

  await db.$disconnect();
}
main();
