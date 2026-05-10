"use client";

import { Loader2 } from "lucide-react";
import { forwardRef, type ButtonHTMLAttributes } from "react";

type ButtonVariant = "primary" | "ghost" | "outline" | "danger";
type ButtonSize = "sm" | "md" | "lg";

const variantClass: Record<ButtonVariant, string> = {
  primary:
    "bg-ink-900 text-wash-50 hover:bg-ink-800 active:scale-[0.98]",
  ghost:
    "text-ink-500 hover:text-ink-700 hover:bg-wash-200",
  outline:
    "border border-ink-200 text-ink-700 hover:border-ink-400 hover:bg-wash-100",
  danger:
    "bg-red-600 text-white hover:bg-red-700 active:scale-[0.98]",
};

const sizeClass: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-sm rounded-soft",
  md: "h-10 px-5 text-sm",
  lg: "h-12 px-8 text-base",
};

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      loading,
      disabled,
      className = "",
      children,
      ...props
    },
    ref
  ) => {
    const base =
      "inline-flex items-center justify-center gap-2 rounded-gentle font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-muted disabled:pointer-events-none disabled:opacity-50";

    return (
      <button
        ref={ref}
        className={`${base} ${variantClass[variant]} ${sizeClass[size]} ${className}`}
        disabled={disabled || loading}
        {...props}
      >
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
