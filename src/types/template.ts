export type StyleCategory =
  | "photographic"
  | "classic_art"
  | "digital_art"
  | "illustration"
  | "style_3d"
  | "chinese_style"
  | "vintage"
  | "creative_effects"
  | "ui_design";

export type TemplatePreset = {
  id: string;
  slug: string;
  title: string;
  styleCategory: StyleCategory;
  /** 模板参考图（用户上传） */
  templateImageKey?: string | null;
};
