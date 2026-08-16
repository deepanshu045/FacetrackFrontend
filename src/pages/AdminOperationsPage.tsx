import { FormEvent, useEffect, useMemo, useState } from "react";
import { Loader2, Plus, Trash2, XCircle } from "lucide-react";
import { toast } from "sonner";

import PageWrap from "../components/layout/PageWrap";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import {
  assignTeacherClass,
  cancelLecture,
  createClassSection,
  createCollegeClosure,
  createLecture,
  createLectureSchedule,
  createTeacher,
  deleteClassSection,
  deleteCollegeClosure,
  deleteLecture,
  deleteLectureSchedule,
  fetchClassSections,
  fetchCollegeClosures,
  fetchLectureSchedules,
  fetchLectures,
  fetchTeachers,
} from "../services/api";
import type { ClassSection, CollegeClosure, Lecture, LectureSchedule, Teacher } from "../types";

type Mode = "class-sections" | "teachers" | "lectures" | "schedules" | "closures";

interface Props { mode: Mode; }

const DAYS = [
  [0, "Monday"], [1, "Tuesday"], [2, "Wednesday"], [3, "Thursday"], [4, "Friday"], [5, "Saturday"], [6, "Sunday"],
] as const;

const EMPTY_SECTION = { department: "", class_name: "", section: "" };
const EMPTY_TEACHER = { username: "", name: "", email: "", password: "" };
const EMPTY_ASSIGNMENT = { teacherId: "", classSectionId: "" };
const EMPTY_LECTURE = { subject: "", classSectionId: "", teacherId: "", date: "", start: "", end: "" };
const EMPTY_SCHEDULE = { subject: "", classSectionId: "", day: "0", start: "", end: "" };
const EMPTY_CLOSURE = { date: "", reason: "Holiday", description: "" };

export default function AdminOperationsPage({ mode }: Props) {
  const [sections, setSections] = useState<ClassSection[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [schedules, setSchedules] = useState<LectureSchedule[]>([]);
  const [closures, setClosures] = useState<CollegeClosure[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [cancellingId, setCancellingId] = useState<number | null>(null);

  const [sectionForm, setSectionForm] = useState(EMPTY_SECTION);
  const [teacherForm, setTeacherForm] = useState(EMPTY_TEACHER);
  const [assignment, setAssignment] = useState(EMPTY_ASSIGNMENT);
  const [lectureForm, setLectureForm] = useState(EMPTY_LECTURE);
  const [scheduleForm, setScheduleForm] = useState(EMPTY_SCHEDULE);
  const [closureForm, setClosureForm] = useState(EMPTY_CLOSURE);

  async function load() {
    setLoading(true);
    try {
      if (mode === "class-sections") setSections(await fetchClassSections());
      else if (mode === "teachers") {
        const [t, s] = await Promise.all([fetchTeachers(), fetchClassSections()]);
        setTeachers(t); setSections(s);
      } else if (mode === "lectures") {
        const [l, s, t] = await Promise.all([fetchLectures(), fetchClassSections(), fetchTeachers()]);
        setLectures(l); setSections(s); setTeachers(t);
      } else if (mode === "schedules") {
        const [w, s] = await Promise.all([fetchLectureSchedules(), fetchClassSections()]);
        setSchedules(w); setSections(s);
      } else if (mode === "closures") setClosures(await fetchCollegeClosures());
    } catch (error: any) {
      toast.error(error?.message || "Failed to load data");
    } finally { setLoading(false); }
  }

  useEffect(() => { void load(); }, [mode]);

  const title = useMemo(() => ({
    "class-sections": "Class Sections", teachers: "Teachers", lectures: "Lectures",
    schedules: "Weekly Schedule", closures: "College Closures",
  }[mode]), [mode]);

  async function submitSection(e: FormEvent) {
    e.preventDefault();
    if (!sectionForm.department.trim() || !sectionForm.class_name.trim() || !sectionForm.section.trim()) {
      toast.error("Department, class and section are required"); return;
    }
    setSubmitting(true);
    try {
      await createClassSection({ department: sectionForm.department.trim(), class_name: sectionForm.class_name.trim(), section: sectionForm.section.trim() });
      setSectionForm(EMPTY_SECTION); await load(); toast.success("Class section created");
    } catch (error: any) { toast.error(error?.message || "Could not create class section"); }
    finally { setSubmitting(false); }
  }

  async function submitTeacher(e: FormEvent) {
    e.preventDefault(); setSubmitting(true);
    try {
      await createTeacher({ ...teacherForm, email: teacherForm.email || undefined });
      setTeacherForm(EMPTY_TEACHER); await load(); toast.success("Teacher created");
    } catch (error: any) { toast.error(error?.message || "Could not create teacher"); }
    finally { setSubmitting(false); }
  }

  async function submitAssignment(e: FormEvent) {
    e.preventDefault();
    if (!assignment.teacherId || !assignment.classSectionId) { toast.error("Select both a teacher and a class section"); return; }
    setSubmitting(true);
    try {
      await assignTeacherClass(Number(assignment.teacherId), Number(assignment.classSectionId));
      setAssignment(EMPTY_ASSIGNMENT); toast.success("Teacher assigned to class");
    } catch (error: any) { toast.error(error?.message || "Could not assign teacher"); }
    finally { setSubmitting(false); }
  }

  async function submitLecture(e: FormEvent) {
    e.preventDefault();
    if (!lectureForm.subject.trim() || !lectureForm.date || !lectureForm.start || !lectureForm.end) {
      toast.error("Subject, date, start time and end time are required"); return;
    }
    if (lectureForm.end <= lectureForm.start) { toast.error("End time must be after start time"); return; }
    setSubmitting(true);
    try {
      await createLecture({
        subject: lectureForm.subject.trim(),
        class_section_id: lectureForm.classSectionId ? Number(lectureForm.classSectionId) : null,
        teacher_id: lectureForm.teacherId ? Number(lectureForm.teacherId) : null,
        lecture_date: lectureForm.date,
        start_time: lectureForm.start,
        end_time: lectureForm.end,
      });
      setLectureForm(EMPTY_LECTURE); await load(); toast.success("Lecture created");
    } catch (error: any) { toast.error(error?.message || "Could not create lecture"); }
    finally { setSubmitting(false); }
  }

  async function handleCancelLecture(lecture: Lecture) {
    if (lecture.status === "Cancelled") return;
    if (!confirm(`Cancel ${lecture.subject} on ${lecture.lecture_date}?`)) return;
    setCancellingId(lecture.id);
    try {
      await cancelLecture(lecture.id);
      await load();
      toast.success("Lecture cancelled");
    } catch (error: any) { toast.error(error?.message || "Could not cancel lecture"); }
    finally { setCancellingId(null); }
  }

  async function submitSchedule(e: FormEvent) {
    e.preventDefault();
    if (!scheduleForm.subject.trim() || !scheduleForm.start || !scheduleForm.end) { toast.error("Subject, start time and end time are required"); return; }
    if (scheduleForm.end <= scheduleForm.start) { toast.error("End time must be after start time"); return; }
    setSubmitting(true);
    try {
      await createLectureSchedule({ subject: scheduleForm.subject.trim(), class_section_id: scheduleForm.classSectionId ? Number(scheduleForm.classSectionId) : null, day_of_week: Number(scheduleForm.day), start_time: scheduleForm.start, end_time: scheduleForm.end });
      setScheduleForm(EMPTY_SCHEDULE); await load(); toast.success("Weekly schedule created");
    } catch (error: any) { toast.error(error?.message || "Could not create schedule"); }
    finally { setSubmitting(false); }
  }

  async function submitClosure(e: FormEvent) {
    e.preventDefault();
    if (!closureForm.date) { toast.error("Select a closure date"); return; }
    setSubmitting(true);
    try {
      await createCollegeClosure({ closure_date: closureForm.date, reason: closureForm.reason as any, description: closureForm.description || null });
      setClosureForm(EMPTY_CLOSURE); await load(); toast.success("College closure created");
    } catch (error: any) { toast.error(error?.message || "Could not create closure"); }
    finally { setSubmitting(false); }
  }

  const sectionName = (id?: number | null) => {
    const s = sections.find(x => x.id === id);
    return s ? `${s.department} · ${s.class_name} · ${s.section}` : "Unassigned";
  };
  const teacherName = (id?: number | null) => teachers.find(x => x.id === id)?.name || "Unassigned";

  if (loading) return <PageWrap><div className="flex min-h-64 items-center justify-center gap-3 text-slate-400"><Loader2 size={20} className="animate-spin" /><span>Loading {title.toLowerCase()}…</span></div></PageWrap>;

  return <PageWrap>
    <div className="mb-6"><h1 className="text-2xl font-bold text-white">{title}</h1><p className="mt-1 text-sm text-slate-400">Manage this data using the current FaceTrack backend.</p></div>

    {mode === "class-sections" && <>
      <form onSubmit={submitSection} className="mb-6 grid gap-3 rounded-2xl border border-white/10 bg-white/5 p-5 md:grid-cols-4">
        <Input label="Department" value={sectionForm.department} onChange={e => setSectionForm({ ...sectionForm, department: e.target.value })} disabled={submitting} />
        <Input label="Class" value={sectionForm.class_name} onChange={e => setSectionForm({ ...sectionForm, class_name: e.target.value })} disabled={submitting} />
        <Input label="Section" value={sectionForm.section} onChange={e => setSectionForm({ ...sectionForm, section: e.target.value })} disabled={submitting} />
        <Button type="submit" className="mt-auto" disabled={submitting}>{submitting ? <><Loader2 size={16} className="animate-spin" /> Creating…</> : <><Plus size={16} /> Create</>}</Button>
      </form>
      <List rows={sections.map(s => ({ id: s.id, text: `${s.department} · ${s.class_name} · ${s.section}`, onDelete: () => deleteClassSection(s.id) }))} reload={load} />
    </>}

    {mode === "teachers" && <>
      <form onSubmit={submitTeacher} className="mb-6 grid gap-3 rounded-2xl border border-white/10 bg-white/5 p-5 md:grid-cols-4">
        <Input label="Username" value={teacherForm.username} onChange={e => setTeacherForm({ ...teacherForm, username: e.target.value })} disabled={submitting} />
        <Input label="Name" value={teacherForm.name} onChange={e => setTeacherForm({ ...teacherForm, name: e.target.value })} disabled={submitting} />
        <Input label="Email" type="email" value={teacherForm.email} onChange={e => setTeacherForm({ ...teacherForm, email: e.target.value })} disabled={submitting} />
        <Input label="Password" type="password" value={teacherForm.password} onChange={e => setTeacherForm({ ...teacherForm, password: e.target.value })} disabled={submitting} />
        <Button type="submit" disabled={submitting}>{submitting ? <><Loader2 size={16} className="animate-spin" /> Creating…</> : <><Plus size={16} /> Create Teacher</>}</Button>
      </form>
      <form onSubmit={submitAssignment} className="mb-6 grid gap-3 rounded-2xl border border-white/10 bg-white/5 p-5 md:grid-cols-3">
        <select disabled={submitting} className="rounded-xl border border-white/10 bg-[#0F172A] px-3 py-2.5 text-sm text-white disabled:opacity-50" value={assignment.teacherId} onChange={e => setAssignment({ ...assignment, teacherId: e.target.value })}><option value="">Select teacher</option>{teachers.map(t => <option key={t.id} value={t.id}>{t.name} ({t.username})</option>)}</select>
        <select disabled={submitting} className="rounded-xl border border-white/10 bg-[#0F172A] px-3 py-2.5 text-sm text-white disabled:opacity-50" value={assignment.classSectionId} onChange={e => setAssignment({ ...assignment, classSectionId: e.target.value })}><option value="">Select class</option>{sections.map(s => <option key={s.id} value={s.id}>{sectionName(s.id)}</option>)}</select>
        <Button type="submit" disabled={submitting}>{submitting ? <><Loader2 size={16} className="animate-spin" /> Assigning…</> : "Assign Class"}</Button>
      </form>
      <List rows={teachers.map(t => ({ id: t.id, text: `${t.name} · ${t.username} · ${t.email || "no email"}`, onDelete: undefined }))} reload={load} />
    </>}

    {mode === "lectures" && <>
      <form onSubmit={submitLecture} className="mb-6 grid gap-3 rounded-2xl border border-white/10 bg-white/5 p-5 md:grid-cols-3">
        <Input label="Subject" value={lectureForm.subject} onChange={e => setLectureForm({ ...lectureForm, subject: e.target.value })} disabled={submitting} />
        <select disabled={submitting} className="rounded-xl border border-white/10 bg-[#0F172A] px-3 py-2.5 text-sm text-white disabled:opacity-50" value={lectureForm.classSectionId} onChange={e => setLectureForm({ ...lectureForm, classSectionId: e.target.value })}><option value="">Class section</option>{sections.map(s => <option key={s.id} value={s.id}>{sectionName(s.id)}</option>)}</select>
        <select disabled={submitting} className="rounded-xl border border-white/10 bg-[#0F172A] px-3 py-2.5 text-sm text-white disabled:opacity-50" value={lectureForm.teacherId} onChange={e => setLectureForm({ ...lectureForm, teacherId: e.target.value })}><option value="">Teacher</option>{teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select>
        <Input label="Date" type="date" value={lectureForm.date} onChange={e => setLectureForm({ ...lectureForm, date: e.target.value })} disabled={submitting} />
        <Input label="Start" type="time" value={lectureForm.start} onChange={e => setLectureForm({ ...lectureForm, start: e.target.value })} disabled={submitting} />
        <Input label="End" type="time" value={lectureForm.end} onChange={e => setLectureForm({ ...lectureForm, end: e.target.value })} disabled={submitting} />
        <Button type="submit" disabled={submitting}>{submitting ? <><Loader2 size={16} className="animate-spin" /> Creating…</> : <><Plus size={16} /> Create Lecture</>}</Button>
      </form>
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5">
        {lectures.length === 0 ? <div className="p-8 text-center text-sm text-slate-400">No lectures found.</div> : lectures.map(l => (
          <div key={l.id} className="flex flex-col gap-3 border-b border-white/5 px-4 py-4 last:border-0 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="text-sm font-medium text-slate-100">{l.subject} <span className={l.status === "Cancelled" ? "text-red-400" : "text-emerald-400"}>· {l.status}</span></div>
              <div className="mt-1 text-xs text-slate-400">{l.lecture_date} · {sectionName(l.class_section_id)} · {teacherName(l.teacher_id)} · {l.start_time}–{l.end_time}</div>
            </div>
            <div className="flex items-center gap-2">
              {l.status !== "Cancelled" && <button disabled={cancellingId !== null} onClick={() => void handleCancelLecture(l)} className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs text-amber-300 hover:bg-amber-500/10 disabled:opacity-50"><XCircle size={15} />{cancellingId === l.id ? "Cancelling…" : "Cancel"}</button>}
              <button disabled={cancellingId !== null} aria-label={`Delete ${l.subject}`} onClick={async () => { if (!confirm("Delete this lecture?")) return; try { await deleteLecture(l.id); await load(); toast.success("Deleted"); } catch (error: any) { toast.error(error?.message || "Delete failed"); } }} className="rounded-lg p-2 text-slate-400 hover:bg-red-500/10 hover:text-red-400 disabled:opacity-50"><Trash2 size={15} /></button>
            </div>
          </div>
        ))}
      </div>
    </>}

    {mode === "schedules" && <>
      <form onSubmit={submitSchedule} className="mb-6 grid gap-3 rounded-2xl border border-white/10 bg-white/5 p-5 md:grid-cols-3">
        <Input label="Subject" value={scheduleForm.subject} onChange={e => setScheduleForm({ ...scheduleForm, subject: e.target.value })} disabled={submitting} />
        <select disabled={submitting} className="rounded-xl border border-white/10 bg-[#0F172A] px-3 py-2.5 text-sm text-white disabled:opacity-50" value={scheduleForm.classSectionId} onChange={e => setScheduleForm({ ...scheduleForm, classSectionId: e.target.value })}><option value="">Class section</option>{sections.map(s => <option key={s.id} value={s.id}>{sectionName(s.id)}</option>)}</select>
        <select disabled={submitting} className="rounded-xl border border-white/10 bg-[#0F172A] px-3 py-2.5 text-sm text-white disabled:opacity-50" value={scheduleForm.day} onChange={e => setScheduleForm({ ...scheduleForm, day: e.target.value })}>{DAYS.map(([id, name]) => <option key={id} value={id}>{name}</option>)}</select>
        <Input label="Start" type="time" value={scheduleForm.start} onChange={e => setScheduleForm({ ...scheduleForm, start: e.target.value })} disabled={submitting} />
        <Input label="End" type="time" value={scheduleForm.end} onChange={e => setScheduleForm({ ...scheduleForm, end: e.target.value })} disabled={submitting} />
        <Button type="submit" disabled={submitting}>{submitting ? <><Loader2 size={16} className="animate-spin" /> Adding…</> : <><Plus size={16} /> Add Weekly Lecture</>}</Button>
      </form>
      <List rows={schedules.map(s => ({ id: s.id, text: `${DAYS[s.day_of_week]?.[1] || "Day"} · ${s.subject} · ${sectionName(s.class_section_id)} · ${s.start_time}–${s.end_time}`, onDelete: () => deleteLectureSchedule(s.id) }))} reload={load} />
    </>}

    {mode === "closures" && <>
      <form onSubmit={submitClosure} className="mb-6 grid gap-3 rounded-2xl border border-white/10 bg-white/5 p-5 md:grid-cols-3">
        <Input label="Date" type="date" value={closureForm.date} onChange={e => setClosureForm({ ...closureForm, date: e.target.value })} disabled={submitting} />
        <select disabled={submitting} className="rounded-xl border border-white/10 bg-[#0F172A] px-3 py-2.5 text-sm text-white disabled:opacity-50" value={closureForm.reason} onChange={e => setClosureForm({ ...closureForm, reason: e.target.value })}><option>Holiday</option><option>Event</option><option>Emergency</option><option>Other</option></select>
        <Input label="Description" value={closureForm.description} onChange={e => setClosureForm({ ...closureForm, description: e.target.value })} disabled={submitting} />
        <Button type="submit" disabled={submitting}>{submitting ? <><Loader2 size={16} className="animate-spin" /> Saving…</> : <><Plus size={16} /> Close College</>}</Button>
      </form>
      <List rows={closures.map(c => ({ id: c.id, text: `${c.closure_date} · ${c.reason} · ${c.description || "No description"}`, onDelete: () => deleteCollegeClosure(c.id) }))} reload={load} />
    </>}
  </PageWrap>;
}

function List({ rows, reload }: { rows: { id: number; text: string; onDelete?: () => Promise<any> }[]; reload: () => Promise<void> }) {
  const [deletingId, setDeletingId] = useState<number | null>(null);
  return <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5">
    {rows.length === 0 ? <div className="p-8 text-center text-sm text-slate-400">No records found.</div> : rows.map(row => (
      <div key={row.id} className="flex items-center justify-between gap-4 border-b border-white/5 px-4 py-3 last:border-0">
        <span className="text-sm text-slate-200">{row.text}</span>
        {row.onDelete && <button disabled={deletingId !== null} aria-label={`Delete ${row.text}`} className="rounded-lg p-2 text-slate-400 hover:bg-red-500/10 hover:text-red-400 disabled:cursor-not-allowed disabled:opacity-50" onClick={async () => { if (!confirm("Delete this record?")) return; setDeletingId(row.id); try { await row.onDelete?.(); await reload(); toast.success("Deleted"); } catch (error: any) { toast.error(error?.message || "Delete failed"); } finally { setDeletingId(null); } }}>{deletingId === row.id ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}</button>}
      </div>
    ))}
  </div>;
}
