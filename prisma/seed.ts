import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
  console.log("写入种子数据...");

  /* ── 风格模板（9 种风格类别） ────────────────── */

  const templates = [
    { slug: "photographic", title: "摄影写实", prompt: "请根据参考图中的人物，生成一张微电影感的毕业主题摄影照片。保持人物自然真实的面部特征和肤色，营造温暖的毕业氛围。", styleCategory: "photographic" as const },
    { slug: "classic-art", title: "经典艺术", prompt: "请根据参考图中的人物，生成一张经典油画风格的毕业主题艺术照。融合古典气质与现代毕业元素。", styleCategory: "classic_art" as const },
    { slug: "digital-art", title: "数字艺术", prompt: "请根据参考图中的人物，生成一张数字艺术风格的毕业主题海报。现代感强，色彩丰富，有概念艺术气质。", styleCategory: "digital_art" as const },
    { slug: "illustration", title: "插画动漫", prompt: "请根据参考图中的人物，生成一张日系唯美插画风格的毕业主题作品。画面温暖治愈，色彩清新明亮。", styleCategory: "illustration" as const },
    { slug: "style-3d", title: "3D 风格", prompt: "请根据参考图中的人物，生成一张3D CG风格的毕业主题作品。人物写实，有次表面散射效果，光影自然。", styleCategory: "style_3d" as const },
    { slug: "chinese-style", title: "国风雅韵", prompt: "请根据参考图中的人物，生成一张中国传统水墨风格与现代写实人物融合的毕业主题作品。意境空灵，色调高雅。", styleCategory: "chinese_style" as const },
    { slug: "vintage", title: "复古怀旧", prompt: "请根据参考图中的人物，生成一张复古胶片风格的毕业主题照片。怀旧暖色调，仿佛老照片质感。", styleCategory: "vintage" as const },
    { slug: "creative-effects", title: "创意特效", prompt: "请根据参考图中的人物，生成一张创意艺术风格的毕业主题作品。融合绘画、水彩等艺术效果，人物保持可辨识的真实感。", styleCategory: "creative_effects" as const },
    { slug: "ui-design", title: "海报设计", prompt: "请根据参考图中的人物，生成一张现代电影海报级的毕业主题设计作品。排版克制，色调高级，设计感强。", styleCategory: "ui_design" as const },
  ];

  for (const t of templates) {
    await db.templatePreset.upsert({
      where: { slug: t.slug },
      update: t,
      create: t,
    });
  }
  console.log(`  ✓ ${templates.length} 个风格模板已写入`);

  /* ── 示例学校 ──────────────────────────────────── */

  const school = await db.school.upsert({
    where: { id: "seed-demo-school" },
    update: { name: "清北大学", aliases: ["清北", "Qingbei"] },
    create: { id: "seed-demo-school", name: "清北大学", aliases: ["清北", "Qingbei"] },
  });

  await db.schoolAsset.deleteMany({ where: { schoolId: school.id } });

  const assets = [
    { displayName: "清北大学校名石", type: "name_stone" as const },
    { displayName: "清北大学图书馆", type: "teaching_building" as const },
    { displayName: "清北大学校徽", type: "badge" as const },
    { displayName: "清北大学银杏大道", type: "campus_scene" as const },
    { displayName: "清北大学正门", type: "landmark" as const },
  ];

  await db.schoolAsset.createMany({
    data: assets.map((a) => ({ ...a, schoolId: school.id })),
  });
  console.log(`  ✓ 清北大学 ${assets.length} 个学校资产已写入`);

  console.log("种子数据写入完成");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
