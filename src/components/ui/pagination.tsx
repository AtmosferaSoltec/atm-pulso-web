import type { ReactElement } from "react";
import { IconButton } from "@/components/ui/icon-button";
import { OptionCards } from "@/components/ui/option-cards";

interface PaginationProps {
  /** Current page, starting at 1. */
  page: number;
  pageSize: number;
  total: number;
  pageSizes: number[];
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

const WINDOW = 1;

/** Page numbers to show: always the first and last, the neighbours of the current one, and gaps as null. */
function visiblePages(current: number, count: number): (number | null)[] {
  const pages = new Set([1, count, current]);
  for (let step = 1; step <= WINDOW; step += 1) {
    pages.add(current - step);
    pages.add(current + step);
  }
  const sorted = [...pages].filter((n) => n >= 1 && n <= count).sort((a, b) => a - b);
  return sorted.flatMap((n, index) => (index > 0 && n - sorted[index - 1] > 1 ? [null, n] : [n]));
}

/** Footer for long lists: range summary, page numbers and a per-page size picker. */
export function Pagination({ page, pageSize, total, pageSizes, onPageChange, onPageSizeChange }: PaginationProps): ReactElement {
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const current = Math.min(page, pageCount);
  const first = total === 0 ? 0 : (current - 1) * pageSize + 1;
  const last = Math.min(current * pageSize, total);

  return (
    <nav className="pagination" aria-label="Paginación">
      <span className="pagination-summary">
        Mostrando {first}–{last} de {total}
      </span>
      <div className="pagination-pages">
        <IconButton icon="chevronLeft" label="Página anterior" disabled={current === 1} onClick={() => onPageChange(current - 1)} />
        {visiblePages(current, pageCount).map((n, index) =>
          n === null ? (
            <span key={`gap-${index}`} className="pagination-gap" aria-hidden="true">
              …
            </span>
          ) : (
            <button
              key={n}
              type="button"
              className="page-button"
              aria-label={`Página ${n}`}
              aria-current={n === current ? "page" : undefined}
              onClick={() => onPageChange(n)}
            >
              {n}
            </button>
          ),
        )}
        <IconButton icon="chevron" label="Página siguiente" disabled={current === pageCount} onClick={() => onPageChange(current + 1)} />
      </div>
      <div className="pagination-size">
        <span>Por página</span>
        <OptionCards
          label="Registros por página"
          variant="chip"
          options={pageSizes.map((size) => ({ value: String(size), label: String(size) }))}
          value={String(pageSize)}
          onChange={(size) => onPageSizeChange(Number(size))}
        />
      </div>
    </nav>
  );
}
