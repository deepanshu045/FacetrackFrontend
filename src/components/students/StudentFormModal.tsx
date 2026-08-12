import { Dispatch, SetStateAction } from "react";

import Button from "../ui/Button";
import Input from "../ui/Input";
import Modal from "../ui/Modal";
import Select from "../ui/Select";

import { DEPARTMENTS } from "../../data/mockData";
import { Student } from "../../types";

const OTHER_DEPARTMENT_OPTION = "Other";

export interface StudentForm {
  roll_no: string;
  name: string;
  email: string;
  phone_no?: string;
  department: string;
  custom_department?: string;
}

interface StudentFormModalProps {
  open: boolean;
  editStudent: Student | null;
  form: StudentForm;
  setForm: Dispatch<SetStateAction<StudentForm>>;
  onClose: () => void;
  onSave: () => void;
}

export default function StudentFormModal({
  open,
  editStudent,
  form,
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
          onChange={(e) =>
            setForm((prev) => ({
              ...prev,
              roll_no: e.target.value,
            }))
          }
        />

        <Input
          label="Name"
          value={form.name}
          placeholder="Full name"
          onChange={(e) =>
            setForm((prev) => ({
              ...prev,
              name: e.target.value,
            }))
          }
        />

        <Input
          label="Email"
          type="email"
          value={form.email}
          placeholder="student@university.edu"
          onChange={(e) =>
            setForm((prev) => ({
              ...prev,
              email: e.target.value,
            }))
          }
        />

        <Input
          label="Phone No"
          value={form.phone_no ?? ""}
          placeholder="Optional phone number"
          onChange={(e) =>
            setForm((prev) => ({
              ...prev,
              phone_no: e.target.value,
            }))
          }
        />

        <Select
          label="Department"
          value={form.department}
          onChange={(e) =>
            setForm((prev) => ({
              ...prev,
              department: e.target.value,
              custom_department:
                e.target.value === OTHER_DEPARTMENT_OPTION
                  ? prev.custom_department ?? ""
                  : "",
            }))
          }
        >
          {DEPARTMENTS.filter((department) => department !== "All").map(
            (department) => (
              <option key={department} value={department}>
                {department}
              </option>
            )
          )}
          <option value={OTHER_DEPARTMENT_OPTION}>
            {OTHER_DEPARTMENT_OPTION}
          </option>
        </Select>

        {form.department === OTHER_DEPARTMENT_OPTION && (
          <Input
            label="Custom Department"
            value={form.custom_department ?? ""}
            placeholder="Enter department name"
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                custom_department: e.target.value,
              }))
            }
          />
        )}

        <div className="flex gap-3 pt-2">
          <Button
            variant="secondary"
            className="flex-1 justify-center"
            onClick={onClose}
          >
            Cancel
          </Button>

          <Button
            variant="primary"
            className="flex-1 justify-center"
            onClick={onSave}
          >
            {editStudent ? "Save Changes" : "Register"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}