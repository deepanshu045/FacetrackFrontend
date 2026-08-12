import { cn } from "../../utils/cn";
import { getInitials } from "../../utils/helpers";

interface AvatarProps {
  name?: string;
  size?: "sm" | "md" | "lg" | "xl";
}

const sizes = {
  sm: "w-8 h-8 text-xs",
  md: "w-10 h-10 text-sm",
  lg: "w-14 h-14 text-lg",
  xl: "w-24 h-24 text-2xl",
};

export default function Avatar({
  name,
  size = "md",
}: AvatarProps) {
  const colors = [
    "bg-blue-600",
    "bg-purple-600",
    "bg-emerald-600",
    "bg-amber-600",
    "bg-rose-600",
    "bg-cyan-600",
  ];

  const safeName = String(name ?? "Unknown");
  const color = colors[safeName.charCodeAt(0) % colors.length];

  return (
    <div
      className={cn(
        "rounded-full flex items-center justify-center font-semibold text-white flex-shrink-0",
        sizes[size],
        color
      )}
    >
      {getInitials(safeName)}
    </div>
  );
}