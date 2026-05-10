"use client";

/**
 * 模型标识组件 — 显示当前使用的 AI 图像模型
 * 从 /api/config/models 获取，非关键信息，加载失败时静默隐藏
 */

import { useEffect, useState } from "react";
import { Cpu } from "lucide-react";

interface ModelInfo {
  provider: string;
  label: string;
}

export function ModelBadge() {
  const [modelInfo, setModelInfo] = useState<ModelInfo | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch("/api/config/models")
      .then((res) => {
        if (!res.ok) throw new Error("获取模型配置失败");
        return res.json();
      })
      .then((data: ModelInfo) => setModelInfo(data))
      .catch(() => setError(true));
  }, []);

  // 静默失败，不展示
  if (error || !modelInfo) return null;

  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs text-ink-500 bg-wash-200/60 border border-wash-300/80">
      <Cpu className="h-3 w-3" />
      {modelInfo.label}
    </span>
  );
}
