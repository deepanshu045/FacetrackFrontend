import { Plus, Search } from "lucide-react";

import Button from "../ui/Button";

interface StudentsToolbarProps {
  search: string;
  setSearch: (value: string) => void;
  dept: string;
  setDept: (value: string) => void;
  setPage: (page: number) => void;
  onAdd: () => void;
  departments: string[];
}

export default function StudentsToolbar({
  search,
  setSearch,
  dept,
  setDept,
  setPage,
  onAdd,
  departments,
}: StudentsToolbarProps) {
  return (
    <div className="mb-6 flex flex-wrap gap-3">
      <div className="relative min-w-48 flex-1">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#475569]" />
        <input
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search students..."
          className="w-full rounded-xl border border-white/10 bg-[#0F172A] py-2.5 pl-9 pr-4 text-sm text-white placeholder:text-[#475569] transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/40"
        />
      </div>

      <select
        value={dept}
        onChange={(e) => { setDept(e.target.value); setPage(1); }}
        className="rounded-xl border border-white/10 bg-[#0F172A] px-4 py-2.5 text-sm text-white focus:outline-none"
      >
        {departments.map((department) => (
          <option key={department} value={department}>{department}</option>
        ))}
      </select>

      <Button onClick={onAdd} variant="primary" size="md">
        <Plus size={16} />
        Add Student
      </Button>
    </div>
  );
}
