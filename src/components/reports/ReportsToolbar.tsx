import { Download, FileText, Printer, Search } from "lucide-react";

import Button from "../ui/Button";

interface ReportsToolbarProps {
  search: string;
  setSearch: (value: string) => void;
  setPage: (page: number) => void;
  onExportCsv?: () => void;
  onExportPdf?: () => void;
  onPrint?: () => void;
}

export default function ReportsToolbar({
  search,
  setSearch,
  setPage,
  onExportCsv,
  onExportPdf,
  onPrint,
}: ReportsToolbarProps) {
  return (
    <div className="mb-4 flex flex-wrap gap-3">
      {/* Search */}
      <div className="relative min-w-48 flex-1">
        <Search
          size={14}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-[#475569]"
        />

        <input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Search records..."
          className="w-full rounded-xl border border-white/10 bg-[#0F172A] py-2 pl-9 pr-4 text-sm text-white placeholder:text-[#475569] focus:outline-none"
        />
      </div>

      {/* Export Buttons */}
      <Button variant="secondary" size="sm" onClick={() => onExportCsv?.()}>
        <Download size={14} />
        CSV
      </Button>
 
      {/* <Button variant="secondary" size="sm" onClick={() => onExportPdf?.()}>
        <FileText size={14} />
        PDF
      </Button> */}
 
      <Button variant="secondary" size="sm" onClick={() => onPrint?.()}>
        <Printer size={14} />
        Print
      </Button>
    </div>
  );
}