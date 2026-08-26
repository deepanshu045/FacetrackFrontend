import Avatar from "../ui/Avatar";
import { AttendanceReport } from "../../types";

interface ReportTableRowProps {
  record: AttendanceReport;
  lectureWise?: boolean;
}

function formatDate(value: string) {
  if (!value) return "—";
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function formatTime(value?: string | null) {
  if (!value) return "—";
  const [hours, minutes] = value.split(":").map(Number);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return value;
  const suffix = hours >= 12 ? "PM" : "AM";
  const hour = hours % 12 || 12;
  return `${hour}:${String(minutes).padStart(2, "0")} ${suffix}`;
}

export default function ReportTableRow({ record, lectureWise = false }: ReportTableRowProps) {
  const present = (record.status || "Present").toLowerCase() === "present";
  const time = record.start_time || record.attendance_time;
  const timeRange = record.end_time
    ? `${formatTime(time)} – ${formatTime(record.end_time)}`
    : formatTime(time);

  return (
    <tr className="transition-colors hover:bg-white/[0.03]">
      <td className="px-3 py-4">
        <div className="flex items-center gap-3">
          <Avatar name={record.name} size="sm" />
          <div>
            <p className="font-medium text-white">{record.name}</p>
            <p className="font-mono text-xs text-[#64748B]">{record.roll_no}</p>
          </div>
        </div>
      </td>

      {lectureWise ? (
        <>
          <td className="px-3 py-4 font-medium text-[#E2E8F0]">{record.subject || "Unknown subject"}</td>
          <td className="px-3 py-4 text-[#94A3B8]">{formatDate(record.attendance_date)}</td>
          <td className="px-3 py-4 font-mono text-xs text-[#94A3B8]">{timeRange}</td>
          <td className="px-3 py-4">
            <span
              className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                present
                  ? "bg-emerald-500/15 text-emerald-300"
                  : "bg-red-500/15 text-red-300"
              }`}
            >
              {present ? "Present" : "Absent"}
            </span>
          </td>
        </>
      ) : (
        <>
          <td className="px-3 py-4 font-mono text-xs text-[#94A3B8]">{record.roll_no}</td>
          <td className="px-3 py-4 text-[#94A3B8]">{record.department}</td>
          <td className="px-3 py-4 text-[#94A3B8]">{formatDate(record.attendance_date)}</td>
          <td className="px-3 py-4 font-mono text-xs text-[#94A3B8]">{timeRange}</td>
        </>
      )}
    </tr>
  );
}
