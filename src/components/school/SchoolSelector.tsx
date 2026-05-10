"use client";

/**
 * 学校搜索选择器
 * 输入关键词 → 调 /api/schools?q=xxx → 下拉选择
 */
import { useState, useEffect, useRef, useCallback } from "react";
import { Search, MapPin, X } from "lucide-react";
import { searchSchools } from "@/lib/api/client";
import { useCreationStore } from "@/lib/store/creation-store";
import type { SchoolAsset } from "@/types/school";

export function SchoolSelector() {
  const {
    schoolSearchQuery,
    selectedSchoolId,
    selectedSchoolName,
    setSchoolSearch,
    setSchool,
  } = useCreationStore();

  const [results, setResults] = useState<SchoolAsset[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  /* 搜索防抖 */
  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await searchSchools(q.trim());
      setResults(data.schools ?? []);
      setIsOpen(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "搜索失败");
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  /* 输入变化 — 300ms 防抖 */
  const onInputChange = (value: string) => {
    setSchoolSearch(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(value), 300);
  };

  /* 点击外部关闭 */
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  /* 已选择学校 */
  if (selectedSchoolId) {
    return (
      <div className="flex items-center gap-3 p-3 rounded-gentle border border-wash-200 bg-white">
        <MapPin className="h-4 w-4 text-accent-deep shrink-0" />
        <span className="text-sm text-ink-800 flex-1">
          {selectedSchoolName}
        </span>
        <button
          onClick={() => setSchool("", "")}
          className="p-0.5 rounded-soft text-ink-400 hover:text-ink-600 hover:bg-wash-100 transition-colors"
          aria-label="清除选择"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative">
      {/* 搜索框 */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-400" />
        <input
          type="text"
          value={schoolSearchQuery}
          onChange={(e) => onInputChange(e.target.value)}
          onFocus={() => {
            if (results.length > 0) setIsOpen(true);
          }}
          placeholder="输入学校名称搜索..."
          className="w-full h-10 pl-9 pr-3 rounded-gentle border border-wash-300
                     bg-white text-sm text-ink-800 placeholder:text-ink-400
                     focus:outline-none focus:ring-2 focus:ring-accent-muted/50 focus:border-accent-muted
                     transition-all"
        />
        {loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-wash-300 border-t-accent-deep" />
          </div>
        )}
      </div>

      {/* 下拉结果 */}
      {isOpen && results.length > 0 && (
        <div className="absolute z-20 mt-1 w-full rounded-gentle border border-wash-200 bg-white shadow-float max-h-60 overflow-y-auto">
          {results.map((s) => (
            <button
              key={s.id}
              onClick={() => {
                setSchool(s.id, s.displayName);
                setIsOpen(false);
                setResults([]);
              }}
              className="w-full text-left px-4 py-2.5 text-sm text-ink-700
                         hover:bg-wash-100 transition-colors flex items-center gap-2"
            >
              <MapPin className="h-3.5 w-3.5 text-ink-400 shrink-0" />
              {s.displayName}
            </button>
          ))}
        </div>
      )}

      {/* 无结果 */}
      {isOpen && !loading && results.length === 0 && schoolSearchQuery.trim() && (
        <div className="absolute z-20 mt-1 w-full rounded-gentle border border-wash-200 bg-white shadow-float">
          <p className="px-4 py-3 text-sm text-ink-400 text-center">
            未找到匹配的学校
          </p>
        </div>
      )}

      {/* 搜索错误 */}
      {error && (
        <p className="mt-2 text-xs text-ink-400">
          搜索暂时不可用，你可以稍后填写
        </p>
      )}
    </div>
  );
}
