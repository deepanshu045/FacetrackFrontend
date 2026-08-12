import { Trash2 } from "lucide-react";

import Button from "../ui/Button";
import Modal from "../ui/Modal";

import { Student } from "../../types";

interface DeleteStudentModalProps {
  open: boolean;
  student: Student | null;
  onClose: () => void;
  onDelete: () => void;
}

export default function DeleteStudentModal({
  open,
  student,
  onClose,
  onDelete,
}: DeleteStudentModalProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Confirm Delete"
    >
      <div className="space-y-4">
        <p className="text-[#94A3B8]">
          Are you sure you want to delete{" "}
          <span className="font-medium text-white">
            {student?.name}
          </span>
          ? This action cannot be undone.
        </p>

        <div className="flex gap-3">
          <Button
            variant="secondary"
            className="flex-1 justify-center"
            onClick={onClose}
          >
            Cancel
          </Button>

          <Button
            variant="danger"
            className="flex-1 justify-center"
            onClick={onDelete}
          >
            <Trash2 size={14} />
            Delete
          </Button>
        </div>
      </div>
    </Modal>
  );
}