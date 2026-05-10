// Ark Seedream API 测试脚本
// 运行: npx tsx scripts/test-ark-api.ts
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: "ark-5a21d477-7472-4019-842c-2b355d7e59f7-f744b",
  baseURL: "https://ark.cn-beijing.volces.com/api/v3",
  timeout: 120_000,
  maxRetries: 1,
});

async function main() {
  console.log("=== ARK Seedream API 连通性测试 ===\n");

  try {
    console.log("正在调用 images.generate...");
    const response = await (client as any).images.generate({
      model: "doubao-seedream-5-0-260128",
      prompt: "一只可爱的卡通猫，水彩风格，简洁温馨",
      n: 1,
      size: "2K",
      response_format: "url",
      watermark: false,
      output_format: "png",
    });

    console.log("✅ API 调用成功!");
    console.log(`   model: ${response.model}`);
    console.log(`   created: ${response.created}`);
    console.log(`   data count: ${response.data.length}`);
    console.log(`   image URL: ${response.data[0]?.url}`);
    if (response.data[0]?.size) {
      console.log(`   image size: ${response.data[0].size}`);
    }
    if (response.usage) {
      console.log(`   usage:`, JSON.stringify(response.usage));
    }

    // 下载测试
    const url = response.data[0]?.url;
    if (url) {
      console.log("\n正在下载图片验证...");
      const imgResp = await fetch(url);
      if (imgResp.ok) {
        const buf = await imgResp.arrayBuffer();
        console.log(`✅ 图片下载成功，${buf.byteLength} bytes`);
      } else {
        console.log(`❌ 图片下载失败 HTTP ${imgResp.status}`);
      }
    }
  } catch (error: any) {
    console.error("❌ API 调用失败:");
    console.error(`   message: ${error.message}`);
    if (error.status) console.error(`   status: ${error.status}`);
    if (error.response?.data) console.error(`   body:`, error.response.data);
    if (error.code) console.error(`   code: ${error.code}`);
    if (error.type) console.error(`   type: ${error.type}`);
  }
}

main();
