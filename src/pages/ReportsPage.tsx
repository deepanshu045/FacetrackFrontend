import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import PageWrap from "../components/layout/PageWrap";
import GlassCard from "../components/ui/GlassCard";
import Input from "../components/ui/Input";
import ReportsFilterTabs, { ReportFilter } from "../components/reports/ReportsFilterTabs";
import ReportsTable from "../components/reports/ReportsTable";
import useStudents from "../hooks/useStudents";
import {
  fetchTodayAttendance,
  fetchAttendanceByDate,
  fetchMonthlyAttendance,
  fetchAttendanceByStudent,
} from "../services/api";
import { fetchStudentAttendanceSummary } from "../services/studentReportApi";
import { AttendanceReport, StudentAttendanceSummary } from "../types";

const todayString = () => new Date().toISOString().slice(0, 10);
const currentMonthString = () => {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
};

function formatDate(value: string) {
  if (!value) return "—";
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export default function ReportsPage() {
  const { students } = useStudents();
  const [filter, setFilter] = useState<ReportFilter>("student");
  const [records, setRecords] = useState<AttendanceReport[]>([]);
  const [page, setPage] = useState(1);
  const [sortKey, setSortKey] = useState<keyof AttendanceReport>("attendance_date");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [selectedDate, setSelectedDate] = useState(todayString());
  const [selectedMonth, setSelectedMonth] = useState(currentMonthString());
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);
  const [subject, setSubject] = useState("all");
  const [status, setStatus] = useState("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [studentSummary, setStudentSummary] = useState<StudentAttendanceSummary | null>(null);

  useEffect(() => {
    if (students.length > 0 && selectedStudentId === null) {
      setSelectedStudentId(students[0].id);
    }
  }, [students, selectedStudentId]);

  useEffect(() => {
    setPage(1);
  }, [filter, selectedStudentId, selectedDate, selectedMonth, subject, status, fromDate, toDate, search]);

  useEffect(() => {
    async function loadRecords() {
      if (filter === "student" && selectedStudentId === null) {
        setRecords([]);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        let data: unknown[] = [];
        if (filter === "student") {
          data = await fetchAttendanceByStudent(selectedStudentId!);
        } else if (filter === "today") {
          data = await fetchTodayAttendance();
        } else if (filter === "date") {
          data = selectedDate ? await fetchAttendanceByDate(selectedDate) : [];
        } else if (filter === "monthly") {
          const [year, month] = selectedMonth.split("-").map(Number);
          data = year && month ? await fetchMonthlyAttendance(year, month) : [];
        }

        setRecords(
          Array.isArray(data)
            ? data.map((record: any) => ({
                ...record,
                student_id: Number(record.student_id || 0),
                name: record.name || record.student_name || "Unknown",
                roll_no: record.roll_no || "",
                department: record.department || "Unknown",
                attendance_date: record.attendance_date || record.date || "",
                attendance_time: record.attendance_time || record.time || record.start_time || "",
                subject: record.subject || null,
                status: record.status || "Present",
              }))
            : []
        );
      } catch (err: any) {
        setRecords([]);
        setError(err?.message || "Unable to load attendance records.");
      } finally {
        setLoading(false);
      }
    }

    loadRecords();
  }, [filter, selectedStudentId, selectedDate, selectedMonth]);

  useEffect(() => {
    if (!selectedStudentId) {
      setStudentSummary(null);
      return;
    }

    async function loadSummary() {
      setSummaryLoading(true);
      try {
        setStudentSummary(await fetchStudentAttendanceSummary(selectedStudentId!));
      } catch {
        setStudentSummary(null);
      } finally {
        setSummaryLoading(false);
      }
    }

    loadSummary();
  }, [selectedStudentId]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return records
      .filter((record) => {
        if (query && !record.name.toLowerCase().includes(query) && !record.roll_no.toLowerCase().includes(query)) return false;
        if (filter === "student") {
          if (subject !== "all" && (record.subject || "Unknown") !== subject) return false;
          if (status !== "all" && (record.status || "Present") !== status) return false;
          if (fromDate && record.attendance_date < fromDate) return false;
          if (toDate && record.attendance_date > toDate) return false;
        }
        return true;
      })
      .sort((a, b) => {
        const va = String(a[sortKey] ?? "");
        const vb = String(b[sortKey] ?? "");
        return sortDir === "asc" ? va.localeCompare(vb) : vb.localeCompare(va);
      });
  }, [records, search, filter, subject, status, fromDate, toDate, sortKey, sortDir]);

  const paginated = filtered.slice((page - 1) * 8, page * 8);
  const selectedStudent = students.find((student) => student.id === selectedStudentId);
  const subjects = useMemo(
    () => Array.from(new Set(records.map((record) => record.subject).filter(Boolean) as string[])).sort(),
    [records]
  );

  const subjectBreakdown = useMemo(() => {
    const groups: Record<string, { present: number; total: number }> = {};
    records.forEach((record) => {
      const name = record.subject || "Unknown subject";
      if (!groups[name]) groups[name] = { present: 0, total: 0 };
      groups[name].total += 1;
      if ((record.status || "Present").toLowerCase() === "present") groups[name].present += 1;
    });
    return Object.entries(groups)
      .map(([name, value]) => ({ name, ...value, percentage: value.total ? Math.round((value.present / value.total) * 100) : 0 }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [records]);

  function toggleSort(key: keyof AttendanceReport) {
    if (sortKey === key) setSortDir((dir) => (dir === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  function exportCsv() {
    if (!filtered.length) {
      toast.error("No lectures available to export.");
      return;
    }
    const rows = [
      ["Student", "Roll Number", "Subject", "Date", "Start Time", "End Time", "Status"],
      ...filtered.map((record) => [
        record.name,
        record.roll_no,
        record.subject || "",
        record.attendance_date,
        record.start_time || record.attendance_time || "",
        record.end_time || "",
        record.status || "Present",
      ]),
    ];
    const csv = rows.map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `attendance-report-${todayString()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <PageWrap>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Attendance Reports</h1>
        <p className="mt-1 text-sm text-[#94A3B8]">Analyze attendance at the lecture level. Every row represents one conducted lecture.</p>
      </div>

      <ReportsFilterTabs filter={filter} setFilter={setFilter} />

      {filter === "student" ? (
        <div className="mt-4 space-y-4">
          <GlassCard className="p-5">
            <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr_1fr_1fr_1fr]">
              <div className="space-y-2">
                <label className="text-xs font-medium uppercase tracking-wide text-[#64748B]">Student</label>
                <select
                  value={selectedStudentId ?? ""}
                  onChange={(event) => setSelectedStudentId(Number(event.target.value) || null)}
                  className="w-full rounded-xl border border-white/10 bg-[#0F172A] px-4 py-3 text-sm text-white outline-none focus:border-blue-500/50"
                >
                  <option value="">Select a student</option>
                  {students.map((student) => (
                    <option key={student.id} value={student.id}>{student.name} · {student.roll_no}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium uppercase tracking-wide text-[#64748B]">Subject</label>
                <select value={subject} onChange={(e) => setSubject(e.target.value)} className="w-full rounded-xl border border-white/10 bg-[#0F172A] px-4 py-3 text-sm text-white outline-none">
                  <option value="all">All subjects</option>
                  {subjects.map((item) => <option key={item} value={item}>{item}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium uppercase tracking-wide text-[#64748B]">Status</label>
                <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full rounded-xl border border-white/10 bg-[#0F172A] px-4 py-3 text-sm text-white outline-none">
                  <option value="all">All statuses</option>
                  <option value="Present">Present</option>
                  <option value="Absent">Absent</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium uppercase tracking-wide text-[#64748B]">From</label>
                <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium uppercase tracking-wide text-[#64748B]">To</label>
                <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
              </div>
            </div>
          </GlassCard>

          {selectedStudent ? (
            <div className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
              <GlassCard className="p-6">
                <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-[0.18em] text-[#64748B]">Student attendance</p>
                    <h2 className="mt-1 text-xl font-semibold text-white">{selectedStudent.name}</h2>
                    <p className="mt-1 text-sm text-[#94A3B8]">{selectedStudent.roll_no} · {selectedStudent.department}{selectedStudent.section ? ` · Section ${selectedStudent.section}` : ""}</p>
                  </div>
                  <div className="text-left sm:text-right">
                    {summaryLoading ? <p className="text-sm text-[#94A3B8]">Loading summary...</p> : studentSummary ? (
                      <>
                        <p className={`text-4xl font-bold ${studentSummary.percentage >= 75 ? "text-emerald-400" : "text-red-400"}`}>{studentSummary.percentage}%</p>
                        <p className="mt-1 text-sm text-[#94A3B8]">{studentSummary.present} / {studentSummary.total_lectures} conducted lectures</p>
                      </>
                    ) : <p className="text-sm text-[#94A3B8]">Summary unavailable</p>}
                  </div>
                </div>
                <div className="mt-6 grid grid-cols-3 gap-3">
                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"><p className="text-xs text-[#64748B]">Present</p><p className="mt-1 text-xl font-semibold text-emerald-300">{studentSummary?.present ?? "—"}</p></div>
                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"><p className="text-xs text-[#64748B]">Absent</p><p className="mt-1 text-xl font-semibold text-red-300">{studentSummary ? studentSummary.total_lectures - studentSummary.present : "—"}</p></div>
                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"><p className="text-xs text-[#64748B]">Conducted</p><p className="mt-1 text-xl font-semibold text-white">{studentSummary?.total_lectures ?? "—"}</p></div>
                </div>
              </GlassCard>

              <GlassCard className="p-6">
                <div className="flex items-center justify-between"><div><p className="text-xs font-medium uppercase tracking-[0.18em] text-[#64748B]">Subject-wise</p><h3 className="mt-1 font-semibold text-white">Attendance by subject</h3></div></div>
                <div className="mt-5 space-y-4">
                  {subjectBreakdown.length === 0 ? <p className="text-sm text-[#94A3B8]">No lecture data available.</p> : subjectBreakdown.map((item) => (
                    <div key={item.name}>
                      <div className="mb-1 flex justify-between text-sm"><span className="text-[#CBD5E1]">{item.name}</span><span className="text-[#94A3B8]">{item.present}/{item.total} · {item.percentage}%</span></div>
                      <div className="h-2 overflow-hidden rounded-full bg-white/10"><div className={`h-full rounded-full ${item.percentage >= 75 ? "bg-emerald-400" : "bg-red-400"}`} style={{ width: `${item.percentage}%` }} /></div>
                    </div>
                  ))}
                </div>
              </GlassCard>
            </div>
          ) : null}
        </div>
      ) : (
        <GlassCard className="mt-4 p-5">
          <div className="grid gap-4 md:grid-cols-2">
            {filter === "date" && <div><label className="mb-2 block text-xs uppercase tracking-wide text-[#64748B]">Date</label><Input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} /></div>}
            {filter === "monthly" && <div><label className="mb-2 block text-xs uppercase tracking-wide text-[#64748B]">Month</label><Input type="month" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} /></div>}
            <div><label className="mb-2 block text-xs uppercase tracking-wide text-[#64748B]">Search student</label><Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Name or roll number" /></div>
          </div>
        </GlassCard>
      )}

      <GlassCard className="mt-4 p-6">
        <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div><h2 className="font-semibold text-white">{filter === "student" ? "Lecture history" : "Attendance records"}</h2><p className="mt-1 text-sm text-[#64748B]">{filtered.length} lecture{filtered.length === 1 ? "" : "s"} in this view</p></div>
          <div className="flex items-center gap-2">
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search..." />
            <button onClick={exportCsv} className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white hover:bg-white/10">Export CSV</button>
          </div>
        </div>

        {error ? <div className="mb-4 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-200">{error}</div> : null}
        {loading ? <div className="rounded-2xl border border-white/10 bg-[#0F172A] p-10 text-center text-sm text-[#94A3B8]">Loading lecture attendance...</div> : (
          <ReportsTable
            records={paginated}
            page={page}
            setPage={setPage}
            total={filtered.length}
            perPage={8}
            sortKey={sortKey}
            sortDir={sortDir}
            toggleSort={toggleSort}
            lectureWise={filter === "student"}
          />
        )}
      </GlassCard>
    </PageWrap>
  );
}
