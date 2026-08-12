import React from "react";

interface PaginationProps {
  page: number;
  total: number;
  perPage: number;
  onPage: (page: number) => void;
}

export default function Pagination({
  page,
  total,
  perPage,
  onPage,
}: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const prev = () => onPage(Math.max(1, page - 1));
  const next = () => onPage(Math.min(totalPages, page + 1));

  return (
    <div className="mt-4 flex items-center justify-between">
      <div className="text-sm text-[#94A3B8]">
        Page {page} of {totalPages}
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={prev}
          className="rounded-md bg-white/5 px-3 py-1 text-sm"
          disabled={page <= 1}
        >
          Prev
        </button>

        <button
          onClick={next}
          className="rounded-md bg-white/5 px-3 py-1 text-sm"
          disabled={page >= totalPages}
        >
          Next
        </button>
      </div>
    </div>
  );
}
