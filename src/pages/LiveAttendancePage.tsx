import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Camera, CameraOff, CheckCircle2, CircleAlert, Clock3, Loader2, RefreshCw, ScanFace, ShieldCheck, UserRoundCheck, Users } from "lucide-react";
import { toast } from "sonner";

import PageWrap from "../components/layout/PageWrap";
import GlassCard from "../components/ui/GlassCard";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Select from "../components/ui/Select";
import Avatar from "../components/ui/Avatar";
import useStudents from "../hooks/useStudents";
import useCamera from "../hooks/useCamera";
import { fetchLectures, fetchTodayAttendance, markAttendanceForStudent, markAttendanceFromImage } from "../services/api";
import type { AttendanceReport, Lecture } from "../types";

interface RecognitionResult {
  matched: boolean;
  attendance_marked: boolean;
  message: string;
  student_id?: number;
  roll_no?: string;
  name?: string;
  department?: string;
  date?: string;
  time?: string;
}

function toMinutes(value: string) {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

function isLectureActive(lecture: Lecture, now: Date) {
  if (lecture.status !== "Scheduled") return false;
  if (lecture.lecture_date !== now.toISOString().slice(0, 10)) return false;
  const current = now.getHours() * 60 + now.getMinutes();
  return current >= toMinutes(lecture.start_time) && current <= toMinutes(lecture.end_time);
}

function formatTime(value: string) {
  return value.slice(0, 5);
}

export default function LiveAttendancePage() {
  const { students, loading: studentsLoading } = useStudents();
  const { videoRef, startCamera, stopCamera } = useCamera();
  const [cameraOn, setCameraOn] = useState(false);
  const [recognizing, setRecognizing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [attendanceList, setAttendanceList] = useState<AttendanceReport[]>([]);
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);
  const [marking, setMarking] = useState(false);
  const [result, setResult] = useState<RecognitionResult | null>(null);
  const [lastScanAt, setLastScanAt] = useState<string | null>(null);
  const [now, setNow] = useState(() => new Date());
  const scanBusyRef = useRef(false);
  const scanTimerRef = useRef<number | null>(null);
  const cooldownRef = useRef(new Map<number, number>());

  const studentsWithFaces = useMemo(() => students.filter((student) => student.has_face), [students]);

  const filteredStudents = useMemo(() => {
    const normalized = searchTerm.trim().toLowerCase();
    const source = normalized ? students : students.slice(0, 20);
    if (!normalized) return source;
    return source.filter((student) =>
      student.name.toLowerCase().includes(normalized) ||
      student.roll_no.toLowerCase().includes(normalized)
    );
  }, [searchTerm, students]);

  const activeLecture = useMemo(
    () => lectures.find((lecture) => isLectureActive(lecture, now)) ?? null,
    [lectures, now]
  );

  useEffect(() => {
    if (filteredStudents.length > 0 && !filteredStudents.some((student) => student.id === selectedStudentId)) {
      setSelectedStudentId(filteredStudents[0].id);
    }
    if (filteredStudents.length === 0) setSelectedStudentId(null);
  }, [filteredStudents, selectedStudentId]);

  const refreshData = useCallback(async () => {
    try {
      const [today, lectureData] = await Promise.all([fetchTodayAttendance(), fetchLectures()]);
      if (Array.isArray(today)) setAttendanceList(today);
      if (Array.isArray(lectureData)) setLectures(lectureData);
    } catch {
      toast.error("Unable to refresh live attendance data.");
    }
  }, []);

  useEffect(() => {
    void refreshData();
    const timer = window.setInterval(() => {
      setNow(new Date());
      void refreshData();
    }, 30000);
    return () => window.clearInterval(timer);
  }, [refreshData]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!cameraOn) {
      stopCamera();
      return;
    }

    let active = true;
    (async () => {
      try {
        await startCamera();
      } catch (err: any) {
        if (!active) return;
        toast.error(err?.message || "Unable to access camera. Check browser camera permission.");
        setCameraOn(false);
      }
    })();

    return () => {
      active = false;
      stopCamera();
    };
  }, [cameraOn, startCamera, stopCamera]);

  const scanFrame = useCallback(async () => {
    if (scanBusyRef.current || !cameraOn || !videoRef.current || !activeLecture || studentsWithFaces.length === 0) return;
    const video = videoRef.current;
    if (video.readyState < 2 || !video.videoWidth) return;

    scanBusyRef.current = true;
    setRecognizing(true);
    try {
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext("2d");
      if (!context) return;
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.82));
      if (!blob) return;

      const response = (await markAttendanceFromImage(blob)) as RecognitionResult;
      setResult(response);
      setLastScanAt(new Date().toLocaleTimeString());

      if (response.student_id) {
        const lastSeen = cooldownRef.current.get(response.student_id) ?? 0;
        const withinCooldown = Date.now() - lastSeen < 10000;
        cooldownRef.current.set(response.student_id, Date.now());
        if (withinCooldown) return;
      }

      if (response.attendance_marked && response.name) {
        toast.success(`Attendance marked for ${response.name}`);
        await refreshData();
      }
    } catch (err: any) {
      setResult({ matched: false, attendance_marked: false, message: err?.message || "Face recognition failed." });
    } finally {
      scanBusyRef.current = false;
      setRecognizing(false);
    }
  }, [activeLecture, cameraOn, refreshData, studentsWithFaces.length, videoRef]);

  useEffect(() => {
    if (!cameraOn || !activeLecture) {
      if (scanTimerRef.current !== null) window.clearInterval(scanTimerRef.current);
      scanTimerRef.current = null;
      return;
    }

    void scanFrame();
    scanTimerRef.current = window.setInterval(() => void scanFrame(), 3000);
    return () => {
      if (scanTimerRef.current !== null) window.clearInterval(scanTimerRef.current);
      scanTimerRef.current = null;
    };
  }, [activeLecture, cameraOn, scanFrame]);

  const selectedStudent = students.find((student) => student.id === selectedStudentId);

  async function handleManualAttendance() {
    if (!selectedStudentId) {
      toast.error("Please select a student first.");
      return;
    }

    setMarking(true);
    try {
      const response = (await markAttendanceForStudent(selectedStudentId)) as RecognitionResult;
      setResult(response);
      if (response.attendance_marked) toast.success(`Attendance marked for ${response.name}`);
      else toast.info(response.message || "Attendance already marked.");
      await refreshData();
    } catch (err: any) {
      toast.error(err?.message || "Unable to mark attendance.");
      setResult({ matched: false, attendance_marked: false, message: err?.message || "Unable to mark attendance." });
    } finally {
      setMarking(false);
    }
  }

  const statusText = !activeLecture
    ? "No active lecture"
    : recognizing
      ? "Checking face"
      : cameraOn
        ? "Recognition active"
        : "Camera ready";

  return (
    <PageWrap>
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <ScanFace className="text-blue-400" size={22} />
            <h1 className="text-2xl font-semibold text-white">Live Attendance</h1>
          </div>
          <p className="mt-1 text-sm text-[#94A3B8]">Face recognition marks the student only when a matching lecture is active.</p>
        </div>
        <div className={`flex items-center gap-2 rounded-full border px-3 py-2 text-xs ${activeLecture ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-300" : "border-amber-500/20 bg-amber-500/10 text-amber-300"}`}>
          <Clock3 size={14} />
          {now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          <span className="text-white/30">•</span>
          {activeLecture ? `${activeLecture.subject} · ${formatTime(activeLecture.start_time)}–${formatTime(activeLecture.end_time)}` : "Waiting for an active lecture"}
        </div>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <GlassCard className="p-4">
          <div className="flex items-center gap-3"><div className="rounded-xl bg-blue-500/10 p-2 text-blue-400"><ShieldCheck size={18} /></div><div><p className="text-xs text-[#64748B]">Scanner status</p><p className="mt-1 text-sm font-medium text-white">{statusText}</p></div></div>
        </GlassCard>
        <GlassCard className="p-4">
          <div className="flex items-center gap-3"><div className="rounded-xl bg-emerald-500/10 p-2 text-emerald-400"><UserRoundCheck size={18} /></div><div><p className="text-xs text-[#64748B]">Today present</p><p className="mt-1 text-sm font-medium text-white">{attendanceList.length} students</p></div></div>
        </GlassCard>
        <GlassCard className="p-4">
          <div className="flex items-center gap-3"><div className="rounded-xl bg-violet-500/10 p-2 text-violet-400"><Users size={18} /></div><div><p className="text-xs text-[#64748B]">Face profiles ready</p><p className="mt-1 text-sm font-medium text-white">{studentsWithFaces.length} students</p></div></div>
        </GlassCard>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.35fr_0.9fr]">
        <GlassCard className="p-6">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-base font-semibold text-white">Camera Scanner</h3>
              <p className="mt-1 text-sm text-[#94A3B8]">Keep exactly one registered face inside the guide.</p>
            </div>
            <Button variant={cameraOn ? "secondary" : "primary"} onClick={() => setCameraOn((value) => !value)} disabled={!activeLecture || studentsWithFaces.length === 0}>
              {cameraOn ? <CameraOff size={16} /> : <Camera size={16} />}
              {cameraOn ? "Stop Camera" : "Start Camera"}
            </Button>
          </div>

          <div className="relative aspect-video overflow-hidden rounded-2xl border border-white/10 bg-black">
            {cameraOn ? (
              <video ref={videoRef} playsInline muted autoPlay className="h-full w-full object-cover" style={{ transform: "scaleX(-1)" }} />
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center text-[#64748B]">
                <Camera size={52} strokeWidth={1.2} />
                <p className="text-sm font-medium text-[#CBD5E1]">{!activeLecture ? "Start is disabled until a lecture is active" : studentsWithFaces.length === 0 ? "No student face profiles are ready" : "Start the camera to begin recognition"}</p>
                <p className="max-w-md text-xs">{!activeLecture ? "The backend accepts attendance only during the scheduled lecture time." : "Recognition uses the face profiles already uploaded for students."}</p>
              </div>
            )}
            <div className="pointer-events-none absolute inset-0">
              <div className={`absolute left-1/2 top-1/2 h-52 w-40 -translate-x-1/2 -translate-y-1/2 rounded-[45%] border-2 ${recognizing ? "border-blue-300 shadow-[0_0_30px_rgba(96,165,250,0.35)]" : "border-blue-400/70"}`} />
              <div className="absolute left-4 top-4 rounded-full border border-white/10 bg-black/60 px-3 py-1.5 text-xs text-white backdrop-blur">{statusText}</div>
              {recognizing && <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-full border border-blue-400/20 bg-black/70 px-4 py-2 text-xs text-blue-200 backdrop-blur"><Loader2 size={14} className="animate-spin" /> Analyzing frame…</div>}
            </div>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-[#0F172A] p-3"><p className="text-xs text-[#64748B]">Last scan</p><p className="mt-1 text-sm text-white">{lastScanAt ?? "—"}</p></div>
            <div className="rounded-2xl border border-white/10 bg-[#0F172A] p-3"><p className="text-xs text-[#64748B]">Recognition interval</p><p className="mt-1 text-sm text-white">Every 3 seconds</p></div>
          </div>

          {result && (
            <div className={`mt-4 rounded-2xl border p-4 ${result.attendance_marked ? "border-emerald-500/20 bg-emerald-500/10" : result.matched ? "border-amber-500/20 bg-amber-500/10" : "border-white/10 bg-white/[0.03]"}`}>
              <div className="flex items-start gap-3">
                {result.attendance_marked ? <CheckCircle2 className="mt-0.5 shrink-0 text-emerald-400" size={19} /> : result.matched ? <CircleAlert className="mt-0.5 shrink-0 text-amber-400" size={19} /> : <ScanFace className="mt-0.5 shrink-0 text-[#94A3B8]" size={19} />}
                <div className="min-w-0"><p className="text-sm font-medium text-white">{result.name || "Recognition status"}</p><p className="mt-1 text-sm text-[#CBD5E1]">{result.message}</p>{result.date && result.time && <p className="mt-2 text-xs text-[#94A3B8]">{result.date} · {result.time}</p>}</div>
              </div>
            </div>
          )}
        </GlassCard>

        <GlassCard className="p-6">
          <div className="mb-5 flex items-center justify-between">
            <div><h3 className="text-base font-semibold text-white">Manual Fallback</h3><p className="mt-1 text-sm text-[#94A3B8]">Use only when face recognition is unavailable.</p></div>
            <Button variant="secondary" onClick={() => void refreshData()}><RefreshCw size={15} /> Refresh</Button>
          </div>

          {!activeLecture && <div className="mb-4 flex gap-3 rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-200"><CircleAlert className="mt-0.5 shrink-0" size={18} /><p>There is no active lecture right now. Manual attendance will also be rejected by the backend until a lecture is active.</p></div>}

          <div className="space-y-4">
            <Input label="Search student" placeholder="Name or roll number" value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} disabled={studentsLoading || students.length === 0} />
            <Select label="Student" value={selectedStudentId ?? ""} onChange={(event) => setSelectedStudentId(Number(event.target.value) || null)} disabled={studentsLoading || filteredStudents.length === 0}>
              {filteredStudents.length === 0 ? <option value="">No matching student</option> : filteredStudents.map((student) => <option key={student.id} value={student.id}>{student.name} · {student.roll_no}</option>)}
            </Select>

            {selectedStudent && <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-[#0F172A] p-4"><Avatar name={selectedStudent.name} size="md" /><div className="min-w-0"><p className="truncate text-sm font-semibold text-white">{selectedStudent.name}</p><p className="truncate text-xs text-[#94A3B8]">{selectedStudent.roll_no} · {selectedStudent.department}</p><p className={`mt-1 text-xs ${selectedStudent.has_face ? "text-emerald-400" : "text-amber-400"}`}>{selectedStudent.has_face ? "Face profile ready" : "No face profile"}</p></div></div>}

            <Button variant="primary" className="w-full" onClick={handleManualAttendance} disabled={marking || !selectedStudentId || !activeLecture}>
              {marking ? <><Loader2 size={15} className="animate-spin" /> Marking…</> : <><UserRoundCheck size={15} /> Mark Attendance Manually</>}
            </Button>
          </div>
        </GlassCard>
      </div>

      <GlassCard className="mt-6 p-6">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div><h3 className="text-base font-semibold text-white">Today’s Attendance</h3><p className="text-sm text-[#94A3B8]">Attendance returned by the backend for today.</p></div>
          <span className="rounded-full bg-white/5 px-3 py-1 text-xs text-[#CBD5E1]">{attendanceList.length} present</span>
        </div>
        <div className="overflow-x-auto rounded-2xl border border-white/10 bg-[#0F172A]">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-white/10 text-left text-xs uppercase tracking-wider text-[#64748B]"><th className="px-4 py-3">Name</th><th className="px-4 py-3">Roll</th><th className="px-4 py-3">Department</th><th className="px-4 py-3">Time</th></tr></thead>
            <tbody className="divide-y divide-white/5">
              {attendanceList.length === 0 ? <tr><td colSpan={4} className="py-12 text-center text-[#64748B]">No attendance marked yet.</td></tr> : attendanceList.map((record) => <tr key={`${record.student_id}-${record.attendance_time}-${record.attendance_date}`} className="hover:bg-white/5"><td className="px-4 py-3 text-white">{record.name}</td><td className="px-4 py-3 text-[#94A3B8]">{record.roll_no}</td><td className="px-4 py-3 text-[#94A3B8]">{record.department}</td><td className="px-4 py-3 text-[#94A3B8]">{record.attendance_time}</td></tr>)}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </PageWrap>
  );
}
