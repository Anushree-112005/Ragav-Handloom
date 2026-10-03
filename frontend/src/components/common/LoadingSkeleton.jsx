import React from 'react';

export default function LoadingSkeleton({ type = 'table', rows = 6 }) {
  if (type === 'cards') {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="p-5 rounded-2xl bg-white border border-linen-200 shadow-subtle animate-pulse">
            <div className="flex justify-between items-start mb-4">
              <div className="h-4 bg-linen-200 rounded w-24" />
              <div className="w-8 h-8 rounded-xl bg-linen-200" />
            </div>
            <div className="h-8 bg-linen-200 rounded w-20 mb-2" />
            <div className="h-3 bg-linen-100 rounded w-32" />
          </div>
        ))}
      </div>
    );
  }

  // Default table rows skeleton
  return (
    <div className="rounded-2xl border border-linen-200 bg-white overflow-hidden shadow-subtle">
      <div className="p-4 border-b border-linen-200 bg-linen-50/50 flex gap-4">
        <div className="h-4 bg-linen-200 rounded w-1/4 animate-pulse" />
        <div className="h-4 bg-linen-200 rounded w-1/4 animate-pulse" />
        <div className="h-4 bg-linen-200 rounded w-1/4 animate-pulse" />
        <div className="h-4 bg-linen-200 rounded w-1/4 animate-pulse" />
      </div>
      <div className="divide-y divide-linen-100">
        {[...Array(rows)].map((_, i) => (
          <div key={i} className="p-4 flex items-center justify-between gap-4 animate-pulse">
            <div className="h-4 bg-linen-100 rounded w-1/5" />
            <div className="h-4 bg-linen-100 rounded w-1/4" />
            <div className="h-4 bg-linen-100 rounded w-1/6" />
            <div className="h-6 bg-linen-100 rounded-full w-20" />
            <div className="h-4 bg-linen-100 rounded w-12" />
          </div>
        ))}
      </div>
    </div>
  );
}
