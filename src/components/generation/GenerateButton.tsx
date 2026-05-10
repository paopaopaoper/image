"use client";

/**
 * 生成按钮 — 收集所有创作参数，调用 /api/generation/jobs 创建任务
 */
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Sparkles } from "lucide-react";
import { createJob, type CreateJobParams } from "@/lib/api/client";
import { useCreationStore } from "@/lib/store/creation-store";
import { Button } from "@/components/ui/Button";

export function GenerateButton() {
  const router = useRouter();
  const store = useCreationStore();
  const [error, setError] = useState<string | null>(null);

  const canSubmit = store.portraitObjectKeys.length > 0 && store.selectedTemplateId;

  const handleGenerate = async () => {
    if (!canSubmit || store.isGenerating) return;

    store.setIsGenerating(true);
    setError(null);

    const params: CreateJobParams = {
      portraitObjectKeys: store.portraitObjectKeys,
      templateId: store.selectedTemplateId!,
    };

    // 可选字段
    if (store.selectedSchoolId) {
      params.schoolId = store.selectedSchoolId;
      params.customSchoolElements = store.selectedSchoolName ?? undefined;
    }

    // 自定义创意提示词（新增字段）
    if (store.customPrompt.trim()) {
      params.customPrompt = store.customPrompt.trim();
    }

    try {
      const result = await createJob(params);
      store.setJobId(result.jobId);
      router.push(`/result/${result.jobId}`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "创建任务失败";
      setError(msg);
      store.setIsGenerating(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <Button
        variant="primary"
        size="lg"
        loading={store.isGenerating}
        disabled={!canSubmit}
        onClick={handleGenerate}
        className="w-full max-w-xs"
      >
        {store.isGenerating ? (
          "正在创建任务..."
        ) : (
          <>
            <Sparkles className="h-4 w-4" />
            开始生成
          </>
        )}
      </Button>

      {!canSubmit && (
        <p className="text-xs text-ink-400">
          请先上传肖像照并选择模板
        </p>
      )}

      {error && (
        <p className="text-sm text-red-600 text-center max-w-xs">{error}</p>
      )}
    </div>
  );
}
