import Avatar from "../ui/Avatar";
import { AttendanceRecord } from "../../types";

interface ReportTableRowProps {
  record: AttendanceRecord;
}

export default function ReportTableRow({
  record,
}: ReportTableRowProps) {
  return (
    <tr className="hover:bg-white/3 transition-colors">
      <td className="py-3 px-3">
        <div className="flex items-center gap-3">
          <Avatar
            name={record.student_name}
            size="sm"
          />

          <span className="font-medium text-white">
            {record.student_name}
          </span>
        </div>
      </td>

      <td className="py-3 px-3 font-mono text-xs text-[#94A3B8]">
        {record.roll_no}
      </td>

      <td className="py-3 px-3 text-[#94A3B8]">
        {record.department}
      </td>

      <td className="py-3 px-3 text-[#94A3B8]">
        {record.attendance_date}
      </td>

      <td className="py-3 px-3 font-mono text-xs text-[#94A3B8]">
        {record.attendance_time}
      </td>
    </tr>
  );
}