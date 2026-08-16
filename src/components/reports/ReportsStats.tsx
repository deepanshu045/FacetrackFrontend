import { BarChart3, UserCheck, UserX, Users } from "lucide-react";
import StatCard from "../ui/StatCard";

interface ReportsStatsProps {
  totalPresent: number;
  totalStudents: number;
  attendancePct: number;
  recognitionAccuracy?: string;
}

export default function ReportsStats({
  totalPresent,
  totalStudents,
  attendancePct,
}: ReportsStatsProps) {
  const totalAbsent = Math.max(totalStudents - totalPresent, 0);

  return (
    <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
      <StatCard
        icon={UserCheck}
        label="Present Today"
        value={totalPresent.toString()}
        growth=""
        trend="up"
        color="bg-emerald-600"
      />

      <StatCard
        icon={UserX}
        label="Absent Today"
        value={totalAbsent.toString()}
        growth=""
        trend="down"
        color="bg-red-600"
      />

      <StatCard
        icon={Users}
        label="Total Students"
        value={totalStudents.toString()}
        growth=""
        trend="up"
        color="bg-blue-600"
      />

      <StatCard
        icon={BarChart3}
        label="Attendance Rate"
        value={`${attendancePct}%`}
        growth=""
        trend={attendancePct > 75 ? "up" : "down"}
        color={attendancePct > 75 ? "bg-emerald-600" : "bg-red-600"}
      />
    </div>
  );
}
