import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Camera, CameraOff, CheckCircle2, Loader2, RefreshCw, ScanFace } from "lucide-react";
import { toast } from "sonner";

import PageWrap from "../components/layout/PageWrap";
import GlassCard from "../components/ui/GlassCard";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Select from "../components/ui/Select";
import Avatar from "../components/ui/Avatar";
import useStudents from "../hooks/useStudents";
import useCamera from "../hooks/useCamera";
import { fetchTodayAttendance, markAttendanceForStudent, markAttendanceFromImage } from "../services/api";
import type { AttendanceRecord } from "../types";

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

export default function LiveAttendancePage() {
  const { students, loading: studentsLoading } = useStudents();
  const { videoRef, startCamera, stopCamera } = useCamera();
  const [cameraOn, setCameraOn] = useState(false);
  const [recognizing, setRecognizing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [attendanceList, setAttendanceList] = useState<AttendanceRecord[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);
  const [marking, setMarking] = useState(false);
  const [result, setResult] = useState<RecognitionResult | null>(null);
  const [lastScanAt, setLastScanAt] = useState<string | null>(null);
  const scanBusyRef = useRef(false);
  const scanTimerRef = useRef<number | null>(null);

  const filteredStudents = useMemo(() => {
    const normalized = searchTerm.trim().toLowerCase();
    if (!normalized) return students.slice(0, 20);
    return students.filter((student) =>
      student.name.toLowerCase().includes(normalized) ||
      student.roll_no.toLowerCase().includes(normalized)
    );
  }, [searchTerm, students]);

  useEffect(() => {
    if (filteredStudents.length > 0 && !filteredStudents.some((student) => student.id === selectedStudentId)) {
      setSelectedStudentId(filteredStudents[0].id);
    }
    if (filteredStudents.length === 0) setSelectedStudentId(null);
  }, [filteredStudents, selectedStudentId]);

  const refreshAttendance = useCallback(async () => {
    try {
      const today = await fetchTodayAttendance();
      if (Array.isArray(today)) setAttendanceList(today);
    } catch {
      toast.error("Unable to refresh attendance list.");
    }
  }, []);

  useEffect(() => {
    void refreshAttendance();
  }, [refreshAttendance]);

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
        toast.error(err?.message || "Unable to access camera.");
        setCameraOn(false);
      }
    })();

    return () => {
      active = false;
      stopCamera();
    };
  }, [cameraOn, startCamera, stopCamera]);

  const scanFrame = useCallback(async () => {
    if (scanBusyRef.current || !cameraOn || !videoRef.current) return;
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

      if (response.attendance_marked && response.name) {
        toast.success(`Attendance marked for ${response.name}`);
        await refreshAttendance();
      }
    } catch (err: any) {
      // Do not show a toast on every automatic scan. The status panel shows the latest error.
      setResult({ matched: false, attendance_marked: false, message: err?.message || "Face recognition failed." });
    } finally {
      scanBusyRef.current = false;
      setRecognizing(false);
    }
  }, [cameraOn, refreshAttendance, videoRef]);

  useEffect(() => {
    if (!cameraOn) {
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
  }, [cameraOn, scanFrame]);

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
      else toast.error(response.message || "Attendance already marked.");
      await refreshAttendance();
    } catch (err: any) {
      toast.error(err?.message || "Unable to mark attendance.");
    } finally {
      setMarking(false);
    }
  }

  return (
    <PageWrap>
      <div className="grid gap-6 xl:grid-cols-[1.25fr_1fr]">
        <GlassCard className="p-6">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-base font-semibold text-white">Live Face Attendance</h3>
              <p className="mt-1 text-sm text-[#94A3B8]">Keep one face inside the frame. The backend checks the face and marks the active lecture automatically.</p>
            </div>
            <Button variant={cameraOn ? "secondary" : "primary"} onClick={() => setCameraOn((value) => !value)}>
              {cameraOn ? <CameraOff size={16} /> : <Camera size={16} />}
              {cameraOn ? "Stop Camera" : "Start Camera"}
            </Button>
          </div>

          <div className="relative aspect-video overflow-hidden rounded-2xl border border-white/10 bg-black">
            {cameraOn ? (
              <video ref={videoRef} playsInline muted autoPlay className="h-full w-full object-cover" style={{ transform: "scaleX(-1)" }} />
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-3 text-[#64748B]">
                <Camera size={52} strokeWidth={1.2} />
                <p className="text-sm">Start the camera to begin recognition</p>
              </div>
            )}
            <div className="pointer-events-none absolute inset-0">
              <div className="absolute left-1/2 top-1/2 h-52 w-40 -translate-x-1/2 -translate-y-1/2 rounded-[45%] border-2 border-blue-400/70" />
              <div className="absolute bottom-4 left-4 rounded-full border border-white/10 bg-black/60 px-3 py-1.5 text-xs text-white backdrop-blur">
                {recognizing ? "Checking face…" : cameraOn ? "Recognition active" : "Camera off"}
              </div>
            </div>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-[#0F172A] p-3">
              <p className="text-xs text-[#64748B]">Recognition</p>
              <p className="mt-1 flex items-center gap-2 text-sm font-medium text-white">
                {recognizing && <Loader2 size={14} className="animate-spin" />}
                {recognizing ? "Scanning" : cameraOn ? "Ready" : "Stopped"}
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-[#0F172A] p-3">
              <p className="text-xs text-[#64748B]">Last scan</p>
              <p className="mt-1 text-sm text-white">{lastScanAt ?? "—"}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-[#0F172A] p-3">
              <p className="text-xs text-[#64748B]">Today present</p>
              <p className="mt-1 text-sm font-medium text-white">{attendanceList.length}</p>
            </div>
          </div>

          {result && (
            <div className={`mt-4 rounded-2xl border p-4 ${result.attendance_marked ? "border-emerald-500/20 bg-emerald-500/10" : result.matched ? "border-amber-500/20 bg-amber-500/10" : "border-white/10 bg-white/[0.03]"}`}>
              <div className="flex items-start gap-3">
                {result.attendance_marked ? <CheckCircle2 className="mt-0.5 text-emerald-400" size={19} /> : <ScanFace className="mt-0.5 text-[#94A3B8]" size={19} />}
                <div>
                  <p className="text-sm font-medium text-white">{result.name || "Recognition status"}</p>
                  <p className="mt-1 text-sm text-[#CBD5E1]">{result.message}</p>
                  {result.date && result.time && <p className="mt-2 text-xs text-[#94A3B8]">{result.date} · {result.time}</p>}
                </div>
              </div>
            </div>
          )}
        </GlassCard>

        <GlassCard className="p-6">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-white">Manual Fallback</h3>
              <p className="mt-1 text-sm text-[#94A3B8]">Use this only when face recognition is unavailable.</p>
            </div>
            <Button variant="secondary" onClick={() => void refreshAttendance()}>
              <RefreshCw size={15} /> Refresh
            </Button>
          </div>

          <div className="space-y-4">
            <Input label="Search student" placeholder="Name or roll number" value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} disabled={studentsLoading || students.length === 0} />
            <Select label="Student" value={selectedStudentId ?? ""} onChange={(event) => setSelectedStudentId(Number(event.target.value) || null)} disabled={studentsLoading || filteredStudents.length === 0}>
              {filteredStudents.length === 0 ? <option value="">No matching student</option> : filteredStudents.map((student) => <option key={student.id} value={student.id}>{student.name} · {student.roll_no}</option>)}
            </Select>

            {selectedStudent && (
              <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-[#0F172A] p-4">
                <Avatar name={selectedStudent.name} size="md" />
                <div>
                  <p className="text-sm font-semibold text-white">{selectedStudent.name}</p>
                  <p className="text-xs text-[#94A3B8]">{selectedStudent.roll_no} · {selectedStudent.department}</p>
                </div>
              </div>
            )}

            <Button variant="primary" className="w-full" onClick={handleManualAttendance} disabled={marking || !selectedStudentId}>
              {marking ? "Marking…" : "Mark Attendance Manually"}
            </Button>
          </div>
        </GlassCard>
      </div>

      <GlassCard className="mt-6 p-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-white">Today’s Attendance</h3>
            <p className="text-sm text-[#94A3B8]">Attendance returned by the backend for today.</p>
          </div>
          <span className="rounded-full bg-white/5 px-3 py-1 text-xs text-[#CBD5E1]">{attendanceList.length} present</span>
        </div>
        <div className="overflow-x-auto rounded-2xl border border-white/10 bg-[#0F172A]">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-white/10 text-left text-xs uppercase tracking-wider text-[#64748B]"><th className="px-4 py-3">Name</th><th className="px-4 py-3">Roll</th><th className="px-4 py-3">Department</th><th className="px-4 py-3">Time</th></tr></thead>
            <tbody className="divide-y divide-white/5">
              {attendanceList.length === 0 ? <tr><td colSpan={4} className="py-12 text-center text-[#64748B]">No attendance marked yet.</td></tr> : attendanceList.map((record) => <tr key={`${record.student_id}-${record.attendance_time}-${record.attendance_date}`} className="hover:bg-white/5"><td className="px-4 py-3 text-white">{record.student_name ?? record.name ?? "Unknown"}</td><td className="px-4 py-3 text-[#94A3B8]">{record.roll_no}</td><td className="px-4 py-3 text-[#94A3B8]">{record.department}</td><td className="px-4 py-3 text-[#94A3B8]">{record.attendance_time}</td></tr>)}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </PageWrap>
  );
}
