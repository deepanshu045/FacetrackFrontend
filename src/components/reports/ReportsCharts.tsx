import React from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { WeeklyAttendance, DepartmentData } from "../../types";

interface ReportsChartsProps {
  weeklyData: WeeklyAttendance[];
  departmentData: DepartmentData[];
}

const COLORS = ["#38bdf8", "#a78bfa", "#f59e0b", "#34d399", "#fb7185"];

export default function ReportsCharts({
  weeklyData,
  departmentData,
}: ReportsChartsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <div className="rounded-3xl border border-white/10 bg-[#0F172A] p-4">
        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-[#94A3B8]">
          Weekly Attendance
        </h3>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={weeklyData}>
              <CartesianGrid stroke="rgba(148,163,184,0.12)" vertical={false} />
              <XAxis dataKey="day" stroke="#94A3B8" tickLine={false} axisLine={false} />
              <YAxis stroke="#94A3B8" tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{
                  background: "#0F172A",
                  border: "1px solid rgba(148,163,184,0.12)",
                  color: "#fff",
                }}
              />
              <Line
                type="monotone"
                dataKey="attendance"
                stroke="#38bdf8"
                strokeWidth={3}
                dot={{ r: 4, fill: "#38bdf8" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-3xl border border-white/10 bg-[#0F172A] p-4">
        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-[#94A3B8]">
          Department Attendance
        </h3>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={departmentData}
                dataKey="value"
                nameKey="name"
                innerRadius={48}
                outerRadius={88}
                paddingAngle={4}
              >
                {departmentData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Legend
                layout="vertical"
                verticalAlign="middle"
                align="right"
                wrapperStyle={{ color: "#94A3B8", fontSize: 12 }}
              />
              <Tooltip
                contentStyle={{
                  background: "#0F172A",
                  border: "1px solid rgba(148,163,184,0.12)",
                  color: "#fff",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
