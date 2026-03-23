import * as React from "react";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "success" | "warning" | "danger" | "info" | "neutral";
}

export const Badge = ({ className = "", variant = "neutral", ...props }: BadgeProps) => {
  const variants = {
    success: "bg-brand-green/10 text-brand-green border-brand-green/20",
    warning: "bg-brand-orange/10 text-brand-orange border-brand-orange/20",
    danger: "bg-brand-red/10 text-brand-red border-brand-red/20",
    info: "bg-brand-blue/10 text-brand-blue border-brand-blue/20",
    neutral: "bg-brand-lead/30 text-gray-400 border-brand-lead/50",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${variants[variant]} ${className}`}
      {...props}
    />
  );
};
