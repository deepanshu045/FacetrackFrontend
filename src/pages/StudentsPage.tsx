import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import PageWrap from "../components/layout/PageWrap";
import GlassCard from "../components/ui/GlassCard";
import StudentsToolbar from "../components/students/StudentsToolbar";
import StudentsTable from "../components/students/StudentsTable";
import StudentFormModal, { StudentForm } from "../components/students/StudentFormModal";
import DeleteStudentModal from "../components/students/DeleteStudentModal";
import useStudents from "../hooks/useStudents";
import { fetchClassSections } from "../services/api";

import type { Student, ClassSection } from "../types";

export default function StudentPage() {
  const { students, loading, error, addStudent, updateStudent, deleteStudent } = useStudents();
  const [classSections, setClassSections] = useState<ClassSection[]>([]);
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
    class_section_id: "",
  });

  useEffect(() => {
    fetchClassSections()
      .then(setClassSections)
      .catch((err: any) => toast.error(err?.message || "Unable to load class sections"));
  }, []);

  const departments = useMemo(
    () => ["All", ...Array.from(new Set(classSections.map((item) => item.department))).sort()],
    [classSections],
  );

  const filteredStudents = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    return students.filter((student) => {
      const matchesDepartment = dept === "All" || student.department === dept;
      const matchesQuery = !normalizedSearch ||
        [student.name, student.roll_no, student.email ?? "", student.phone_no ?? "", student.class_name ?? "", student.section ?? ""]
          .join(" ")
          .toLowerCase()
          .includes(normalizedSearch);
      return matchesDepartment && matchesQuery;
    });
  }, [dept, search, students]);

  const PER_PAGE = 8;
  const paginatedStudents = filteredStudents.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  function resetForm() {
    setForm({ roll_no: "", name: "", email: "", phone_no: "", class_section_id: "" });
    setEditStudent(null);
  }

  function openAdd() {
    resetForm();
    setModalOpen(true);
  }

  function openEdit(student: Student) {
    setForm({
      roll_no: student.roll_no,
      name: student.name,
      email: student.email ?? "",
      phone_no: student.phone_no ?? "",
      class_section_id: student.class_section_id ? String(student.class_section_id) : "",
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
    if (!form.class_section_id) {
      toast.error("Please select a class and section");
      return;
    }

    const selectedSection = classSections.find(
      (item) => item.id === Number(form.class_section_id),
    );

    if (!selectedSection) {
      toast.error("Selected class/section could not be found");
      return;
    }

    // The backend requires department on StudentCreate/StudentUpdate.
    // Department is derived from the selected class section so the frontend
    // cannot accidentally send a department that does not match the section.
    const payload: Partial<Student> = {
      roll_no: form.roll_no.trim(),
      name: form.name.trim(),
      email: form.email.trim() || null,
      phone_no: form.phone_no?.trim() || null,
      department: selectedSection.department,
      class_section_id: selectedSection.id,
      class_name: selectedSection.class_name,
      section: selectedSection.section,
    };

    try {
      if (editStudent) {
        await updateStudent(editStudent.id, payload);
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
    if (!deleteConfirm) return;
    try {
      await deleteStudent(deleteConfirm.id);
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
            <p className="text-sm text-[#94A3B8]">Students are assigned to a class/section used by lectures and attendance.</p>
          </div>
        </div>

        {error ? <div className="mb-6 rounded-2xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-100">{error}</div> : null}

        <StudentsToolbar
          search={search}
          setSearch={(value) => { setSearch(value); setPage(1); }}
          dept={dept}
          setDept={(value) => { setDept(value); setPage(1); }}
          setPage={setPage}
          onAdd={openAdd}
          departments={departments}
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
        classSections={classSections}
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
