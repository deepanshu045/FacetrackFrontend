import {
  ReactNode,
  SelectHTMLAttributes,
} from "react";
import { cn } from "../../utils/cn";

interface SelectProps
  extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  children: ReactNode;
}

export default function Select({
  label,
  children,
  className,
  ...props
}: SelectProps) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="text-sm font-medium text-[#94A3B8]">
          {label}
        </label>
      )}

      <select
        {...props}
        className={cn(
          "w-full px-4 py-2.5 rounded-xl border border-white/10 bg-[#0F172A] text-white appearance-none",
          "focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all",
          className
        )}
      >
        {children}
      </select>
    </div>
  );
}