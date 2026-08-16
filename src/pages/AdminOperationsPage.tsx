import { FormEvent, useEffect, useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import PageWrap from "../components/layout/PageWrap";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import {
  assignTeacherClass,
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

interface Props {
  mode: Mode;
}

const DAYS = [
  [0, "Monday"], [1, "Tuesday"], [2, "Wednesday"], [3, "Thursday"], [4, "Friday"], [5, "Saturday"], [6, "Sunday"],
] as const;

export default function AdminOperationsPage({ mode }: Props) {
  const [sections, setSections] = useState<ClassSection[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [schedules, setSchedules] = useState<LectureSchedule[]>([]);
  const [closures, setClosures] = useState<CollegeClosure[]>([]);
  const [loading, setLoading] = useState(true);

  const [sectionForm, setSectionForm] = useState({ department: "", class_name: "", section: "" });
  const [teacherForm, setTeacherForm] = useState({ username: "", name: "", email: "", password: "" });
  const [assignment, setAssignment] = useState({ teacherId: "", classSectionId: "" });
  const [lectureForm, setLectureForm] = useState({ subject: "", classSectionId: "", teacherId: "", date: "", start: "", end: "" });
  const [scheduleForm, setScheduleForm] = useState({ subject: "", classSectionId: "", day: "0", start: "", end: "" });
  const [closureForm, setClosureForm] = useState({ date: "", reason: "Holiday", description: "" });

  async function load() {
    setLoading(true);
    try {
      const [s, t, l, w, c] = await Promise.all([
        fetchClassSections(),
        fetchTeachers(),
        fetchLectures(),
        fetchLectureSchedules(),
        fetchCollegeClosures(),
      ]);
      setSections(s); setTeachers(t); setLectures(l); setSchedules(w); setClosures(c);
    } catch (error: any) {
      toast.error(error?.message || "Failed to load admin data");
    } finally { setLoading(false); }
  }

  useEffect(() => { void load(); }, []);

  const title = useMemo(() => ({
    "class-sections": "Class Sections",
    teachers: "Teachers",
    lectures: "Lectures",
    schedules: "Weekly Schedule",
    closures: "College Closures",
  }[mode]), [mode]);

  async function submitSection(e: FormEvent) {
    e.preventDefault();
    try { await createClassSection(sectionForm); setSectionForm({ department: "", class_name: "", section: "" }); await load(); toast.success("Class section created"); }
    catch (error: any) { toast.error(error?.message || "Could not create class section"); }
  }

  async function submitTeacher(e: FormEvent) {
    e.preventDefault();
    try { await createTeacher({ ...teacherForm, email: teacherForm.email || undefined }); setTeacherForm({ username: "", name: "", email: "", password: "" }); await load(); toast.success("Teacher created"); }
    catch (error: any) { toast.error(error?.message || "Could not create teacher"); }
  }

  async function submitAssignment(e: FormEvent) {
    e.preventDefault();
    if (!assignment.teacherId || !assignment.classSectionId) return;
    try { await assignTeacherClass(Number(assignment.teacherId), Number(assignment.classSectionId)); toast.success("Teacher assigned to class"); }
    catch (error: any) { toast.error(error?.message || "Could not assign teacher"); }
  }

  async function submitLecture(e: FormEvent) {
    e.preventDefault();
    try {
      await createLecture({ subject: lectureForm.subject, class_section_id: lectureForm.classSectionId ? Number(lectureForm.classSectionId) : null, teacher_id: lectureForm.teacherId ? Number(lectureForm.teacherId) : null, lecture_date: lectureForm.date, start_time: lectureForm.start, end_time: lectureForm.end });
      setLectureForm({ subject: "", classSectionId: "", teacherId: "", date: "", start: "", end: "" }); await load(); toast.success("Lecture created");
    } catch (error: any) { toast.error(error?.message || "Could not create lecture"); }
  }

  async function submitSchedule(e: FormEvent) {
    e.preventDefault();
    try {
      await createLectureSchedule({ subject: scheduleForm.subject, class_section_id: scheduleForm.classSectionId ? Number(scheduleForm.classSectionId) : null, day_of_week: Number(scheduleForm.day), start_time: scheduleForm.start, end_time: scheduleForm.end });
      setScheduleForm({ subject: "", classSectionId: "", day: "0", start: "", end: "" }); await load(); toast.success("Weekly schedule created");
    } catch (error: any) { toast.error(error?.message || "Could not create schedule"); }
  }

  async function submitClosure(e: FormEvent) {
    e.preventDefault();
    try { await createCollegeClosure({ closure_date: closureForm.date, reason: closureForm.reason as any, description: closureForm.description || null }); setClosureForm({ date: "", reason: "Holiday", description: "" }); await load(); toast.success("College closure created"); }
    catch (error: any) { toast.error(error?.message || "Could not create closure"); }
  }

  const sectionName = (id?: number | null) => { const s = sections.find(x => x.id === id); return s ? `${s.department} · ${s.class_name} · ${s.section}` : "Unassigned"; };
  const teacherName = (id?: number | null) => teachers.find(x => x.id === id)?.name || "Unassigned";

  if (loading) return <PageWrap><div className="py-16 text-center text-slate-400">Loading…</div></PageWrap>;

  return <PageWrap>
    <div className="mb-6"><h1 className="text-2xl font-bold text-white">{title}</h1><p className="mt-1 text-sm text-slate-400">Manage this data using the current FaceTrack backend.</p></div>

    {mode === "class-sections" && <>
      <form onSubmit={submitSection} className="mb-6 grid gap-3 rounded-2xl border border-white/10 bg-white/5 p-5 md:grid-cols-4">
        <Input label="Department" value={sectionForm.department} onChange={e => setSectionForm({ ...sectionForm, department: e.target.value })} />
        <Input label="Class" value={sectionForm.class_name} onChange={e => setSectionForm({ ...sectionForm, class_name: e.target.value })} />
        <Input label="Section" value={sectionForm.section} onChange={e => setSectionForm({ ...sectionForm, section: e.target.value })} />
        <Button type="submit" className="mt-auto"><Plus size={16} /> Create</Button>
      </form>
      <List rows={sections.map(s => ({ id: s.id, text: `${s.department} · ${s.class_name} · ${s.section}`, onDelete: () => deleteClassSection(s.id) }))} reload={load} />
    </>}

    {mode === "teachers" && <>
      <form onSubmit={submitTeacher} className="mb-6 grid gap-3 rounded-2xl border border-white/10 bg-white/5 p-5 md:grid-cols-4">
        <Input label="Username" value={teacherForm.username} onChange={e => setTeacherForm({ ...teacherForm, username: e.target.value })} />
        <Input label="Name" value={teacherForm.name} onChange={e => setTeacherForm({ ...teacherForm, name: e.target.value })} />
        <Input label="Email" type="email" value={teacherForm.email} onChange={e => setTeacherForm({ ...teacherForm, email: e.target.value })} />
        <Input label="Password" type="password" value={teacherForm.password} onChange={e => setTeacherForm({ ...teacherForm, password: e.target.value })} />
        <Button type="submit"><Plus size={16} /> Create Teacher</Button>
      </form>
      <form onSubmit={submitAssignment} className="mb-6 grid gap-3 rounded-2xl border border-white/10 bg-white/5 p-5 md:grid-cols-3">
        <select className="rounded-xl border border-white/10 bg-[#0F172A] px-3 py-2.5 text-sm text-white" value={assignment.teacherId} onChange={e => setAssignment({ ...assignment, teacherId: e.target.value })}><option value="">Select teacher</option>{teachers.map(t => <option key={t.id} value={t.id}>{t.name} ({t.username})</option>)}</select>
        <select className="rounded-xl border border-white/10 bg-[#0F172A] px-3 py-2.5 text-sm text-white" value={assignment.classSectionId} onChange={e => setAssignment({ ...assignment, classSectionId: e.target.value })}><option value="">Select class</option>{sections.map(s => <option key={s.id} value={s.id}>{sectionName(s.id)}</option>)}</select>
        <Button type="submit">Assign Class</Button>
      </form>
      <List rows={teachers.map(t => ({ id: t.id, text: `${t.name} · ${t.username} · ${t.email || "no email"}`, onDelete: undefined }))} reload={load} />
    </>}

    {mode === "lectures" && <>
      <form onSubmit={submitLecture} className="mb-6 grid gap-3 rounded-2xl border border-white/10 bg-white/5 p-5 md:grid-cols-3">
        <Input label="Subject" value={lectureForm.subject} onChange={e => setLectureForm({ ...lectureForm, subject: e.target.value })} />
        <select className="rounded-xl border border-white/10 bg-[#0F172A] px-3 py-2.5 text-sm text-white" value={lectureForm.classSectionId} onChange={e => setLectureForm({ ...lectureForm, classSectionId: e.target.value })}><option value="">Class section</option>{sections.map(s => <option key={s.id} value={s.id}>{sectionName(s.id)}</option>)}</select>
        <select className="rounded-xl border border-white/10 bg-[#0F172A] px-3 py-2.5 text-sm text-white" value={lectureForm.teacherId} onChange={e => setLectureForm({ ...lectureForm, teacherId: e.target.value })}><option value="">Teacher</option>{teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select>
        <Input label="Date" type="date" value={lectureForm.date} onChange={e => setLectureForm({ ...lectureForm, date: e.target.value })} />
        <Input label="Start" type="time" value={lectureForm.start} onChange={e => setLectureForm({ ...lectureForm, start: e.target.value })} />
        <Input label="End" type="time" value={lectureForm.end} onChange={e => setLectureForm({ ...lectureForm, end: e.target.value })} />
        <Button type="submit"><Plus size={16} /> Create Lecture</Button>
      </form>
      <List rows={lectures.map(l => ({ id: l.id, text: `${l.lecture_date} · ${l.subject} · ${sectionName(l.class_section_id)} · ${teacherName(l.teacher_id)} · ${l.start_time}–${l.end_time} · ${l.status}`, onDelete: l.status === "Cancelled" ? undefined : () => deleteLecture(l.id) }))} reload={load} />
    </>}

    {mode === "schedules" && <>
      <form onSubmit={submitSchedule} className="mb-6 grid gap-3 rounded-2xl border border-white/10 bg-white/5 p-5 md:grid-cols-3">
        <Input label="Subject" value={scheduleForm.subject} onChange={e => setScheduleForm({ ...scheduleForm, subject: e.target.value })} />
        <select className="rounded-xl border border-white/10 bg-[#0F172A] px-3 py-2.5 text-sm text-white" value={scheduleForm.classSectionId} onChange={e => setScheduleForm({ ...scheduleForm, classSectionId: e.target.value })}><option value="">Class section</option>{sections.map(s => <option key={s.id} value={s.id}>{sectionName(s.id)}</option>)}</select>
        <select className="rounded-xl border border-white/10 bg-[#0F172A] px-3 py-2.5 text-sm text-white" value={scheduleForm.day} onChange={e => setScheduleForm({ ...scheduleForm, day: e.target.value })}>{DAYS.map(([id, name]) => <option key={id} value={id}>{name}</option>)}</select>
        <Input label="Start" type="time" value={scheduleForm.start} onChange={e => setScheduleForm({ ...scheduleForm, start: e.target.value })} />
        <Input label="End" type="time" value={scheduleForm.end} onChange={e => setScheduleForm({ ...scheduleForm, end: e.target.value })} />
        <Button type="submit"><Plus size={16} /> Add Weekly Lecture</Button>
      </form>
      <List rows={schedules.map(s => ({ id: s.id, text: `${DAYS[s.day_of_week]?.[1] || "Day"} · ${s.subject} · ${sectionName(s.class_section_id)} · ${s.start_time}–${s.end_time}`, onDelete: () => deleteLectureSchedule(s.id) }))} reload={load} />
    </>}

    {mode === "closures" && <>
      <form onSubmit={submitClosure} className="mb-6 grid gap-3 rounded-2xl border border-white/10 bg-white/5 p-5 md:grid-cols-3">
        <Input label="Date" type="date" value={closureForm.date} onChange={e => setClosureForm({ ...closureForm, date: e.target.value })} />
        <select className="rounded-xl border border-white/10 bg-[#0F172A] px-3 py-2.5 text-sm text-white" value={closureForm.reason} onChange={e => setClosureForm({ ...closureForm, reason: e.target.value })}><option>Holiday</option><option>Event</option><option>Emergency</option><option>Other</option></select>
        <Input label="Description" value={closureForm.description} onChange={e => setClosureForm({ ...closureForm, description: e.target.value })} />
        <Button type="submit"><Plus size={16} /> Close College</Button>
      </form>
      <List rows={closures.map(c => ({ id: c.id, text: `${c.closure_date} · ${c.reason} · ${c.description || "No description"}`, onDelete: () => deleteCollegeClosure(c.id) }))} reload={load} />
    </>}
  </PageWrap>;
}

function List({ rows, reload }: { rows: { id: number; text: string; onDelete?: () => Promise<any> }[]; reload: () => Promise<void> }) {
  return <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5">{rows.length === 0 ? <div className="p-8 text-center text-sm text-slate-400">No records found.</div> : rows.map(row => <div key={row.id} className="flex items-center justify-between gap-4 border-b border-white/5 px-4 py-3 last:border-0"><span className="text-sm text-slate-200">{row.text}</span>{row.onDelete && <button className="rounded-lg p-2 text-slate-400 hover:bg-red-500/10 hover:text-red-400" onClick={async () => { if (!confirm("Delete this record?")) return; try { await row.onDelete?.(); await reload(); toast.success("Deleted"); } catch (error: any) { toast.error(error?.message || "Delete failed"); } }}><Trash2 size={15} /></button>}</div>)}</div>;
}
