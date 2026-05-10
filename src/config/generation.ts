export const generationConfig = {
  freeDailyGenerations: Number(process.env.FREE_DAILY_GENERATIONS ?? 3),
  imageModel: process.env.ARK_IMAGE_MODEL ?? "doubao-seedream-5-0-260128",
  imageSize: process.env.ARK_IMAGE_SIZE ?? "2K"
} as const;

