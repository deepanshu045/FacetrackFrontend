import Avatar from "../ui/Avatar";
import GlassCard from "../ui/GlassCard";

import { ATTENDANCE } from "../../data/mockData";
import { useEffect, useState } from "react";
import { fetchTodayAttendance } from "../../services/api";

export default function RecentAttendanceTable() {
  const [data, setData] = useState(ATTENDANCE);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const res = await fetchTodayAttendance();
        if (!mounted || !Array.isArray(res)) return;
        setData(res as any);
      } catch (e) {
        // keep mock
      } finally { if (mounted) setLoading(false); }
    })();
    return () => { mounted = false; };
  }, []);

  return (
    <GlassCard className="p-6">
      <h3 className="mb-4 text-base font-semibold text-white">
        Recent Attendance
      </h3>

      <div className="overflow-x-auto relative">
        {loading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/30">
            <div className="text-sm text-white">Loading…</div>
          </div>
        )}
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10">
              {[
                "Name",
                "Roll No",
                "Department",
                "Date",
                "Time",
              ].map((header) => (
                <th
                  key={header}
                  className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wider text-[#94A3B8]"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-white/5">
            {data.slice(0, 5).map((attendance: any, idx: number) => {
              const name = attendance.student_name ?? attendance.name ?? attendance.student_name ?? attendance['Student']?.name ?? "Unknown";
              const roll = attendance.roll_no ?? attendance.rollNo ?? "—";
              const dept = attendance.department ?? "—";
              const date = attendance.attendance_date ?? attendance.date ?? "—";
              const time = attendance.attendance_time ?? attendance.attendanceTime ?? "—";

              const key = attendance.id ?? `${attendance.student_id ?? attendance.studentId ?? idx}-${date}-${time}`;

              return (
                <tr
                  key={key}
                  className="transition-colors hover:bg-white/3"
                >
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar
                        name={name}
                        size="sm"
                      />

                      <span className="font-medium text-white">
                        {name}
                      </span>
                    </div>
                  </td>

                  <td className="px-3 py-3 font-mono text-xs text-[#94A3B8]">
                    {roll}
                  </td>

                  <td className="px-3 py-3 text-[#94A3B8]">
                    {dept}
                  </td>

                  <td className="px-3 py-3 text-[#94A3B8]">
                    {date}
                  </td>

                  <td className="px-3 py-3 text-[#94A3B8]">
                    {time}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </GlassCard>
  );
}
