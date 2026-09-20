import Modal from "../ui/Modal";
import Badge from "../ui/Badge";
import Avatar from "../ui/Avatar";
import type { Student } from "../../types";

interface StudentViewModalProps {
  open: boolean;
  student: Student | null;
  onClose: () => void;
}

function normalizeClassYear(value?: string | null) {
  if (!value) return "";
  const normalized = value.trim().toUpperCase();
  const map: Record<string, string> = { "1": "FY", "2": "SY", "3": "TY", "4": "4Y", "5": "5Y", "6": "6Y", "7": "7Y", "8": "8Y", "9": "9Y", "10": "10Y", "FIRST YEAR": "FY", "SECOND YEAR": "SY", "THIRD YEAR": "TY", "FOURTH YEAR": "4Y", "FIFTH YEAR": "5Y", "SIXTH YEAR": "6Y" };
  return map[normalized] ?? value;
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
      <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500">{label}</p>
      <p className="mt-1 break-words text-sm text-white">{value || "—"}</p>
    </div>
  );
}

export default function StudentViewModal({ open, student, onClose }: StudentViewModalProps) {
  if (!student) return null;

  return (
    <Modal open={open} onClose={onClose} title="Student Details">
      <div className="space-y-5">
        <div className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <Avatar name={student.name} size="lg" />
          <div className="min-w-0">
            <h3 className="truncate text-lg font-semibold text-white">{student.name}</h3>
            <p className="text-sm text-slate-400">Roll No: {student.roll_no}</p>
            <div className="mt-2">
              {student.has_face ? <Badge variant="success">Face Registered</Badge> : <Badge variant="warning">Face Not Registered</Badge>}
            </div>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <Detail label="Roll No" value={student.roll_no} />
          <Detail label="Department" value={student.department} />
          <Detail label="Class" value={normalizeClassYear(student.class_name)} />
          <Detail label="Section" value={student.section ?? ""} />
          <Detail label="Email" value={student.email ?? ""} />
          <Detail label="Phone" value={student.phone_no ?? ""} />
        </div>

        <div className="rounded-xl border border-blue-400/10 bg-blue-500/5 p-3 text-xs leading-5 text-slate-400">
          Student ID: {student.id} · Class section ID: {student.class_section_id ?? "—"}
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-white/10"
        >
          Close
        </button>
      </div>
    </Modal>
  );
}
