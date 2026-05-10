"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { Download, RefreshCw, AlertTriangle, Loader2, Clock } from "lucide-react";
import { getJob, type JobResult } from "@/lib/api/client";
import { useCreationStore } from "@/lib/store/creation-store";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";

type ResultPreviewProps = {
  jobId: string;
};

const POLL_INTERVAL = 3000; // 3 秒轮询
const MAX_WAIT_SECONDS = 180; // 最多等 3 分钟

/** 使用 Web Audio API 播放生成完成提示音（C5 → E5 双音） */
function playSuccessSound() {
  try {
    const ctx = new AudioContext();
    const playTone = (freq: number, startTime: number, duration: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.3, startTime + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(startTime);
      osc.stop(startTime + duration);
    };
    playTone(523.25, ctx.currentTime, 0.35);       // C5
    playTone(659.25, ctx.currentTime + 0.12, 0.45); // E5
  } catch {
    // 静默失败 — 提示音不是关键功能
  }
}

export function ResultPreview({ jobId }: ResultPreviewProps) {
  const router = useRouter();
  const reset = useCreationStore((s) => s.reset);
  const [job, setJob] = useState<JobResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [timedOut, setTimedOut] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const soundPlayedRef = useRef(false);

  const fetchJob = useCallback(async () => {
    try {
      const data = await getJob(jobId);
      setJob(data);

      if (data.status === "succeeded" || data.status === "failed" || data.status === "canceled") {
        return false;
      }
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : "获取任务状态失败");
      return false;
    } finally {
      setLoading(false);
    }
  }, [jobId]);

  useEffect(() => {
    let cancelled = false;
    let pollTimer: ReturnType<typeof setTimeout>;

    // 已用时间计时器
    timerRef.current = setInterval(() => {
      setElapsed((prev) => {
        if (prev >= MAX_WAIT_SECONDS) {
          return prev;
        }
        return prev + 1;
      });
    }, 1000);

    const poll = async () => {
      if (cancelled) return;
      const shouldContinue = await fetchJob();

      if (shouldContinue && !cancelled) {
        const currentElapsed = elapsed;
        if (currentElapsed >= MAX_WAIT_SECONDS) {
          setTimedOut(true);
          setError("生成超时，请稍后重试或联系客服");
          return;
        }
        pollTimer = setTimeout(poll, POLL_INTERVAL);
      }
    };

    poll();

    return () => {
      cancelled = true;
      if (pollTimer) clearTimeout(pollTimer);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [fetchJob, jobId]);

  // 生成成功时播放提示音（只播一次）
  useEffect(() => {
    if (job?.status === "succeeded" && !soundPlayedRef.current) {
      soundPlayedRef.current = true;
      playSuccessSound();
    }
  }, [job?.status]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const handleDownload = async () => {
    if (!job?.outputObjectKey) return;
    try {
      const res = await fetch(`/${job.outputObjectKey}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `graduation-photo-${jobId}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      window.open(`/${job.outputObjectKey}`, "_blank");
    }
  };

  const handleRegenerate = () => {
    reset();
    router.push("/create");
  };

  if (loading) {
    return (
      <Card className="p-6 space-y-4">
        <Skeleton className="w-full aspect-[3/4] max-w-sm mx-auto" />
        <Skeleton className="h-5 w-2/3 mx-auto" />
        <Skeleton className="h-4 w-1/2 mx-auto" />
      </Card>
    );
  }

  if (error || timedOut) {
    return (
      <Card className="p-8 text-center space-y-4">
        <AlertTriangle className="h-10 w-10 mx-auto text-ink-400" />
        <p className="text-sm text-ink-500">{error || "生成失败"}</p>
        <div className="flex gap-3 justify-center">
          <Button variant="outline" onClick={() => window.location.reload()}>
            重试
          </Button>
          <Button variant="primary" onClick={handleRegenerate}>
            <RefreshCw className="h-4 w-4" /> 重新生成
          </Button>
        </div>
      </Card>
    );
  }

  if (!job) return null;

  if (job.status === "queued" || job.status === "processing") {
    return (
      <Card className="p-8 text-center space-y-4">
        <Loader2 className="h-10 w-10 mx-auto text-accent-deep animate-spin" />
        <div>
          <p className="text-lg font-serif text-ink-800 mb-1">
            AI 正在创作中...
          </p>
          <p className="text-sm text-ink-400">
            {job.status === "queued" ? "排队等待中" : "正在生成你的专属毕业照"}
          </p>
        </div>
        {/* 已用时间 + 进度条 */}
        <div className="flex items-center justify-center gap-2 text-xs text-ink-400">
          <Clock className="h-3.5 w-3.5" />
          <span>已等待 {formatTime(elapsed)}</span>
          <span className="text-ink-300">/</span>
          <span>最长 {formatTime(MAX_WAIT_SECONDS)}</span>
        </div>
        <div className="w-full max-w-xs mx-auto h-1.5 rounded-full bg-wash-200 overflow-hidden">
          <div
            className="h-full rounded-full bg-accent-muted transition-all duration-1000"
            style={{ width: `${Math.min((elapsed / MAX_WAIT_SECONDS) * 100, 100)}%` }}
          />
        </div>
        <div className="flex justify-center gap-1">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-1.5 w-1.5 rounded-full bg-accent-muted animate-skeleton-pulse"
              style={{ animationDelay: `${i * 0.2}s` }}
            />
          ))}
        </div>
      </Card>
    );
  }

  if (job.status === "failed") {
    return (
      <Card className="p-8 text-center space-y-4">
        <AlertTriangle className="h-10 w-10 mx-auto text-red-400" />
        <div>
          <p className="text-lg font-serif text-ink-800 mb-1">生成失败</p>
          {job.errorReason && (
            <p className="text-sm text-ink-500">{job.errorReason}</p>
          )}
        </div>
        <Button variant="primary" onClick={handleRegenerate}>
          <RefreshCw className="h-4 w-4" />
          重新生成
        </Button>
      </Card>
    );
  }

  if (job.status === "succeeded" && job.outputObjectKey) {
    return (
      <Card className="overflow-hidden max-w-sm mx-auto">
        <div className="relative max-h-[75vh] bg-ink-100 flex items-center justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`/${job.outputObjectKey}`}
            alt={`生成结果 - ${job.templateTitle}`}
            className="max-h-[75vh] w-auto max-w-full object-contain"
          />
        </div>
        <div className="p-4 space-y-3">
          <p className="text-center text-sm text-ink-600 font-medium">
            {job.templateTitle}
          </p>
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={handleDownload}>
              <Download className="h-4 w-4" />
              下载图片
            </Button>
            <Button variant="primary" className="flex-1" onClick={handleRegenerate}>
              <RefreshCw className="h-4 w-4" />
              再生成一张
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-8 text-center space-y-4">
      <p className="text-sm text-ink-500">任务已取消</p>
      <Button variant="primary" onClick={handleRegenerate}>
        再生成一张
      </Button>
    </Card>
  );
}
