import { sanitizeSchoolInput } from "@/lib/safety/moderation";

const NEGATIVE_PROMPT = [
  "portrait face directly visible, full face, frontal face, 正脸直出",
  "photo-bashing, stock photo mashup, 素材拼接",
  "collage, cut-and-paste, scrapbook, 生硬拼贴",
  "3D render, CGI, unreal engine, 三维渲染",
  "cheap fantasy, glowing magic, sparkles, lens flare, 廉价奇幻特效",
  "cluttered, busy background, chaotic composition, 杂乱构图",
  "template, stock background, watermark, 模板化背景",
  "distorted face, extra limbs, bad anatomy, 人体结构异常",
  "ugly, tiling, poorly drawn hands, fused fingers, 畸形",
  "low contrast, flat lighting, overexposed, 过曝欠曝",
  "neon colors, oversaturated, vibrant, 高饱和荧光色",
  "过度磨皮, 网红感, 影楼风, cheap studio photography",
].join(", ");

type PromptParams = {
  /** 模板自带的提示词 */
  templatePrompt: string;
  /** 用户自定义提示词（如有则覆盖模板提示词） */
  customPrompt?: string;
  /** 学校上下文 */
  schoolContext?: string;
};

export function buildGenerationPrompt(params: PromptParams): {
  prompt: string;
  negativePrompt: string;
} {
  /* 用户自定义提示词优先，否则用模板提示词 */
  let fullPrompt = params.customPrompt?.trim() || params.templatePrompt;

  /* Layer: 学校上下文（仅当用户没自定义提示词时附加） */
  if (!params.customPrompt && params.schoolContext) {
    const safe = sanitizeSchoolInput(params.schoolContext);
    if (safe) {
      fullPrompt += `\n\n创作时参考以下校园特征作为背景语境：${safe}`;
    }
  }

  return { prompt: fullPrompt, negativePrompt: NEGATIVE_PROMPT };
}
