"use client";

import ModernSelect from "./ModernSelect";

export interface PaginationBarProps {
  vi: boolean;
  currentPage: number;
  pageSize: number;
  totalItems: number;
  pageSizeOptions?: number[];
  unitLabel?: string;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

export default function PaginationBar({
  vi,
  currentPage,
  pageSize,
  totalItems,
  pageSizeOptions = [4, 6, 10, 20],
  unitLabel,
  onPageChange,
  onPageSizeChange,
}: PaginationBarProps) {
  const effectivePageSize = pageSize <= 0 ? Math.max(1, totalItems) : pageSize;
  const totalPages = Math.max(1, Math.ceil(totalItems / effectivePageSize));
  const safePage = Math.min(Math.max(1, currentPage), totalPages);

  const startItem =
    totalItems === 0 ? 0 : (safePage - 1) * effectivePageSize + 1;
  const endItem = Math.min(totalItems, safePage * effectivePageSize);

  const pageNumbers: number[] = [];
  for (let i = 1; i <= totalPages; i++) {
    pageNumbers.push(i);
  }

  return (
    <div className="tv-card flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-xs print:hidden">
      {/* Left: Showing X-Y of Z */}
      <div className="flex flex-wrap items-center gap-3">
        <span className="tv-text-muted">
          {vi ? (
            <>
              Hiển thị{" "}
              <strong className="tv-text font-mono">
                {startItem}–{endItem}
              </strong>{" "}
              trên tổng{" "}
              <strong className="tv-accent-text font-mono">{totalItems}</strong>{" "}
              {unitLabel ?? "mục"}
            </>
          ) : (
            <>
              Showing{" "}
              <strong className="tv-text font-mono">
                {startItem}–{endItem}
              </strong>{" "}
              of{" "}
              <strong className="tv-accent-text font-mono">{totalItems}</strong>{" "}
              {unitLabel ?? "items"}
            </>
          )}
        </span>

        <div className="flex items-center gap-2">
          <span className="tv-text-muted text-[11px]">
            {vi ? "Số dòng/trang:" : "Rows/page:"}
          </span>
          <ModernSelect
            value={pageSize}
            onChange={(e) => {
              onPageSizeChange(Number(e.target.value));
              onPageChange(1);
            }}
            className="text-xs font-bold"
          >
            {pageSizeOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
            <option value={9999}>{vi ? "Tất cả" : "All"}</option>
          </ModernSelect>
        </div>
      </div>

      {/* Right: Page Controls */}
      <div className="flex items-center gap-1.5">
        <span className="tv-text-muted mr-1 hidden sm:inline text-[11px]">
          {vi
            ? `Trang ${safePage} / ${totalPages}`
            : `Page ${safePage} of ${totalPages}`}
        </span>

        <button
          type="button"
          disabled={safePage <= 1}
          onClick={() => onPageChange(safePage - 1)}
          className={`tv-surface-2 tv-border inline-flex items-center justify-center gap-1.5 rounded-lg border px-3 py-1.5 font-semibold transition ${
            safePage <= 1
              ? "opacity-40 cursor-not-allowed"
              : "hover:opacity-85 cursor-pointer"
          }`}
        >
          <span aria-hidden="true">←</span>
          <span>{vi ? "Trước" : "Prev"}</span>
        </button>

        <div className="flex items-center gap-1">
          {pageNumbers.map((num) => {
            const active = num === safePage;
            return (
              <button
                key={num}
                type="button"
                onClick={() => onPageChange(num)}
                className={`inline-flex h-8 min-w-8 items-center justify-center rounded-lg border px-2 font-mono text-xs font-bold transition cursor-pointer ${
                  active
                    ? "tv-accent-bg border-transparent shadow-xs"
                    : "tv-surface-2 tv-border tv-text-muted hover:opacity-90"
                }`}
              >
                {num}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          disabled={safePage >= totalPages}
          onClick={() => onPageChange(safePage + 1)}
          className={`tv-surface-2 tv-border inline-flex items-center justify-center gap-1.5 rounded-lg border px-3 py-1.5 font-semibold transition ${
            safePage >= totalPages
              ? "opacity-40 cursor-not-allowed"
              : "hover:opacity-85 cursor-pointer"
          }`}
        >
          <span>{vi ? "Sau" : "Next"}</span>
          <span aria-hidden="true">→</span>
        </button>
      </div>
    </div>
  );
}
