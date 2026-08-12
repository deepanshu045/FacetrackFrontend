import { BarChart3, UserCheck, Users, Zap } from "lucide-react";
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
  recognitionAccuracy = "—",
}: ReportsStatsProps) {
  return (
    <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
      <StatCard
        icon={UserCheck}
        label="Total Present Today"
        value={totalPresent.toString()}
        growth="5%"
        trend="up"
        color="bg-emerald-600"
      />

      <StatCard
        icon={Users}
        label="Total Students"
        value={totalStudents.toString()}
        growth="0%"
        trend="up"
        color="bg-blue-600"
      />

      <StatCard
        icon={Zap}
        label="Recognition Accuracy"
        value={recognitionAccuracy}
        growth="1.2%"
        trend="up"
        color="bg-purple-600"
      />

      <StatCard
        icon={BarChart3}
        label="Attendance Rate"
        value={`${attendancePct}%`}
        growth="3.1%"
        trend="up"
        color="bg-amber-600"
      />
    </div>
  );
}