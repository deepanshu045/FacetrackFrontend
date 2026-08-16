import { FormEvent, useEffect, useMemo, useState } from "react";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import PageWrap from "../components/layout/PageWrap";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import { createLectureSchedule, deleteLectureSchedule, fetchClassSections, fetchLectureSchedules } from "../services/api";
import type { ClassSection, LectureSchedule } from "../types";

const DAYS = [
  [0, "Monday"],
  [1, "Tuesday"],
  [2, "Wednesday"],
  [3, "Thursday"],
  [4, "Friday"],
  [5, "Saturday"],
  [6, "Sunday"],
] as const;

const EMPTY_FORM = {
  subject: "",
  classSectionId: "",
  day: "0",
  start: "",
  end: "",
};

export default function WeeklySchedulePage() {
  const [schedules, setSchedules] = useState<LectureSchedule[]>([]);
  const [sections, setSections] = useState<ClassSection[]>([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  async function load() {
    setLoading(true);
    try {
      const [weeklySchedules, classSections] = await Promise.all([
        fetchLectureSchedules(),
        fetchClassSections(),
      ]);
      setSchedules(weeklySchedules);
      setSections(classSections);
    } catch (error: any) {
      toast.error(error?.message || "Failed to load weekly schedule");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const sectionName = (id: number | null | undefined) => {
    const section = sections.find((item) => item.id === id);
    return section
      ? `${section.department} · ${section.class_name} · ${section.section}`
      : "Unassigned";
  };

  const groupedSchedules = useMemo(() => {
    return DAYS.map(([day]) => ({
      day,
      schedules: schedules
        .filter((schedule) => schedule.day_of_week === day)
        .sort((a, b) => a.start_time.localeCompare(b.start_time)),
    }));
  }, [schedules]);

  async function submit(e: FormEvent) {
    e.preventDefault();

    if (!form.subject.trim() || !form.classSectionId || !form.start || !form.end) {
      toast.error("Subject, class section, start time and end time are required");
      return;
    }

    if (form.end <= form.start) {
      toast.error("End time must be after start time");
      return;
    }

    setSubmitting(true);
    try {
      await createLectureSchedule({
        subject: form.subject.trim(),
        class_section_id: Number(form.classSectionId),
        day_of_week: Number(form.day),
        start_time: form.start,
        end_time: form.end,
      });

      setForm(EMPTY_FORM);
      await load();
      toast.success("Weekly schedule created");
    } catch (error: any) {
      toast.error(error?.message || "Could not create weekly schedule");
    } finally {
      setSubmitting(false);
    }
  }

  async function removeSchedule(schedule: LectureSchedule) {
    if (!confirm(`Delete ${schedule.subject} from the weekly schedule?`)) return;

    setDeletingId(schedule.id);
    try {
      await deleteLectureSchedule(schedule.id);
      await load();
      toast.success("Weekly schedule deleted");
    } catch (error: any) {
      toast.error(error?.message || "Could not delete weekly schedule");
    } finally {
      setDeletingId(null);
    }
  }

  if (loading) {
    return (
      <PageWrap>
        <div className="flex min-h-64 items-center justify-center gap-3 text-slate-400">
          <Loader2 size={20} className="animate-spin" />
          <span>Loading weekly schedule…</span>
        </div>
      </PageWrap>
    );
  }

  return (
    <PageWrap>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Weekly Schedule</h1>
        <p className="mt-1 text-sm text-slate-400">
          Create recurring lectures. The backend uses the selected day and time to generate scheduled lectures.
        </p>
      </div>

      <form
        onSubmit={submit}
        className="mb-6 grid gap-3 rounded-2xl border border-white/10 bg-white/5 p-5 md:grid-cols-3"
      >
        <Input
          label="Subject"
          value={form.subject}
          onChange={(e) => setForm({ ...form, subject: e.target.value })}
          disabled={submitting}
          placeholder="Database Management"
        />

        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-slate-300">Class Section</span>
          <select
            required
            disabled={submitting}
            value={form.classSectionId}
            onChange={(e) => setForm({ ...form, classSectionId: e.target.value })}
            className="w-full rounded-xl border border-white/10 bg-[#0F172A] px-3 py-2.5 text-sm text-white disabled:opacity-50"
          >
            <option value="">Select class section</option>
            {sections.map((section) => (
              <option key={section.id} value={section.id}>
                {sectionName(section.id)}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-slate-300">Day</span>
          <select
            disabled={submitting}
            value={form.day}
            onChange={(e) => setForm({ ...form, day: e.target.value })}
            className="w-full rounded-xl border border-white/10 bg-[#0F172A] px-3 py-2.5 text-sm text-white disabled:opacity-50"
          >
            {DAYS.map(([id, name]) => (
              <option key={id} value={id}>{name}</option>
            ))}
          </select>
        </label>

        <Input
          label="Start"
          type="time"
          value={form.start}
          onChange={(e) => setForm({ ...form, start: e.target.value })}
          disabled={submitting}
        />
        <Input
          label="End"
          type="time"
          value={form.end}
          onChange={(e) => setForm({ ...form, end: e.target.value })}
          disabled={submitting}
        />

        <Button type="submit" className="mt-auto" disabled={submitting}>
          {submitting ? (
            <><Loader2 size={16} className="animate-spin" /> Saving…</>
          ) : (
            <><Plus size={16} /> Add Schedule</>
          )}
        </Button>
      </form>

      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        {groupedSchedules.map(({ day, schedules: daySchedules }) => {
          const dayName = DAYS.find(([id]) => id === day)?.[1] || "Day";

          return (
            <section key={day} className="overflow-hidden rounded-2xl border border-white/10 bg-white/5">
              <div className="border-b border-white/10 bg-white/[0.03] px-4 py-3">
                <h2 className="text-sm font-semibold text-white">{dayName}</h2>
                <p className="mt-0.5 text-xs text-slate-500">
                  {daySchedules.length} {daySchedules.length === 1 ? "lecture" : "lectures"}
                </p>
              </div>

              {daySchedules.length === 0 ? (
                <div className="p-5 text-sm text-slate-500">No lectures scheduled.</div>
              ) : (
                <div className="divide-y divide-white/5">
                  {daySchedules.map((schedule) => (
                    <div key={schedule.id} className="flex items-start justify-between gap-3 p-4">
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-slate-100">{schedule.subject}</div>
                        <div className="mt-1 text-xs font-medium text-slate-300">
                          {schedule.start_time} – {schedule.end_time}
                        </div>
                        <div className="mt-1 text-xs text-slate-500">
                          {sectionName(schedule.class_section_id)}
                        </div>
                      </div>

                      <button
                        type="button"
                        disabled={deletingId !== null}
                        aria-label={`Delete ${schedule.subject}`}
                        onClick={() => void removeSchedule(schedule)}
                        className="shrink-0 rounded-lg p-2 text-slate-400 hover:bg-red-500/10 hover:text-red-400 disabled:opacity-50"
                      >
                        {deletingId === schedule.id ? (
                          <Loader2 size={15} className="animate-spin" />
                        ) : (
                          <Trash2 size={15} />
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>
          );
        })}
      </div>
    </PageWrap>
  );
}
