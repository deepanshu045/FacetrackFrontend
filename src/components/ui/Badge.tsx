import React from "react";

interface BadgeProps {
  variant?: "info" | "success" | "warning" | "danger" | "default";
  children: React.ReactNode;
  className?: string;
}

export default function Badge({
  variant = "default",
  children,
  className = "",
}: BadgeProps) {
  const base = "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium";
  const color =
    variant === "info"
      ? "bg-blue-600 text-white"
      : variant === "success"
      ? "bg-emerald-600 text-white"
      : variant === "warning"
      ? "bg-amber-500 text-white"
      : variant === "danger"
      ? "bg-red-600 text-white"
      : "bg-white/5 text-white";

  return (
    <span className={`${base} ${color} ${className}`}>
      {children}
    </span>
  );
}
