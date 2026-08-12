import { FormEvent, useMemo, useState } from "react";
import { CalendarDays, Search } from "lucide-react";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import Button from "../components/ui/Button";
import GlassCard from "../components/ui/GlassCard";
import PageWrap from "../components/layout/PageWrap";
import { fetchPublicAttendance, type PublicAttendanceReport } from "../services/publicAttendance";
import FaceTrackMark from "../components/branding/FaceTrackMark";

export default function PublicAttendancePage() {
  const [rollNo, setRollNo] = useState("");
  const [collegeSlug, setCollegeSlug] = useState("");
  const [report, setReport] = useState<PublicAttendanceReport | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const chartData = useMemo(() => {
    if (!report) return [];

    const totals = report.records.reduce<Record<string, number>>((totals, record) => {
        const month = record.attendance_date.slice(0, 7);
        totals[month] = (totals[month] ?? 0) + 1;
        return totals;
      }, {});

    return Object.entries(totals)
      .sort(([firstDate], [secondDate]) => firstDate.localeCompare(secondDate))
      .map(([month, attendance]) => ({
        month: new Date(`${month}-01T00:00:00`).toLocaleDateString(undefined, {
          month: "short",
          year: "numeric",
        }),
        attendance,
      }));
  }, [report]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!collegeSlug.trim() || !rollNo.trim()) {
      setError("Enter your college ID and roll number to view your report.");
      return;
    }

    setLoading(true);
    setError("");
    setReport(null);
    try {
      setReport(await fetchPublicAttendance(collegeSlug, rollNo));
    } catch (err: any) {
      setError(err?.message || "Unable to load your attendance report.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#020817] px-4 py-8 text-white sm:px-6">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 flex items-center justify-between">
          <a href="/" className="flex items-center gap-3">
            <FaceTrackMark />
            <span className="font-semibold">FaceTrack</span>
          </a>
          <a href="/" className="text-sm text-[#94A3B8] transition hover:text-white">Admin login</a>
        </div>

        <PageWrap>
          <GlassCard className="p-6 sm:p-8">
            <div className="mb-6">
              <p className="mb-2 text-sm font-medium text-blue-400">Student portal</p>
              <h1 className="text-2xl font-bold">View your attendance report</h1>
              <p className="mt-2 text-sm text-[#94A3B8]">Enter your college ID and roll number. No administrator login is required.</p>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row">
              <div className="relative flex-1">
                <input
                  value={collegeSlug}
                  onChange={(event) => setCollegeSlug(event.target.value)}
                  placeholder="College ID (e.g. greenfield-college)"
                  className="w-full rounded-xl border border-white/10 bg-[#0F172A] px-4 py-3 text-sm text-white placeholder:text-[#475569] focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                />
              </div>
              <div className="relative flex-1">
                <Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#475569]" />
                <input
                  value={rollNo}
                  onChange={(event) => setRollNo(event.target.value)}
                  placeholder="Enter roll number"
                  className="w-full rounded-xl border border-white/10 bg-[#0F172A] py-3 pl-10 pr-4 text-sm text-white placeholder:text-[#475569] focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                />
              </div>
              <Button type="submit" variant="primary" disabled={loading} className="justify-center">
                {loading ? "Loading..." : "View Report"}
              </Button>
            </form>

            {error && <p className="mt-4 text-sm text-rose-400">{error}</p>}
          </GlassCard>

          {report && (
            <GlassCard className="overflow-hidden">
              <div className="flex flex-col gap-3 border-b border-white/10 p-6 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="font-semibold">{report.student.name}</h2>
                  <p className="mt-1 text-sm text-[#94A3B8]">{report.student.roll_no} · {report.student.department}</p>
                </div>
                <div className="rounded-xl bg-blue-500/10 px-4 py-2 text-sm text-blue-300">
                  {report.records.length} day{report.records.length === 1 ? "" : "s"} present
                </div>
              </div>

              {chartData.length > 0 && (
                <div className="border-b border-white/10 p-6">
                  <h3 className="mb-4 text-sm font-semibold">Monthly attendance</h3>
                  <div className="h-52 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData} margin={{ top: 4, right: 8, left: -24, bottom: 0 }}>
                        <XAxis dataKey="month" tick={{ fill: "#94A3B8", fontSize: 11 }} axisLine={false} tickLine={false} />
                        <YAxis allowDecimals={false} tick={{ fill: "#94A3B8", fontSize: 11 }} axisLine={false} tickLine={false} />
                        <Tooltip
                          cursor={{ fill: "rgba(255,255,255,0.04)" }}
                          contentStyle={{ background: "#1E293B", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px" }}
                          labelStyle={{ color: "#fff" }}
                        />
                        <Bar dataKey="attendance" name="Present" fill="#3B82F6" radius={[5, 5, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {report.records.length ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="border-b border-white/10 text-left text-xs uppercase tracking-wider text-[#94A3B8]">
                      <tr><th className="px-6 py-3">Date</th><th className="px-6 py-3">Time</th><th className="px-6 py-3">Status</th></tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {report.records.map((record) => (
                        <tr key={`${record.student_id}-${record.attendance_date}`}>
                          <td className="px-6 py-4">{record.attendance_date}</td>
                          <td className="px-6 py-4 text-[#94A3B8]">{record.attendance_time}</td>
                          <td className="px-6 py-4"><span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-400">Present</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 px-6 py-12 text-center text-[#94A3B8]">
                  <CalendarDays size={28} />
                  <p>No attendance records found.</p>
                </div>
              )}
            </GlassCard>
          )}
        </PageWrap>
      </div>
    </div>
  );
}
