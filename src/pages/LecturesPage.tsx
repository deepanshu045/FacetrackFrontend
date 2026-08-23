import { FormEvent, useEffect, useMemo, useState } from "react";
import { CalendarDays, Clock3, Edit3, Loader2, Plus, Trash2, XCircle } from "lucide-react";
import { toast } from "sonner";
import PageWrap from "../components/layout/PageWrap";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import {
  cancelLecture,
  createLectureSchedule,
  deleteLectureSchedule,
  fetchClassSections,
  fetchLectureSchedules,
  fetchLectures,
  fetchTeachers,
} from "../services/api";
import type { ClassSection, Lecture, LectureSchedule, Teacher } from "../types";

const DAYS = [
  [0, "Monday"], [1, "Tuesday"], [2, "Wednesday"], [3, "Thursday"],
  [4, "Friday"], [5, "Saturday"], [6, "Sunday"],
] as const;

const EMPTY_FORM = {
  subject: "",
  classSectionId: "",
  teacherId: "",
  day: "0",
  start: "",
  end: "",
  startDate: "",
  endDate: "",
};

const isoDate = (d: Date) => {
  const copy = new Date(d);
  copy.setMinutes(copy.getMinutes() - copy.getTimezoneOffset());
  return copy.toISOString().slice(0, 10);
};

export default function LecturesPage() {
  const [tab, setTab] = useState<"schedule" | "lectures">("schedule");
  const [schedules, setSchedules] = useState<LectureSchedule[]>([]);
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [sections, setSections] = useState<ClassSection[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [workingId, setWorkingId] = useState<number | null>(null);
  const [deletingScheduleId, setDeletingScheduleId] = useState<number | null>(null);
  const [savingSchedule, setSavingSchedule] = useState(false);
  const [scheduleForm, setScheduleForm] = useState(EMPTY_FORM);
  const [editingSchedule, setEditingSchedule] = useState<LectureSchedule | null>(null);
  const [classFilter, setClassFilter] = useState("");
  const [lectureView, setLectureView] = useState<"today" | "week" | "upcoming">("today");

  const today = useMemo(() => new Date(), []);
  const end = useMemo(() => {
    const d = new Date(today);
    d.setDate(d.getDate() + 30);
    return d;
  }, [today]);

  async function load() {
    setLoading(true);
    try {
      const [w, l, s, t] = await Promise.all([
        fetchLectureSchedules(),
        fetchLectures(isoDate(today), isoDate(end)),
        fetchClassSections(),
        fetchTeachers(),
      ]);
      setSchedules(w);
      setLectures(l);
      setSections(s);
      setTeachers(t);
    } catch (e: any) {
      toast.error(e?.message || "Failed to load lectures");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, []);

  const sectionName = (id: number | null | undefined) => {
    const s = sections.find(x => x.id === id);
    return s ? `${s.department} · ${s.class_name} · ${s.section}` : "Unassigned";
  };

  const teacherName = (id: number | null | undefined) =>
    teachers.find(t => t.id === id)?.name || "No teacher";

  const groupedSchedules = useMemo(
    () => DAYS.map(([day, name]) => ({
      day,
      name,
      schedules: schedules
        .filter(s => s.day_of_week === day && (!classFilter || String(s.class_section_id) === classFilter))
        .sort((a, b) => a.start_time.localeCompare(b.start_time)),
    })),
    [schedules, classFilter],
  );

  const filteredLectures = useMemo(() => {
    let result = classFilter
      ? lectures.filter(l => String(l.class_section_id) === classFilter)
      : lectures;
    const todayString = isoDate(new Date());
    if (lectureView === "today") result = result.filter(l => l.lecture_date === todayString);
    if (lectureView === "week") {
      const start = new Date(todayString);
      const weekEnd = new Date(start);
      weekEnd.setDate(weekEnd.getDate() + 6);
      const endString = isoDate(weekEnd);
      result = result.filter(l => l.lecture_date >= todayString && l.lecture_date <= endString);
    }
    return [...result].sort((a, b) => `${a.lecture_date}${a.start_time}`.localeCompare(`${b.lecture_date}${b.start_time}`));
  }, [lectures, classFilter, lectureView]);

  function startAdd(day = 0) {
    setEditingSchedule(null);
    setScheduleForm({ ...EMPTY_FORM, day: String(day), startDate: isoDate(new Date()) });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function startEdit(schedule: LectureSchedule) {
    setEditingSchedule(schedule);
    setScheduleForm({
      subject: schedule.subject,
      classSectionId: schedule.class_section_id ? String(schedule.class_section_id) : "",
      teacherId: schedule.teacher_id ? String(schedule.teacher_id) : "",
      day: String(schedule.day_of_week),
      start: schedule.start_time,
      end: schedule.end_time,
      startDate: schedule.effective_start_date || isoDate(new Date()),
      endDate: schedule.effective_end_date || "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function saveSchedule(e: FormEvent) {
    e.preventDefault();
    if (!scheduleForm.subject.trim() || !scheduleForm.classSectionId || !scheduleForm.start || !scheduleForm.end || !scheduleForm.startDate) {
      toast.error("Subject, class, effective start date and times are required");
      return;
    }
    if (scheduleForm.end <= scheduleForm.start) {
      toast.error("End time must be after start time");
      return;
    }
    if (scheduleForm.endDate && scheduleForm.endDate < scheduleForm.startDate) {
      toast.error("Effective end date must be on or after the start date");
      return;
    }

    setSavingSchedule(true);
    try {
      const payload = {
        subject: scheduleForm.subject.trim(),
        class_section_id: Number(scheduleForm.classSectionId),
        teacher_id: scheduleForm.teacherId ? Number(scheduleForm.teacherId) : null,
        day_of_week: Number(scheduleForm.day),
        start_time: scheduleForm.start,
        end_time: scheduleForm.end,
        effective_start_date: scheduleForm.startDate,
        effective_end_date: scheduleForm.endDate || null,
      };

      // The current API exposes create/delete for schedule templates. Editing
      // therefore replaces the template while leaving already-generated lecture
      // occurrences untouched.
      if (editingSchedule) {
        await deleteLectureSchedule(editingSchedule.id);
        await createLectureSchedule(payload);
        toast.success("Weekly schedule updated");
      } else {
        await createLectureSchedule(payload);
        toast.success("Weekly schedule added");
      }
      setEditingSchedule(null);
      setScheduleForm(EMPTY_FORM);
      await load();
    } catch (e: any) {
      toast.error(e?.message || "Could not save weekly schedule");
    } finally {
      setSavingSchedule(false);
    }
  }

  async function removeSchedule(schedule: LectureSchedule) {
    if (!confirm(`Remove ${schedule.subject} from the recurring timetable? Existing generated lectures will remain.`)) return;
    setDeletingScheduleId(schedule.id);
    try {
      await deleteLectureSchedule(schedule.id);
      await load();
      toast.success("Weekly schedule removed");
    } catch (e: any) {
      toast.error(e?.message || "Could not remove weekly schedule");
    } finally {
      setDeletingScheduleId(null);
    }
  }

  async function cancel(l: Lecture) {
    if (l.status === "Cancelled") return;
    if (!confirm(`Cancel only ${l.subject} on ${l.lecture_date}? The weekly timetable will remain unchanged.`)) return;
    setWorkingId(l.id);
    try {
      await cancelLecture(l.id);
      await load();
      toast.success("Lecture occurrence cancelled");
    } catch (e: any) {
      toast.error(e?.message || "Could not cancel lecture");
    } finally {
      setWorkingId(null);
    }
  }

  if (loading) return <PageWrap><div className="flex min-h-64 items-center justify-center gap-3 text-slate-400"><Loader2 size={20} className="animate-spin"/><span>Loading timetable…</span></div></PageWrap>;

  return <PageWrap>
    <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-blue-300"><CalendarDays size={15}/> Academic timetable</div>
        <h1 className="mt-1 text-2xl font-bold text-white">Lectures</h1>
        <p className="mt-1 text-sm text-slate-400">Manage the recurring timetable here. Individual dated lectures are generated automatically.</p>
      </div>
      <div className="flex rounded-xl border border-white/10 bg-white/5 p-1">
        <button type="button" onClick={() => setTab("schedule")} className={`rounded-lg px-4 py-2 text-sm font-medium transition ${tab === "schedule" ? "bg-white/10 text-white" : "text-slate-400 hover:text-white"}`}>Weekly Schedule</button>
        <button type="button" onClick={() => setTab("lectures")} className={`rounded-lg px-4 py-2 text-sm font-medium transition ${tab === "lectures" ? "bg-white/10 text-white" : "text-slate-400 hover:text-white"}`}>Generated Lectures</button>
      </div>
    </div>

    <div className="mb-5 flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 md:flex-row md:items-center">
      <div className="flex-1">
        <label htmlFor="lecture-class-filter" className="mb-1.5 block text-xs font-medium text-slate-400">Class section</label>
        <select id="lecture-class-filter" value={classFilter} onChange={e => setClassFilter(e.target.value)} className="w-full rounded-xl border border-white/10 bg-[#0F172A] px-3 py-2.5 text-sm text-white md:max-w-sm">
          <option value="">All classes</option>
          {sections.map(s => <option key={s.id} value={s.id}>{sectionName(s.id)}</option>)}
        </select>
      </div>
      {tab === "schedule" && <Button type="button" onClick={() => startAdd(0)}><Plus size={16}/> Add lecture</Button>}
    </div>

    {tab === "schedule" && <>
      <form onSubmit={saveSchedule} className="mb-6 rounded-2xl border border-blue-400/15 bg-blue-400/[0.04] p-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-white">{editingSchedule ? "Edit recurring lecture" : "Add recurring lecture"}</h2>
            <p className="mt-1 text-xs text-slate-500">Changes apply to the weekly timetable. Existing generated occurrences are not rewritten.</p>
          </div>
          {(editingSchedule || scheduleForm.subject) && <button type="button" onClick={() => { setEditingSchedule(null); setScheduleForm(EMPTY_FORM); }} className="rounded-lg p-2 text-slate-400 hover:bg-white/5 hover:text-white"><XCircle size={18}/></button>}
        </div>
        <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-4">
          <Input label="Subject" value={scheduleForm.subject} onChange={e => setScheduleForm({...scheduleForm, subject:e.target.value})} disabled={savingSchedule} placeholder="Database Management"/>
          <label className="block"><span className="mb-1.5 block text-sm font-medium text-slate-300">Class Section</span><select required disabled={savingSchedule} value={scheduleForm.classSectionId} onChange={e => setScheduleForm({...scheduleForm,classSectionId:e.target.value})} className="w-full rounded-xl border border-white/10 bg-[#0F172A] px-3 py-2.5 text-sm text-white"><option value="">Select class</option>{sections.map(s=><option key={s.id} value={s.id}>{sectionName(s.id)}</option>)}</select></label>
          <label className="block"><span className="mb-1.5 block text-sm font-medium text-slate-300">Teacher</span><select disabled={savingSchedule} value={scheduleForm.teacherId} onChange={e => setScheduleForm({...scheduleForm,teacherId:e.target.value})} className="w-full rounded-xl border border-white/10 bg-[#0F172A] px-3 py-2.5 text-sm text-white"><option value="">No teacher</option>{teachers.map(t=><option key={t.id} value={t.id}>{t.name}</option>)}</select></label>
          <label className="block"><span className="mb-1.5 block text-sm font-medium text-slate-300">Day</span><select disabled={savingSchedule} value={scheduleForm.day} onChange={e => setScheduleForm({...scheduleForm,day:e.target.value})} className="w-full rounded-xl border border-white/10 bg-[#0F172A] px-3 py-2.5 text-sm text-white">{DAYS.map(([id,name])=><option key={id} value={id}>{name}</option>)}</select></label>
          <Input label="Start" type="time" value={scheduleForm.start} onChange={e => setScheduleForm({...scheduleForm,start:e.target.value})} disabled={savingSchedule}/>
          <Input label="End" type="time" value={scheduleForm.end} onChange={e => setScheduleForm({...scheduleForm,end:e.target.value})} disabled={savingSchedule}/>
          <Input label="Effective From" type="date" value={scheduleForm.startDate} onChange={e => setScheduleForm({...scheduleForm,startDate:e.target.value})} disabled={savingSchedule}/>
          <Input label="Effective Until" type="date" value={scheduleForm.endDate} onChange={e => setScheduleForm({...scheduleForm,endDate:e.target.value})} disabled={savingSchedule}/>
        </div>
        <div className="mt-4 flex gap-2">
          <Button type="submit" disabled={savingSchedule}>{savingSchedule ? <><Loader2 size={16} className="animate-spin"/> Saving…</> : <><CalendarDays size={16}/> {editingSchedule ? "Save changes" : "Add to timetable"}</>}</Button>
          {editingSchedule && <Button type="button" disabled={savingSchedule} onClick={() => {setEditingSchedule(null);setScheduleForm(EMPTY_FORM);}}>Cancel</Button>}
        </div>
      </form>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {groupedSchedules.map(({day, name, schedules: daySchedules}) => <section key={day} className="overflow-hidden rounded-2xl border border-white/10 bg-white/5">
          <div className="flex items-center justify-between border-b border-white/10 bg-white/[0.03] px-4 py-3"><div><h2 className="text-sm font-semibold text-white">{name}</h2><p className="mt-0.5 text-xs text-slate-500">{daySchedules.length} {daySchedules.length === 1 ? "class" : "classes"}</p></div><button type="button" onClick={() => startAdd(day)} className="rounded-lg p-2 text-slate-400 hover:bg-white/10 hover:text-white"><Plus size={16}/></button></div>
          {daySchedules.length === 0 ? <div className="p-5 text-sm text-slate-500">No lectures scheduled.</div> : <div className="divide-y divide-white/5">{daySchedules.map(s => <div key={s.id} className="group flex gap-3 p-4">
            <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-400/10 text-blue-300"><Clock3 size={17}/></div>
            <div className="min-w-0 flex-1"><div className="truncate text-sm font-medium text-slate-100">{s.subject}</div><div className="mt-1 text-xs font-medium text-slate-300">{s.start_time} – {s.end_time}</div><div className="mt-1 truncate text-xs text-slate-500">{sectionName(s.class_section_id)} · {teacherName(s.teacher_id)}</div><div className="mt-1 text-[11px] text-slate-600">{s.effective_start_date || "Any date"}{s.effective_end_date ? ` → ${s.effective_end_date}` : " → ongoing"}</div></div>
            <div className="flex shrink-0 gap-1 opacity-70 transition group-hover:opacity-100"><button type="button" onClick={() => startEdit(s)} className="rounded-lg p-2 text-slate-400 hover:bg-white/10 hover:text-white" title="Edit recurring lecture"><Edit3 size={15}/></button><button type="button" disabled={deletingScheduleId !== null} onClick={() => void removeSchedule(s)} className="rounded-lg p-2 text-slate-400 hover:bg-red-500/10 hover:text-red-400" title="Remove recurring lecture">{deletingScheduleId === s.id ? <Loader2 size={15} className="animate-spin"/> : <Trash2 size={15}/>}</button></div>
          </div>)}</div>}
        </section>)}
      </div>
    </>}

    {tab === "lectures" && <>
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between"><div><h2 className="text-lg font-semibold text-white">Generated lectures</h2><p className="mt-1 text-xs text-slate-500">These are dated occurrences created from the weekly timetable.</p></div><div className="flex rounded-xl border border-white/10 bg-white/5 p-1"><button type="button" onClick={() => setLectureView("today")} className={`rounded-lg px-3 py-1.5 text-xs ${lectureView === "today" ? "bg-white/10 text-white" : "text-slate-400"}`}>Today</button><button type="button" onClick={() => setLectureView("week")} className={`rounded-lg px-3 py-1.5 text-xs ${lectureView === "week" ? "bg-white/10 text-white" : "text-slate-400"}`}>This week</button><button type="button" onClick={() => setLectureView("upcoming")} className={`rounded-lg px-3 py-1.5 text-xs ${lectureView === "upcoming" ? "bg-white/10 text-white" : "text-slate-400"}`}>Next 30 days</button></div></div>
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5">
        {filteredLectures.length === 0 ? <div className="p-10 text-center text-sm text-slate-500">No generated lectures found.</div> : filteredLectures.map(l => <div key={l.id} className="flex flex-col gap-3 border-b border-white/5 px-4 py-4 last:border-0 md:flex-row md:items-center md:justify-between"><div className="flex min-w-0 items-start gap-3"><div className="mt-0.5 rounded-lg bg-white/5 p-2 text-slate-400"><CalendarDays size={16}/></div><div className="min-w-0"><div className="text-sm font-medium text-slate-100">{l.subject}</div><div className="mt-1 text-xs text-slate-300">{l.lecture_date} · {l.start_time} – {l.end_time}</div><div className="mt-1 text-xs text-slate-500">{sectionName(l.class_section_id)} · {teacherName(l.teacher_id)}</div></div></div><div className="flex shrink-0 items-center gap-2"><span className={`rounded-full px-2.5 py-1 text-xs ${l.status === "Cancelled" ? "bg-red-400/10 text-red-300" : "bg-emerald-400/10 text-emerald-300"}`}>{l.status}</span><Button type="button" disabled={l.status === "Cancelled" || workingId !== null} onClick={() => void cancel(l)}>{workingId === l.id ? <Loader2 size={15} className="animate-spin"/> : <XCircle size={15}/>} Cancel occurrence</Button></div></div>)}
      </div>
    </>}
  </PageWrap>;
}
