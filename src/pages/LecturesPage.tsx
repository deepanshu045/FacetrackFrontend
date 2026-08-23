import { FormEvent, useEffect, useMemo, useState } from "react";
import { Loader2, Pencil, XCircle } from "lucide-react";
import { toast } from "sonner";
import PageWrap from "../components/layout/PageWrap";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import { cancelLecture, fetchClassSections, fetchLectures, fetchTeachers, updateLecture } from "../services/api";
import type { ClassSection, Lecture, Teacher } from "../types";

const isoDate = (d: Date) => {
  const copy = new Date(d);
  copy.setMinutes(copy.getMinutes() - copy.getTimezoneOffset());
  return copy.toISOString().slice(0, 10);
};

export default function LecturesPage() {
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [sections, setSections] = useState<ClassSection[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [workingId, setWorkingId] = useState<number | null>(null);
  const [editing, setEditing] = useState<Lecture | null>(null);
  const [saving, setSaving] = useState(false);
  const [classFilter, setClassFilter] = useState("");

  const today = useMemo(() => new Date(), []);
  const end = useMemo(() => {
    const d = new Date(today);
    d.setDate(d.getDate() + 30);
    return d;
  }, [today]);

  async function load() {
    setLoading(true);
    try {
      const [l, s, t] = await Promise.all([
        fetchLectures(isoDate(today), isoDate(end)),
        fetchClassSections(),
        fetchTeachers(),
      ]);
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

  const filteredLectures = useMemo(
    () => classFilter
      ? lectures.filter(l => String(l.class_section_id) === classFilter)
      : lectures,
    [lectures, classFilter],
  );

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

  function startEdit(l: Lecture) { setEditing(l); }

  async function saveEdit(e: FormEvent) {
    e.preventDefault();
    if (!editing) return;
    if (editing.end_time <= editing.start_time) {
      toast.error("End time must be after start time");
      return;
    }
    setSaving(true);
    try {
      await updateLecture(editing.id, {
        subject: editing.subject,
        lecture_date: editing.lecture_date,
        start_time: editing.start_time,
        end_time: editing.end_time,
        teacher_id: editing.teacher_id ?? null,
        class_section_id: editing.class_section_id ?? null,
      });
      setEditing(null);
      await load();
      toast.success("Lecture occurrence updated");
    } catch (e: any) {
      toast.error(e?.message || "Could not update lecture");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <PageWrap><div className="flex min-h-64 items-center justify-center gap-3 text-slate-400"><Loader2 size={20} className="animate-spin"/><span>Generating and loading lectures…</span></div></PageWrap>;

  return <PageWrap>
    <div className="mb-6">
      <h1 className="text-2xl font-bold text-white">Lectures</h1>
      <p className="mt-1 text-sm text-slate-400">These are actual dated lecture instances generated from the Weekly Schedule. Changes here affect only this occurrence.</p>
    </div>

    {editing && <form onSubmit={saveEdit} className="mb-6 grid gap-3 rounded-2xl border border-white/10 bg-white/5 p-5 md:grid-cols-4">
      <Input label="Subject" value={editing.subject} onChange={e => setEditing({...editing, subject: e.target.value})} disabled={saving}/>
      <Input label="Date" type="date" value={editing.lecture_date} onChange={e => setEditing({...editing, lecture_date: e.target.value})} disabled={saving}/>
      <Input label="Start" type="time" value={editing.start_time} onChange={e => setEditing({...editing, start_time: e.target.value})} disabled={saving}/>
      <Input label="End" type="time" value={editing.end_time} onChange={e => setEditing({...editing, end_time: e.target.value})} disabled={saving}/>
      <label className="block md:col-span-2"><span className="mb-1.5 block text-sm font-medium text-slate-300">Teacher</span><select value={editing.teacher_id ?? ""} onChange={e => setEditing({...editing, teacher_id: e.target.value ? Number(e.target.value) : null})} disabled={saving} className="w-full rounded-xl border border-white/10 bg-[#0F172A] px-3 py-2.5 text-sm text-white"><option value="">No teacher</option>{teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select></label>
      <div className="flex items-end gap-2"><Button type="submit" disabled={saving}>{saving ? <><Loader2 size={16} className="animate-spin"/> Saving…</> : "Save occurrence"}</Button><Button type="button" disabled={saving} onClick={() => setEditing(null)}>Close</Button></div>
    </form>}

    <div className="mb-4 rounded-xl border border-blue-400/10 bg-blue-400/5 px-4 py-3 text-xs text-blue-200">Showing the next 31 days. Creating or loading this page materializes missing lectures from active weekly schedule entries. Cancelled occurrences are not regenerated.</div>

    <div className="mb-4 flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 md:flex-row md:items-center">
      <div className="flex-1">
        <label htmlFor="lecture-class-filter" className="mb-1.5 block text-xs font-medium text-slate-400">Filter lectures by class</label>
        <select
          id="lecture-class-filter"
          value={classFilter}
          onChange={e => setClassFilter(e.target.value)}
          className="w-full rounded-xl border border-white/10 bg-[#0F172A] px-3 py-2.5 text-sm text-white"
        >
          <option value="">All classes</option>
          {sections.map(s => <option key={s.id} value={s.id}>{sectionName(s.id)}</option>)}
        </select>
      </div>
      <div className="text-xs text-slate-400 md:pt-5">Showing {filteredLectures.length} of {lectures.length} lectures</div>
      {classFilter && <button type="button" onClick={() => setClassFilter("")} className="rounded-xl border border-white/10 px-4 py-2.5 text-sm text-slate-300 hover:bg-white/5">Clear filter</button>}
    </div>

    <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5">
      {filteredLectures.length === 0 ? <div className="p-8 text-center text-sm text-slate-400">No lectures found for this class.</div> : filteredLectures.map(l => <div key={l.id} className="flex flex-col gap-3 border-b border-white/5 px-4 py-4 last:border-0 md:flex-row md:items-center md:justify-between"><div className="min-w-0"><div className="text-sm font-medium text-slate-100">{l.subject} <span className={l.status === "Cancelled" ? "text-red-400" : "text-emerald-400"}>· {l.status}</span></div><div className="mt-1 text-xs text-slate-300">{l.lecture_date} · {l.start_time} – {l.end_time}</div><div className="mt-1 text-xs text-slate-500">{sectionName(l.class_section_id)} · {teachers.find(t => t.id === l.teacher_id)?.name || "No teacher"}</div></div><div className="flex shrink-0 gap-2"><Button type="button" disabled={l.status === "Cancelled" || workingId !== null} onClick={() => startEdit(l)}><Pencil size={15}/> Edit</Button><Button type="button" disabled={l.status === "Cancelled" || workingId !== null} onClick={() => void cancel(l)}>{workingId === l.id ? <Loader2 size={15} className="animate-spin"/> : <XCircle size={15}/>} Cancel</Button></div></div>)}
    </div>
  </PageWrap>;
}
