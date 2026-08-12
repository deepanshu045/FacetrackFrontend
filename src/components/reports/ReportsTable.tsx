import { Dispatch, SetStateAction } from "react";

import Pagination from "../ui/Pagination";
import ReportTableRow from "./ReportTableRow";
import { AttendanceRecord } from "../../types";

interface ReportsTableProps {
  records: AttendanceRecord[];
  page: number;
  setPage: Dispatch<SetStateAction<number>>;
  total: number;
  perPage: number;

  sortKey: keyof AttendanceRecord;
  sortDir: "asc" | "desc";
  toggleSort: (key: keyof AttendanceRecord) => void;
}

const columns: {
  key: keyof AttendanceRecord;
  label: string;
}[] = [
  { key: "student_name", label: "Student Name" },
  { key: "roll_no", label: "Roll Number" },
  { key: "department", label: "Department" },
  { key: "attendance_date", label: "Date" },
  { key: "attendance_time", label: "Time" },
];

export default function ReportsTable({
  records,
  page,
  setPage,
  total,
  perPage,
  sortKey,
  sortDir,
  toggleSort,
}: ReportsTableProps) {
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
                      <span className="text-blue-400">
                        {sortDir === "asc" ? "↑" : "↓"}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-white/5">
            {records.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="py-10 text-center text-[#94A3B8]"
                >
                  No attendance records found.
                </td>
              </tr>
            ) : (
              records.map((record) => (
                <ReportTableRow
                  key={
                    record.id ||
                    `${record.student_name}-${record.roll_no}-${record.attendance_date}-${record.attendance_time}`
                  }
                  record={record}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      <Pagination
        page={page}
        total={total}
        perPage={perPage}
        onPage={setPage}
      />
    </>
  );
}