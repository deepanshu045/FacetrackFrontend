import { Dispatch, SetStateAction } from "react";

import Button from "../ui/Button";
import Input from "../ui/Input";
import Modal from "../ui/Modal";
import Select from "../ui/Select";

import { Student, ClassSection } from "../../types";

export interface StudentForm {
  roll_no: string;
  name: string;
  email: string;
  phone_no?: string;
  class_section_id: string;
}

interface StudentFormModalProps {
  open: boolean;
  editStudent: Student | null;
  form: StudentForm;
  classSections: ClassSection[];
  setForm: Dispatch<SetStateAction<StudentForm>>;
  onClose: () => void;
  onSave: () => void;
  saving?: boolean;
}

function Spinner() {
  return (
    <span
      aria-hidden="true"
      className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"
    />
  );
}

export default function StudentFormModal({
  open,
  editStudent,
  form,
  classSections,
  setForm,
  onClose,
  onSave,
  saving = false,
}: StudentFormModalProps) {
  return (
    <Modal
      open={open}
      onClose={saving ? () => undefined : onClose}
      title={editStudent ? "Edit Student" : "Register Student"}
    >
      <div className="relative space-y-4">
        {saving && (
          <div className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-slate-950/70 backdrop-blur-[2px]">
            <div className="flex flex-col items-center gap-3 rounded-2xl border border-white/10 bg-slate-900/90 px-6 py-5 shadow-xl">
              <span
                aria-hidden="true"
                className="h-7 w-7 animate-spin rounded-full border-2 border-blue-400/30 border-t-blue-400"
              />
              <p className="text-sm font-medium text-white">
                {editStudent ? "Saving student…" : "Registering student…"}
              </p>
              <p className="text-xs text-slate-400">Please wait</p>
            </div>
          </div>
        )}

        <div className={saving ? "pointer-events-none opacity-60" : ""}>
          <Input
            label="Roll No"
            value={form.roll_no}
            placeholder="e.g. CS2021001"
            disabled={!!editStudent || saving}
            onChange={(e) => setForm((prev) => ({ ...prev, roll_no: e.target.value }))}
          />

          <div className="mt-4">
            <Input
              label="Name"
              value={form.name}
              placeholder="Full name"
              disabled={saving}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
            />
          </div>

          <div className="mt-4">
            <Input
              label="Email"
              type="email"
              value={form.email}
              placeholder="student@university.edu"
              disabled={saving}
              onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
            />
          </div>

          <div className="mt-4">
            <Input
              label="Phone No"
              value={form.phone_no ?? ""}
              placeholder="Optional phone number"
              disabled={saving}
              onChange={(e) => setForm((prev) => ({ ...prev, phone_no: e.target.value }))}
            />
          </div>

          <div className="mt-4">
            <Select
              label="Class / Section"
              value={form.class_section_id}
              disabled={saving}
              onChange={(e) => setForm((prev) => ({ ...prev, class_section_id: e.target.value }))}
            >
              <option value="">Select class and section</option>
              {classSections.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.department} · {item.class_name} · Section {item.section}
                </option>
              ))}
            </Select>
          </div>

          <div className="mt-4 rounded-xl border border-blue-400/10 bg-blue-500/5 p-3 text-xs leading-5 text-slate-400">
            The class/section controls which students belong to each lecture and prevents attendance from being marked for another class.
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              className="flex-1 justify-center"
              disabled={saving}
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              className="flex-1 justify-center"
              disabled={saving}
              onClick={onSave}
            >
              {saving ? <Spinner /> : null}
              {saving ? (editStudent ? "Saving…" : "Registering…") : editStudent ? "Save Changes" : "Register"}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
