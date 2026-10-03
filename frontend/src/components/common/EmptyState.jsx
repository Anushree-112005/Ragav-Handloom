import React from 'react';
import { PackageOpen } from 'lucide-react';
import Button from './Button';

export default function EmptyState({
  icon: Icon = PackageOpen,
  title = 'No records found',
  description = 'There are currently no items matching your criteria.',
  actionText,
  onAction,
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center rounded-2xl border-2 border-dashed border-linen-200 bg-linen-50/60 my-4">
      <div className="p-4 rounded-2xl bg-white shadow-subtle border border-linen-200 text-indigo-900 mb-4">
        <Icon className="w-8 h-8 stroke-[1.75]" />
      </div>
      <h3 className="text-base font-bold text-linen-900 tracking-tight">{title}</h3>
      <p className="mt-1 text-xs text-linen-500 max-w-sm leading-relaxed">{description}</p>
      {actionText && onAction && (
        <div className="mt-5">
          <Button variant="primary" size="sm" onClick={onAction}>
            {actionText}
          </Button>
        </div>
      )}
    </div>
  );
}
