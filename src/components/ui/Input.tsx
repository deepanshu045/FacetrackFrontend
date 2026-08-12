import { InputHTMLAttributes } from "react";
import { cn } from "../../utils/cn";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export default function Input({
  label,
  className,
  ...props
}: InputProps) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="text-sm font-medium text-[#94A3B8]">
          {label}
        </label>
      )}

      <input
        {...props}
        className={cn(
          "w-full px-4 py-2.5 rounded-xl border border-white/10 bg-[#0F172A] text-white placeholder:text-[#475569]",
          "focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all",
          className
        )}
      />
    </div>
  );
}