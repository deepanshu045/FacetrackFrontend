import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  CircleAlert,
  Clock3,
  Laptop,
  Loader2,
  RefreshCw,
  ScanFace,
  ShieldCheck,
  UserRoundCheck,
  Users,
  Wifi,
  WifiOff,
} from "lucide-react";
import { toast } from "sonner";

import PageWrap from "../components/layout/PageWrap";
import GlassCard from "../components/ui/GlassCard";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Select from "../components/ui/Select";
import Avatar from "../components/ui/Avatar";
import useStudents from "../hooks/useStudents";
import {
  fetchLectures,
  fetchTodayAttendance,
  markAttendanceForStudent,
} from "../services/api";
import type { AttendanceReport, Lecture } from "../types";

function localDateString(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function toMinutes(value: string) {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

function isLectureActive(lecture: Lecture, now: Date) {
  if (lecture.status !== "Scheduled") return false;
  if (lecture.lecture_date !== localDateString(now)) return false;
  const current = now.getHours() * 60 + now.getMinutes();
  return current >= toMinutes(lecture.start_time) && current <= toMinutes(lecture.end_time);
}

function formatTime(value?: string) {
  if (!value) return "—";
  return value.slice(0, 5);
}

function formatAttendanceTime(value?: string) {
  if (!value) return "—";
  const normalized = value.includes("T") ? value : `1970-01-01T${value}`;
  const parsed = new Date(normalized);
  if (Number.isNaN(parsed.getTime())) return value.slice(0, 5);
  return parsed.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function LiveAttendancePage() {
  const { students, loading: studentsLoading } = useStudents();
  const [attendanceList, setAttendanceList] = useState<AttendanceReport[]>([]);
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);
  const [marking, setMarking] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [backendOnline, setBackendOnline] = useState(false);
  const [lastRefreshAt, setLastRefreshAt] = useState<string | null>(null);
  const [now, setNow] = useState(() => new Date());
  const [lastRecognized, setLastRecognized] = useState<AttendanceReport | null>(null);

  const refreshData = useCallback(async (silent = false) => {
    if (!silent) setRefreshing(true);
    try {
      const [today, lectureData] = await Promise.all([
        fetchTodayAttendance(),
        fetchLectures(),
      ]);

      if (Array.isArray(today)) {
        setAttendanceList(today);
        if (today.length > 0) setLastRecognized(today[0]);
      }
      if (Array.isArray(lectureData)) setLectures(lectureData);
      setBackendOnline(true);
      setLastRefreshAt(
        new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      );
    } catch (error: any) {
      setBackendOnline(false);
      if (!silent) toast.error(error?.message || "Unable to connect to attendance service.");
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void refreshData();
    const timer = window.setInterval(() => {
      setNow(new Date());
      void refreshData(true);
    }, 5000);
    return () => window.clearInterval(timer);
  }, [refreshData]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const activeLectures = useMemo(
    () => lectures.filter((lecture) => isLectureActive(lecture, now)),
    [lectures, now]
  );
  const activeLecture = activeLectures[0] ?? null;

  const studentsWithFaces = useMemo(
    () => students.filter((student) => student.has_face),
    [students]
  );

  const filteredStudents = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return students.slice(0, 20);
    return students.filter(
      (student) =>
        student.name.toLowerCase().includes(query) ||
        student.roll_no.toLowerCase().includes(query)
    );
  }, [searchTerm, students]);

  useEffect(() => {
    if (filteredStudents.length === 0) {
      setSelectedStudentId(null);
      return;
    }
    if (!filteredStudents.some((student) => student.id === selectedStudentId)) {
      setSelectedStudentId(filteredStudents[0].id);
    }
  }, [filteredStudents, selectedStudentId]);

  const selectedStudent = students.find((student) => student.id === selectedStudentId);
  const presentStudentIds = useMemo(
    () => new Set(attendanceList.map((record) => record.student_id)),
    [attendanceList]
  );

  async function handleManualAttendance() {
    if (!selectedStudentId) {
      toast.error("Please select a student first.");
      return;
    }
    if (!activeLecture) {
      toast.error("There is no active lecture right now.");
      return;
    }

    setMarking(true);
    try {
      const response = (await markAttendanceForStudent(selectedStudentId)) as {
        attendance_marked?: boolean;
        name?: string;
        message?: string;
      };

      if (response.attendance_marked) {
        toast.success(`Attendance marked for ${response.name || selectedStudent?.name || "student"}`);
      } else {
        toast.info(response.message || "Attendance already marked.");
      }
      await refreshData(true);
    } catch (error: any) {
      toast.error(error?.message || "Unable to mark attendance.");
    } finally {
      setMarking(false);
    }
  }

  return (
    <PageWrap>
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <ScanFace className="text-blue-400" size={22} />
            <h1 className="text-2xl font-semibold text-white">Live Attendance</h1>
          </div>
          <p className="mt-1 text-sm text-[#94A3B8]">
            Monitor attendance captured by the FaceTrack desktop recognition app.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-[#CBD5E1]">
            <Clock3 className="mr-2 inline" size={14} />
            {now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
          </div>
          <Button variant="secondary" onClick={() => void refreshData()} disabled={refreshing}>
            {refreshing ? <Loader2 size={15} className="animate-spin" /> : <RefreshCw size={15} />}
            {refreshing ? "Syncing…" : "Sync"}
          </Button>
        </div>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <GlassCard className="p-4">
          <div className="flex items-center gap-3">
            <div className={`rounded-xl p-2 ${backendOnline ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"}`}>
              {backendOnline ? <Wifi size={18} /> : <WifiOff size={18} />}
            </div>
            <div>
              <p className="text-xs text-[#64748B]">Attendance service</p>
              <p className="mt-1 text-sm font-medium text-white">{backendOnline ? "Connected" : "Offline"}</p>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-blue-500/10 p-2 text-blue-400"><Laptop size={18} /></div>
            <div>
              <p className="text-xs text-[#64748B]">Recognition source</p>
              <p className="mt-1 text-sm font-medium text-white">Desktop app</p>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-emerald-500/10 p-2 text-emerald-400"><UserRoundCheck size={18} /></div>
            <div>
              <p className="text-xs text-[#64748B]">Present today</p>
              <p className="mt-1 text-sm font-medium text-white">{presentStudentIds.size} students</p>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-violet-500/10 p-2 text-violet-400"><Users size={18} /></div>
            <div>
              <p className="text-xs text-[#64748B]">Face profiles</p>
              <p className="mt-1 text-sm font-medium text-white">{studentsWithFaces.length} ready</p>
            </div>
          </div>
        </GlassCard>
      </div>

      <div className="mb-6 rounded-2xl border border-blue-500/20 bg-blue-500/10 p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-blue-500/15 p-2 text-blue-300"><ShieldCheck size={20} /></div>
            <div>
              <p className="font-semibold text-white">Desktop recognition is the attendance engine</p>
              <p className="mt-1 text-sm text-blue-100/70">
                Keep the FaceTrack desktop app running. This page monitors the attendance it sends to the backend instead of opening another browser camera.
              </p>
            </div>
          </div>
          <div className={`shrink-0 rounded-full px-3 py-1.5 text-xs ${backendOnline ? "bg-emerald-500/15 text-emerald-300" : "bg-red-500/15 text-red-300"}`}>
            {backendOnline ? "Backend receiving data" : "Backend unavailable"}
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <GlassCard className="p-6">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-semibold text-white">Current Session</h3>
              <p className="mt-1 text-sm text-[#94A3B8]">The lecture currently eligible for attendance.</p>
            </div>
            <div className={`rounded-full px-3 py-1.5 text-xs ${activeLecture ? "bg-emerald-500/10 text-emerald-300" : "bg-amber-500/10 text-amber-300"}`}>
              {activeLecture ? "Lecture active" : "Waiting"}
            </div>
          </div>

          {activeLecture ? (
            <div className="rounded-2xl border border-white/10 bg-[#0F172A] p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wider text-[#64748B]">Subject</p>
                  <h2 className="mt-1 text-xl font-semibold text-white">{activeLecture.subject}</h2>
                  <p className="mt-2 text-sm text-[#94A3B8]">
                    {activeLecture.department} · {activeLecture.class_name} · Section {activeLecture.section}
                  </p>
                </div>
                <div className="text-left sm:text-right">
                  <p className="text-xs text-[#64748B]">Schedule</p>
                  <p className="mt-1 text-sm font-medium text-white">
                    {formatTime(activeLecture.start_time)} – {formatTime(activeLecture.end_time)}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-3 rounded-2xl border border-amber-500/20 bg-amber-500/10 p-5">
              <CircleAlert className="mt-0.5 shrink-0 text-amber-300" size={19} />
              <div>
                <p className="font-medium text-white">No active lecture</p>
                <p className="mt-1 text-sm text-amber-100/70">
                  Attendance will be accepted when a scheduled lecture is active.
                </p>
              </div>
            </div>
          )}

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
              <p className="text-xs text-[#64748B]">Last recognized</p>
              <p className="mt-1 truncate text-sm font-medium text-white">{lastRecognized?.name || "Waiting…"}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
              <p className="text-xs text-[#64748B]">Recognition time</p>
              <p className="mt-1 text-sm font-medium text-white">{formatAttendanceTime(lastRecognized?.attendance_time)}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
              <p className="text-xs text-[#64748B]">Last sync</p>
              <p className="mt-1 text-sm font-medium text-white">{lastRefreshAt || "—"}</p>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          <div className="mb-5">
            <h3 className="text-base font-semibold text-white">Manual Fallback</h3>
            <p className="mt-1 text-sm text-[#94A3B8]">Use only when the desktop recognition app cannot recognize a student.</p>
          </div>

          <div className="space-y-4">
            <Input
              label="Search student"
              placeholder="Name or roll number"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              disabled={studentsLoading || students.length === 0}
            />

            <Select
              label="Student"
              value={selectedStudentId ?? ""}
              onChange={(event) => setSelectedStudentId(Number(event.target.value) || null)}
              disabled={studentsLoading || filteredStudents.length === 0}
            >
              {filteredStudents.length === 0 ? (
                <option value="">No matching student</option>
              ) : (
                filteredStudents.map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.name} · {student.roll_no}
                  </option>
                ))
              )}
            </Select>

            {selectedStudent && (
              <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-[#0F172A] p-4">
                <Avatar name={selectedStudent.name} size="md" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-white">{selectedStudent.name}</p>
                  <p className="truncate text-xs text-[#94A3B8]">{selectedStudent.roll_no} · {selectedStudent.department}</p>
                  <p className="mt-1 text-xs text-emerald-400">{selectedStudent.has_face ? "Face profile ready" : "No face profile"}</p>
                </div>
              </div>
            )}

            <Button
              variant="primary"
              className="w-full"
              onClick={handleManualAttendance}
              disabled={marking || !selectedStudentId || !activeLecture}
            >
              {marking ? <><Loader2 size={15} className="animate-spin" /> Marking…</> : <><UserRoundCheck size={15} /> Mark Attendance Manually</>}
            </Button>
          </div>
        </GlassCard>
      </div>

      <GlassCard className="mt-6 p-6">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-base font-semibold text-white">Live Recognition Feed</h3>
            <p className="text-sm text-[#94A3B8]">Latest attendance events received from the backend.</p>
          </div>
          <span className="rounded-full bg-white/5 px-3 py-1 text-xs text-[#CBD5E1]">{presentStudentIds.size} present</span>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-white/10 bg-[#0F172A]">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 text-left text-xs uppercase tracking-wider text-[#64748B]">
                <th className="px-4 py-3">Student</th>
                <th className="px-4 py-3">Roll</th>
                <th className="px-4 py-3">Department</th>
                <th className="px-4 py-3">Recognized</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {attendanceList.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-[#64748B]">Waiting for recognition events…</td>
                </tr>
              ) : (
                attendanceList.slice(0, 20).map((record) => (
                  <tr key={`${record.student_id}-${record.attendance_date}-${record.attendance_time}`} className="hover:bg-white/5">
                    <td className="px-4 py-3 text-white">
                      <div className="flex items-center gap-3">
                        <Avatar name={record.name} size="sm" />
                        <span>{record.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[#94A3B8]">{record.roll_no}</td>
                    <td className="px-4 py-3 text-[#94A3B8]">{record.department}</td>
                    <td className="px-4 py-3 text-[#94A3B8]">{formatAttendanceTime(record.attendance_time)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </PageWrap>
  );
}
