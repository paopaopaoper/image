"use client";

/**
 * 手机号登录页 — 短信验证码登录
 * 步骤: 输入手机号 → 发送验证码 → 输入验证码 → 验证 → 跳转 /create
 */
import { useState, useRef, useEffect, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, ArrowLeft, ShieldCheck, Smartphone } from "lucide-react";
import { sendOtp, verifyOtp } from "@/lib/api/client";
import { Button } from "@/components/ui/Button";

const COUNTDOWN_SECONDS = 60;

export default function LoginPage() {
  const router = useRouter();

  // ── 表单状态 ──
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"phone" | "code">("phone");

  // ── 验证码发送 ──
  const [sendingOtp, setSendingOtp] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [sendError, setSendError] = useState<string | null>(null);

  // ── 验证状态 ──
  const [verifying, setVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [devCode, setDevCode] = useState<string | null>(null);

  const codeInputRef = useRef<HTMLInputElement>(null);

  // 倒计时逻辑
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  // 自动聚焦验证码输入框
  useEffect(() => {
    if (step === "code") {
      codeInputRef.current?.focus();
    }
  }, [step]);

  // ── 发送验证码 ──
  const handleSendOtp = async (e: FormEvent) => {
    e.preventDefault();
    if (sendingOtp || countdown > 0) return;

    // 简易手机号校验
    const trimmed = phone.replace(/\s/g, "");
    if (!/^1[3-9]\d{9}$/.test(trimmed)) {
      setSendError("请输入有效的手机号");
      return;
    }

    setSendingOtp(true);
    setSendError(null);

    try {
      const result = await sendOtp(trimmed);
      setCountdown(COUNTDOWN_SECONDS);
      setStep("code");
      setVerifyError(null);
      setDevCode(result.devCode ?? null);
    } catch (e) {
      setSendError(e instanceof Error ? e.message : "发送失败，请稍后重试");
    } finally {
      setSendingOtp(false);
    }
  };

  // ── 验证码验证 ──
  const handleVerify = async (e: FormEvent) => {
    e.preventDefault();
    if (verifying) return;

    const trimmed = phone.replace(/\s/g, "");
    const trimmedCode = code.trim();

    if (!trimmedCode || trimmedCode.length < 4) {
      setVerifyError("请输入完整验证码");
      return;
    }

    setVerifying(true);
    setVerifyError(null);

    try {
      await verifyOtp(trimmed, trimmedCode);
      router.push("/create");
    } catch (e) {
      setVerifyError(e instanceof Error ? e.message : "验证失败，请检查验证码");
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* 顶栏 */}
      <header className="h-14 flex items-center px-6 border-b border-wash-200">
        <Link href="/" className="font-serif text-lg text-ink-900 tracking-wide">
          毕业纪念
        </Link>
      </header>

      {/* 主体 */}
      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          {/* 标题 */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-accent-muted/20 mb-4">
              <Smartphone className="h-5 w-5 text-accent-deep" />
            </div>
            <h1 className="font-serif text-2xl text-ink-900 mb-2">
              {step === "phone" ? "手机号登录" : "输入验证码"}
            </h1>
            <p className="text-sm text-ink-500">
              {step === "phone"
                ? "使用手机号即可创建你的毕业纪念照"
                : `验证码已发送至 ${phone.replace(/\s/g, "")}`}
            </p>
          </div>

          {/* 步骤 1: 输入手机号 */}
          {step === "phone" && (
            <form onSubmit={handleSendOtp} className="space-y-5">
              {/* 手机号输入 */}
              <div>
                <label
                  htmlFor="phone-input"
                  className="block text-sm font-medium text-ink-700 mb-2"
                >
                  手机号
                </label>
                <input
                  id="phone-input"
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel"
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value);
                    setSendError(null);
                  }}
                  placeholder="请输入手机号"
                  className="w-full h-12 px-4 rounded-gentle border border-wash-300
                             bg-white text-base text-ink-900 placeholder:text-ink-400
                             focus:outline-none focus:ring-2 focus:ring-accent-muted/50 focus:border-accent-muted
                             transition-all"
                  maxLength={13}
                />
              </div>

              {/* 发送错误 */}
              {sendError && (
                <p className="text-sm text-red-600">{sendError}</p>
              )}

              {/* 发送按钮 */}
              <Button
                type="submit"
                variant="primary"
                size="lg"
                loading={sendingOtp}
                className="w-full"
                disabled={!phone.trim()}
              >
                {sendingOtp ? "发送中..." : "发送验证码"}
                {!sendingOtp && <ArrowRight className="h-4 w-4" />}
              </Button>
            </form>
          )}

          {/* 步骤 2: 输入验证码 */}
          {step === "code" && (
            <form onSubmit={handleVerify} className="space-y-5">
              {/* 验证码输入 */}
              <div>
                <label
                  htmlFor="code-input"
                  className="block text-sm font-medium text-ink-700 mb-2"
                >
                  验证码
                </label>
                <input
                  ref={codeInputRef}
                  id="code-input"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  value={code}
                  onChange={(e) => {
                    // 只允许数字
                    const val = e.target.value.replace(/\D/g, "");
                    if (val.length <= 6) {
                      setCode(val);
                      setVerifyError(null);
                    }
                  }}
                  placeholder="输入 6 位验证码"
                  className="w-full h-12 px-4 rounded-gentle border border-wash-300
                             bg-white text-base text-ink-900 placeholder:text-ink-400
                             tracking-[0.3em] text-center
                             focus:outline-none focus:ring-2 focus:ring-accent-muted/50 focus:border-accent-muted
                             transition-all"
                  maxLength={6}
                />
              </div>

              {/* 验证错误 */}
              {verifyError && (
                <p className="text-sm text-red-600">{verifyError}</p>
              )}

              {/* 开发模式：显示验证码 */}
              {devCode && (
                <p className="text-sm text-ink-500 text-center">
                  开发验证码：<button
                    type="button"
                    className="font-mono font-bold text-accent-deep underline hover:text-ink-800"
                    onClick={() => { setCode(devCode); setVerifyError(null); }}
                  >
                    {devCode}
                  </button>
                </p>
              )}

              {/* 操作按钮 */}
              <div className="space-y-3">
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  loading={verifying}
                  className="w-full"
                  disabled={code.length < 4}
                >
                  {verifying ? "验证中..." : "验证登录"}
                </Button>

                {/* 重新发送 */}
                <div className="flex items-center justify-between text-sm">
                  <button
                    type="button"
                    onClick={() => setStep("phone")}
                    className="text-ink-500 hover:text-ink-700 transition-colors inline-flex items-center gap-1"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    更换手机号
                  </button>

                  <button
                    type="button"
                    onClick={handleSendOtp}
                    disabled={countdown > 0 || sendingOtp}
                    className={`transition-colors ${
                      countdown > 0
                        ? "text-ink-400 cursor-default"
                        : "text-accent-deep hover:text-accent-deep/80"
                    }`}
                  >
                    {countdown > 0
                      ? `${countdown} 秒后重发`
                      : sendingOtp
                      ? "发送中..."
                      : "重新发送"}
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* 合规声明 */}
          <div className="mt-10 flex items-start gap-2 text-xs text-ink-400 leading-relaxed">
            <ShieldCheck className="h-3.5 w-3.5 mt-0.5 shrink-0" />
            <span>
              登录即表示你同意将照片仅用于个人毕业纪念创作，不会用于商业用途。
            </span>
          </div>
        </div>
      </main>
    </div>
  );
}
