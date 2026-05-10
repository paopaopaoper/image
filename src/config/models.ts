/**
 * 模型配置中心 — 集中管理所有图像生成模型的提供商和参数
 */

export type ImageModelProvider = "seedream" | "gpt-image2";

export const MODEL_CONFIG = {
  seedream: {
    apiKey: process.env.ARK_API_KEY!,
    baseURL: process.env.ARK_BASE_URL!,
    model: process.env.ARK_IMAGE_MODEL ?? "doubao-seedream-5-0-260128",
    size: process.env.ARK_IMAGE_SIZE ?? "2K",
    label: "豆包 Seedream 5.0 Lite",
    supportsReferenceImage: true,
  },
  "gpt-image2": {
    apiKey: process.env.AIHUBMIX_API_KEY!,
    baseURL: process.env.AIHUBMIX_BASE_URL ?? "https://aihubmix.com/v1",
    model: process.env.GPT_IMAGE_MODEL ?? "gpt-image-2",
    size: "1024x1024",
    label: "GPT Image 2",
    supportsReferenceImage: false,
  },
} as const;

/** 获取当前激活的模型配置 */
export function getActiveModelConfig() {
  const provider = (process.env.IMAGE_MODEL_PROVIDER ?? "seedream") as ImageModelProvider;
  return { provider, config: MODEL_CONFIG[provider] };
}
