import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Camera,
  CameraOff,
  CheckCircle2,
  CircleAlert,
  Clock3,
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
import { fetchDesktopStatus, fetchLectures, fetchTodayAttendance, markAttendanceForStudent } from "../services/api";
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

  const [cameraAccessCode, setCameraAccessCode] = useState("");
  const [cameraVerified, setCameraVerified] = useState(false);
  const [cameraLoading, setCameraLoading] = useState(false);
  const [cameraRunning, setCameraRunning] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

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

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
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

  async function verifyCameraCode() {
    if (!cameraAccessCode.trim()) {
      toast.error("Enter the camera access code first.");
      return;
    }
    setCameraLoading(true);
    setCameraError("");
    try {
      const base = ((import.meta as any).env.VITE_API_URL || "http://127.0.0.1:8000").replace(/\/$/, "");
      const response = await fetch(`${base}/public/college/access-code/${encodeURIComponent(cameraAccessCode.trim())}/verify`);
      const data = await response.json();
      if (!response.ok) throw new Error(data?.detail || "Invalid camera access code.");
      setCameraVerified(true);
      toast.success(`${data.college_name} camera access verified.`);
    } catch (error: any) {
      setCameraVerified(false);
      setCameraError(error?.message || "Unable to verify camera access code.");
      toast.error(error?.message || "Invalid camera access code.");
    } finally {
      setCameraLoading(false);
    }
  }

  async function startCameraPreview() {
    if (!cameraVerified) {
      toast.error("Verify the camera access code first.");
      return;
    }
    setCameraError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: false });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setCameraRunning(true);
    } catch (error: any) {
      setCameraRunning(false);
      setCameraError(error?.message || "Camera permission was denied or the camera is unavailable.");
    }
  }

  function stopCameraPreview() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraRunning(false);
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
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="flex items-center gap-2"><ScanFace className="text-blue-400" size={22} /><h1 className="text-2xl font-semibold text-white">Live Attendance</h1></div>
          <p className="mt-1 text-sm text-[#94A3B8]">Desktop recognition is the attendance engine. The browser camera below is only a live preview.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-[#CBD5E1]"><Clock3 className="mr-2 inline" size={14} />{now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</div>
          <Button variant="secondary" onClick={() => void refreshData()} disabled={refreshing}>{refreshing ? <Loader2 size={15} className="animate-spin" /> : <RefreshCw size={15} />}{refreshing ? "Syncing…" : "Sync"}</Button>
        </div>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <GlassCard className="p-4"><div className="flex items-center gap-3"><div className={`rounded-xl p-2 ${backendOnline ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"}`}>{backendOnline ? <Wifi size={18} /> : <WifiOff size={18} />}</div><div><p className="text-xs text-[#64748B]">Backend</p><p className="mt-1 text-sm font-medium text-white">{backendOnline ? "Connected" : "Offline"}</p></div></div></GlassCard>
        <GlassCard className="p-4"><div className="flex items-center gap-3"><div className={`rounded-xl p-2 ${desktopOnline ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-400"}`}>{desktopOnline ? <Laptop size={18} /> : <WifiOff size={18} />}</div><div><p className="text-xs text-[#64748B]">Desktop recognition</p><p className="mt-1 text-sm font-medium text-white">{desktopOnline ? "Online" : "Offline"}</p><p className="mt-1 text-[11px] text-[#64748B]">Last seen {formatLastSeen(desktopLastSeen)}</p></div></div></GlassCard>
        <GlassCard className="p-4"><div className="flex items-center gap-3"><div className="rounded-xl bg-emerald-500/10 p-2 text-emerald-400"><UserRoundCheck size={18} /></div><div><p className="text-xs text-[#64748B]">Present today</p><p className="mt-1 text-sm font-medium text-white">{presentStudentIds.size} students</p></div></div></GlassCard>
        <GlassCard className="p-4"><div className="flex items-center gap-3"><div className="rounded-xl bg-violet-500/10 p-2 text-violet-400"><Users size={18} /></div><div><p className="text-xs text-[#64748B]">Face profiles</p><p className="mt-1 text-sm font-medium text-white">{studentsWithFaces.length} ready</p></div></div></GlassCard>
      </div>

      <div className="mb-6 grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <GlassCard className="overflow-hidden p-0">
          <div className="border-b border-white/10 p-5"><div className="flex items-center justify-between gap-3"><div><h3 className="text-base font-semibold text-white">Camera Preview</h3><p className="mt-1 text-sm text-[#94A3B8]">Optional browser preview. Recognition continues in the desktop app.</p></div><span className={`rounded-full px-3 py-1.5 text-xs ${cameraRunning ? "bg-emerald-500/10 text-emerald-300" : "bg-white/5 text-[#94A3B8]"}`}>{cameraRunning ? "Camera active" : "Preview stopped"}</span></div></div>
          <div className="relative aspect-video bg-[#050A0F]">
            <video ref={videoRef} autoPlay muted playsInline className={`h-full w-full object-cover ${cameraRunning ? "" : "hidden"}`} />
            {!cameraRunning && <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-center text-[#64748B]"><CameraOff size={42} /><p className="text-sm">Camera preview is off</p></div>}
          </div>
          <div className="p-5">
            <div className="flex flex-col gap-3 sm:flex-row">
              <Input label="Camera access code" type="password" value={cameraAccessCode} onChange={(event) => { setCameraAccessCode(event.target.value); setCameraVerified(false); }} placeholder="Enter desktop camera code" />
              <div className="flex items-end gap-2"><Button variant="secondary" onClick={() => void verifyCameraCode()} disabled={cameraLoading}>{cameraLoading ? <Loader2 size={15} className="animate-spin" /> : <KeyRound size={15} />}{cameraLoading ? "Checking…" : "Verify"}</Button>{cameraRunning ? <Button variant="secondary" onClick={stopCameraPreview}><CameraOff size={15} />Stop</Button> : <Button variant="primary" onClick={() => void startCameraPreview()} disabled={!cameraVerified}><Camera size={15} />Preview</Button>}</div>
            </div>
            <div className="mt-3 flex items-center gap-2 text-xs"><span className={cameraVerified ? "text-emerald-400" : "text-[#64748B]"}>{cameraVerified ? <CheckCircle2 size={14} /> : <KeyRound size={14} />}</span><span className={cameraVerified ? "text-emerald-300" : "text-[#64748B]"}>{cameraVerified ? "Camera access code verified" : "Verify the code before requesting camera access"}</span></div>
            {cameraError && <p className="mt-2 text-xs text-red-400">{cameraError}</p>}
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          <div className="mb-5 flex items-start gap-3"><div className="rounded-xl bg-blue-500/10 p-2 text-blue-400"><ShieldCheck size={20} /></div><div><h3 className="font-semibold text-white">Recognition Status</h3><p className="mt-1 text-sm text-[#94A3B8]">Connection between the desktop app and backend.</p></div></div>
          <div className={`rounded-2xl border p-5 ${desktopOnline ? "border-emerald-500/20 bg-emerald-500/10" : "border-amber-500/20 bg-amber-500/10"}`}>
            <p className={`text-lg font-semibold ${desktopOnline ? "text-emerald-300" : "text-amber-300"}`}>{desktopOnline ? "Desktop app is online" : "Desktop app is offline"}</p>
            <p className="mt-2 text-sm text-[#CBD5E1]">{desktopOnline ? "Recognition heartbeats are reaching the backend." : "Start FaceTrack Desktop with the correct camera access code."}</p>
            <p className="mt-3 text-xs text-[#64748B]">Last heartbeat: {formatLastSeen(desktopLastSeen)}</p>
          </div>
          {activeLecture ? <div className="mt-5 rounded-2xl border border-white/10 bg-[#0F172A] p-4"><p className="text-xs uppercase tracking-wider text-[#64748B]">Current lecture</p><p className="mt-1 text-lg font-semibold text-white">{activeLecture.subject}</p><p className="mt-1 text-sm text-[#94A3B8]">{activeLecture.department} · {activeLecture.class_name} · Section {activeLecture.section}</p><p className="mt-2 text-xs text-[#64748B]">{formatTime(activeLecture.start_time)} – {formatTime(activeLecture.end_time)}</p></div> : <div className="mt-5 flex gap-3 rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4"><CircleAlert className="shrink-0 text-amber-300" size={18} /><p className="text-sm text-amber-100/80">No active lecture. Attendance will be accepted when a scheduled lecture is active.</p></div>}
        </GlassCard>
      </div>

      <div className="mb-6 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <GlassCard className="p-6"><div className="mb-5 flex items-center justify-between"><div><h3 className="text-base font-semibold text-white">Recent Recognition</h3><p className="mt-1 text-sm text-[#94A3B8]">Attendance events recorded by the desktop app.</p></div><span className="rounded-full bg-white/5 px-3 py-1 text-xs text-[#CBD5E1]">{presentStudentIds.size} present</span></div><div className="overflow-x-auto rounded-2xl border border-white/10 bg-[#0F172A]"><table className="w-full text-sm"><thead><tr className="border-b border-white/10 text-left text-xs uppercase tracking-wider text-[#64748B]"><th className="px-4 py-3">Student</th><th className="px-4 py-3">Roll</th><th className="px-4 py-3">Recognized</th></tr></thead><tbody className="divide-y divide-white/5">{attendanceList.length === 0 ? <tr><td colSpan={3} className="py-12 text-center text-[#64748B]">Waiting for recognition events…</td></tr> : attendanceList.slice(0, 12).map((record) => <tr key={`${record.student_id}-${record.attendance_date}-${record.attendance_time}`} className="hover:bg-white/5"><td className="px-4 py-3"><div className="flex items-center gap-3"><Avatar name={record.name} size="sm" /><span className="text-white">{record.name}</span></div></td><td className="px-4 py-3 text-[#94A3B8]">{record.roll_no}</td><td className="px-4 py-3 text-[#94A3B8]">{formatAttendanceTime(record.attendance_time)}</td></tr>)}</tbody></table></div></GlassCard>

        <GlassCard className="p-6"><div className="mb-5"><h3 className="text-base font-semibold text-white">Manual Fallback</h3><p className="mt-1 text-sm text-[#94A3B8]">Use only when desktop recognition cannot identify a student.</p></div><div className="space-y-4"><Input label="Search student" placeholder="Name or roll number" value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} disabled={studentsLoading || students.length === 0} /><Select label="Student" value={selectedStudentId ?? ""} onChange={(event) => setSelectedStudentId(Number(event.target.value) || null)} disabled={studentsLoading || filteredStudents.length === 0}>{filteredStudents.length === 0 ? <option value="">No matching student</option> : filteredStudents.map((student) => <option key={student.id} value={student.id}>{student.name} · {student.roll_no}</option>)}</Select>{selectedStudent && <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-[#0F172A] p-4"><Avatar name={selectedStudent.name} size="md" /><div className="min-w-0"><p className="truncate text-sm font-semibold text-white">{selectedStudent.name}</p><p className="truncate text-xs text-[#94A3B8]">{selectedStudent.roll_no} · {selectedStudent.department}</p></div></div>}<Button variant="primary" className="w-full" onClick={handleManualAttendance} disabled={marking || !selectedStudentId || !activeLecture}>{marking ? <><Loader2 size={15} className="animate-spin" />Marking…</> : <><UserRoundCheck size={15} />Mark Attendance Manually</>}</Button></div></GlassCard>
      </div>

      <GlassCard className="p-5"><div className="flex flex-col gap-2 text-sm text-[#94A3B8] sm:flex-row sm:items-center sm:justify-between"><span>Last backend sync: {lastRefreshAt || "—"}</span><span>Latest recognized: <strong className="text-white">{lastRecognized?.name || "Waiting…"}</strong>{lastRecognized ? ` · ${formatAttendanceTime(lastRecognized.attendance_time)}` : ""}</span></div></GlassCard>
    </PageWrap>
  );
}
