import { QuotaBadge } from "@/components/quota/QuotaBadge";

export default function StudioLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      {/* 顶部导航栏 */}
      <header className="sticky top-0 z-40 h-14 flex items-center justify-between px-6 bg-wash-50/80 backdrop-blur border-b border-wash-200">
        <span className="font-serif text-lg text-ink-900 tracking-wide">
          毕业纪念
        </span>
        <QuotaBadge />
      </header>

      {/* 合规声明横幅 */}
      <div className="bg-ink-50 text-xs text-ink-400 text-center py-1.5 px-4 leading-relaxed">
        本工具仅用于个人毕业纪念的艺术创作，禁止将生成内容用于冒充、诈骗、商业代言等任何违规用途。
        禁止用户上传非本人照片，禁止将生成的图像用于商业用途，仅允许个人非商用分享。
      </div>

      {/* 主内容区 */}
      <main className="flex-1 mx-auto w-full max-w-4xl px-page py-section">
        {children}
      </main>

      {/* 底部 */}
      <footer className="py-6 text-center text-xs text-ink-300">
        仅供个人非商用分享
      </footer>
    </div>
  );
}
