import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

import GlassCard from "../ui/GlassCard";
import ChartTooltip from "../ui/ChartTooltip";

import { DEPT_DATA } from "../../data/mockData";
import { useEffect, useState } from "react";
import { fetchStudents } from "../../services/api";

const DEFAULT_COLORS = ["#2563EB", "#10B981", "#8B5CF6", "#F59E0B", "#EF4444"];

export default function DepartmentChart() {
  const [data, setData] = useState(DEPT_DATA);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const students = await fetchStudents();
        if (!mounted || !Array.isArray(students)) return;
        const totals: Record<string, number> = {};
        students.forEach((s: any) => {
          const dept = s.department || 'Unknown';
          totals[dept] = (totals[dept] || 0) + 1;
        });
        const entries = Object.keys(totals).map((name, i) => ({
          name,
          value: Math.round((totals[name] / students.length) * 100),
          color: DEFAULT_COLORS[i % DEFAULT_COLORS.length],
        }));
        setData(entries as any);
      } catch (e) {
        // keep mock
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <GlassCard className="p-6 relative">
      {loading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/30">
          <div className="text-sm text-white">Loading chart…</div>
        </div>
      )}
      <h3 className="mb-4 text-base font-semibold text-white">
        By Department
      </h3>

      <ResponsiveContainer
        width="100%"
        height={160}
      >
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={40}
            outerRadius={70}
            dataKey="value"
            paddingAngle={3}
          >
            {data.map((entry, index) => (
              <Cell
                key={index}
                fill={entry.color}
              />
            ))}
          </Pie>

          <Tooltip content={<ChartTooltip />} />
        </PieChart>
      </ResponsiveContainer>

      <div className="mt-2 space-y-2">
        {data.map((department) => (
          <div
            key={department.name}
            className="flex items-center justify-between text-xs"
          >
            <div className="flex items-center gap-2">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{
                  background: department.color,
                }}
              />

              <span className="truncate text-[#94A3B8]">
                {department.name}
              </span>
            </div>

            <span className="font-medium text-white">
              {department.value}%
            </span>
          </div>
        ))}
      </div>
    </GlassCard>
  );
}
