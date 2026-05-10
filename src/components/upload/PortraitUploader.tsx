"use client";

/**
 * 肖像上传组件（多图版）
 * 支持拖拽/点击上传，最多 5 张，调用预签名 URL 后直传 OSS/S3
 */
import { useState, useRef, useCallback } from "react";
import { Upload, ImageUp, X, AlertCircle, Plus } from "lucide-react";
import { getPresignUrl, uploadToPresignedUrl } from "@/lib/api/client";
import { useCreationStore } from "@/lib/store/creation-store";
import { Card } from "@/components/ui/Card";

const MAX_IMAGES = 5;
const MAX_SIZE_MB = 12;
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export function PortraitUploader() {
  const { portraitObjectKeys, portraitPreviewUrls, addPortrait, removePortrait } =
    useCreationStore();
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const count = portraitObjectKeys.length;
  const canAdd = count < MAX_IMAGES && !uploading;

  const validateFile = (file: File): string | null => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      return "仅支持 JPG / PNG / WebP 格式";
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      return `文件大小不能超过 ${MAX_SIZE_MB}MB`;
    }
    return null;
  };

  const handleFile = useCallback(
    async (file: File) => {
      if (portraitObjectKeys.length >= MAX_IMAGES) return;
      setError(null);

      const err = validateFile(file);
      if (err) {
        setError(err);
        return;
      }

      setUploading(true);
      setUploadProgress(0);

      try {
        // 1) 获取预签名 URL
        const { uploadUrl, objectKey } = await getPresignUrl(file.name, file.type);

        // 2) 直接上传到 OSS/S3
        await uploadToPresignedUrl(uploadUrl, file, (pct) =>
          setUploadProgress(pct)
        );

        // 3) 生成本地预览
        const previewUrl = URL.createObjectURL(file);
        addPortrait(objectKey, previewUrl);

        setUploadProgress(100);
      } catch (e) {
        const msg =
          e instanceof Error ? e.message : "上传失败，请稍后重试";
        setError(msg);
      } finally {
        setUploading(false);
      }
    },
    [addPortrait, portraitObjectKeys.length]
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    // 重置 input，允许重复选择同一文件
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleRemove = (index: number) => {
    const url = portraitPreviewUrls[index];
    if (url) URL.revokeObjectURL(url);
    removePortrait(index);
  };

  return (
    <div className="space-y-4">
      {/* ── 已上传肖像网格 ── */}
      {count > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
          {portraitPreviewUrls.map((url, i) => (
            <Card key={`${portraitObjectKeys[i]}-${i}`} className="overflow-hidden p-0">
              <div className="relative aspect-[3/4] bg-ink-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={url}
                  alt={`肖像照 ${i + 1}`}
                  className="h-full w-full object-cover"
                />
                <button
                  onClick={() => handleRemove(i)}
                  className="absolute top-1 right-1 p-1 rounded-full bg-ink-900/60 text-white hover:bg-ink-900/80 transition-colors"
                  aria-label={`移除照片 ${i + 1}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            </Card>
          ))}

          {/* 添加卡片（内嵌在网格末尾） */}
          {canAdd && (
            <div
              onClick={() => inputRef.current?.click()}
              className="cursor-pointer rounded-gentle border-2 border-dashed border-wash-300
                         hover:border-ink-300 hover:bg-wash-100
                         flex flex-col items-center justify-center gap-1 aspect-[3/4]
                         transition-all duration-200"
            >
              <Plus className="h-6 w-6 text-ink-400" />
              <span className="text-xs text-ink-400">添加</span>
            </div>
          )}
        </div>
      )}

      {/* ── 空状态上传区域 ── */}
      {count === 0 && (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
          className={`
            relative cursor-pointer rounded-gentle border-2 border-dashed
            flex flex-col items-center justify-center gap-3
            aspect-[3/4] max-w-xs mx-auto
            transition-all duration-200
            ${
              dragOver
                ? "border-accent-deep bg-accent-muted/10"
                : "border-wash-300 hover:border-ink-300 hover:bg-wash-100"
            }
            ${uploading ? "pointer-events-none opacity-60" : ""}
          `}
        >
          {uploading ? (
            /* 上传中 */
            <div className="text-center px-4">
              <ImageUp className="h-8 w-8 mx-auto mb-3 text-accent-deep animate-pulse" />
              <p className="text-sm text-ink-500 mb-2">正在上传...</p>
              <div className="w-full h-1.5 rounded-full bg-wash-200 overflow-hidden">
                <div
                  className="h-full rounded-full bg-accent-deep transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <p className="text-xs text-ink-400 mt-1">{uploadProgress}%</p>
            </div>
          ) : (
            /* 空状态 */
            <div className="text-center px-6">
              <Upload className="h-8 w-8 mx-auto mb-3 text-ink-400" />
              <p className="text-sm text-ink-600 mb-1">
                点击或拖拽上传肖像照
              </p>
              <p className="text-xs text-ink-400">
                支持 JPG / PNG / WebP，最大 {MAX_SIZE_MB}MB，最多 {MAX_IMAGES} 张
              </p>
            </div>
          )}
        </div>
      )}

      {/* ── 已有图片时再上传的进度条 ── */}
      {count > 0 && uploading && (
        <div className="flex items-center gap-3 p-3 rounded-gentle bg-wash-100">
          <ImageUp className="h-5 w-5 text-accent-deep animate-pulse shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm text-ink-500 mb-1">正在上传...</p>
            <div className="h-1.5 rounded-full bg-wash-200 overflow-hidden">
              <div
                className="h-full rounded-full bg-accent-deep transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
          <span className="text-xs text-ink-400 shrink-0">{uploadProgress}%</span>
        </div>
      )}

      {/* 隐藏的文件输入 */}
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_TYPES.join(",")}
        onChange={onFileChange}
        className="hidden"
      />

      {/* 计数提示 */}
      <p className="text-xs text-ink-400 text-center">
        已上传 {count}/{MAX_IMAGES} 张，多角度照片可提升生成效果
      </p>

      {/* 错误提示 */}
      {error && (
        <div className="flex items-start gap-2 text-sm text-red-600">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
