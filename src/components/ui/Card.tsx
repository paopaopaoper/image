import { type ReactNode, type MouseEventHandler } from "react";

type CardProps = {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: MouseEventHandler<HTMLDivElement>;
};

export function Card({ children, className = "", hover = false, onClick }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-gentle border border-wash-200 shadow-poster ${
        hover ? "transition-shadow hover:shadow-float" : ""
      } ${className}`}
    >
      {children}
    </div>
  );
}
