import Pagination from "../ui/Pagination";
import StudentRow from "./StudentRow";

import { Student } from "../../types";

interface StudentsTableProps {
  students: Student[];
  page: number;
  total: number;
  perPage: number;
  onPage: (page: number) => void;
  onView: (student: Student) => void;
  onEdit: (student: Student) => void;
  onDelete: (student: Student) => void;
}

export default function StudentsTable({
  students,
  page,
  total,
  perPage,
  onPage,
  onView,
  onEdit,
  onDelete,
}: StudentsTableProps) {
  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10">
              {["Roll No", "Name", "Email", "Phone", "Department", "Face Registered", "Actions"].map((header) => (
                <th key={header} className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wider text-[#94A3B8]">
                  {header}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-white/5">
            {students.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-[#94A3B8]">No students found</td>
              </tr>
            ) : (
              students.map((student) => (
                <StudentRow
                  key={student.id}
                  student={student}
                  onView={onView}
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      <Pagination page={page} total={total} perPage={perPage} onPage={onPage} />
    </>
  );
}
