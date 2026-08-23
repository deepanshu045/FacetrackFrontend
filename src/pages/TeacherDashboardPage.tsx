import { useEffect, useMemo, useState } from "react";
import { CalendarDays, Check, Clock3, Loader2, Users, X } from "lucide-react";
import { toast } from "sonner";
import PageWrap from "../components/layout/PageWrap";
import GlassCard from "../components/ui/GlassCard";
import Button from "../components/ui/Button";
import { fetchTeacherLectures, fetchTeacherMe, getLectureAttendance, markTeacherAttendance } from "../services/api";
import type { Lecture, Teacher, TeacherAttendanceRow } from "../types";

function formatTime(value: string) {
  const [h, m] = value.split(":").map(Number);
  const date = new Date(); date.setHours(h, m, 0, 0);
  return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function formatDate(value: string) {
  const date = new Date(`${value}T00:00:00`);
  return date.toLocaleDateString([], { weekday: "short", day: "numeric", month: "short", year: "numeric" });
}

export default function TeacherDashboardPage() {
  const [teacher, setTeacher] = useState<Teacher | null>(null);
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [selected, setSelected] = useState<Lecture | null>(null);
  const [attendance, setAttendance] = useState<TeacherAttendanceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [markingId, setMarkingId] = useState<number | null>(null);

  async function load() {
    setLoading(true);
    try {
      const [me, data] = await Promise.all([fetchTeacherMe(), fetchTeacherLectures()]);
      setTeacher(me);
      setLectures(Array.isArray(data) ? data : []);
    } catch (error: any) { toast.error(error?.message || "Unable to load your lectures"); }
    finally { setLoading(false); }
  }

  async function openAttendance(lecture: Lecture) {
    setSelected(lecture); setAttendanceLoading(true);
    try {
      const rows = await getLectureAttendance(lecture.id);
      setAttendance(rows);
    } catch (error: any) { toast.error(error?.message || "Unable to load attendance"); setAttendance([]); }
    finally { setAttendanceLoading(false); }
  }

  async function changeStatus(row: TeacherAttendanceRow, status: "Present" | "Absent") {
    if (!selected) return;
    setMarkingId(row.student_id);
    try {
      await markTeacherAttendance(selected.id, row.student_id, status);
      setAttendance((current) => current.map((item) => item.student_id === row.student_id ? { ...item, status } : item));
      toast.success(`${row.name} marked ${status.toLowerCase()}`);
    } catch (error: any) { toast.error(error?.message || "Unable to update attendance"); }
    finally { setMarkingId(null); }
  }

  useEffect(() => { load(); }, []);

  const upcoming = useMemo(() => [...lectures].sort((a, b) => `${a.lecture_date}${a.start_time}`.localeCompare(`${b.lecture_date}${b.start_time}`)), [lectures]);

  if (loading) return <PageWrap><div className="flex min-h-[60vh] items-center justify-center text-slate-400"><Loader2 className="mr-2 animate-spin" size={20} /> Loading your assigned lectures…</div></PageWrap>;

  return <PageWrap>
    <div className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
      <div><p className="text-sm font-medium text-blue-400">Teacher workspace</p><h1 className="mt-1 text-3xl font-bold tracking-tight text-white">Welcome, {teacher?.name || "Teacher"}</h1><p className="mt-2 text-sm text-slate-400">Only lectures from your assigned classes are shown here.</p></div>
      <div className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-xs text-slate-400"><span className="font-medium text-white">{lectures.length}</span> assigned lectures</div>
    </div>

    {upcoming.length === 0 ? <GlassCard className="p-10 text-center"><CalendarDays className="mx-auto text-slate-500" size={30} /><h2 className="mt-4 font-semibold text-white">No assigned lectures</h2><p className="mt-2 text-sm text-slate-400">Ask an administrator to assign your class or lecture.</p></GlassCard> : <div className="grid gap-4 lg:grid-cols-2">{upcoming.map((lecture) => <GlassCard key={lecture.id} className="p-5"><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-medium uppercase tracking-wider text-blue-400">{formatDate(lecture.lecture_date)}</p><h2 className="mt-2 text-lg font-semibold text-white">{lecture.subject}</h2><p className="mt-1 text-sm text-slate-400">{lecture.class_name || "Class"}{lecture.section ? ` · Section ${lecture.section}` : ""}</p></div><span className={`rounded-full px-2.5 py-1 text-xs font-medium ${lecture.status === "Cancelled" ? "bg-red-500/10 text-red-300" : "bg-emerald-500/10 text-emerald-300"}`}>{lecture.status}</span></div><div className="mt-5 flex flex-wrap gap-4 text-xs text-slate-400"><span className="inline-flex items-center gap-1.5"><Clock3 size={14} /> {formatTime(lecture.start_time)} – {formatTime(lecture.end_time)}</span><span className="inline-flex items-center gap-1.5"><Users size={14} /> Assigned class</span></div><Button className="mt-5 w-full justify-center" variant="secondary" disabled={lecture.status === "Cancelled"} onClick={() => openAttendance(lecture)}>View attendance</Button></GlassCard>)}</div>}

    {selected && <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4 backdrop-blur-sm sm:items-center"><div className="max-h-[85vh] w-full max-w-3xl overflow-hidden rounded-2xl border border-white/10 bg-[#0F172A] shadow-2xl"><div className="flex items-start justify-between border-b border-white/10 p-5"><div><p className="text-xs text-blue-400">{formatDate(selected.lecture_date)} · {formatTime(selected.start_time)} – {formatTime(selected.end_time)}</p><h2 className="mt-1 text-xl font-semibold text-white">{selected.subject}</h2><p className="text-sm text-slate-400">{selected.class_name || "Class"}{selected.section ? ` · Section ${selected.section}` : ""}</p></div><button onClick={() => setSelected(null)} className="rounded-lg p-2 text-slate-400 hover:bg-white/5 hover:text-white"><X size={18} /></button></div><div className="max-h-[60vh] overflow-y-auto p-5">{attendanceLoading ? <div className="flex justify-center py-12 text-slate-400"><Loader2 className="mr-2 animate-spin" size={18} /> Loading attendance…</div> : <div className="overflow-hidden rounded-xl border border-white/10"><table className="w-full text-sm"><thead className="bg-white/[0.03] text-xs uppercase tracking-wider text-slate-500"><tr><th className="px-4 py-3 text-left">Roll</th><th className="px-4 py-3 text-left">Student</th><th className="px-4 py-3 text-right">Status</th><th className="px-4 py-3 text-right">Action</th></tr></thead><tbody className="divide-y divide-white/5">{attendance.map((row) => <tr key={row.student_id}><td className="px-4 py-3 text-slate-400">{row.roll_no}</td><td className="px-4 py-3 font-medium text-white">{row.name}</td><td className="px-4 py-3 text-right"><span className={row.status === "Present" ? "text-emerald-400" : "text-slate-500"}>{row.status === "Present" ? <Check className="mr-1 inline" size={14} /> : null}{row.status}</span></td><td className="px-4 py-3 text-right"><div className="flex justify-end gap-2"><button disabled={markingId === row.student_id} onClick={() => changeStatus(row, "Present")} className="rounded-lg border border-emerald-400/20 px-2.5 py-1.5 text-xs text-emerald-300 hover:bg-emerald-400/10 disabled:opacity-50">Present</button><button disabled={markingId === row.student_id} onClick={() => changeStatus(row, "Absent")} className="rounded-lg border border-red-400/20 px-2.5 py-1.5 text-xs text-red-300 hover:bg-red-400/10 disabled:opacity-50">Absent</button></div></td></tr>)}</tbody></table></div>}</div></div></div>}
  </PageWrap>;
}
