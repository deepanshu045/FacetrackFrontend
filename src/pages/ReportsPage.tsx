import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import PageWrap from "../components/layout/PageWrap";
import GlassCard from "../components/ui/GlassCard";
import Input from "../components/ui/Input";

import ReportsFilterTabs, {
  ReportFilter,
} from "../components/reports/ReportsFilterTabs";
import ReportsStats from "../components/reports/ReportsStats";
import ReportsCharts from "../components/reports/ReportsCharts";
import ReportsToolbar from "../components/reports/ReportsToolbar";
import ReportsTable from "../components/reports/ReportsTable";
import useStudents from "../hooks/useStudents";
import {
  fetchTodayAttendance,
  fetchAttendanceByDate,
  fetchMonthlyAttendance,
  fetchAttendanceByStudent,
} from "../services/api";

import { AttendanceRecord, DepartmentData, WeeklyAttendance } from "../types";

const todayString = () => {
  const today = new Date();
  return today.toISOString().slice(0, 10);
};

const currentMonthString = () => {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(
    2,
    "0"
  )}`;
};

export default function ReportsPage() {
  const { students } = useStudents();
  const [filter, setFilter] = useState<ReportFilter>("today");
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [sortKey, setSortKey] = useState<keyof AttendanceRecord>(
    "attendance_date"
  );
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [selectedDate, setSelectedDate] = useState(todayString());
  const [selectedMonth, setSelectedMonth] = useState(currentMonthString());
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (selectedStudentId === null && students.length > 0) {
      setSelectedStudentId(students[0].id);
    }
  }, [students, selectedStudentId]);

  useEffect(() => {
    setPage(1);
  }, [filter, search]);

  useEffect(() => {
    async function loadRecords() {
      setError(null);
      setLoading(true);

      try {
        let data: Array<Record<string, unknown>> = [];

        if (filter === "today") {
          data = await fetchTodayAttendance();
        } else if (filter === "date") {
          if (selectedDate) {
            data = await fetchAttendanceByDate(selectedDate);
          }
        } else if (filter === "monthly") {
          const [year, month] = selectedMonth.split("-").map(Number);
          if (year && month) {
            data = await fetchMonthlyAttendance(year, month);
          }
        } else if (filter === "student") {
          if (selectedStudentId) {
            data = await fetchAttendanceByStudent(selectedStudentId);
          }
        }

        const normalized = Array.isArray(data)
          ? data.map((record) => {
              const student = (record as any).student || {};
              return {
                ...record,
                id:
                  (record as any).id ||
                  (record as any).attendance_id ||
                  (record as any).record_id ||
                  0,
                student_name:
                  (record as any).student_name ||
                  (record as any).name ||
                  student.name ||
                  "Unknown",
                roll_no:
                  (record as any).roll_no ||
                  student.roll_no ||
                  "",
                department:
                  (record as any).department ||
                  student.department ||
                  "Unknown",
                attendance_date:
                  (record as any).attendance_date ||
                  (record as any).date ||
                  "",
                attendance_time:
                  (record as any).attendance_time ||
                  (record as any).time ||
                  "",
              } as AttendanceRecord;
            })
          : [];

        setRecords(normalized as AttendanceRecord[]);
      } catch (err: any) {
        setError(err?.message || "Unable to load attendance records.");
        setRecords([]);
      } finally {
        setLoading(false);
      }
    }

    loadRecords();
  }, [filter, selectedDate, selectedMonth, selectedStudentId]);

  const filtered = useMemo(() => {
    const normalized = search.trim().toLowerCase();
    return records
      .filter((record) => {
        if (!normalized) return true;

        return (
          record.student_name.toLowerCase().includes(normalized) ||
          record.roll_no.toLowerCase().includes(normalized)
        );
      })
      .sort((a, b) => {
        const va = String(a[sortKey]);
        const vb = String(b[sortKey]);

        return sortDir === "asc"
          ? va.localeCompare(vb)
          : vb.localeCompare(va);
      });
  }, [records, search, sortKey, sortDir]);

  const paginated = filtered.slice((page - 1) * 5, page * 5);

  function toggleSort(key: keyof AttendanceRecord) {
    if (sortKey === key) {
      setSortDir((dir) => (dir === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  const totalPresent = records.length;
  const totalStudents = students.length;
  const attendancePct = totalStudents
    ? Math.round((records.length / totalStudents) * 100)
    : 0;
  const registered = students.filter((s: any) => Boolean(s.has_face || s.image_path)).length;
  const recognitionAccuracy = totalStudents ? `${Math.round((registered / totalStudents) * 100)}%` : "—";
 
  const selectedStudent = students.find(
    (student) => student.id === selectedStudentId
  );
 
  const weeklyData = useMemo(() => {
    const counts: Record<string, number> = {};
    records.forEach((record) => {
      const key = record.attendance_date || "";
      if (!key) return;
      counts[key] = (counts[key] ?? 0) + 1;
    });
 
    const today = new Date();
    const recentDays = Array.from({ length: 7 }, (_, index) => {
      const date = new Date(today);
      date.setDate(today.getDate() - (6 - index));
      const dateKey = date.toISOString().slice(0, 10);
      return {
        day: date.toLocaleDateString("en-US", { weekday: "short" }),
        dateKey,
        attendance: counts[dateKey] ?? 0,
      };
    });
 
    return recentDays.map(({ day, attendance }) => ({ day, attendance }));
  }, [records]);
 
  const departmentData = useMemo(() => {
    const counts: Record<string, number> = {};
    records.forEach((record) => {
      const department = record.department || "Unknown";
      counts[department] = (counts[department] ?? 0) + 1;
    });
 
    const colors = [
      "#38bdf8",
      "#a78bfa",
      "#f59e0b",
      "#34d399",
      "#fb7185",
      "#f97316",
    ];
 
    return Object.entries(counts).map(([name, value], index) => ({
      name,
      value,
      color: colors[index % colors.length],
    }));
  }, [records]);
 
  function exportCsv() {
    if (!records.length) {
      toast.error("No records available to export.");
      return;
    }
 
    const headers = [
      "Name",
      "Roll Number",
      "Department",
      "Date",
      "Time",
    ];
 
    const rows = filtered.map((record) => [
      record.student_name,
      record.roll_no,
      record.department,
      record.attendance_date,
      record.attendance_time,
    ]);
 
    const csvContent = [headers, ...rows]
      .map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(","))
      .join("\n");
 
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `attendance-report-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  }
 
  function exportPdf() {
    if (!records.length) {
      toast.error("No records available to export.");
      return;
    }
 
    window.print();
  }
 
  function printReport() {
    if (!records.length) {
      toast.error("No records available to print.");
      return;
    }
 
    window.print();
  }

  return (
    <PageWrap>
      <ReportsFilterTabs filter={filter} setFilter={setFilter} />

      <div className="grid gap-4 xl:grid-cols-[1fr_1.2fr]">
        <ReportsStats
          totalPresent={totalPresent}
          totalStudents={totalStudents}
          attendancePct={attendancePct}
          recognitionAccuracy={recognitionAccuracy}
        />

        <GlassCard className="p-6">
          <div className="space-y-4">
            {filter === "date" && (
              <div className="space-y-2">
                <p className="text-sm text-[#94A3B8]">
                  Choose the date to view attendance for.
                </p>
                <Input
                  type="date"
                  value={selectedDate}
                  onChange={(event) => setSelectedDate(event.target.value)}
                />
              </div>
            )}

            {filter === "monthly" && (
              <div className="space-y-2">
                <p className="text-sm text-[#94A3B8]">
                  Choose the month to view attendance for.
                </p>
                <Input
                  type="month"
                  value={selectedMonth}
                  onChange={(event) => setSelectedMonth(event.target.value)}
                />
              </div>
            )}

            {filter === "student" && (
              <div className="space-y-2">
                <p className="text-sm text-[#94A3B8]">
                  Select a student to view their attendance history.
                </p>
                <select
                  value={selectedStudentId ?? ""}
                  onChange={(event) =>
                    setSelectedStudentId(
                      Number(event.target.value) || null
                    )
                  }
                  className="w-full rounded-xl border border-white/10 bg-[#0F172A] px-4 py-2 text-white focus:outline-none"
                >
                  <option value="">Select a student</option>
                  {students.map((student) => (
                    <option key={student.id} value={student.id}>
                      {student.name} · {student.roll_no}
                    </option>
                  ))}
                </select>
                {selectedStudent ? (
                  <div className="rounded-3xl border border-white/10 bg-[#0F172A] p-4">
                    <p className="text-sm font-semibold text-white">
                      {selectedStudent.name}
                    </p>
                    <p className="text-sm text-[#94A3B8]">
                      {selectedStudent.roll_no} · {selectedStudent.department}
                    </p>
                  </div>
                ) : null}
              </div>
            )}
          </div>
        </GlassCard>
      </div>

      <ReportsCharts weeklyData={weeklyData} departmentData={departmentData} />

      <GlassCard className="p-6">
        <ReportsToolbar
          search={search}
          setSearch={(value) => {
            setSearch(value);
            setPage(1);
          }}
          setPage={setPage}
          onExportCsv={exportCsv}
          onExportPdf={exportPdf}
          onPrint={printReport}
        />

        {error ? (
          <div className="rounded-3xl border border-red-600/20 bg-red-600/10 p-4 text-sm text-red-200">
            {error}
          </div>
        ) : null}

        {loading ? (
          <div className="rounded-3xl border border-white/10 bg-[#0F172A] p-8 text-center text-sm text-[#94A3B8]">
            Loading attendance records...
          </div>
        ) : null}

        <ReportsTable
          records={paginated}
          page={page}
          setPage={setPage}
          total={filtered.length}
          perPage={5}
          sortKey={sortKey}
          sortDir={sortDir}
          toggleSort={toggleSort}
        />
      </GlassCard>
    </PageWrap>
  );
}
