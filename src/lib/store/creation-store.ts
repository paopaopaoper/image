/**
 * 创作流程状态管理 (Zustand)
 * 管理从上传肖像到生成结果的全流程状态
 */
import { create } from "zustand";

type CreationState = {
  // ── 肖像上传 ──
  portraitObjectKeys: string[];
  portraitPreviewUrls: string[];
  addPortrait: (key: string, previewUrl: string) => void;
  removePortrait: (index: number) => void;
  clearPortraits: () => void;

  // ── 模板选择 ──
  selectedTemplateId: string | null;
  setTemplate: (id: string) => void;

  // ── 学校搜索 / 选择 ──
  schoolSearchQuery: string;
  setSchoolSearch: (q: string) => void;
  selectedSchoolId: string | null;
  selectedSchoolName: string | null;
  setSchool: (id: string, name: string) => void;

  // ── 自定义创意提示词（新增） ──
  customPrompt: string;
  setCustomPrompt: (prompt: string) => void;

  // ── 生成状态 ──
  isGenerating: boolean;
  setIsGenerating: (v: boolean) => void;
  jobId: string | null;
  setJobId: (id: string) => void;

  // ── 是否可提交生成 ──
  canSubmit: () => boolean;

  // ── 重置全流程 ──
  reset: () => void;
};

const initialState = {
  portraitObjectKeys: [] as string[],
  portraitPreviewUrls: [] as string[],
  selectedTemplateId: null,
  schoolSearchQuery: "",
  selectedSchoolId: null,
  selectedSchoolName: null,
  customPrompt: "",
  isGenerating: false,
  jobId: null,
};

export const useCreationStore = create<CreationState>((set, get) => ({
  ...initialState,

  addPortrait: (key, previewUrl) =>
    set((s) => ({
      portraitObjectKeys: [...s.portraitObjectKeys, key],
      portraitPreviewUrls: [...s.portraitPreviewUrls, previewUrl],
    })),

  removePortrait: (index) =>
    set((s) => ({
      portraitObjectKeys: s.portraitObjectKeys.filter((_, i) => i !== index),
      portraitPreviewUrls: s.portraitPreviewUrls.filter((_, i) => i !== index),
    })),

  clearPortraits: () => set({ portraitObjectKeys: [], portraitPreviewUrls: [] }),

  setTemplate: (id) => set({ selectedTemplateId: id }),

  setSchoolSearch: (q) => set({ schoolSearchQuery: q }),

  setSchool: (id, name) =>
    set({ selectedSchoolId: id, selectedSchoolName: name, schoolSearchQuery: name }),

  setCustomPrompt: (prompt) => set({ customPrompt: prompt }),

  setIsGenerating: (v) => set({ isGenerating: v }),

  setJobId: (id) => set({ jobId: id }),

  canSubmit: () => {
    const s = get();
    return !!(s.portraitObjectKeys.length > 0 && s.selectedTemplateId);
  },

  reset: () => set(initialState),
}));
