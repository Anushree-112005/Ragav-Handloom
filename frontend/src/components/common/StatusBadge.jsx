import React from 'react';

export default function StatusBadge({ status, size = 'md' }) {
  if (!status) return null;

  const s = String(status).toUpperCase();

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-[11px]',
    md: 'px-2.5 py-1 text-xs',
    lg: 'px-3 py-1.5 text-sm',
  };

  // Color mappings
  let styles = 'bg-linen-100 text-linen-800 border-linen-200';
  let dotColor = 'bg-linen-500';

  if (['ACTIVE', 'RUNNING', 'IN_STOCK', 'APPROVED', 'PASSED', 'COMPLETED', 'DELIVERED', 'A_GRADE', 'SUCCESS'].includes(s)) {
    styles = 'bg-teal-50 text-teal-800 border-teal-200';
    dotColor = 'bg-teal-600';
  } else if (['PENDING', 'PENDING_APPROVAL', 'PENDING_RECEIPT', 'PROCESSING', 'IN_PROGRESS', 'UNDER_REVIEW', 'IDLE'].includes(s)) {
    styles = 'bg-saffron-50 text-saffron-800 border-saffron-200';
    dotColor = 'bg-saffron-600';
  } else if (['LOW_STOCK', 'MAINTENANCE', 'ON_HOLD', 'B_GRADE'].includes(s)) {
    styles = 'bg-coral-50 text-coral-800 border-coral-200';
    dotColor = 'bg-coral-600';
  } else if (['INACTIVE', 'REJECTED', 'FAILED', 'OUT_OF_STOCK', 'CANCELLED'].includes(s)) {
    styles = 'bg-linen-100 text-linen-600 border-linen-300';
    dotColor = 'bg-linen-400';
  }

  // Format label
  const label = s
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-semibold border ${sizeClasses[size] || sizeClasses.md} ${styles} select-none`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${dotColor} shrink-0`} />
      <span>{label}</span>
    </span>
  );
}
