import { motion } from "motion/react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { ElementType } from "react";
import { cn } from "../../utils/cn";

interface StatCardProps {
  icon: ElementType;
  label: string;
  value: string;
  growth?: string | null;
  trend?: "up" | "down" | "flat";
  color: string;
}

export default function StatCard({
  icon: Icon,
  label,
  value,
  growth,
  trend,
  color,
}: StatCardProps) {
  return (
    <motion.div
      whileHover={{
        y: -3,
        boxShadow: "0 20px 40px rgba(0,0,0,0.3)",
      }}
      transition={{ duration: 0.2 }}
      className="rounded-2xl border border-white/10 bg-[#1E293B] p-6"
    >
      <div className="flex items-start justify-between mb-4">

        <div
          className={cn(
            "w-12 h-12 rounded-xl flex items-center justify-center",
            color
          )}
        >
          <Icon
            size={22}
            className="text-white"
          />
        </div>

        <span
          className={cn(
            "flex items-center gap-1 text-sm font-medium",
            trend === "up" ? "text-emerald-400" : trend === "down" ? "text-red-400" : "text-[#94A3B8]"
          )}
        >
          {trend === "up" ? (
            <ArrowUpRight size={16} />
          ) : trend === "down" ? (
            <ArrowDownRight size={16} />
          ) : null}

          {growth ?? "—"}
        </span>

      </div>

      <div className="text-3xl font-bold text-white">
        {value}
      </div>

      <div className="text-sm text-[#94A3B8] mt-1">
        {label}
      </div>
    </motion.div>
  );
}