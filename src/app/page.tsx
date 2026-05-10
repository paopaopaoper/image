import Link from "next/link";
import { ArrowRight, ShieldCheck } from "lucide-react";

const PREVIEW_CARDS = [
  {
    title: "摄影写实",
    desc: "电影级人像 · 真实质感与叙事光影",
    gradient: "from-rose-100 to-amber-100",
    icon: "📷",
    iconAlt: "相机",
  },
  {
    title: "经典艺术",
    desc: "古典油画风格 · 布面纹理与大师光影",
    gradient: "from-violet-100 to-indigo-100",
    icon: "🎨",
    iconAlt: "调色板",
  },
  {
    title: "国风雅韵",
    desc: "水墨意境 · 气韵生动的东方美学",
    gradient: "from-amber-100 to-stone-100",
    icon: "🖌️",
    iconAlt: "毛笔",
  },
  {
    title: "海报设计",
    desc: "极简版式 · 品牌级视觉叙事",
    gradient: "from-cyan-100 to-blue-100",
    icon: "✒️",
    iconAlt: "钢笔",
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* ── Hero 区域 ── */}
      <section className="flex-1 flex flex-col items-center justify-center px-6 py-16 md:py-24 text-center">
        {/* 顶部标签 */}
        <div className="inline-flex items-center gap-1.5 rounded-full border border-wash-300 bg-white/60 px-4 py-1.5 text-xs text-ink-500 mb-8">
          <span className="h-1.5 w-1.5 rounded-full bg-accent-muted" />
          AI 驱动 · 艺术创作
        </div>

        {/* 主标题 */}
        <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl text-ink-900 tracking-wide leading-tight mb-4">
          毕业纪念
        </h1>

        {/* 副标题 */}
        <p className="text-base md:text-lg text-ink-500 max-w-md leading-relaxed mb-10">
          用 AI 创作你的专属毕业照，<br />
          让青春留下一份独特的艺术记忆
        </p>

        {/* CTA 按钮 */}
        <Link
          href="/create"
          className="inline-flex items-center gap-2 h-12 px-8 rounded-gentle
                     bg-ink-900 text-wash-50 font-medium text-sm
                     hover:bg-ink-800 active:scale-[0.98]
                     transition-all duration-200 shadow-float"
        >
          开始创作
          <ArrowRight className="h-4 w-4" />
        </Link>

        {/* ── 模板预览卡片 ── */}
        <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-3xl">
          {PREVIEW_CARDS.map((card) => (
            <div
              key={card.title}
              className="group relative overflow-hidden rounded-gentle border border-wash-200
                         bg-white shadow-poster hover:shadow-float transition-all duration-300"
            >
              {/* 渐变背景 */}
              <div
                className={`aspect-[3/4] bg-gradient-to-br ${card.gradient} flex items-center justify-center`}
              >
                <span className="text-4xl select-none" role="img" aria-label={card.iconAlt}>
                  {card.icon}
                </span>
              </div>

              {/* 底部标题栏 */}
              <div className="p-3 text-left">
                <p className="text-sm font-medium text-ink-800">{card.title}</p>
                <p className="text-xs text-ink-400 mt-0.5">{card.desc}</p>
              </div>

              {/* 悬浮效果线 */}
              <div className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-transparent via-accent-muted to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          ))}
        </div>
      </section>

      {/* ── 合规声明 ── */}
      <footer className="py-8 px-6 space-y-4">
        {/* 安全声明 */}
        <div className="flex items-center justify-center gap-2 text-xs text-ink-400">
          <ShieldCheck className="h-3.5 w-3.5" />
          <span>你的照片仅用于本次生成，完成后自动删除</span>
        </div>

        {/* 合规横幅 */}
        <div className="compliance-banner rounded-gentle max-w-2xl mx-auto">
          本工具仅用于个人毕业纪念的艺术创作。禁止将生成内容用于冒充、诈骗、商业代言等任何违规用途。
          用户须上传本人照片，生成结果仅供个人非商业分享。
        </div>

        {/* 版权 */}
        <p className="text-center text-xs text-ink-300">
          &copy; {new Date().getFullYear()} 毕业纪念 · 仅供个人非商用分享
        </p>
      </footer>
    </div>
  );
}
