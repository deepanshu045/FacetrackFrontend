import { ReactNode } from "react";
import { cn } from "../../utils/cn";

interface GlassCardProps {
  children: ReactNode;
  className?: string;
}

export default function GlassCard({
  children,
  className,
}: GlassCardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-white/10 bg-[#1E293B]/80 backdrop-blur-sm shadow-xl",
        className
      )}
    >
      {children}
    </div>
  );
}