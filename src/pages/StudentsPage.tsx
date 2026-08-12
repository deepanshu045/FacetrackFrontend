import { useMemo, useState } from "react";
import { toast } from "sonner";

import PageWrap from "../components/layout/PageWrap";
import GlassCard from "../components/ui/GlassCard";
import StudentsToolbar from "../components/students/StudentsToolbar";
import StudentsTable from "../components/students/StudentsTable";
import StudentFormModal, { StudentForm } from "../components/students/StudentFormModal";
import DeleteStudentModal from "../components/students/DeleteStudentModal";
import useStudents from "../hooks/useStudents";
import { DEPARTMENTS } from "../data/mockData";

import type { Student } from "../types";

export default function StudentPage() {
  const {
    students,
    loading,
    error,
    addStudent,
    updateStudent,
    deleteStudent,
  } = useStudents();

  const [search, setSearch] = useState("");
  const [dept, setDept] = useState("All");
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editStudent, setEditStudent] = useState<Student | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Student | null>(null);
  const [form, setForm] = useState<StudentForm>({
    roll_no: "",
    name: "",
    email: "",
    phone_no: "",
    department: DEPARTMENTS.find((item) => item !== "All") ?? "",
    custom_department: "",
  });

  const filteredStudents = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return students.filter((student) => {
      const matchesDepartment = dept === "All" || student.department === dept;
      const matchesQuery =
        !normalizedSearch ||
        [
          student.name,
          student.roll_no,
          student.email,
          student.phone_no ?? "",
        ]
          .join(" ")
          .toLowerCase()
          .includes(normalizedSearch);

      return matchesDepartment && matchesQuery;
    });
  }, [dept, search, students]);

  const PER_PAGE = 8;
  const paginatedStudents = filteredStudents.slice(
    (page - 1) * PER_PAGE,
    page * PER_PAGE
  );

  function resetForm() {
    setForm({
      roll_no: "",
      name: "",
      email: "",
      phone_no: "",
      department: DEPARTMENTS.find((item) => item !== "All") ?? "",
      custom_department: "",
    });
    setEditStudent(null);
  }

  function openAdd() {
    resetForm();
    setModalOpen(true);
  }

  function openEdit(student: Student) {
    const isStandardDepartment = DEPARTMENTS.includes(student.department);

    setForm({
      roll_no: student.roll_no,
      name: student.name,
      email: student.email,
      phone_no: student.phone_no ?? "",
      department: isStandardDepartment ? student.department : "Other",
      custom_department: isStandardDepartment ? "" : student.department,
    });

    setEditStudent(student);
    setModalOpen(true);
  }

  async function handleSave() {
    if (!form.roll_no.trim() || !form.name.trim()) {
      toast.error("Please enter name and roll number");
      return;
    }

    if (!form.email.trim() && !form.phone_no?.trim()) {
      toast.error("Please provide email or phone number");
      return;
    }

    if (form.department === "Other" && !form.custom_department?.trim()) {
      toast.error("Please enter a custom department name");
      return;
    }

    const payload: Partial<Student> = {
      roll_no: form.roll_no.trim(),
      name: form.name.trim(),
      email: form.email.trim(),
      phone_no: form.phone_no?.trim() || undefined,
      department:
        form.department === "Other"
          ? (form.custom_department?.trim() || "Other")
          : form.department,
    };

    try {
      if (editStudent) {
        const updated = await updateStudent(editStudent.id, payload);
        if (!updated) {
          toast.error("Student not found");
          return;
        }
        toast.success("Student updated");
      } else {
        await addStudent(payload);
        toast.success("Student added");
      }

      setModalOpen(false);
      resetForm();
    } catch (err: any) {
      toast.error(err?.message || "Unable to save student");
    }
  }

  async function handleDelete() {
    if (!deleteConfirm) {
      return;
    }

    try {
      const deleted = await deleteStudent(deleteConfirm.id);
      if (!deleted) {
        toast.error("Student could not be deleted");
        return;
      }
      toast.success("Student deleted");
      setDeleteConfirm(null);
    } catch (err: any) {
      toast.error(err?.message || "Unable to delete student");
    }
  }

  return (
    <PageWrap>
      <GlassCard className="p-6 relative">
        {loading && (
          <div className="absolute inset-0 z-20 flex items-center justify-center rounded-3xl bg-black/60 text-sm text-white">
            Loading students…
          </div>
        )}

        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-base font-semibold text-white">Student Directory</h3>
            <p className="text-sm text-[#94A3B8]">
              Register new students, edit or remove existing records.
            </p>
          </div>

          {/* <button
            type="button"
            onClick={openAdd}
            className="inline-flex items-center justify-center rounded-xl bg-blue-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-400"
          >
            Add Student
          </button> */}
        </div>

        {error ? (
          <div className="mb-6 rounded-2xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-100">
            {error}
          </div>
        ) : null}

        <StudentsToolbar
          search={search}
          setSearch={(value) => {
            setSearch(value);
            setPage(1);
          }}
          dept={dept}
          setDept={(value) => {
            setDept(value);
            setPage(1);
          }}
          setPage={setPage}
          onAdd={openAdd}
        />

        <StudentsTable
          students={paginatedStudents}
          page={page}
          total={filteredStudents.length}
          perPage={PER_PAGE}
          onPage={setPage}
          onEdit={openEdit}
          onDelete={setDeleteConfirm}
        />
      </GlassCard>

      <StudentFormModal
        open={modalOpen}
        editStudent={editStudent}
        form={form}
        setForm={setForm}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
      />

      <DeleteStudentModal
        open={!!deleteConfirm}
        student={deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onDelete={handleDelete}
      />
    </PageWrap>
  );
}
