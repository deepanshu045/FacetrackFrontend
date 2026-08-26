import { Dispatch, SetStateAction } from "react";

import Pagination from "../ui/Pagination";
import ReportTableRow from "./ReportTableRow";
import { AttendanceReport } from "../../types";

interface ReportsTableProps {
  records: AttendanceReport[];
  page: number;
  setPage: Dispatch<SetStateAction<number>>;
  total: number;
  perPage: number;
  sortKey: keyof AttendanceReport;
  sortDir: "asc" | "desc";
  toggleSort: (key: keyof AttendanceReport) => void;
  lectureWise?: boolean;
}

export default function ReportsTable({
  records,
  page,
  setPage,
  total,
  perPage,
  sortKey,
  sortDir,
  toggleSort,
  lectureWise = false,
}: ReportsTableProps) {
  const columns: { key: keyof AttendanceReport; label: string }[] = lectureWise
    ? [
        { key: "name", label: "Student" },
        { key: "subject", label: "Subject" },
        { key: "attendance_date", label: "Date" },
        { key: "start_time", label: "Lecture Time" },
        { key: "status", label: "Status" },
      ]
    : [
        { key: "name", label: "Student" },
        { key: "roll_no", label: "Roll Number" },
        { key: "department", label: "Department" },
        { key: "attendance_date", label: "Date" },
        { key: "attendance_time", label: "Time" },
      ];

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10">
              {columns.map((column) => (
                <th
                  key={column.key}
                  onClick={() => toggleSort(column.key)}
                  className="cursor-pointer px-3 py-3 text-left text-xs font-medium uppercase tracking-wider text-[#94A3B8] transition-colors hover:text-white"
                >
                  <div className="flex items-center gap-1">
                    {column.label}
                    {sortKey === column.key && (
                      <span className="text-blue-400">{sortDir === "asc" ? "↑" : "↓"}</span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {records.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="py-12 text-center text-[#94A3B8]">
                  {lectureWise ? "No lectures match the selected filters." : "No attendance records found."}
                </td>
              </tr>
            ) : (
              records.map((record) => (
                <ReportTableRow
                  key={record.lecture_id || `${record.student_id}-${record.attendance_date}-${record.attendance_time}`}
                  record={record}
                  lectureWise={lectureWise}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      <Pagination page={page} total={total} perPage={perPage} onPage={setPage} />
    </>
  );
}
