import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import GlassCard from "../ui/GlassCard";
import ChartTooltip from "../ui/ChartTooltip";

import { WEEKLY_DATA } from "../../data/mockData";
import { useEffect, useState } from "react";
import { fetchAttendanceByDate } from "../../services/api";

export default function WeeklyAttendanceChart() {
  const [data, setData] = useState(WEEKLY_DATA);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;

    (async () => {
      setLoading(true);
      try {
        // compute last 7 days
        const days = Array.from({ length: 7 }).map((_, i) => {
          const d = new Date();
          d.setDate(d.getDate() - (6 - i)); // oldest to newest
          return d;
        });

        const dateStrs = days.map((d) => d.toISOString().slice(0, 10));

        const promises = dateStrs.map((ds) => fetchAttendanceByDate(ds).catch(() => []));
        const results = await Promise.all(promises);

        if (!mounted) return;

        const mapped = results.map((list, idx) => ({
          day: days[idx].toLocaleDateString(undefined, { weekday: 'short' }),
          attendance: Array.isArray(list) ? list.length : 0,
        }));

        setData(mapped as any);
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
    <GlassCard className="lg:col-span-2 p-6 relative">
      {loading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/30">
          <div className="text-sm text-white">Loading chart…</div>
        </div>
      )}
      <h3 className="mb-4 text-base font-semibold text-white">
        Weekly Attendance
      </h3>

      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data}>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="rgba(255,255,255,0.05)"
          />

          <XAxis
            dataKey="day"
            stroke="#94A3B8"
            tick={{ fontSize: 12 }}
          />

          <YAxis
            stroke="#94A3B8"
            tick={{ fontSize: 12 }}
          />

          <Tooltip content={<ChartTooltip />} />

          <Line
            type="monotone"
            dataKey="attendance"
            stroke="#2563EB"
            strokeWidth={2.5}
            dot={{
              fill: "#2563EB",
              r: 4,
            }}
            activeDot={{
              r: 6,
            }}
          />
        </LineChart>
      </ResponsiveContainer>
    </GlassCard>
  );
}
