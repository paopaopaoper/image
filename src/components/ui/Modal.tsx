"use client";

import { X } from "lucide-react";
import { useEffect, useRef, type ReactNode } from "react";

type ModalProps = {
  open: boolean;
  onClose?: () => void;
  closable?: boolean;
  children: ReactNode;
};

export function Modal({ open, onClose, closable = true, children }: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && closable && onClose) onClose();
    };
    document.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handler);
      document.body.style.overflow = "";
    };
  }, [open, closable, onClose]);

  if (!open) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/30 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === overlayRef.current && closable && onClose) onClose();
      }}
    >
      <div className="animate-fade-in w-full max-w-md mx-4 bg-wash-50 rounded-arch shadow-float">
        {closable && onClose && (
          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-1 rounded-soft text-ink-300 hover:text-ink-600 hover:bg-wash-200 transition-colors"
            aria-label="关闭"
          >
            <X className="h-4 w-4" />
          </button>
        )}
        {children}
      </div>
    </div>
  );
}
