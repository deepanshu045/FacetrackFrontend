import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import PageWrap from "../components/layout/PageWrap";
import GlassCard from "../components/ui/GlassCard";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Select from "../components/ui/Select";
import Avatar from "../components/ui/Avatar";
import useStudents from "../hooks/useStudents";
import { fetchTodayAttendance, markAttendanceForStudent } from "../services/api";

import type { AttendanceRecord } from "../types";

interface ManualAttendanceResult {
  matched: boolean;
  attendance_marked: boolean;
  message: string;
  student_id: number;
  roll_no: string;
  name: string;
  department: string;
  date?: string;
  time?: string;
}

export default function LiveAttendancePage() {
  const { students, loading: studentsLoading } = useStudents();
  const [searchTerm, setSearchTerm] = useState("");
  const [attendanceList, setAttendanceList] = useState<AttendanceRecord[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);
  const [marking, setMarking] = useState(false);
  const [result, setResult] = useState<ManualAttendanceResult | null>(null);

  const filteredStudents = useMemo(() => {
    const normalized = searchTerm.trim().toLowerCase();
    if (!normalized) {
      return students.slice(0, 20);
    }

    return students.filter((student) => {
      return (
        student.name.toLowerCase().includes(normalized) ||
        student.roll_no.toLowerCase().includes(normalized)
      );
    });
  }, [searchTerm, students]);

  useEffect(() => {
    if (
      filteredStudents.length > 0 &&
      !filteredStudents.some((student) => student.id === selectedStudentId)
    ) {
      setSelectedStudentId(filteredStudents[0].id);
    }

    if (filteredStudents.length === 0) {
      setSelectedStudentId(null);
    }
  }, [filteredStudents, selectedStudentId]);

  useEffect(() => {
    let mounted = true;

    async function loadAttendance() {
      try {
        const today = await fetchTodayAttendance();
        if (!mounted || !Array.isArray(today)) return;
        setAttendanceList(today);
      } catch (_err) {
        // keep previous state
      }
    }

    loadAttendance();

    return () => {
      mounted = false;
    };
  }, []);

  const selectedStudent = students.find(
    (student) => student.id === selectedStudentId
  );

  async function handleMarkAttendance() {
    if (!selectedStudentId) {
      toast.error("Please select a student before marking attendance.");
      return;
    }

    setMarking(true);
    try {
      const response = await markAttendanceForStudent(selectedStudentId);
      setResult(response);

      if (response.attendance_marked) {
        toast.success(`Attendance marked for ${response.name}`);
      } else {
        toast.error(response.message || "Attendance already marked.");
      }

      const today = await fetchTodayAttendance();
      if (Array.isArray(today)) {
        setAttendanceList(today);
      }
    } catch (err: any) {
      toast.error(err?.message || "Unable to mark attendance.");
    } finally {
      setMarking(false);
    }
  }

  return (
    <PageWrap>
      <GlassCard className="p-6">
        <div className="mb-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-base font-semibold text-white">
              Today’s Marks
            </h3>
            <p className="text-sm text-[#94A3B8]">
              Select a student and mark attendance for today without face recognition.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              variant="secondary"
              onClick={async () => {
                try {
                  const today = await fetchTodayAttendance();
                  setAttendanceList(Array.isArray(today) ? today : []);
                } catch (_err) {
                  toast.error("Unable to refresh attendance list.");
                }
              }}
            >
              Refresh
            </Button>
            <Button
              variant="primary"
              onClick={handleMarkAttendance}
              disabled={marking || !selectedStudentId}
            >
              {marking ? "Marking…" : "Mark Attendance"}
            </Button>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr] xl:grid-cols-[1.6fr_1fr]">
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-4">
                <Input
                  label="Search student"
                  placeholder="Type name or roll number"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  disabled={studentsLoading || students.length === 0}
                />

                <Select
                  label="Matching students"
                  value={selectedStudentId ?? ""}
                  onChange={(event) =>
                    setSelectedStudentId(Number(event.target.value) || null)
                  }
                  disabled={studentsLoading || filteredStudents.length === 0}
                >
                  {students.length === 0 ? (
                    <option value="">No students available</option>
                  ) : filteredStudents.length === 0 ? (
                    <option value="">No matching student found</option>
                  ) : (
                    filteredStudents.map((student) => (
                      <option key={student.id} value={student.id}>
                        {student.name} · {student.roll_no}
                      </option>
                    ))
                  )}
                </Select>
              </div>

              <div className="space-y-2 rounded-3xl border border-white/10 bg-[#0F172A] p-4">
                <p className="text-sm text-[#94A3B8]">Selected student</p>
                {selectedStudent ? (
                  <div className="flex items-center gap-3">
                    <Avatar name={selectedStudent.name} size="md" />
                    <div>
                      <p className="text-sm font-semibold text-white">
                        {selectedStudent.name}
                      </p>
                      <p className="text-xs text-[#94A3B8]">
                        {selectedStudent.roll_no} · {selectedStudent.department}
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-[#94A3B8]">
                    Select a student to mark attendance.
                  </p>
                )}
              </div>
            </div>

            {result ? (
              <div className="rounded-3xl border border-white/10 bg-[#111827]/80 p-4">
                <p className="text-xs uppercase tracking-wide text-[#94A3B8]">
                  {result.attendance_marked ? "Success" : "Warning"}
                </p>
                <p className="mt-2 text-sm text-white">{result.message}</p>
                {result.attendance_marked && (
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl bg-[#0F172A] p-3">
                      <p className="text-xs text-[#94A3B8]">Date</p>
                      <p className="mt-1 text-sm text-white">
                        {result.date ?? "—"}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-[#0F172A] p-3">
                      <p className="text-xs text-[#94A3B8]">Time</p>
                      <p className="mt-1 text-sm text-white">
                        {result.time ?? "—"}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ) : null}
          </div>

          <div className="overflow-x-auto rounded-3xl border border-white/10 bg-[#0F172A] p-4">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 text-left text-xs uppercase tracking-wider text-[#94A3B8]">
                  <th className="px-3 py-3">Name</th>
                  <th className="px-3 py-3">Roll</th>
                  <th className="px-3 py-3">Dept</th>
                  <th className="px-3 py-3">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {attendanceList.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-12 text-center text-[#94A3B8]">
                      No attendance marked yet.
                    </td>
                  </tr>
                ) : (
                  attendanceList.map((record) => (
                    <tr
                      key={`${record.student_id}-${record.attendance_time}-${record.attendance_date}`}
                      className="transition-colors hover:bg-white/5"
                    >
                      <td className="px-3 py-3 text-white">
                        {record.student_name ?? record.name ?? "Unknown"}
                      </td>
                      <td className="px-3 py-3 text-[#94A3B8]">{record.roll_no}</td>
                      <td className="px-3 py-3 text-[#94A3B8]">{record.department}</td>
                      <td className="px-3 py-3 text-[#94A3B8]">{record.attendance_time}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </GlassCard>
    </PageWrap>
  );
}
