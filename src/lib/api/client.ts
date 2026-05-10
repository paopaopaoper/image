/**
 * API 客户端 — 封装所有后端 API 调用
 * 每次调用都附带 try/catch，前端可独立于后端运行和预览
 */

// ── 基础请求 ──
async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error ?? `请求失败 (${res.status})`);
  }

  return data as T;
}

// ── 类型 ──
import type { TemplatePreset } from "@/types/template";
import type { SchoolAsset } from "@/types/school";

export type CreateJobParams = {
  portraitObjectKeys: string[];
  templateId: string;
  schoolId?: string;
  customSchoolElements?: string;
  /** 新增：用户自定义创意描述，将影响 AI 生图 prompt */
  customPrompt?: string;
};

export type JobResult = {
  id: string;
  status: string;
  templateTitle: string;
  outputObjectKey: string | null;
  errorReason: string | null;
  createdAt: string;
  updatedAt: string;
};

export type PresignResult = {
  uploadUrl: string;
  objectKey: string;
  expiresIn: number;
};

// ── 认证 ──
export async function sendOtp(phone: string) {
  return request<{ success: boolean; devCode?: string }>("/api/auth/sms/send", {
    method: "POST",
    body: JSON.stringify({ phone }),
  });
}

export async function verifyOtp(phone: string, code: string) {
  return request<{ message?: string }>("/api/auth/sms/verify", {
    method: "POST",
    body: JSON.stringify({ phone, code }),
  });
}

// ── 资源 ──
export async function fetchTemplates() {
  return request<{ templates: TemplatePreset[] }>("/api/templates");
}

export async function searchSchools(q: string) {
  return request<{ schools: SchoolAsset[] }>(
    `/api/schools?q=${encodeURIComponent(q)}`
  );
}

export async function getPresignUrl(_filename: string, _contentType: string) {
  return request<PresignResult>("/api/upload/presign", {
    method: "POST",
  });
}

// ── 生成任务 ──
export async function createJob(params: CreateJobParams) {
  return request<{ jobId: string; status: string }>("/api/generation/jobs", {
    method: "POST",
    body: JSON.stringify(params),
  });
}

export async function getJob(jobId: string) {
  return request<JobResult>(`/api/generation/jobs/${jobId}`);
}

/** 上传文件到预签名 URL */
export async function uploadToPresignedUrl(
  uploadUrl: string,
  file: File,
  onProgress?: (pct: number) => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", uploadUrl);

    // 监听上传进度
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
      } else {
        reject(new Error(`上传失败 (${xhr.status})`));
      }
    };

    xhr.onerror = () => reject(new Error("网络错误，上传失败"));
    xhr.ontimeout = () => reject(new Error("上传超时"));

    xhr.send(file);
  });
}
