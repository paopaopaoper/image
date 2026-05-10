import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "crypto";

function getS3Client() {
  const endpoint = process.env.STORAGE_ENDPOINT;
  return new S3Client({
    region: process.env.STORAGE_REGION ?? "us-east-1",
    endpoint: endpoint || undefined,
    forcePathStyle: !!endpoint,
    credentials: {
      accessKeyId: process.env.STORAGE_ACCESS_KEY_ID ?? "",
      secretAccessKey: process.env.STORAGE_SECRET_ACCESS_KEY ?? "",
    },
  });
}

const BUCKET = process.env.STORAGE_BUCKET ?? "";
const MAX_SIZE = (Number(process.env.MAX_UPLOAD_MB) || 12) * 1024 * 1024;

const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
];

/** S3 是否已配置 */
function isStorageConfigured() {
  return !!(process.env.STORAGE_BUCKET && process.env.STORAGE_REGION);
}

/**
 * 创建上传预签名 URL
 * 未配置 S3 时返回本地上传端点
 */
export async function createUploadTarget(userId: string) {
  const key = `uploads/${userId}/${randomUUID()}.jpg`;

  if (!isStorageConfigured()) {
    return {
      uploadUrl: `/api/upload/local?key=${encodeURIComponent(key)}`,
      objectKey: key,
      expiresIn: 300,
    };
  }

  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    ContentType: "image/jpeg",
    ContentLength: MAX_SIZE,
  });

  const url = await getSignedUrl(getS3Client(), command, {
    expiresIn: 300,
  });

  return {
    uploadUrl: url,
    objectKey: key,
    expiresIn: 300,
  };
}

/**
 * 创建私有下载预签名 URL
 */
export async function createDownloadUrl(objectKey: string) {
  if (!isStorageConfigured()) {
    return `/${objectKey}`;
  }

  const command = new GetObjectCommand({
    Bucket: BUCKET,
    Key: objectKey,
  });

  const url = await getSignedUrl(getS3Client(), command, {
    expiresIn: 3600,
  });

  return url;
}

/**
 * 验证上传文件是否符合约束
 */
export function validateUploadMetadata(
  contentType: string | null,
  contentLength: number | null
) {
  if (!contentType || !ALLOWED_TYPES.includes(contentType)) {
    throw new Error(
      `不支持的文件类型: ${contentType}，仅允许 JPEG/PNG/WebP/HEIC`
    );
  }

  if (contentLength && contentLength > MAX_SIZE) {
    throw new Error(`文件大小超过限制 ${process.env.MAX_UPLOAD_MB || 12}MB`);
  }
}

export { ALLOWED_TYPES, MAX_SIZE };
