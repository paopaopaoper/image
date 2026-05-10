"use client";

/**
 * 创作工坊 — 分步骤完成毕业照 AI 生成
 * 1. 上传肖像  2. 选择模板  3. 毕业院校  4. 创意描述  5. 生成
 */
import { useCreationStore } from "@/lib/store/creation-store";
import { PortraitUploader } from "@/components/upload/PortraitUploader";
import { TemplateGrid } from "@/components/templates/TemplateGrid";
import { SchoolSelector } from "@/components/school/SchoolSelector";
import { GenerateButton } from "@/components/generation/GenerateButton";
import { ModelBadge } from "@/components/generation/ModelBadge";

/* ── 步骤区块容器 ── */
function StepSection({
  number,
  title,
  description,
  optional = false,
  children,
}: {
  number: number;
  title: string;
  description: string;
  optional?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4">
      {/* 步骤标题 */}
      <div className="flex items-start gap-3">
        {/* 步骤编号 */}
        <span className="flex-shrink-0 flex items-center justify-center h-7 w-7 rounded-full bg-ink-900 text-wash-50 text-xs font-medium">
          {number}
        </span>
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-serif text-ink-900 leading-tight">
            {title}
            {optional && (
              <span className="ml-2 text-xs font-normal text-ink-400">
                （可选）
              </span>
            )}
          </h2>
          <p className="text-sm text-ink-500 mt-0.5">{description}</p>
        </div>
      </div>

      {/* 步骤内容 */}
      <div className="ml-10">{children}</div>
    </section>
  );
}

export default function CreatePage() {
  const { customPrompt, setCustomPrompt } = useCreationStore();

  return (
    <div className="space-y-12 py-4">
      {/* 页面标题 */}
      <div className="text-center mb-2">
        <h1 className="text-2xl font-serif text-ink-900">创作工坊</h1>
        <p className="text-sm text-ink-500 mt-2">
          按步骤填写信息，AI 将为你生成独一无二的毕业纪念照
        </p>
        <div className="mt-3 flex justify-center">
          <ModelBadge />
        </div>
      </div>

      {/* 步骤 1: 上传肖像 */}
      <StepSection
        number={1}
        title="上传肖像照"
        description="上传 1-5 张清晰的肖像照，多角度照片可帮助 AI 更好地还原你的样貌"
      >
        <PortraitUploader />
      </StepSection>

      {/* 步骤 2: 选择模板 */}
      <StepSection
        number={2}
        title="选择风格模板"
        description="挑选你喜欢的毕业照风格"
      >
        <TemplateGrid />
      </StepSection>

      {/* 步骤 3: 毕业院校 */}
      <StepSection
        number={3}
        title="毕业院校"
        description="选择或搜索你的学校"
        optional
      >
        <SchoolSelector />
      </StepSection>

      {/* 步骤 4: 创意描述（新增） */}
      <StepSection
        number={4}
        title="创意描述"
        description="描述你想要的风格、场景、氛围，让 AI 更好地理解你的想法"
        optional
      >
        <div className="space-y-2">
          <textarea
            value={customPrompt}
            onChange={(e) => {
              // 限制 500 字
              if (e.target.value.length <= 500) {
                setCustomPrompt(e.target.value);
              }
            }}
            placeholder="例如：夕阳下的校园，胶片质感，温暖怀旧风格，有银杏叶飘落..."
            rows={4}
            className="w-full px-4 py-3 rounded-gentle border border-wash-300
                       bg-white text-sm text-ink-800 placeholder:text-ink-400
                       focus:outline-none focus:ring-2 focus:ring-accent-muted/50 focus:border-accent-muted
                       resize-none transition-all"
          />
          {/* 字数统计 */}
          <div className="flex justify-between text-xs text-ink-400">
            <span>
              留空则由 AI 自动生成默认提示词
            </span>
            <span className={customPrompt.length >= 500 ? "text-red-500" : ""}>
              {customPrompt.length}/500
            </span>
          </div>
        </div>
      </StepSection>

      {/* 步骤 5: 生成 */}
      <StepSection
        number={5}
        title="开始生成"
        description="确认以上信息无误后，点击按钮开始 AI 创作"
      >
        <GenerateButton />
      </StepSection>
    </div>
  );
}
