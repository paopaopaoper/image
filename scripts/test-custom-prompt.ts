/**
 * 测试自定义提示词完整链路
 */
import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();

const BASE = "http://localhost:3004";

async function main() {
  console.log("=== 自定义提示词链路测试 ===\n");

  // 1. 发送 OTP
  console.log("1. 发送 OTP...");
  const s1 = await fetch(`${BASE}/api/auth/sms/send`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone: "13800138001" }),
  });
  console.log(`   ${s1.status} ${await s1.text()}`);

  // 2. 覆盖 OTP (用已知 bcrypt hash: "000000")
  console.log("2. 覆盖验证码...");
  const hash = "$2a$10$93Qnbazf2xQVRCgXp/5loeCUsBvJyjLsNwKIWU.bz8.WodvwJ8Kq.";
  const crypto = await import("crypto");
  const phoneSecret = "dev-secret-graduation-art-2026-change-in-production";
  const phoneHash = crypto.createHmac("sha256", phoneSecret).update("13800138001").digest("hex");

  await db.otpCode.deleteMany({ where: { phoneHash } });
  await db.otpCode.create({
    data: {
      phoneHash,
      codeHash: hash,
      expiresAt: new Date(Date.now() + 300_000),
    },
  });
  console.log("   ✓");

  // 3. 验证 OTP
  console.log("3. 验证 OTP...");
  const s3 = await fetch(`${BASE}/api/auth/sms/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone: "13800138001", code: "000000" }),
  });
  const setCookie = s3.headers.get("set-cookie") ?? "";
  const sessionCookie = setCookie.split(";")[0];
  console.log(`   ${s3.status} cookie=${sessionCookie.slice(0, 30)}...`);

  // 4. 获取模板
  console.log("4. 获取模板...");
  const s4 = await fetch(`${BASE}/api/templates`);
  const { templates } = await s4.json();
  const tpl = templates[0];
  console.log(`   模板: ${tpl?.title} (${tpl?.id})`);

  // 5. 创建任务（带自定义提示词）
  console.log("5. 创建任务 (customPrompt)...");
  const s5 = await fetch(`${BASE}/api/generation/jobs`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: sessionCookie,
    },
    body: JSON.stringify({
      portraitObjectKeys: ["test/mock-portrait-custom.jpg"],
      templateId: tpl.id,
      customPrompt: "夕阳下的校园操场，暖金色调，胶片质感，朦胧怀旧",
    }),
  });
  const job = await s5.json();
  console.log(`   ${s5.status} jobId=${job.jobId} status=${job.status}`);

  // 6. 等待处理
  console.log("6. 等待生成完成...");
  for (let i = 0; i < 30; i++) {
    await new Promise((r) => setTimeout(r, 3000));
    const s6 = await fetch(`${BASE}/api/generation/jobs/${job.jobId}`, {
      headers: { Cookie: sessionCookie },
    });
    const status = await s6.json();
    console.log(`   ${i + 1}. status=${status.status}`);
    if (status.status === "succeeded" || status.status === "failed") {
      console.log(`   结果: ${JSON.stringify(status)}`);
      break;
    }
  }

  await db.$disconnect();
}
main().catch((e) => { console.error(e); process.exit(1); });
