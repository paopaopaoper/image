"use client";

/**
 * 风格模板网格 — 从 /api/templates 加载 9 种风格类别，卡片式展示
 */
import { useEffect, useState } from "react";
import { Check, Sparkles } from "lucide-react";
import { fetchTemplates } from "@/lib/api/client";
import { useCreationStore } from "@/lib/store/creation-store";
import { Card } from "@/components/ui/Card";
import { SkeletonCard } from "@/components/ui/Skeleton";
import type { TemplatePreset, StyleCategory } from "@/types/template";

/* 静态占位渐变 */
const PLACEHOLDER_GRADIENTS = [
  "from-rose-100 to-amber-100",
  "from-violet-100 to-indigo-100",
  "from-cyan-100 to-blue-100",
  "from-emerald-100 to-teal-100",
  "from-orange-100 to-yellow-100",
  "from-rose-100 to-sky-100",
  "from-amber-100 to-stone-100",
  "from-fuchsia-100 to-pink-100",
  "from-slate-100 to-gray-100",
];

/* 风格标签与描述 */
const STYLE_META: Record<StyleCategory, { label: string; desc: string }> = {
  photographic:     { label: "摄影写实", desc: "电影级人像摄影 · 真实质感" },
  classic_art:     { label: "经典艺术", desc: "古典油画 · 布面纹理 · 大师光影" },
  digital_art:     { label: "数字艺术", desc: "概念艺术厚涂 · 戏剧性光影" },
  illustration:    { label: "插画动漫", desc: "日系唯美插画 · 温暖治愈" },
  style_3d:        { label: "3D 风格", desc: "高端 CG 渲染 · 皮克斯级质感" },
  chinese_style:   { label: "国风雅韵", desc: "水墨意境 · 工笔丹青 · 气韵生动" },
  vintage:         { label: "复古怀旧", desc: "胶片质感 · 旧时光 · 温暖褪色" },
  creative_effects:{ label: "创意特效", desc: "双重曝光 · 水彩晕染 · 艺术拼贴" },
  ui_design:       { label: "海报设计", desc: "极简版式 · 品牌级视觉 · 克制高级" },
};

export function TemplateGrid() {
  const { selectedTemplateId, setTemplate } = useCreationStore();
  const [templates, setTemplates] = useState<TemplatePreset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchTemplates()
      .then((data) => {
        if (!cancelled) setTemplates(data.templates ?? []);
      })
      .catch((e) => {
        if (!cancelled)
          setError(e instanceof Error ? e.message : "加载风格模板失败");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  /* 加载骨架 */
  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  /* 加载失败时显示静态占位卡片 */
  if (error || templates.length === 0) {
    const fallbackStyles = [
      { title: "摄影写实", desc: "电影级人像" },
      { title: "经典艺术", desc: "古典油画" },
      { title: "数字艺术", desc: "概念厚涂" },
    ];
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {fallbackStyles.map((s, i) => (
          <Card key={i} hover className="overflow-hidden cursor-pointer">
            <div
              className={`aspect-[3/4] bg-gradient-to-br ${PLACEHOLDER_GRADIENTS[i]} flex items-center justify-center`}
            >
              <span className="font-serif text-ink-500/60 text-lg">
                {s.title}
              </span>
            </div>
            <div className="p-3">
              <p className="text-sm font-medium text-ink-800">{s.title}</p>
              <p className="text-xs text-ink-400 mt-0.5">{s.desc}</p>
            </div>
          </Card>
        ))}
        {error && (
          <p className="col-span-full text-center text-xs text-ink-400">
            风格模板加载失败，以上为示例预览
          </p>
        )}
      </div>
    );
  }

  /* 正常风格列表 */
  const sorted = [...templates].sort((a, b) => {
    const order = Object.keys(STYLE_META);
    return order.indexOf(a.styleCategory) - order.indexOf(b.styleCategory);
  });

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {sorted.map((t) => {
        const selected = selectedTemplateId === t.id;
        const meta = STYLE_META[t.styleCategory];
        return (
          <Card
            key={t.id}
            hover
            className={`overflow-hidden cursor-pointer transition-all duration-200 ${
              selected ? "ring-2 ring-accent-deep ring-offset-2" : ""
            }`}
            onClick={() => setTemplate(t.id)}
          >
            {/* 预览图 / 风格色块 */}
            <div className="relative aspect-[3/4] bg-wash-200">
              {t.templateImageKey ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={`/${t.templateImageKey}`}
                  alt={t.title}
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              ) : (
                <div
                  className={`h-full w-full bg-gradient-to-br ${
                    PLACEHOLDER_GRADIENTS[
                      Object.keys(STYLE_META).indexOf(t.styleCategory) %
                        PLACEHOLDER_GRADIENTS.length
                    ]
                  } flex flex-col items-center justify-center gap-2`}
                >
                  <Sparkles className="h-6 w-6 text-ink-400/40" />
                  <span className="text-xs text-ink-400/50 font-mono tracking-wider">
                    {t.title}
                  </span>
                </div>
              )}

              {/* 选中标记 */}
              {selected && (
                <div className="absolute top-2 right-2 h-6 w-6 rounded-full bg-accent-deep flex items-center justify-center">
                  <Check className="h-3.5 w-3.5 text-white" strokeWidth={3} />
                </div>
              )}
            </div>

            {/* 模板信息 */}
            <div className="p-3 space-y-0.5">
              <p className="text-sm font-medium text-ink-800 leading-tight">
                {t.title}
              </p>
              <p className="text-[11px] text-ink-400 leading-tight">
                {meta?.desc ?? t.slug}
              </p>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
