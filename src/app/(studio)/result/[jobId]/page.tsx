"use client";

/**
 * 结果页 — 展示 AI 生成的结果图片
 * 自动轮询任务状态，支持下载和重新生成
 */
import { ResultPreview } from "@/components/generation/ResultPreview";

type ResultPageProps = {
  params: {
    jobId: string;
  };
};

export default function ResultPage({ params }: ResultPageProps) {
  return (
    <div className="max-w-sm mx-auto py-4 space-y-4">
      <h1 className="text-center font-serif text-xl text-ink-900">
        生成结果
      </h1>
      <ResultPreview jobId={params.jobId} />
    </div>
  );
}
