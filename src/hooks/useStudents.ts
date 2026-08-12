import { useEffect, useState, useCallback } from "react";
import type { Student } from "../types";
import * as api from "../services/api";

export default function useStudents() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.fetchStudents();
      setStudents(data);
    } catch (err: any) {
      setError(err?.message || "Failed to load students");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const addStudent = useCallback(async (payload: Partial<Student>) => {
    setLoading(true);
    try {
      const student = await api.addStudent(payload);
      setStudents((prev) => [student, ...prev]);
      return student;
    } catch (err: any) {
      setError(err?.message || "Failed to add student");
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateStudent = useCallback(async (id: number, payload: Partial<Student>) => {
    setLoading(true);
    try {
      const updated = await api.updateStudent(id, payload);
      if (updated) {
        setStudents((prev) => prev.map((s) => (s.id === id ? updated : s)));
      }
      return updated;
    } catch (err: any) {
      setError(err?.message || "Failed to update student");
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteStudent = useCallback(async (id: number) => {
    setLoading(true);
    try {
      const ok = await api.deleteStudent(id);
      if (ok) setStudents((prev) => prev.filter((s) => s.id !== id));
      return ok;
    } catch (err: any) {
      setError(err?.message || "Failed to delete student");
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    students,
    loading,
    error,
    fetchAll,
    addStudent,
    updateStudent,
    deleteStudent,
  };
}
