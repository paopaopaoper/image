export type GenerationStatus =
  | "queued"
  | "processing"
  | "succeeded"
  | "failed"
  | "canceled";

export type CreateGenerationJobInput = {
  userId: string;
  portraitObjectKeys: string[];
  templateId: string;
  schoolId?: string;
  customSchoolElements?: string;
  customPrompt?: string;
};

export type GenerateImageInput = {
  jobId: string;
  portraitObjectKeys: string[];
  templateId: string;
  schoolPromptContext: string;
  customPrompt?: string;
};

export type GenerateImageOutput = {
  outputObjectKey: string;
};

/* 数据库轮询：cron 每次取出处理的一批 job */
export type GenerationJobRecord = {
  id: string;
  userId: string;
  templatePresetId: string;
  status: GenerationStatus;
  portraitObjectKeys: string;
  schoolId: string | null;
  customSchoolContext: string | null;
  outputObjectKey: string | null;
  errorReason: string | null;
  retryCount: number;
  maxRetries: number;
  createdAt: Date;
  updatedAt: Date;
};
