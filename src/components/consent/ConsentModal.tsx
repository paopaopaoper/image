"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";

const STORAGE_KEY = "consent_terms_version";
const CURRENT_VERSION = 1;

const TERMS_CONTENT = `我自愿上传自己的照片，生成自己的毕业纪念照，用于朋友圈分享、个人纪念，完全是个人非恶意使用，没有侵犯他人肖像权，也没有误导性用途。

本人知悉上传的照片将用于 AI 生成处理，生成结果可能被平台存储用于服务优化，本人有权随时要求删除。`;

type ConsentModalProps = {
  onAgree?: () => void;
  onReject?: () => void;
};

export function ConsentModal({ onAgree, onReject }: ConsentModalProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored !== String(CURRENT_VERSION)) {
      setOpen(true);
    }
  }, []);

  function handleAgree() {
    localStorage.setItem(STORAGE_KEY, String(CURRENT_VERSION));
    setOpen(false);
    onAgree?.();
  }

  function handleReject() {
    setOpen(false);
    onReject?.();
  }

  return (
    <Modal open={open} closable={false}>
      <div className="p-8">
        {/* 顶部装饰线 */}
        <div className="mx-auto mb-6 h-px w-16 bg-accent-muted" />

        <h2 className="text-center font-serif text-xl text-ink-900 mb-6">
          创作须知
        </h2>

        <div className="text-sm text-ink-500 leading-relaxed whitespace-pre-line mb-8">
          {TERMS_CONTENT}
        </div>

        <div className="flex gap-3">
          <Button
            variant="ghost"
            className="flex-1"
            onClick={handleReject}
          >
            拒绝
          </Button>
          <Button
            variant="primary"
            className="flex-1"
            onClick={handleAgree}
          >
            我已知晓并同意
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export { CURRENT_VERSION as CONSENT_VERSION, STORAGE_KEY as CONSENT_STORAGE_KEY };
