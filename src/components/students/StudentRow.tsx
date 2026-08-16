import {
  CheckCircle,
  Edit2,
  Eye,
  Trash2,
  XCircle,
} from "lucide-react";

import Avatar from "../ui/Avatar";
import Badge from "../ui/Badge";

import { Student } from "../../types";

interface StudentRowProps {
  student: Student;
  onView: (student: Student) => void;
  onEdit: (student: Student) => void;
  onDelete: (student: Student) => void;
}

export default function StudentRow({
  student,
  onView,
  onEdit,
  onDelete,
}: StudentRowProps) {
  return (
    <tr className="transition-colors hover:bg-white/3">
      <td className="px-3 py-3 font-mono text-xs text-[#94A3B8]">{student.roll_no}</td>

      <td className="px-3 py-3">
        <div className="flex items-center gap-3">
          <Avatar name={student.name} size="sm" />
          <span className="font-medium text-white">{student.name}</span>
        </div>
      </td>

      <td className="px-3 py-3 text-[#94A3B8]">{student.email}</td>
      <td className="px-3 py-3 text-[#94A3B8]">{student.phone_no ?? "—"}</td>
      <td className="px-3 py-3 text-[#94A3B8]">{student.department}</td>

      <td className="px-3 py-3">
        {student.has_face ? (
          <Badge variant="success">
            <CheckCircle size={11} className="mr-1" />
            Registered
          </Badge>
        ) : (
          <Badge variant="warning">
            <XCircle size={11} className="mr-1" />
            Not Set
          </Badge>
        )}
      </td>

      <td className="px-3 py-3">
        <div className="flex items-center gap-1">
          <button
            type="button"
            title={`View ${student.name}`}
            aria-label={`View ${student.name}`}
            onClick={() => onView(student)}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-[#94A3B8] transition-colors hover:bg-blue-500/10 hover:text-blue-400"
          >
            <Eye size={14} />
          </button>

          <button
            type="button"
            title={`Edit ${student.name}`}
            aria-label={`Edit ${student.name}`}
            onClick={() => onEdit(student)}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-[#94A3B8] transition-colors hover:bg-amber-500/10 hover:text-amber-400"
          >
            <Edit2 size={14} />
          </button>

          <button
            type="button"
            title={`Delete ${student.name}`}
            aria-label={`Delete ${student.name}`}
            onClick={() => onDelete(student)}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-[#94A3B8] transition-colors hover:bg-red-500/10 hover:text-red-400"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </td>
    </tr>
  );
}
