/**
 * 毕业照 AI 生成项目 - API 集成测试
 *
 * 测试链路:
 *   1. POST /api/auth/sms/send      - 发送 OTP 验证码
 *   2. 从 DB 覆盖 OTP 为已知值        - 绕过 bcrypt 不可逆问题
 *   3. POST /api/auth/sms/verify    - 验证 OTP，获取 session cookie
 *   4. GET  /api/templates           - 获取模板列表
 *   5. POST /api/upload/presign      - 获取上传预签名 URL (需 session)
 *   6. POST /api/generation/jobs     - 创建生成任务 (需 session)
 */

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { createHmac } from "node:crypto";
import { writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

// ── 配置 ──────────────────────────────────────────────
const BASE_URL = "http://localhost:3004";
const SESSION_SECRET = "dev-secret-graduation-art-2026-change-in-production";
const TEST_PHONE = "13800138000";
const KNOWN_CODE = "000000";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOG_DIR = path.resolve(__dirname, "..", "logs");
const timestamp = new Date()
  .toISOString()
  .replace(/[-:T.]/g, "")
  .slice(0, 14);
const LOG_FILE = path.join(LOG_DIR, `integration-test-${timestamp}.log`);

const logLines = [];

// ── 工具函数 ─────────────────────────────────────────

function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}`;
  console.log(line);
  logLines.push(line);
}

function hashPhone(phone) {
  return createHmac("sha256", SESSION_SECRET).update(phone).digest("hex");
}

function writeLog() {
  mkdirSync(LOG_DIR, { recursive: true });
  writeFileSync(LOG_FILE, logLines.join("\n"), "utf-8");
  console.log(`\n日志文件: ${LOG_FILE}`);
}

// ── 主流程 ───────────────────────────────────────────

async function main() {
  const db = new PrismaClient();
  let cookie = "";
  let portraitObjectKey = "";
  let allPassed = true;

  log("══════════════════════════════════════════");
  log("  毕业照 AI 生成项目 - API 集成测试");
  log(`  目标地址: ${BASE_URL}`);
  log(`  测试手机号: ${TEST_PHONE}`);
  log("══════════════════════════════════════════");
  log("");

  try {
    // ═══════════════════════════════════════════
    // Step 1: 发送 OTP 验证码
    // ═══════════════════════════════════════════
    log("── Step 1: 发送 OTP 验证码 ──");
    {
      const url = `${BASE_URL}/api/auth/sms/send`;
      const body = { phone: TEST_PHONE };

      log(`REQUEST  POST ${url}`);
      log(`BODY     ${JSON.stringify(body)}`);

      const resp = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const respText = await resp.text();
      log(`STATUS   ${resp.status}`);
      log(`RESPONSE ${respText}`);

      const passed = resp.status === 200;
      log(`RESULT   ${passed ? "PASS" : "FAIL"}`);
      if (!passed) allPassed = false;
    }
    log("");

    // ═══════════════════════════════════════════
    // Step 2: 覆盖 OTP 为已知验证码
    // ═══════════════════════════════════════════
    log("── Step 2: 从 DB 覆盖 OTP 为已知值 ──");
    {
      const phoneHash = hashPhone(TEST_PHONE);
      log(`phoneHash (计算值): ${phoneHash}`);

      const otp = await db.otpCode.findFirst({
        where: {
          phoneHash,
          consumedAt: null,
          expiresAt: { gt: new Date() },
        },
        orderBy: { createdAt: "desc" },
      });

      if (!otp) {
        log("WARN: 未找到有效的 OtpCode 记录，正在手动创建...");

        const knownHash = bcrypt.hashSync(KNOWN_CODE, 10);
        await db.otpCode.create({
          data: {
            phoneHash,
            codeHash: knownHash,
            expiresAt: new Date(Date.now() + 5 * 60 * 1000),
            attempts: 0,
          },
        });
        log(`已创建 OtpCode: phoneHash=${phoneHash}, code=${KNOWN_CODE}`);
        log("RESULT   PASS (手动创建)");
      } else {
        log(`找到 OtpCode: id=${otp.id}, attempts=${otp.attempts}`);

        const knownHash = bcrypt.hashSync(KNOWN_CODE, 10);
        await db.otpCode.update({
          where: { id: otp.id },
          data: { codeHash: knownHash, attempts: 0, expiresAt: new Date(Date.now() + 5 * 60 * 1000) },
        });
        log(`已更新 codeHash 为 "${KNOWN_CODE}" 的 bcrypt 哈希`);
        log("RESULT   PASS (覆盖成功)");
      }
    }
    log("");

    // ═══════════════════════════════════════════
    // Step 3: 验证 OTP
    // ═══════════════════════════════════════════
    log("── Step 3: 验证 OTP ──");
    {
      const url = `${BASE_URL}/api/auth/sms/verify`;
      const body = { phone: TEST_PHONE, code: KNOWN_CODE };

      log(`REQUEST  POST ${url}`);
      log(`BODY     ${JSON.stringify(body)}`);

      const resp = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const respText = await resp.text();
      const setCookieHeader = resp.headers.get("set-cookie") || "";

      log(`STATUS   ${resp.status}`);
      log(`RESPONSE ${respText}`);

      if (setCookieHeader) {
        // 提取 session_token cookie
        const m = setCookieHeader.match(/(session_token=[^;]+)/);
        cookie = m ? m[1] : "";
        log(`COOKIE   ${cookie ? "已获取 session_token" : "格式异常"}`);
      } else {
        log("COOKIE   未在响应头中找到 Set-Cookie");
      }

      const passed = resp.status === 200;
      log(`RESULT   ${passed ? "PASS" : "FAIL"}`);
      if (!passed) allPassed = false;
    }
    log("");

    // ═══════════════════════════════════════════
    // Step 4: 获取模板列表
    // ═══════════════════════════════════════════
    log("── Step 4: 获取模板列表 ──");
    let templateId = "";
    {
      const url = `${BASE_URL}/api/templates`;

      log(`REQUEST  GET ${url}`);

      const resp = await fetch(url);
      const json = await resp.json();

      log(`STATUS   ${resp.status}`);
      log(`RESPONSE ${JSON.stringify(json).slice(0, 500)}`);

      const templates = json.templates || [];
      if (templates.length > 0) {
        templateId = templates[0].id;
        log(`模板数量: ${templates.length}, 首个: id=${templateId} title="${templates[0].title}"`);
      }

      const passed = resp.status === 200 && templates.length > 0;
      log(`RESULT   ${passed ? "PASS" : "FAIL"}${templates.length === 0 ? " (无可用模板)" : ""}`);
      if (!passed) allPassed = false;
    }
    log("");

    // ═══════════════════════════════════════════
    // Step 5: 获取上传预签名 URL
    // ═══════════════════════════════════════════
    log("── Step 5: 获取上传预签名 URL ──");
    {
      const url = `${BASE_URL}/api/upload/presign`;

      log(`REQUEST  POST ${url}`);
      log(`COOKIE   ${cookie ? "已携带" : "未携带"}`);

      const resp = await fetch(url, {
        method: "POST",
        headers: cookie ? { Cookie: cookie } : {},
      });

      const respText = await resp.text();

      log(`STATUS   ${resp.status}`);
      log(`RESPONSE ${respText.slice(0, 300)}`);

      if (resp.ok) {
        try {
          const json = JSON.parse(respText);
          portraitObjectKey = json.objectKey || "";
          if (portraitObjectKey) {
            log(`获取 objectKey: ${portraitObjectKey}`);
          }
          log("RESULT   PASS");
        } catch {
          log("RESULT   FAIL (响应非 JSON)");
          allPassed = false;
        }
      } else {
        // S3 未配置时预签名会失败，使用模拟 key
        portraitObjectKey = `test/mock-portrait-${Date.now()}.jpg`;
        log(`WARN: 预签名失败 (可能 S3 未配置)，使用模拟 objectKey: ${portraitObjectKey}`);
        log("RESULT   SKIP (降级为模拟 key)");
      }
    }
    log("");

    // ═══════════════════════════════════════════
    // Step 6: 创建生成任务
    // ═══════════════════════════════════════════
    log("── Step 6: 创建生成任务 ──");
    if (!templateId) {
      log("SKIP: 无可用的模板 ID (Step 4 未获取到模板)");
    } else if (!cookie) {
      log("SKIP: 无有效的 session cookie (Step 3 未登录成功)");
    } else if (!portraitObjectKey) {
      log("SKIP: 无有效的 portraitObjectKey");
    } else {
      const url = `${BASE_URL}/api/generation/jobs`;
      const body = {
        portraitObjectKey,
        templateId,
        schoolId: undefined,
        customSchoolElements: "北京大学|未名湖|博雅塔",
      };

      log(`REQUEST  POST ${url}`);
      log(`BODY     ${JSON.stringify(body)}`);
      log(`COOKIE   ${cookie ? "已携带" : "未携带"}`);

      const resp = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(cookie ? { Cookie: cookie } : {}),
        },
        body: JSON.stringify(body),
      });

      const respText = await resp.text();

      log(`STATUS   ${resp.status}`);
      log(`RESPONSE ${respText}`);

      const passed = resp.status === 201;
      log(`RESULT   ${passed ? "PASS" : "FAIL"}${resp.status === 401 ? " (未登录)" : resp.status === 429 ? " (限流/配额)" : resp.status === 500 ? " (服务器错误)" : ""}`);

      if (resp.ok) {
        try {
          const json = JSON.parse(respText);
          log(`jobId:    ${json.jobId || "N/A"}`);
          log(`status:   ${json.status || "N/A"}`);

          // 查询任务状态（验证数据库写入）
          if (json.jobId) {
            const job = await db.generationJob.findUnique({
              where: { id: json.jobId },
              select: { id: true, status: true, portraitObjectKey: true, templatePresetId: true, createdAt: true },
            });
            if (job) {
              log(`DB 验证:  jobId=${job.id} status=${job.status} createdAt=${job.createdAt.toISOString()}`);
            } else {
              log("DB 验证:  未在数据库中找到该任务");
            }
          }
        } catch {
          // ignore parse error
        }
      }

      if (!passed) allPassed = false;
    }
    log("");

    // ═══════════════════════════════════════════
    // 总结
    // ═══════════════════════════════════════════
    log("══════════════════════════════════════════");
    log(`  测试结果: ${allPassed ? "全部通过" : "存在失败项"}`);
    log("══════════════════════════════════════════");

  } catch (err) {
    log("");
    log(`FATAL ERROR: ${err.message}`);
    log(`STACK: ${err.stack}`);
    allPassed = false;
  } finally {
    await db.$disconnect();
    writeLog();
  }

  return allPassed;
}

main().then((passed) => {
  process.exit(passed ? 0 : 1);
});
