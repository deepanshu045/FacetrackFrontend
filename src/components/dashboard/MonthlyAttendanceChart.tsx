import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import GlassCard from "../ui/GlassCard";
import ChartTooltip from "../ui/ChartTooltip";

import { MONTHLY_DATA } from "../../data/mockData";
import { useEffect, useState } from "react";
import { fetchMonthlyAttendance } from "../../services/api";

export default function MonthlyAttendanceChart() {
  const [data, setData] = useState(MONTHLY_DATA);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const now = new Date();
        const res = await fetchMonthlyAttendance(now.getFullYear(), now.getMonth() + 1);
        if (!mounted || !Array.isArray(res)) return;
        // res is attendance records; aggregate by day
        const counts: Record<string, number> = {};
        res.forEach((r: any) => {
          const d = new Date(r.attendance_date).getDate();
          counts[d] = (counts[d] || 0) + 1;
        });
        const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
        const mapped = Array.from({ length: daysInMonth }).map((_, i) => ({
          month: `${i + 1}`,
          attendance: counts[i + 1] || 0,
        }));
        setData(mapped as any);
      } catch (e) {
        // keep mock data
      } finally { if (mounted) setLoading(false); }
    })();
    return () => { mounted = false; };
  }, []);

  return (
    <GlassCard className="p-6 relative">
      {loading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/30">
          <div className="text-sm text-white">Loading chart…</div>
        </div>
      )}
      <h3 className="mb-4 text-base font-semibold text-white">
        Monthly Attendance
      </h3>

      <ResponsiveContainer
        width="100%"
        height={180}
      >
        <BarChart data={data}>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="rgba(255,255,255,0.05)"
          />

          <XAxis
            dataKey="month"
            stroke="#94A3B8"
            tick={{ fontSize: 12 }}
          />

          <YAxis
            stroke="#94A3B8"
            tick={{ fontSize: 12 }}
          />

          <Tooltip content={<ChartTooltip />} />

          <Bar
            dataKey="attendance"
            fill="#2563EB"
            radius={[6, 6, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </GlassCard>
  );
}
