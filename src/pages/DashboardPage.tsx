import PageWrap from "../components/layout/PageWrap";

import DashboardStats from "../components/dashboard/DashboardStats";
import WeeklyAttendanceChart from "../components/dashboard/WeeklyAttendanceChart";
import DepartmentChart from "../components/dashboard/DepartmentChart";
import MonthlyAttendanceChart from "../components/dashboard/MonthlyAttendanceChart";
import RecentAttendanceTable from "../components/dashboard/RecentAttendanceTable";

export default function DashboardPage() {
  return (
    <PageWrap>
      <DashboardStats />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <WeeklyAttendanceChart />
        <DepartmentChart />
      </div>

      <MonthlyAttendanceChart />

      <RecentAttendanceTable />
    </PageWrap>
  );
}