import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export default function Modal({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxWidth,
  size = 'md',
  showClose = true,
}) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };

    if (isOpen) {
      document.body.classList.add('modal-open');
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.classList.remove('modal-open');
      document.body.style.overflow = '';
      document.body.style.removeProperty('overflow');
    }

    return () => {
      document.body.classList.remove('modal-open');
      document.body.style.overflow = '';
      document.body.style.removeProperty('overflow');
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Resolve size
  let widthClass = 'max-w-2xl';
  if (maxWidth) {
    widthClass = maxWidth;
  } else if (size === 'sm') {
    widthClass = 'max-w-md';
  } else if (size === 'lg') {
    widthClass = 'max-w-3xl';
  } else if (size === 'xl') {
    widthClass = 'max-w-5xl';
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Dark backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="flex min-h-full items-center justify-center p-4 sm:p-6 text-center">
        <div
          className={`relative z-10 w-full ${widthClass} transform overflow-hidden rounded-2xl bg-white dark:bg-gray-900 text-left align-middle shadow-2xl transition-all border border-gray-200 dark:border-gray-800 animate-slide-up`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          {(title || showClose) && (
            <div className="flex items-start justify-between px-6 py-5 border-b border-gray-200 dark:border-gray-800 bg-gray-50/80 dark:bg-gray-800/60">
              <div>
                {title && (
                  <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 tracking-tight">
                    {title}
                  </h3>
                )}
                {subtitle && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {subtitle}
                  </p>
                )}
              </div>
              {showClose && (
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-lg p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
          )}

          {/* Body */}
          <div className="px-6 py-5 max-h-[calc(85vh-120px)] overflow-y-auto bg-white dark:bg-gray-900">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
