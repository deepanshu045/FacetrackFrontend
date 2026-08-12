import { Camera, UserCheck, Users, Zap } from "lucide-react";

import StatCard from "../ui/StatCard";
import { fetchStudents, fetchTodayAttendance } from "../../services/api";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function DashboardStats() {
  const [studentsCount, setStudentsCount] = useState<number | null>(null);
  const [registeredFacesCount, setRegisteredFacesCount] = useState<number | null>(null);
  const [todayAttendanceCount, setTodayAttendanceCount] = useState<number | null>(null);
  const [recognitionAccuracy, setRecognitionAccuracy] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [studentsGrowth, setStudentsGrowth] = useState<string | null>(null);
  const [studentsTrend, setStudentsTrend] = useState<'up'|'down'|'flat'>('flat');
  const [attendanceGrowth, setAttendanceGrowth] = useState<string | null>(null);
  const [attendanceTrend, setAttendanceTrend] = useState<'up'|'down'|'flat'>('flat');
  const [registeredGrowth, setRegisteredGrowth] = useState<string | null>(null);
  const [registeredTrend, setRegisteredTrend] = useState<'up'|'down'|'flat'>('flat');
  const [recognitionGrowth, setRecognitionGrowth] = useState<string | null>(null);
  const [recognitionTrend, setRecognitionTrend] = useState<'up'|'down'|'flat'>('flat');

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      try {
        const students = await fetchStudents();
        if (!mounted) return;
        setStudentsCount(students.length);

        const registered = students.filter((s: any) => Boolean(s.has_face || s.image_path)).length;
        setRegisteredFacesCount(registered);
        setRecognitionAccuracy(students.length ? `${Math.round((registered / students.length) * 100)}%` : null);

        // load today's attendance
        let todayCount: number | null = null;
        try {
          const today = await fetchTodayAttendance();
          if (!mounted) return;
          todayCount = Array.isArray(today) ? today.length : 0;
          setTodayAttendanceCount(todayCount);
        } catch (err) {
          if (!mounted) return;
          setTodayAttendanceCount(null);
          toast.error("Failed to load today's attendance");
        }

        // compute growth/trend based on previous snapshot saved in localStorage
        try {
          const key = 'dashboard-prev-stats';
          const prevRaw = localStorage.getItem(key);
          const prev = prevRaw ? JSON.parse(prevRaw) : null;

          function computeGrowth(prevVal: number | null, curVal: number | null) {
            if (prevVal == null || curVal == null) return { growth: null as string | null, trend: 'flat' as const };
            if (prevVal === 0) return { growth: null as string | null, trend: curVal === 0 ? 'flat' as const : 'up' as const };
            const diff = curVal - prevVal;
            const pct = Math.round((diff / prevVal) * 100);
            return { growth: `${Math.abs(pct)}%`, trend: diff > 0 ? 'up' as const : diff < 0 ? 'down' as const : 'flat' as const };
          }

          const studentsPrev = prev?.studentsCount ?? null;
          const registeredPrev = prev?.registeredFacesCount ?? null;
          const todayPrev = prev?.todayAttendanceCount ?? null;
          const recogPrev = prev?.recognitionAccuracy ?? null; // number

          const s = computeGrowth(studentsPrev, students.length);
          setStudentsGrowth(s.growth);
          setStudentsTrend(s.trend);

          const r = computeGrowth(registeredPrev, registered);
          setRegisteredGrowth(r.growth);
          setRegisteredTrend(r.trend);

          const t = computeGrowth(todayPrev, todayCount);
          setAttendanceGrowth(t.growth);
          setAttendanceTrend(t.trend);

          // recognition accuracy compare
          const curRecog = students.length ? Math.round((registered / students.length) * 100) : null;
          if (recogPrev == null || curRecog == null) {
            setRecognitionGrowth(null);
            setRecognitionTrend('flat');
          } else if (recogPrev === 0) {
            setRecognitionGrowth(null);
            setRecognitionTrend(curRecog === 0 ? 'flat' : 'up');
          } else {
            const diff = curRecog - recogPrev;
            const pct = Math.round((diff / recogPrev) * 100);
            setRecognitionGrowth(`${Math.abs(pct)}%`);
            setRecognitionTrend(diff > 0 ? 'up' : diff < 0 ? 'down' : 'flat');
          }

          // save snapshot for next run
          const snapshot = {
            studentsCount: students.length,
            registeredFacesCount: registered,
            todayAttendanceCount: todayCount,
            recognitionAccuracy: students.length ? Math.round((registered / students.length) * 100) : null,
            ts: Date.now(),
          };

          localStorage.setItem(key, JSON.stringify(snapshot));
        } catch (e) {
          // ignore storage errors
        }

      } catch (e) {
        if (!mounted) return;
        setStudentsCount(null);
        setRegisteredFacesCount(null);
        toast.error("Failed to load student stats");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard
        icon={Users}
        label="Total Students"
        value={loading ? "Loading..." : studentsCount !== null ? studentsCount.toString() : "—"}
        growth={studentsGrowth ?? "—"}
        trend={studentsTrend}
        color="bg-blue-600"
      />

      <StatCard
        icon={UserCheck}
        label="Today's Attendance"
        value={loading ? "Loading..." : todayAttendanceCount !== null ? todayAttendanceCount.toString() : "—"}
        growth={attendanceGrowth ?? "—"}
        trend={attendanceTrend}
        color="bg-emerald-600"
      />

      <StatCard
        icon={Camera}
        label="Registered Faces"
        value={loading ? "Loading..." : registeredFacesCount !== null ? registeredFacesCount.toString() : "—"}
        growth={registeredGrowth ?? "—"}
        trend={registeredTrend}
        color="bg-purple-600"
      />

      <StatCard
        icon={Zap}
        label="Recognition Accuracy"
        value={loading ? "Loading..." : recognitionAccuracy ?? "—"}
        growth={recognitionGrowth ?? "—"}
        trend={recognitionTrend}
        color="bg-amber-600"
      />
    </div>
  );
}
