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
}

export default function StudentFormModal({
  open,
  editStudent,
  form,
  classSections,
  setForm,
  onClose,
  onSave,
}: StudentFormModalProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editStudent ? "Edit Student" : "Register Student"}
    >
      <div className="space-y-4">
        <Input
          label="Roll No"
          value={form.roll_no}
          placeholder="e.g. CS2021001"
          disabled={!!editStudent}
          onChange={(e) => setForm((prev) => ({ ...prev, roll_no: e.target.value }))}
        />

        <Input
          label="Name"
          value={form.name}
          placeholder="Full name"
          onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
        />

        <Input
          label="Email"
          type="email"
          value={form.email}
          placeholder="student@university.edu"
          onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
        />

        <Input
          label="Phone No"
          value={form.phone_no ?? ""}
          placeholder="Optional phone number"
          onChange={(e) => setForm((prev) => ({ ...prev, phone_no: e.target.value }))}
        />

        <Select
          label="Class / Section"
          value={form.class_section_id}
          onChange={(e) => setForm((prev) => ({ ...prev, class_section_id: e.target.value }))}
        >
          <option value="">Select class and section</option>
          {classSections.map((item) => (
            <option key={item.id} value={item.id}>
              {item.department} · {item.class_name} · Section {item.section}
            </option>
          ))}
        </Select>

        <div className="rounded-xl border border-blue-400/10 bg-blue-500/5 p-3 text-xs leading-5 text-slate-400">
          The class/section controls which students belong to each lecture and prevents attendance from being marked for another class.
        </div>

        <div className="flex gap-3 pt-2">
          <Button variant="secondary" className="flex-1 justify-center" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" className="flex-1 justify-center" onClick={onSave}>
            {editStudent ? "Save Changes" : "Register"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
