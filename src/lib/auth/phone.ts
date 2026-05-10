import { db } from "@/lib/db/client";
import { createSession } from "@/lib/auth/session";
import { rateLimit } from "@/lib/rate-limit/index";
import bcrypt from "bcryptjs";
import { createHmac } from "crypto";

const OTP_LENGTH = 6;
const OTP_TTL_MINUTES = 5;
const MAX_ATTEMPTS = 5;

/** HMAC-SHA256 确定性哈希，同一手机号永远产出相同 hash */
function hashPhone(phone: string): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error("SESSION_SECRET 环境变量未设置");
  return createHmac("sha256", secret).update(phone).digest("hex");
}

function hashCode(code: string) {
  return bcrypt.hashSync(code, 10);
}

export async function sendPhoneOtp(phone: string) {
  const phoneHash = hashPhone(phone);

  /* 限流：每分钟同一手机号最多 1 次 */
  await rateLimit(`otp:send:${phoneHash}`, 1, 60);

  /* 生成 6 位验证码 */
  const code = String(Math.floor(100000 + Math.random() * 900000));

  /* 废弃旧 OTP */
  await db.otpCode.updateMany({
    where: { phoneHash, consumedAt: null },
    data: { consumedAt: new Date() },
  });

  /* 存储新 OTP */
  await db.otpCode.create({
    data: {
      phoneHash,
      codeHash: hashCode(code),
      expiresAt: new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000),
    },
  });

  /* 发送短信 */
  await sendSms(phone, code);

  /* 开发/调试模式：返回验证码明文，方便前端展示 */
  const isMock = !process.env.SMS_PROVIDER || process.env.SMS_PROVIDER === "mock";
  return { success: true, ...(isMock && { devCode: code }) };
}

export async function verifyPhoneOtp(phone: string, code: string) {
  const phoneHash = hashPhone(phone);

  /* 限流：每分钟同一手机号最多 5 次验证 */
  await rateLimit(`otp:verify:${phoneHash}`, 5, 60);

  const record = await db.otpCode.findFirst({
    where: {
      phoneHash,
      consumedAt: null,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: "desc" },
  });

  if (!record) {
    throw new Error("验证码不存在或已过期");
  }

  if (record.attempts >= MAX_ATTEMPTS) {
    await db.otpCode.update({
      where: { id: record.id },
      data: { consumedAt: new Date() },
    });
    throw new Error("验证码尝试次数过多，请重新获取");
  }

  const valid = bcrypt.compareSync(code, record.codeHash);
  if (!valid) {
    await db.otpCode.update({
      where: { id: record.id },
      data: { attempts: { increment: 1 } },
    });
    throw new Error("验证码错误");
  }

  /* 标记 OTP 已消费 */
  await db.otpCode.update({
    where: { id: record.id },
    data: { consumedAt: new Date() },
  });

  /* 查找或创建用户 */
  let user = await db.user.findUnique({ where: { phoneHash } });
  if (!user) {
    user = await db.user.create({ data: { phoneHash } });
  }

  if (!user.isActive || user.isBanned) {
    throw new Error("账户已被禁用");
  }

  /* 创建会话 */
  await createSession(user.id);

  return { userId: user.id };
}

/* ── SMS 发送适配器 ─────────────────────────────── */

async function sendSms(phone: string, code: string) {
  const provider = process.env.SMS_PROVIDER;

  if (!provider || provider === "mock") {
    console.log(`[SMS MOCK] 发送验证码到 ${phone}: ${code}`);
    return;
  }

  if (provider === "aliyun") {
    /* TODO: 接入阿里云短信 SDK */
    console.log(`[SMS ALIYUN] 发送验证码到 ${phone}: ${code}`);
    return;
  }

  if (provider === "tencent") {
    /* TODO: 接入腾讯云短信 SDK */
    console.log(`[SMS TENCENT] 发送验证码到 ${phone}: ${code}`);
    return;
  }

  throw new Error(`不支持的 SMS 服务商: ${provider}`);
}
