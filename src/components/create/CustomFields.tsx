"use client";

import { useCreationStore } from "@/lib/store/creation-store";
import { SchoolSelector } from "@/components/school/SchoolSelector";

export function CustomFields() {
  const store = useCreationStore();

  return (
    <div className="space-y-6">
      {/* 学校搜索 */}
      <div>
        <label className="block text-sm font-medium text-ink-700 mb-1.5">
          选择学校（可选）
        </label>
        <SchoolSelector />
      </div>

      {/* 自定义提示词 */}
      <div>
        <label className="block text-sm font-medium text-ink-700 mb-1.5">
          创作灵感（可选）
        </label>
        <textarea
          className="w-full min-h-[100px] rounded-gentle border border-wash-300 bg-white px-4 py-3 text-sm text-ink-800 placeholder:text-ink-300 focus:outline-none focus:ring-2 focus:ring-accent-muted/30 resize-y"
          placeholder={"添加你的创作灵感，如：希望有飘落的梧桐叶、想要暖黄的夕阳色调...\n提示词仅作氛围参考，不改变人物身份和基本构图"}
          maxLength={500}
          value={store.customPrompt}
          onChange={(e) => store.setCustomPrompt(e.target.value)}
        />
        <p className="text-xs text-ink-400 mt-1 text-right">
          {store.customPrompt.length} / 500
        </p>
      </div>
    </div>
  );
}
