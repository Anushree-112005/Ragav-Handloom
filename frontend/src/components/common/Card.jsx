import React from 'react';

export default function Card({
  title,
  subtitle,
  headerAction,
  children,
  footer,
  className = '',
  bodyClassName = '',
}) {
  return (
    <div className={`rounded-2xl border border-linen-200 bg-white shadow-subtle transition-all duration-200 hover:shadow-card overflow-hidden ${className}`}>
      {(title || subtitle || headerAction) && (
        <div className="flex items-center justify-between px-6 py-4 border-b border-linen-100 bg-linen-50/40">
          <div>
            {title && <h3 className="text-base font-bold text-linen-900 tracking-tight">{title}</h3>}
            {subtitle && <p className="text-xs text-linen-500 mt-0.5">{subtitle}</p>}
          </div>
          {headerAction && <div>{headerAction}</div>}
        </div>
      )}

      <div className={`p-6 ${bodyClassName}`}>{children}</div>

      {footer && (
        <div className="px-6 py-3 border-t border-linen-100 bg-linen-50/30 text-xs text-linen-500">
          {footer}
        </div>
      )}
    </div>
  );
}
