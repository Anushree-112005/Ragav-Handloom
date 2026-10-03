import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Button from './Button';

export default function Pagination({
  currentPage = 1,
  totalPages = 1,
  totalItems = 0,
  pageSize = 10,
  onPageChange,
  onPageSizeChange,
}) {
  if (totalItems === 0) return null;

  const start = (currentPage - 1) * pageSize + 1;
  const end = Math.min(currentPage * pageSize, totalItems);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-3 bg-white border border-linen-200 rounded-2xl shadow-subtle mt-4">
      {/* Items count summary */}
      <div className="text-xs font-medium text-linen-600">
        Showing <span className="font-semibold text-linen-900">{start}</span> to{' '}
        <span className="font-semibold text-linen-900">{end}</span> of{' '}
        <span className="font-semibold text-linen-900">{totalItems}</span> records
      </div>

      <div className="flex items-center gap-3">
        {/* Page size dropdown */}
        {onPageSizeChange && (
          <div className="flex items-center gap-2 text-xs text-linen-600">
            <span>Per page:</span>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="py-1 px-2 rounded-lg border border-linen-300 text-xs bg-white text-linen-900 focus:outline-none focus:ring-1 focus:ring-indigo-600"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </div>
        )}

        {/* Page navigation controls */}
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="xs"
            disabled={currentPage <= 1}
            onClick={() => onPageChange(currentPage - 1)}
            aria-label="Previous Page"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </Button>

          <span className="px-2.5 text-xs font-semibold text-linen-700">
            Page {currentPage} of {totalPages || 1}
          </span>

          <Button
            variant="outline"
            size="xs"
            disabled={currentPage >= totalPages}
            onClick={() => onPageChange(currentPage + 1)}
            aria-label="Next Page"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
