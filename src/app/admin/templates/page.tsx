"use client";

import { useEffect, useState, useCallback } from "react";

/* ── 类型 ────────────────────────────────────────── */

type Template = {
  id: string;
  slug: string;
  title: string;
  prompt: string;
  templateImageKey: string | null;
  styleCategory: string;
  isActive: boolean;
  createdAt: string;
};

/* ── API 辅助 ────────────────────────────────────── */

async function fetchTemplates(): Promise<Template[]> {
  const res = await fetch("/api/admin/templates");
  if (!res.ok) throw new Error("获取失败");
  const json = await res.json();
  return json.templates;
}

/* ── 主组件 ───────────────────────────────────────── */

export default function AdminTemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [title, setTitle] = useState("");
  const [prompt, setPrompt] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [claimSecret, setClaimSecret] = useState("");

  /* ── 加载模板 ─────────────────────────────────── */

  const load = useCallback(async () => {
    try {
      const list = await fetchTemplates();
      setTemplates(list);
    } catch {
      /* 403 时说明不是 admin，会显示 claim 界面 */
    }
  }, []);

  useEffect(() => {
    load().catch(() => setIsAdmin(false));
  }, [load]);

  /* ── 校验管理员身份 ────────────────────────────── */

  useEffect(() => {
    fetch("/api/admin/templates")
      .then((r) => {
        if (r.status === 403) setIsAdmin(false);
        else if (r.ok) setIsAdmin(true);
      })
      .catch(() => setIsAdmin(false));
  }, []);

  /* ── 认领管理员 ────────────────────────────────── */

  const handleClaim = async () => {
    setError("");
    const res = await fetch("/api/admin/claim", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ secret: claimSecret }),
    });
    if (res.ok) {
      setIsAdmin(true);
      load();
    } else {
      const json = await res.json();
      setError(json.error || "密钥错误");
    }
  };

  /* ── 新建模板 ──────────────────────────────────── */

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!title.trim() || !prompt.trim()) {
      setError("标题和提示词不能为空");
      return;
    }

    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("title", title);
      fd.append("prompt", prompt);
      if (imageFile) fd.append("image", imageFile);

      const res = await fetch("/api/admin/templates", {
        method: "POST",
        body: fd,
      });

      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || "创建失败");
      }

      setSuccess("模板创建成功");
      setTitle("");
      setPrompt("");
      setImageFile(null);
      setImagePreview(null);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "创建失败");
    } finally {
      setLoading(false);
    }
  };

  /* ── 删除模板 ──────────────────────────────────── */

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`确定删除模板「${title}」？`)) return;
    try {
      const res = await fetch(`/api/admin/templates/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("删除失败");
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "删除失败");
    }
  };

  /* ── 图片预览 ──────────────────────────────────── */

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  /* ── 非管理员：认领界面 ──────────────────────────── */

  if (isAdmin === false) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950">
        <div className="w-full max-w-md p-8">
          <h1 className="text-2xl font-bold text-white mb-2">开发者入口</h1>
          <p className="text-zinc-400 text-sm mb-6">输入管理员密钥以解锁模板管理</p>
          <input
            type="password"
            value={claimSecret}
            onChange={(e) => setClaimSecret(e.target.value)}
            placeholder="管理员密钥"
            className="w-full px-4 py-3 rounded-lg bg-zinc-900 border border-zinc-700 text-white placeholder-zinc-500 mb-4 focus:outline-none focus:border-zinc-500"
          />
          {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
          <button
            onClick={handleClaim}
            className="w-full py-3 rounded-lg bg-white text-zinc-900 font-semibold hover:bg-zinc-200 transition"
          >
            验证身份
          </button>
        </div>
      </div>
    );
  }

  /* ── 加载中 ────────────────────────────────────── */

  if (isAdmin === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950">
        <p className="text-zinc-500">加载中...</p>
      </div>
    );
  }

  /* ── 管理员主界面 ────────────────────────────────── */

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className="max-w-5xl mx-auto px-6 py-12">
        <header className="mb-12">
          <h1 className="text-3xl font-bold">模板管理</h1>
          <p className="text-zinc-400 mt-1">管理你的毕业照风格模板</p>
        </header>

        {/* 新增模板表单 */}
        <section className="mb-16">
          <h2 className="text-xl font-semibold mb-6">新建模板</h2>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm text-zinc-400 mb-1">模板名称</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="如：夏日校园"
                className="w-full px-4 py-3 rounded-lg bg-zinc-900 border border-zinc-700 text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500"
              />
            </div>

            <div>
              <label className="block text-sm text-zinc-400 mb-1">提示词（不展示给用户）</label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="输入生成图片用的提示词..."
                rows={4}
                className="w-full px-4 py-3 rounded-lg bg-zinc-900 border border-zinc-700 text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500 resize-vertical"
              />
            </div>

            <div>
              <label className="block text-sm text-zinc-400 mb-1">模板参考图</label>
              <div className="flex items-start gap-4">
                <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-3 rounded-lg bg-zinc-900 border border-zinc-700 hover:border-zinc-500 transition">
                  <svg className="w-5 h-5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="text-sm text-zinc-300">选择图片</span>
                  <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                </label>
                {imagePreview && (
                  <div className="relative">
                    <img
                      src={imagePreview}
                      alt="预览"
                      className="h-24 w-24 object-cover rounded-lg border border-zinc-700"
                    />
                    <button
                      type="button"
                      onClick={() => { setImageFile(null); setImagePreview(null); }}
                      className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center"
                    >
                      ×
                    </button>
                  </div>
                )}
              </div>
            </div>

            {error && <p className="text-red-400 text-sm">{error}</p>}
            {success && <p className="text-emerald-400 text-sm">{success}</p>}

            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 rounded-lg bg-white text-zinc-900 font-semibold hover:bg-zinc-200 disabled:opacity-50 transition"
            >
              {loading ? "创建中..." : "创建模板"}
            </button>
          </form>
        </section>

        {/* 模板列表 */}
        <section>
          <h2 className="text-xl font-semibold mb-6">
            已创建的模板（{templates.length}）
          </h2>
          {templates.length === 0 ? (
            <p className="text-zinc-500">还没有模板，创建第一个吧</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {templates.map((t) => (
                <div key={t.id} className="group relative rounded-xl overflow-hidden bg-zinc-900 border border-zinc-800">
                  <div className="aspect-[3/4] bg-zinc-800">
                    {t.templateImageKey ? (
                      <img
                        src={`/${t.templateImageKey}`}
                        alt={t.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-zinc-600 text-sm">
                        无图片
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <p className="text-sm font-medium truncate">{t.title}</p>
                    <p className="text-xs text-zinc-500 mt-1 truncate">
                      {t.prompt?.slice(0, 40)}{t.prompt?.length > 40 ? "..." : ""}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDelete(t.id, t.title)}
                    className="absolute top-2 right-2 w-8 h-8 rounded-full bg-red-500/80 text-white text-sm opacity-0 group-hover:opacity-100 transition flex items-center justify-center hover:bg-red-600"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
