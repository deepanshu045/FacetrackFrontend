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

  if (lecture.lecture_date !== localDateString(now)) {
    return false;
  }

  const current = now.getHours() * 60 + now.getMinutes();

  return (
    current >= toMinutes(lecture.start_time) &&
    current <= toMinutes(lecture.end_time)
  );
}

function formatTime(value?: string) {
  return value ? value.slice(0, 5) : "—";
}

function formatAttendanceTime(value?: string) {
  if (!value) return "—";

  const normalized = value.includes("T")
    ? value
    : `1970-01-01T${value}`;

  const parsed = new Date(normalized);

  if (Number.isNaN(parsed.getTime())) {
    return value.slice(0, 5);
  }

  return parsed.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatLastSeen(value?: string | null) {
  if (!value) return "Never";

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return "Unknown";
  }

  return parsed.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function generateAccessCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

  const bytes = crypto.getRandomValues(new Uint8Array(12));

  const code = Array.from(
    bytes,
    (byte) => alphabet[byte % alphabet.length],
  ).join("");

  return `${code.slice(0, 4)}-${code.slice(4, 8)}-${code.slice(8)}`;
}

export default function LiveAttendancePage() {
  const { students, loading: studentsLoading } = useStudents();

  const [attendanceList, setAttendanceList] = useState<
    AttendanceReport[]
  >([]);

  const [lectures, setLectures] = useState<Lecture[]>([]);

  const [searchTerm, setSearchTerm] = useState("");

  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(
    null,
  );

  const [marking, setMarking] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [backendOnline, setBackendOnline] = useState(false);
  const [desktopOnline, setDesktopOnline] = useState(false);

  const [desktopLastSeen, setDesktopLastSeen] = useState<string | null>(null);

  const [lastRefreshAt, setLastRefreshAt] = useState<string | null>(null);

  const [now, setNow] = useState(() => new Date());

  const [lastRecognized, setLastRecognized] =
    useState<AttendanceReport | null>(null);

  const [accessCode, setAccessCode] = useState("");
  const [savingCode, setSavingCode] = useState(false);
  const [copied, setCopied] = useState(false);

  const refreshData = useCallback(async (silent = false) => {
    if (!silent) {
      setRefreshing(true);
    }

    try {
      const [today, lectureData, desktop] = await Promise.all([
        fetchTodayAttendance(),
        fetchLectures(),
        fetchDesktopStatus(),
      ]);

      if (Array.isArray(today)) {
        setAttendanceList(today);

        if (today.length > 0) {
          setLastRecognized(today[0]);
        }
      }

      if (Array.isArray(lectureData)) {
        setLectures(lectureData);
      }

      setDesktopOnline(Boolean(desktop.online));
      setDesktopLastSeen(desktop.last_seen_at);

      setBackendOnline(true);

      setLastRefreshAt(
        new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }),
      );
    } catch (error: any) {
      setBackendOnline(false);
      setDesktopOnline(false);

      if (!silent) {
        toast.error(
          error?.message || "Unable to connect to attendance service.",
        );
      }
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void refreshData();

    const timer = window.setInterval(() => {
      void refreshData(true);
    }, 5000);

    return () => window.clearInterval(timer);
  }, [refreshData]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => window.clearInterval(timer);
  }, []);

  /*
   * IMPORTANT:
   *
   * Previously:
   *
   * lectures.find(...)
   *
   * returned only ONE active lecture.
   *
   * Now:
   *
   * lectures.filter(...)
   *
   * returns ALL active lectures.
   */
  const activeLectures = useMemo(
    () =>
      lectures.filter((lecture) =>
        isLectureActive(lecture, now),
      ),
    [lectures, now],
  );

  const hasActiveLecture = activeLectures.length > 0;

  const studentsWithFaces = useMemo(
    () => students.filter((student) => student.has_face),
    [students],
  );

  const filteredStudents = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    if (!query) {
      return students.slice(0, 20);
    }

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

    if (
      !filteredStudents.some(
        (student) => student.id === selectedStudentId,
      )
    ) {
      setSelectedStudentId(filteredStudents[0].id);
    }
  }, [filteredStudents, selectedStudentId]);

  const selectedStudent = students.find(
    (student) => student.id === selectedStudentId,
  );

  const presentStudentIds = useMemo(
    () =>
      new Set(
        attendanceList.map((record) => record.student_id),
      ),
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
      toast.error(
        error?.message || "Unable to save access code.",
      );
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
    if (!selectedStudentId) {
      return toast.error("Please select a student first.");
    }

    if (!hasActiveLecture) {
      return toast.error("There is no active lecture right now.");
    }

    setMarking(true);

    try {
      const response = (await markAttendanceForStudent(
        selectedStudentId,
      )) as {
        attendance_marked?: boolean;
        name?: string;
        message?: string;
      };

      if (response.attendance_marked) {
        toast.success(
          `Attendance marked for ${
            response.name ||
            selectedStudent?.name ||
            "student"
          }`,
        );
      } else {
        toast.info(
          response.message || "Attendance already marked.",
        );
      }

      await refreshData(true);
    } catch (error: any) {
      toast.error(
        error?.message || "Unable to mark attendance.",
      );
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

            <h1 className="text-2xl font-semibold text-white">
              Live Attendance
            </h1>
          </div>

          <p className="mt-1 text-sm text-[#94A3B8]">
            Monitor attendance from the FaceTrack Desktop
            recognition application.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-[#CBD5E1]">
            <Clock3 className="mr-2 inline" size={14} />

            {now.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            })}
          </div>

          <Button
            variant="secondary"
            onClick={() => void refreshData()}
            disabled={refreshing}
          >
            {refreshing ? (
              <Loader2 size={15} className="animate-spin" />
            ) : (
              <RefreshCw size={15} />
            )}

            {refreshing ? "Syncing…" : "Sync"}
          </Button>
        </div>
      </div>

      {/* STATUS CARDS */}

      <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <GlassCard className="p-4">
          <div className="flex items-center gap-3">
            <div
              className={`rounded-xl p-2 ${
                backendOnline
                  ? "bg-emerald-500/10 text-emerald-400"
                  : "bg-red-500/10 text-red-400"
              }`}
            >
              {backendOnline ? (
                <Wifi size={18} />
              ) : (
                <WifiOff size={18} />
              )}
            </div>

            <div>
              <p className="text-xs text-[#64748B]">
                Backend
              </p>

              <p className="mt-1 text-sm font-medium text-white">
                {backendOnline ? "Connected" : "Offline"}
              </p>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-4">
          <div className="flex items-center gap-3">
            <div
              className={`rounded-xl p-2 ${
                desktopOnline
                  ? "bg-emerald-500/10 text-emerald-400"
                  : "bg-amber-500/10 text-amber-400"
              }`}
            >
              {desktopOnline ? (
                <Laptop size={18} />
              ) : (
                <WifiOff size={18} />
              )}
            </div>

            <div>
              <p className="text-xs text-[#64748B]">
                Desktop recognition
              </p>

              <p className="mt-1 text-sm font-medium text-white">
                {desktopOnline ? "Online" : "Offline"}
              </p>

              <p className="mt-1 text-[11px] text-[#64748B]">
                Last seen {formatLastSeen(desktopLastSeen)}
              </p>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-emerald-500/10 p-2 text-emerald-400">
              <UserRoundCheck size={18} />
            </div>

            <div>
              <p className="text-xs text-[#64748B]">
                Present today
              </p>

              <p className="mt-1 text-sm font-medium text-white">
                {presentStudentIds.size} students
              </p>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-violet-500/10 p-2 text-violet-400">
              <Users size={18} />
            </div>

            <div>
              <p className="text-xs text-[#64748B]">
                Face profiles
              </p>

              <p className="mt-1 text-sm font-medium text-white">
                {studentsWithFaces.length} ready
              </p>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* ACCESS CODE + RECOGNITION STATUS */}

      <div className="mb-6 grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <GlassCard className="p-6">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-blue-500/10 p-3 text-blue-300">
              <KeyRound size={21} />
            </div>

            <div>
              <h2 className="font-semibold text-white">
                Desktop Camera Access Code
              </h2>

              <p className="mt-1 text-sm text-[#94A3B8]">
                Generate a secure code for the FaceTrack
                Desktop recognition application. The browser
                does not access the camera.
              </p>
            </div>
          </div>

          <div className="mt-5 rounded-2xl border border-white/10 bg-[#0F172A] p-4">
            <p className="mb-2 text-xs uppercase tracking-wider text-[#64748B]">
              Current access code
            </p>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Input
                value={accessCode}
                onChange={(event) =>
                  setAccessCode(
                    event.target.value.toUpperCase(),
                  )
                }
                placeholder="XXXX-XXXX-XXXX"
                aria-label="Desktop camera access code"
              />

              <div className="flex shrink-0 gap-2">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setAccessCode(generateAccessCode());
                    setCopied(false);
                  }}
                >
                  <KeyRound size={15} />
                  Generate
                </Button>

                <Button
                  variant="secondary"
                  onClick={() => void copyAccessCode()}
                  disabled={!accessCode}
                >
                  {copied ? (
                    <Check size={15} />
                  ) : (
                    <Copy size={15} />
                  )}

                  {copied ? "Copied" : "Copy"}
                </Button>

                <Button
                  variant="primary"
                  onClick={() => void saveAccessCode()}
                  disabled={savingCode}
                >
                  {savingCode ? (
                    <Loader2
                      size={15}
                      className="animate-spin"
                    />
                  ) : (
                    <Check size={15} />
                  )}

                  {savingCode ? "Saving…" : "Save"}
                </Button>
              </div>
            </div>
          </div>

          <p className="mt-3 text-xs text-[#64748B]">
            Keep the code private. Enter the saved code in
            FaceTrack Desktop when connecting the recognition
            application to this college.
          </p>
        </GlassCard>

        <GlassCard className="p-6">
          <div className="mb-5 flex items-start gap-3">
            <div className="rounded-xl bg-blue-500/10 p-2 text-blue-400">
              <ShieldCheck size={20} />
            </div>

            <div>
              <h3 className="font-semibold text-white">
                Recognition Status
              </h3>

              <p className="mt-1 text-sm text-[#94A3B8]">
                Connection between the desktop app and
                backend.
              </p>
            </div>
          </div>

          <div
            className={`rounded-2xl border p-5 ${
              desktopOnline
                ? "border-emerald-500/20 bg-emerald-500/10"
                : "border-amber-500/20 bg-amber-500/10"
            }`}
          >
            <p
              className={`text-lg font-semibold ${
                desktopOnline
                  ? "text-emerald-300"
                  : "text-amber-300"
              }`}
            >
              {desktopOnline
                ? "Desktop app is online"
                : "Desktop app is offline"}
            </p>

            <p className="mt-2 text-sm text-[#CBD5E1]">
              {desktopOnline
                ? "Recognition heartbeats are reaching the backend."
                : "Start FaceTrack Desktop and use the saved camera access code."}
            </p>

            <p className="mt-3 text-xs text-[#64748B]">
              Last heartbeat:{" "}
              {formatLastSeen(desktopLastSeen)}
            </p>
          </div>

          {/* MULTIPLE ACTIVE LECTURES */}

          {activeLectures.length > 0 ? (
            <div className="mt-5 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs uppercase tracking-wider text-[#64748B]">
                  Active lectures
                </p>

                <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-300">
                  {activeLectures.length} active
                </span>
              </div>

              {activeLectures.map((lecture) => (
                <div
                  key={lecture.id}
                  className="rounded-2xl border border-white/10 bg-[#0F172A] p-4"
                >
                  <p className="text-lg font-semibold text-white">
                    {lecture.subject}
                  </p>

                  <p className="mt-1 text-sm text-[#94A3B8]">
                    {lecture.department} ·{" "}
                    {lecture.class_name} · Section{" "}
                    {lecture.section}
                  </p>

                  <p className="mt-2 text-xs text-[#64748B]">
                    {formatTime(lecture.start_time)} –{" "}
                    {formatTime(lecture.end_time)}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-5 flex gap-3 rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4">
              <CircleAlert
                className="shrink-0 text-amber-300"
                size={18}
              />

              <p className="text-sm text-amber-100/80">
                No active lecture. Attendance will be accepted
                when a scheduled lecture is active.
              </p>
            </div>
          )}
        </GlassCard>
      </div>

      {/* RECENT RECOGNITION + MANUAL FALLBACK */}

      <div className="mb-6 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <GlassCard className="p-6">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-white">
                Recent Recognition
              </h3>

              <p className="mt-1 text-sm text-[#94A3B8]">
                Attendance events recorded by the desktop app.
              </p>
            </div>

            <span className="rounded-full bg-white/5 px-3 py-1 text-xs text-[#CBD5E1]">
              {presentStudentIds.size} present
            </span>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-white/10 bg-[#0F172A]">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 text-left text-xs uppercase tracking-wider text-[#64748B]">
                  <th className="px-4 py-3">
                    Student
                  </th>

                  <th className="px-4 py-3">
                    Roll
                  </th>

                  <th className="px-4 py-3">
                    Recognized
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-white/5">
                {attendanceList.length === 0 ? (
                  <tr>
                    <td
                      colSpan={3}
                      className="py-12 text-center text-[#64748B]"
                    >
                      Waiting for recognition events…
                    </td>
                  </tr>
                ) : (
                  attendanceList
                    .slice(0, 12)
                    .map((record) => (
                      <tr
                        key={`${record.student_id}-${record.attendance_date}-${record.attendance_time}`}
                        className="hover:bg-white/5"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <Avatar
                              name={record.name}
                              size="sm"
                            />

                            <span className="text-white">
                              {record.name}
                            </span>
                          </div>
                        </td>

                        <td className="px-4 py-3 text-[#94A3B8]">
                          {record.roll_no}
                        </td>

                        <td className="px-4 py-3 text-[#94A3B8]">
                          {formatAttendanceTime(
                            record.attendance_time,
                          )}
                        </td>
                      </tr>
                    ))
                )}
              </tbody>
            </table>
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          <div className="mb-5">
            <h3 className="text-base font-semibold text-white">
              Manual Fallback
            </h3>

            <p className="mt-1 text-sm text-[#94A3B8]">
              Use only when desktop recognition cannot identify
              a student.
            </p>
          </div>

          <div className="space-y-4">
            <Input
              label="Search student"
              placeholder="Name or roll number"
              value={searchTerm}
              onChange={(event) =>
                setSearchTerm(event.target.value)
              }
              disabled={
                studentsLoading || students.length === 0
              }
            />

            <Select
              label="Student"
              value={selectedStudentId ?? ""}
              onChange={(event) =>
                setSelectedStudentId(
                  Number(event.target.value) || null,
                )
              }
              disabled={
                studentsLoading ||
                filteredStudents.length === 0
              }
            >
              {filteredStudents.length === 0 ? (
                <option value="">
                  No matching student
                </option>
              ) : (
                filteredStudents.map((student) => (
                  <option
                    key={student.id}
                    value={student.id}
                  >
                    {student.name} · {student.roll_no}
                  </option>
                ))
              )}
            </Select>

            {selectedStudent && (
              <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-[#0F172A] p-4">
                <Avatar
                  name={selectedStudent.name}
                  size="md"
                />

                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-white">
                    {selectedStudent.name}
                  </p>

                  <p className="truncate text-xs text-[#94A3B8]">
                    {selectedStudent.roll_no} ·{" "}
                    {selectedStudent.department}
                  </p>
                </div>
              </div>
            )}

            <Button
              variant="primary"
              className="w-full"
              onClick={handleManualAttendance}
              disabled={
                marking ||
                !selectedStudentId ||
                !hasActiveLecture
              }
            >
              {marking ? (
                <>
                  <Loader2
                    size={15}
                    className="animate-spin"
                  />
                  Marking…
                </>
              ) : (
                <>
                  <UserRoundCheck size={15} />
                  Mark Attendance Manually
                </>
              )}
            </Button>
          </div>
        </GlassCard>
      </div>

      {/* FOOTER */}

      <GlassCard className="p-5">
        <div className="flex flex-col gap-2 text-sm text-[#94A3B8] sm:flex-row sm:items-center sm:justify-between">
          <span>
            Last backend sync: {lastRefreshAt || "—"}
          </span>

          <span>
            Latest recognized:{" "}
            <strong className="text-white">
              {lastRecognized?.name || "Waiting…"}
            </strong>

            {lastRecognized
              ? ` · ${formatAttendanceTime(
                  lastRecognized.attendance_time,
                )}`
              : ""}
          </span>
        </div>
      </GlassCard>
    </PageWrap>
  );
}