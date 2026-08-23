import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Check,
  CircleAlert,
  Clock3,
  Copy,
  KeyRound,
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
  fetchDesktopStatus,
  fetchLectures,
  fetchTodayAttendance,
  markAttendanceForStudent,
  setCollegeAccessCode,
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
  return value ? value.slice(0, 5) : "—";
}

function formatAttendanceTime(value?: string) {
  if (!value) return "—";
  const normalized = value.includes("T") ? value : `1970-01-01T${value}`;
  const parsed = new Date(normalized);
  if (Number.isNaN(parsed.getTime())) return value.slice(0, 5);
  return parsed.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatLastSeen(value?: string | null) {
  if (!value) return "Never";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "Unknown";
  return parsed.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function generateAccessCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = crypto.getRandomValues(new Uint8Array(12));
  const code = Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join("");
  return `${code.slice(0, 4)}-${code.slice(4, 8)}-${code.slice(8)}`;
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
  const [desktopOnline, setDesktopOnline] = useState(false);
  const [desktopLastSeen, setDesktopLastSeen] = useState<string | null>(null);
  const [lastRefreshAt, setLastRefreshAt] = useState<string | null>(null);
  const [now, setNow] = useState(() => new Date());
  const [lastRecognized, setLastRecognized] = useState<AttendanceReport | null>(null);
  const [accessCode, setAccessCode] = useState("");
  const [savingCode, setSavingCode] = useState(false);
  const [copied, setCopied] = useState(false);

  const refreshData = useCallback(async (silent = false) => {
    if (!silent) setRefreshing(true);
    try {
      const [today, lectureData, desktop] = await Promise.all([
        fetchTodayAttendance(),
        fetchLectures(),
        fetchDesktopStatus(),
      ]);
      if (Array.isArray(today)) {
        setAttendanceList(today);
        if (today.length > 0) setLastRecognized(today[0]);
      }
      if (Array.isArray(lectureData)) setLectures(lectureData);
      setDesktopOnline(Boolean(desktop.online));
      setDesktopLastSeen(desktop.last_seen_at);
      setBackendOnline(true);
      setLastRefreshAt(new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }));
    } catch (error: any) {
      setBackendOnline(false);
      setDesktopOnline(false);
      if (!silent) toast.error(error?.message || "Unable to connect to attendance service.");
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void refreshData();
    const timer = window.setInterval(() => void refreshData(true), 5000);
    return () => window.clearInterval(timer);
  }, [refreshData]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const activeLectures = useMemo(
    () => lectures.filter((lecture) => isLectureActive(lecture, now)),
    [lectures, now],
  );
  const hasActiveLecture = activeLectures.length > 0;
  const studentsWithFaces = useMemo(() => students.filter((student) => student.has_face), [students]);
  const filteredStudents = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return students.slice(0, 20);
    return students.filter(
      (student) =>
        student.name.toLowerCase().includes(query) ||
        student.roll_no.toLowerCase().includes(query),
    );
  }, [searchTerm, students]);

  useEffect(() => {
    if (!filteredStudents.length) {
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
    [attendanceList],
  );

  async function saveAccessCode() {
    if (accessCode.replace(/-/g, "").length < 8) {
      toast.error("Generate an access code first.");
      return;
    }
    setSavingCode(true);
    try {
      await setCollegeAccessCode(accessCode);
      toast.success("Desktop camera access code saved.");
    } catch (error: any) {
      toast.error(error?.message || "Unable to save access code.");
    } finally {
      setSavingCode(false);
    }
  }

  async function copyAccessCode() {
    if (!accessCode) {
      toast.error("Generate an access code first.");
      return;
    }
    try {
      await navigator.clipboard.writeText(accessCode);
      setCopied(true);
      toast.success("Access code copied.");
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.error("Unable to copy the access code.");
    }
  }

  async function handleManualAttendance() {
    if (!selectedStudentId) return toast.error("Please select a student first.");
    if (!hasActiveLecture) return toast.error("There is no active lecture right now.");
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

  const currentTime = now.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  return (
    <PageWrap>
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-blue-500/[0.10] via-white/[0.03] to-violet-500/[0.08] p-5 shadow-2xl shadow-black/20 sm:p-7">
        <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-blue-500/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-28 left-1/3 h-56 w-56 rounded-full bg-violet-500/10 blur-3xl" />
        <div className="relative flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
          <div className="min-w-0">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-300">
                <span className={`h-1.5 w-1.5 rounded-full ${desktopOnline ? "animate-pulse bg-emerald-300" : "bg-amber-300"}`} />
                {desktopOnline ? "LIVE RECOGNITION" : "DESKTOP OFFLINE"}
              </span>
              {hasActiveLecture && (
                <span className="rounded-full border border-blue-400/20 bg-blue-400/10 px-3 py-1 text-xs font-medium text-blue-200">
                  {activeLectures.length} active {activeLectures.length === 1 ? "lecture" : "lectures"}
                </span>
              )}
            </div>
            <div className="flex items-start gap-4">
              <div className="hidden rounded-2xl border border-blue-400/20 bg-blue-400/10 p-3 text-blue-300 sm:block">
                <ScanFace size={28} />
              </div>
              <div>
                <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">Live Attendance</h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-[#94A3B8]">
                  Monitor face recognition, active lectures, and today&apos;s attendance from one place.
                </p>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-black/10 px-3 py-2 text-xs text-[#CBD5E1]">
              <Clock3 size={14} className="text-blue-300" />
              {currentTime}
            </div>
            <Button variant="secondary" onClick={() => void refreshData()} disabled={refreshing}>
              {refreshing ? <Loader2 size={15} className="animate-spin" /> : <RefreshCw size={15} />}
              {refreshing ? "Syncing…" : "Sync now"}
            </Button>
          </div>
        </div>
      </div>

      <div className="my-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <GlassCard className="relative overflow-hidden p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-[#64748B]">Backend</p>
              <p className="mt-1 text-lg font-semibold text-white">{backendOnline ? "Connected" : "Offline"}</p>
              <p className="mt-1 text-xs text-[#64748B]">Attendance API</p>
            </div>
            <div className={`rounded-2xl p-3 ${backendOnline ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"}`}>
              {backendOnline ? <Wifi size={20} /> : <WifiOff size={20} />}
            </div>
          </div>
        </GlassCard>
        <GlassCard className="relative overflow-hidden p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-[#64748B]">Desktop app</p>
              <p className="mt-1 text-lg font-semibold text-white">{desktopOnline ? "Online" : "Offline"}</p>
              <p className="mt-1 text-xs text-[#64748B]">Last seen {formatLastSeen(desktopLastSeen)}</p>
            </div>
            <div className={`rounded-2xl p-3 ${desktopOnline ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-400"}`}>
              {desktopOnline ? <Laptop size={20} /> : <WifiOff size={20} />}
            </div>
          </div>
        </GlassCard>
        <GlassCard className="relative overflow-hidden p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-[#64748B]">Present today</p>
              <p className="mt-1 text-lg font-semibold text-white">{presentStudentIds.size}</p>
              <p className="mt-1 text-xs text-[#64748B]">unique students</p>
            </div>
            <div className="rounded-2xl bg-emerald-500/10 p-3 text-emerald-400"><UserRoundCheck size={20} /></div>
          </div>
        </GlassCard>
        <GlassCard className="relative overflow-hidden p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-[#64748B]">Face profiles</p>
              <p className="mt-1 text-lg font-semibold text-white">{studentsWithFaces.length}</p>
              <p className="mt-1 text-xs text-[#64748B]">ready for recognition</p>
            </div>
            <div className="rounded-2xl bg-violet-500/10 p-3 text-violet-400"><Users size={20} /></div>
          </div>
        </GlassCard>
      </div>

      <div className="mb-6 grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <GlassCard className="overflow-hidden p-0">
          <div className="border-b border-white/10 bg-white/[0.02] p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="rounded-2xl bg-blue-500/10 p-3 text-blue-300"><KeyRound size={21} /></div>
                <div>
                  <h2 className="font-semibold text-white">Desktop camera access</h2>
                  <p className="mt-1 text-sm text-[#94A3B8]">Connect FaceTrack Desktop without exposing the browser camera.</p>
                </div>
              </div>
              <span className="hidden rounded-full border border-white/10 px-2.5 py-1 text-[11px] text-[#94A3B8] sm:block">Private code</span>
            </div>
          </div>
          <div className="p-6">
            <div className="rounded-2xl border border-white/10 bg-[#0F172A]/80 p-4">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#64748B]">Access code</p>
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                <Input
                  value={accessCode}
                  onChange={(event) => setAccessCode(event.target.value.toUpperCase())}
                  placeholder="XXXX-XXXX-XXXX"
                  aria-label="Desktop camera access code"
                />
                <div className="grid grid-cols-3 gap-2 lg:flex lg:shrink-0">
                  <Button variant="secondary" onClick={() => { setAccessCode(generateAccessCode()); setCopied(false); }}>
                    <KeyRound size={15} /> Generate
                  </Button>
                  <Button variant="secondary" onClick={() => void copyAccessCode()} disabled={!accessCode}>
                    {copied ? <Check size={15} /> : <Copy size={15} />}
                    {copied ? "Copied" : "Copy"}
                  </Button>
                  <Button variant="primary" onClick={() => void saveAccessCode()} disabled={savingCode}>
                    {savingCode ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
                    {savingCode ? "Saving…" : "Save"}
                  </Button>
                </div>
              </div>
            </div>
            <p className="mt-3 text-xs leading-5 text-[#64748B]">Keep this code private. Enter the saved code in FaceTrack Desktop when connecting the recognition application.</p>
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          <div className="flex items-start gap-3">
            <div className={`rounded-2xl p-3 ${desktopOnline ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-300"}`}>
              <ShieldCheck size={20} />
            </div>
            <div>
              <h2 className="font-semibold text-white">Recognition status</h2>
              <p className="mt-1 text-sm text-[#94A3B8]">Desktop heartbeat and current lecture context.</p>
            </div>
          </div>
          <div className={`mt-5 rounded-2xl border p-4 ${desktopOnline ? "border-emerald-500/20 bg-emerald-500/[0.07]" : "border-amber-500/20 bg-amber-500/[0.07]"}`}>
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className={`font-semibold ${desktopOnline ? "text-emerald-300" : "text-amber-300"}`}>{desktopOnline ? "Desktop app is online" : "Desktop app is offline"}</p>
                <p className="mt-1 text-xs text-[#94A3B8]">Last heartbeat {formatLastSeen(desktopLastSeen)}</p>
              </div>
              <span className={`h-2.5 w-2.5 rounded-full ${desktopOnline ? "animate-pulse bg-emerald-400" : "bg-amber-400"}`} />
            </div>
          </div>
          <div className="mt-5 flex items-center justify-between">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#64748B]">Active lectures</p>
            <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${hasActiveLecture ? "bg-emerald-500/10 text-emerald-300" : "bg-amber-500/10 text-amber-300"}`}>
              {activeLectures.length} active
            </span>
          </div>
          <div className="mt-3 space-y-2">
            {activeLectures.length > 0 ? activeLectures.map((lecture) => (
              <div key={lecture.id} className="rounded-2xl border border-white/10 bg-[#0F172A] p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-white">{lecture.subject}</p>
                    <p className="mt-1 truncate text-xs text-[#94A3B8]">{lecture.department} · {lecture.class_name} · Section {lecture.section}</p>
                  </div>
                  <span className="shrink-0 text-xs font-medium text-blue-300">{formatTime(lecture.start_time)}–{formatTime(lecture.end_time)}</span>
                </div>
              </div>
            )) : (
              <div className="flex gap-3 rounded-2xl border border-amber-500/20 bg-amber-500/[0.07] p-4">
                <CircleAlert className="mt-0.5 shrink-0 text-amber-300" size={17} />
                <p className="text-xs leading-5 text-amber-100/80">No active lecture. Attendance will be accepted when a scheduled lecture is active.</p>
              </div>
            )}
          </div>
        </GlassCard>
      </div>

      <div className="mb-6 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <GlassCard className="overflow-hidden p-0">
          <div className="flex items-center justify-between gap-4 border-b border-white/10 bg-white/[0.02] p-6">
            <div>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
                <h2 className="text-base font-semibold text-white">Recent recognition</h2>
              </div>
              <p className="mt-1 text-sm text-[#94A3B8]">Latest attendance events from the desktop app.</p>
            </div>
            <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs text-[#CBD5E1]">{presentStudentIds.size} present</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 text-left text-[11px] uppercase tracking-[0.15em] text-[#64748B]">
                  <th className="px-6 py-3.5">Student</th>
                  <th className="px-4 py-3.5">Roll</th>
                  <th className="px-6 py-3.5 text-right">Recognized</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {attendanceList.length === 0 ? (
                  <tr><td colSpan={3} className="py-16 text-center"><div className="mx-auto flex max-w-xs flex-col items-center"><div className="rounded-2xl bg-white/5 p-3 text-[#64748B]"><ScanFace size={22} /></div><p className="mt-3 text-sm text-[#94A3B8]">Waiting for recognition events…</p><p className="mt-1 text-xs text-[#64748B]">Recognized students will appear here automatically.</p></div></td></tr>
                ) : attendanceList.slice(0, 12).map((record, index) => (
                  <tr key={`${record.student_id}-${record.attendance_date}-${record.attendance_time}`} className={`group transition-colors hover:bg-white/[0.03] ${index === 0 ? "bg-emerald-500/[0.025]" : ""}`}>
                    <td className="px-6 py-3.5"><div className="flex items-center gap-3"><Avatar name={record.name} size="sm" /><div className="min-w-0"><p className="truncate font-medium text-white">{record.name}</p>{index === 0 && <span className="text-[10px] font-medium uppercase tracking-wider text-emerald-400">Latest</span>}</div></div></td>
                    <td className="px-4 py-3.5 text-[#94A3B8]">{record.roll_no}</td>
                    <td className="px-6 py-3.5 text-right"><span className="inline-flex items-center gap-1.5 text-[#CBD5E1]"><Check size={14} className="text-emerald-400" />{formatAttendanceTime(record.attendance_time)}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2"><UserRoundCheck size={18} className="text-blue-300" /><h2 className="text-base font-semibold text-white">Manual fallback</h2></div>
              <p className="mt-1 text-sm leading-5 text-[#94A3B8]">Use when desktop recognition cannot identify a student.</p>
            </div>
            <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${hasActiveLecture ? "bg-emerald-500/10 text-emerald-300" : "bg-amber-500/10 text-amber-300"}`}>{hasActiveLecture ? "Ready" : "Locked"}</span>
          </div>
          <div className="space-y-4">
            <Input label="Search student" placeholder="Name or roll number" value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} disabled={studentsLoading || students.length === 0} />
            <Select label="Student" value={selectedStudentId ?? ""} onChange={(event) => setSelectedStudentId(Number(event.target.value) || null)} disabled={studentsLoading || filteredStudents.length === 0}>
              {filteredStudents.length === 0 ? <option value="">No matching student</option> : filteredStudents.map((student) => <option key={student.id} value={student.id}>{student.name} · {student.roll_no}</option>)}
            </Select>
            {selectedStudent && (
              <div className="rounded-2xl border border-white/10 bg-[#0F172A] p-4">
                <div className="flex items-center gap-3"><Avatar name={selectedStudent.name} size="md" /><div className="min-w-0"><p className="truncate text-sm font-semibold text-white">{selectedStudent.name}</p><p className="truncate text-xs text-[#94A3B8]">{selectedStudent.roll_no} · {selectedStudent.department}</p></div></div>
              </div>
            )}
            <Button variant="primary" className="w-full justify-center py-3" onClick={handleManualAttendance} disabled={marking || !selectedStudentId || !hasActiveLecture}>
              {marking ? <><Loader2 size={15} className="animate-spin" /> Marking…</> : <><UserRoundCheck size={15} /> Mark attendance manually</>}
            </Button>
            {!hasActiveLecture && <p className="text-center text-xs text-amber-300/80">Manual attendance unlocks during an active lecture.</p>}
          </div>
        </GlassCard>
      </div>

      <GlassCard className="p-5">
        <div className="flex flex-col gap-3 text-xs text-[#64748B] sm:flex-row sm:items-center sm:justify-between">
          <span>Last backend sync: <strong className="font-medium text-[#94A3B8]">{lastRefreshAt || "—"}</strong></span>
          <span>Latest recognized: <strong className="font-medium text-white">{lastRecognized?.name || "Waiting…"}</strong>{lastRecognized ? ` · ${formatAttendanceTime(lastRecognized.attendance_time)}` : ""}</span>
        </div>
      </GlassCard>
    </PageWrap>
  );
}
