import OpenAI from "openai";
import type { GenerateImageInput, GenerateImageOutput } from "@/types/generation";
import { buildGenerationPrompt } from "@/server/services/prompt-builder";
import { db } from "@/lib/db/client";

/* ── 图片文件转 Base64 ────────────────────────── */

async function resolveImage(objectKey: string): Promise<string> {
  try {
    const fs = await import("fs/promises");
    const path = await import("path");
    const filePath = path.join(process.cwd(), "public", objectKey);
    const buffer = await fs.readFile(filePath);
    const base64 = buffer.toString("base64");
    const ext = objectKey.split(".").pop()?.toLowerCase() ?? "jpeg";
    const mimeType = ext === "png" ? "image/png" : "image/jpeg";
    return `data:${mimeType};base64,${base64}`;
  } catch {
    console.warn(`[生成] 图片读取失败: ${objectKey}，跳过`);
    return "";
  }
}

/* ── 主生成函数 ──────────────────────────────── */

export async function generateGraduationArtwork(
  input: GenerateImageInput
): Promise<GenerateImageOutput> {
  /* 查询模板（含提示词和模板参考图） */
  const template = await db.templatePreset.findUnique({
    where: { id: input.templateId },
  });

  if (!template) {
    throw new Error("模板不存在");
  }

  if (!template.prompt) {
    throw new Error("模板提示词为空，请先在管理后台设置提示词");
  }

  /* 拼装 prompt */
  const { prompt } = buildGenerationPrompt({
    templatePrompt: template.prompt,
    customPrompt: input.customPrompt,
    schoolContext: input.schoolPromptContext,
  });

  /* 参考图：只传用户肖像照，不传模版参考图
     即梦的「角色参考」和「风格参考」走的是不同内部 API 通道，
     ARK API 的 image 参数是扁平数组，无法区分两种用途，
     同时传两张图会让模型混淆哪张是人物主体哪张是风格来源 */
  const imageList: string[] = [];

  const mainPortraitKey = input.portraitObjectKeys?.[0];
  if (mainPortraitKey) {
    const base64 = await resolveImage(mainPortraitKey);
    if (base64) {
      imageList.push(base64);
      console.log(`[生成] 用户照片已加载: ${mainPortraitKey}`);
    }
  }

  /* 模型提供商路由（目前只用 Seedream） */
  const provider = process.env.IMAGE_MODEL_PROVIDER ?? "seedream";

  if (provider === "gpt-image2") {
    return generateWithGptImage2(prompt, input.jobId);
  }

  return generateWithSeedream(prompt, input.jobId, imageList);
}

/* ── Seedream 路径 ────────────────────────────── */

async function generateWithSeedream(
  prompt: string,
  jobId: string,
  imageList: string[]
): Promise<GenerateImageOutput> {
  const model = process.env.ARK_IMAGE_MODEL ?? "doubao-seedream-5-0-260128";
  const size = process.env.ARK_IMAGE_SIZE ?? "2K";
  const apiKey = process.env.ARK_API_KEY;
  const baseURL = process.env.ARK_BASE_URL;

  if (!apiKey || !baseURL) {
    throw new Error("ARK_API_KEY 或 ARK_BASE_URL 未配置");
  }

  const body: Record<string, any> = {
    model,
    prompt,
    n: 1,
    size,
    response_format: "url",
    watermark: false,
    output_format: "png",
  };

  if (imageList.length > 0) {
    body.image = imageList;
    console.log(`[生成] Seedream 图生图模式, 参考图数=${imageList.length}, model=${model}, size=${size}`);
    console.log(`[调试] image[0] 前100字符: ${imageList[0]?.slice(0, 100)}`);
    if (imageList[1]) {
      console.log(`[调试] image[1] 前100字符: ${imageList[1]?.slice(0, 100)}`);
    }
  } else {
    console.log(`[生成] Seedream 文生图模式（无参考图）, model=${model}, size=${size}`);
  }

  /* 原生 fetch，避免 OpenAI SDK 丢弃 image 参数 */
  const url = `${baseURL.replace(/\/+$/, "")}/images/generations`;
  console.log(`[调试] 请求 URL: ${url}`);
  console.log(`[调试] 请求 body 字段: ${Object.keys(body).join(", ")}`);

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  const text = await response.text();
  console.log(`[调试] 响应状态: ${response.status}`);
  console.log(`[调试] 响应前200字符: ${text.slice(0, 200)}`);

  if (!response.ok) {
    throw new Error(`Seedream API 错误 (${response.status}): ${text.slice(0, 500)}`);
  }

  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(`Seedream 响应解析失败: ${text.slice(0, 200)}`);
  }

  return downloadAndSave(data, jobId);
}

/* ── GPT Image 2 路径 (Aihubmix 中转) ──────────── */

async function generateWithGptImage2(
  prompt: string,
  jobId: string
): Promise<GenerateImageOutput> {
  const model = process.env.GPT_IMAGE_MODEL ?? "gpt-image-2";
  const size = process.env.ARK_IMAGE_SIZE ?? "2K";

  console.log(`[生成] GPT Image 2 文生图模式, model=${model}, size=${size}`);

  const client = new OpenAI({
    apiKey: process.env.AIHUBMIX_API_KEY,
    baseURL: process.env.AIHUBMIX_BASE_URL ?? "https://aihubmix.com/v1",
    timeout: 90_000,
    maxRetries: 1,
  });

  const response = await (client as any).images.generate({
    model,
    prompt,
    n: 1,
    size,
    response_format: "url",
  });

  return downloadAndSave(response, jobId);
}

/* ── 下载并保存到本地 ──────────────────────────── */

async function downloadAndSave(
  response: any,
  jobId: string
): Promise<GenerateImageOutput> {
  console.log(`[生成] 响应成功, data count=${response.data?.length}`);

  const imageUrl = response.data?.[0]?.url;
  if (!imageUrl) {
    throw new Error("API 未返回图片 URL");
  }

  const imageResp = await fetch(imageUrl);
  if (!imageResp.ok) {
    throw new Error(`下载生成图片失败 HTTP ${imageResp.status}`);
  }
  const buffer = Buffer.from(await imageResp.arrayBuffer());
  console.log(`[生成] jobId=${jobId} 图片生成成功，大小=${buffer.length} bytes`);

  const fs = await import("fs/promises");
  const path = await import("path");
  const outputDir = path.join(process.cwd(), "public", "generated");
  await fs.mkdir(outputDir, { recursive: true });
  const filename = `${jobId}.png`;
  await fs.writeFile(path.join(outputDir, filename), buffer);
  console.log(`[生成] 图片已保存到 public/generated/${filename}`);

  return { outputObjectKey: `generated/${filename}` };
}
