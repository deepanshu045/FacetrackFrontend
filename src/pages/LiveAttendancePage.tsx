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
import { fetchDesktopStatus, fetchLectures, fetchTodayAttendance, markAttendanceForStudent, setCollegeAccessCode } from "../services/api";
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
  return parsed.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
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
      setLastRefreshAt(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
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

  const activeLecture = useMemo(
    () => lectures.find((lecture) => isLectureActive(lecture, now)) ?? null,
    [lectures, now]
  );

  const studentsWithFaces = useMemo(() => students.filter((student) => student.has_face), [students]);
  const filteredStudents = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return students.slice(0, 20);
    return students.filter((student) => student.name.toLowerCase().includes(query) || student.roll_no.toLowerCase().includes(query));
  }, [searchTerm, students]);

  useEffect(() => {
    if (!filteredStudents.length) {
      setSelectedStudentId(null);
      return;
    }
    if (!filteredStudents.some((student) => student.id === selectedStudentId)) setSelectedStudentId(filteredStudents[0].id);
  }, [filteredStudents, selectedStudentId]);

  const selectedStudent = students.find((student) => student.id === selectedStudentId);
  const presentStudentIds = useMemo(() => new Set(attendanceList.map((record) => record.student_id)), [attendanceList]);

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
    if (!activeLecture) return toast.error("There is no active lecture right now.");
    setMarking(true);
    try {
      const response = (await markAttendanceForStudent(selectedStudentId)) as { attendance_marked?: boolean; name?: string; message?: string };
      if (response.attendance_marked) toast.success(`Attendance marked for ${response.name || selectedStudent?.name || "student"}`);
      else toast.info(response.message || "Attendance already marked.");
      await refreshData(true);
    } catch (error: any) {
      toast.error(error?.message || "Unable to mark attendance.");
    } finally {
      setMarking(false);
    }
  }

  return (
    <PageWrap>
      <div className="mb-6 overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-blue-500/[0.13] via-white/[0.035] to-violet-500/[0.08] p-5 shadow-2xl shadow-black/10 sm:p-7">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-4">
            <div className="relative rounded-2xl border border-blue-400/20 bg-blue-500/10 p-3 text-blue-300 shadow-lg shadow-blue-500/10">
              <ScanFace size={28} />
              {desktopOnline && <span className="absolute -right-1 -top-1 h-3 w-3 animate-pulse rounded-full bg-emerald-400 ring-4 ring-[#101827]" />}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">Live Attendance</h1>
                <span className={`rounded-full border px-2.5 py-1 text-[11px] font-medium ${desktopOnline ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-300" : "border-amber-400/20 bg-amber-400/10 text-amber-300"}`}>
                  {desktopOnline ? "● Live recognition" : "● Waiting for desktop"}
                </span>
              </div>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-[#94A3B8]">Real-time attendance monitoring powered by FaceTrack Desktop. Recognition events sync automatically every few seconds.</p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-start lg:self-auto">
            <div className="hidden rounded-xl border border-white/10 bg-black/10 px-3 py-2 text-xs text-[#CBD5E1] sm:block">
              <Clock3 className="mr-2 inline text-blue-300" size={14} />{now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
            </div>
            <Button variant="secondary" onClick={() => void refreshData()} disabled={refreshing}>
              {refreshing ? <Loader2 size={15} className="animate-spin" /> : <RefreshCw size={15} />}
              {refreshing ? "Syncing…" : "Sync now"}
            </Button>
          </div>
        </div>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <GlassCard className="group p-4 transition-transform duration-200 hover:-translate-y-0.5">
          <div className="flex items-center justify-between"><div className={`rounded-xl p-2.5 ${backendOnline ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"}`}>{backendOnline ? <Wifi size={18} /> : <WifiOff size={18} />}</div><span className="text-[10px] uppercase tracking-wider text-[#475569]">API</span></div>
          <p className="mt-4 text-xs text-[#64748B]">Backend connection</p><p className="mt-1 text-lg font-semibold text-white">{backendOnline ? "Connected" : "Offline"}</p>
        </GlassCard>
        <GlassCard className="group p-4 transition-transform duration-200 hover:-translate-y-0.5">
          <div className="flex items-center justify-between"><div className={`rounded-xl p-2.5 ${desktopOnline ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-400"}`}>{desktopOnline ? <Laptop size={18} /> : <WifiOff size={18} />}</div><span className="text-[10px] uppercase tracking-wider text-[#475569]">5s sync</span></div>
          <p className="mt-4 text-xs text-[#64748B]">Desktop recognition</p><p className="mt-1 text-lg font-semibold text-white">{desktopOnline ? "Online" : "Offline"}</p><p className="mt-1 text-[11px] text-[#64748B]">Last seen {formatLastSeen(desktopLastSeen)}</p>
        </GlassCard>
        <GlassCard className="group p-4 transition-transform duration-200 hover:-translate-y-0.5">
          <div className="flex items-center justify-between"><div className="rounded-xl bg-emerald-500/10 p-2.5 text-emerald-400"><UserRoundCheck size={18} /></div><span className="text-[10px] uppercase tracking-wider text-[#475569]">Today</span></div>
          <p className="mt-4 text-xs text-[#64748B]">Students present</p><p className="mt-1 text-lg font-semibold text-white">{presentStudentIds.size}</p>
        </GlassCard>
        <GlassCard className="group p-4 transition-transform duration-200 hover:-translate-y-0.5">
          <div className="flex items-center justify-between"><div className="rounded-xl bg-violet-500/10 p-2.5 text-violet-400"><Users size={18} /></div><span className="text-[10px] uppercase tracking-wider text-[#475569]">Ready</span></div>
          <p className="mt-4 text-xs text-[#64748B]">Face profiles</p><p className="mt-1 text-lg font-semibold text-white">{studentsWithFaces.length}</p>
        </GlassCard>
      </div>

      <div className="mb-6 grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <GlassCard className="p-5 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3"><div className="rounded-xl bg-blue-500/10 p-3 text-blue-300"><KeyRound size={21} /></div><div><h2 className="font-semibold text-white">Desktop camera access</h2><p className="mt-1 text-sm leading-5 text-[#94A3B8]">Pair the recognition app securely without exposing the browser camera.</p></div></div>
            <span className="hidden rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[10px] uppercase tracking-wider text-[#64748B] sm:block">Secure pairing</span>
          </div>
          <div className="mt-5 rounded-2xl border border-white/10 bg-[#0B1220] p-4 sm:p-5">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#64748B]">Access code</p>
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
              <Input value={accessCode} onChange={(event) => setAccessCode(event.target.value.toUpperCase())} placeholder="XXXX-XXXX-XXXX" aria-label="Desktop camera access code" />
              <div className="flex flex-wrap gap-2 lg:shrink-0">
                <Button variant="secondary" onClick={() => { setAccessCode(generateAccessCode()); setCopied(false); }}><KeyRound size={15} />Generate</Button>
                <Button variant="secondary" onClick={() => void copyAccessCode()} disabled={!accessCode}>{copied ? <Check size={15} /> : <Copy size={15} />}{copied ? "Copied" : "Copy"}</Button>
                <Button variant="primary" onClick={() => void saveAccessCode()} disabled={savingCode}>{savingCode ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}{savingCode ? "Saving…" : "Save"}</Button>
              </div>
            </div>
          </div>
          <p className="mt-3 flex items-start gap-2 text-xs leading-5 text-[#64748B]"><ShieldCheck className="mt-0.5 shrink-0" size={14} />Keep this code private. Enter it once in FaceTrack Desktop to connect recognition to this college.</p>
        </GlassCard>

        <GlassCard className="p-5 sm:p-6">
          <div className="mb-4 flex items-start gap-3"><div className="rounded-xl bg-blue-500/10 p-2.5 text-blue-400"><ShieldCheck size={20} /></div><div><h3 className="font-semibold text-white">Session status</h3><p className="mt-1 text-sm text-[#94A3B8]">Live connection and current lecture.</p></div></div>
          <div className={`rounded-2xl border p-4 ${desktopOnline ? "border-emerald-500/20 bg-emerald-500/[0.07]" : "border-amber-500/20 bg-amber-500/[0.07]"}`}>
            <div className="flex items-center gap-2"><span className={`h-2.5 w-2.5 rounded-full ${desktopOnline ? "animate-pulse bg-emerald-400" : "bg-amber-400"}`} /><p className={`text-sm font-semibold ${desktopOnline ? "text-emerald-300" : "text-amber-300"}`}>{desktopOnline ? "Desktop app is online" : "Desktop app is offline"}</p></div>
            <p className="mt-2 text-xs leading-5 text-[#CBD5E1]">{desktopOnline ? "Recognition heartbeats are reaching the backend." : "Start FaceTrack Desktop and use the saved camera access code."}</p>
            <p className="mt-2 text-[11px] text-[#64748B]">Last heartbeat: {formatLastSeen(desktopLastSeen)}</p>
          </div>
          {activeLecture ? (
            <div className="mt-4 rounded-2xl border border-blue-400/15 bg-blue-500/[0.06] p-4">
              <div className="mb-2 flex items-center justify-between gap-3"><p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-blue-300">Live lecture</p><span className="rounded-full bg-blue-400/10 px-2 py-1 text-[10px] font-medium text-blue-300">ACTIVE</span></div>
              <p className="text-lg font-semibold text-white">{activeLecture.subject}</p><p className="mt-1 text-xs text-[#94A3B8]">{activeLecture.department} · {activeLecture.class_name} · Section {activeLecture.section}</p><p className="mt-3 text-xs font-medium text-[#CBD5E1]">{formatTime(activeLecture.start_time)} – {formatTime(activeLecture.end_time)}</p>
            </div>
          ) : (
            <div className="mt-4 flex gap-3 rounded-2xl border border-amber-500/20 bg-amber-500/[0.06] p-4"><CircleAlert className="mt-0.5 shrink-0 text-amber-300" size={18} /><div><p className="text-sm font-medium text-amber-200">No active lecture</p><p className="mt-1 text-xs leading-5 text-amber-100/60">Attendance will be accepted when a scheduled lecture is active.</p></div></div>
          )}
        </GlassCard>
      </div>

      <div className="mb-6 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <GlassCard className="overflow-hidden p-0">
          <div className="flex items-center justify-between gap-4 border-b border-white/10 p-5 sm:p-6"><div><div className="flex items-center gap-2"><span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" /><h3 className="text-base font-semibold text-white">Recent recognition</h3></div><p className="mt-1 text-sm text-[#94A3B8]">Latest attendance events from the desktop app.</p></div><span className="rounded-full border border-emerald-400/15 bg-emerald-400/10 px-3 py-1.5 text-xs font-medium text-emerald-300">{presentStudentIds.size} present</span></div>
          <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b border-white/10 bg-white/[0.015] text-left text-[10px] uppercase tracking-[0.16em] text-[#64748B]"><th className="px-5 py-3.5 font-medium">Student</th><th className="px-5 py-3.5 font-medium">Roll number</th><th className="px-5 py-3.5 text-right font-medium">Time</th></tr></thead><tbody className="divide-y divide-white/5">{attendanceList.length === 0 ? <tr><td colSpan={3} className="py-14 text-center"><div className="mx-auto mb-3 w-fit rounded-full bg-white/5 p-3 text-[#64748B]"><ScanFace size={20} /></div><p className="text-sm text-[#94A3B8]">Waiting for recognition events…</p><p className="mt-1 text-xs text-[#64748B]">Recognized students will appear here automatically.</p></td></tr> : attendanceList.slice(0, 12).map((record, index) => <tr key={`${record.student_id}-${record.attendance_date}-${record.attendance_time}`} className={`transition-colors hover:bg-white/[0.035] ${index === 0 ? "bg-emerald-400/[0.025]" : ""}`}><td className="px-5 py-3.5"><div className="flex items-center gap-3"><Avatar name={record.name} size="sm" /><div><p className="font-medium text-white">{record.name}</p>{index === 0 && <span className="text-[10px] font-medium text-emerald-400">Latest recognition</span>}</div></div></td><td className="px-5 py-3.5 text-[#94A3B8]">{record.roll_no}</td><td className="px-5 py-3.5 text-right font-medium text-[#CBD5E1]">{formatAttendanceTime(record.attendance_time)}</td></tr>)}</tbody></table></div>
        </GlassCard>

        <GlassCard className="p-5 sm:p-6">
          <div className="mb-5 flex items-start gap-3"><div className="rounded-xl bg-violet-500/10 p-2.5 text-violet-300"><UserRoundCheck size={20} /></div><div><h3 className="text-base font-semibold text-white">Manual fallback</h3><p className="mt-1 text-sm leading-5 text-[#94A3B8]">Use only when recognition cannot identify a student.</p></div></div>
          <div className="space-y-4">
            <Input label="Search student" placeholder="Name or roll number" value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} disabled={studentsLoading || students.length === 0} />
            <Select label="Student" value={selectedStudentId ?? ""} onChange={(event) => setSelectedStudentId(Number(event.target.value) || null)} disabled={studentsLoading || filteredStudents.length === 0}>{filteredStudents.length === 0 ? <option value="">No matching student</option> : filteredStudents.map((student) => <option key={student.id} value={student.id}>{student.name} · {student.roll_no}</option>)}</Select>
            {selectedStudent && <div className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-[#0B1220] p-4"><div className="flex min-w-0 items-center gap-3"><Avatar name={selectedStudent.name} size="md" /><div className="min-w-0"><p className="truncate text-sm font-semibold text-white">{selectedStudent.name}</p><p className="truncate text-xs text-[#94A3B8]">{selectedStudent.roll_no} · {selectedStudent.department}</p></div></div>{presentStudentIds.has(selectedStudent.id) && <span className="shrink-0 rounded-full bg-emerald-400/10 px-2 py-1 text-[10px] font-medium text-emerald-300">Present</span>}</div>}
            <Button variant="primary" className="w-full py-2.5" onClick={handleManualAttendance} disabled={marking || !selectedStudentId || !activeLecture}>{marking ? <><Loader2 size={15} className="animate-spin" />Marking…</> : <><UserRoundCheck size={15} />Mark attendance manually</>}</Button>
            {!activeLecture && <p className="text-center text-[11px] text-amber-300/70">Manual attendance is disabled until a lecture is active.</p>}
          </div>
        </GlassCard>
      </div>

      <GlassCard className="p-4 sm:p-5"><div className="flex flex-col gap-2 text-xs text-[#64748B] sm:flex-row sm:items-center sm:justify-between"><span>Last backend sync: <strong className="font-medium text-[#94A3B8]">{lastRefreshAt || "—"}</strong></span><span>Latest recognized: <strong className="font-medium text-white">{lastRecognized?.name || "Waiting…"}</strong>{lastRecognized ? ` · ${formatAttendanceTime(lastRecognized.attendance_time)}` : ""}</span></div></GlassCard>
    </PageWrap>
  );
}
