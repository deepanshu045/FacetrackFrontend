import { Dispatch, SetStateAction } from "react";

import { cn } from "../../utils/cn";

export type ReportFilter =
  | "today"
  | "monthly"
  | "date"
  | "student";

interface ReportsFilterTabsProps {
  filter: ReportFilter;
  setFilter: Dispatch<SetStateAction<ReportFilter>>;
}

const FILTERS: ReportFilter[] = [
  "today",
  "monthly",
  "date",
  "student",
];

export default function ReportsFilterTabs({
  filter,
  setFilter,
}: ReportsFilterTabsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {FILTERS.map((item) => (
        <button
          key={item}
          onClick={() => setFilter(item)}
          className={cn(
            "rounded-xl px-4 py-2 text-sm font-medium capitalize transition-all",
            filter === item
              ? "bg-blue-600 text-white"
              : "bg-white/5 text-[#94A3B8] hover:bg-white/10 hover:text-white"
          )}
        >
          {item === "date"
            ? "Custom Date"
            : item.charAt(0).toUpperCase() + item.slice(1)}
        </button>
      ))}

    </div>
  );
}