import { STUDENTS } from "../data/mockData";
import type { Student } from "../types";

let nextId = STUDENTS.length > 0 ? Math.max(...STUDENTS.map((s) => s.id)) + 1 : 1;

const simulate = <T,>(value: T, delay = 300) =>
  new Promise<T>((res) => setTimeout(() => res(value), delay));

export async function fetchStudents(): Promise<Student[]> {
  // return a shallow copy to simulate fresh response
  return simulate(STUDENTS.map((s) => ({ ...s })));
}

export async function addStudent(payload: Partial<Student>): Promise<Student> {
  const student: Student = {
    id: nextId++,
    roll_no: payload.roll_no || "",
    name: payload.name || "",
    email: payload.email || "",
    department: payload.department || "",
    face_image: null,
    face_encoding: null,
    created_at: new Date().toISOString(),
  };

  STUDENTS.push(student);
  return simulate({ ...student });
}

export async function updateStudent(id: number, payload: Partial<Student>): Promise<Student | null> {
  const idx = STUDENTS.findIndex((s) => s.id === id);
  if (idx === -1) return simulate(null, 200);

  const updated = { ...STUDENTS[idx], ...payload } as Student;
  STUDENTS[idx] = updated;
  return simulate({ ...updated }, 200);
}

export async function deleteStudent(id: number): Promise<boolean> {
  const idx = STUDENTS.findIndex((s) => s.id === id);
  if (idx === -1) return simulate(false, 200);
  STUDENTS.splice(idx, 1);
  return simulate(true, 200);
}
