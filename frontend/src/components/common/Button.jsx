import React from 'react';
import { Loader2 } from 'lucide-react';

export default function Button({
  children,
  type = 'button',
  variant = 'primary',
  size = 'md',
  icon: Icon,
  loading = false,
  disabled = false,
  className = '',
  onClick,
  ...props
}) {
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed select-none';

  const variants = {
    primary: 'bg-indigo-900 text-white hover:bg-indigo-800 focus:ring-indigo-700 shadow-sm hover:shadow active:scale-[0.98]',
    teal: 'bg-teal-800 text-white hover:bg-teal-700 focus:ring-teal-600 shadow-sm hover:shadow active:scale-[0.98]',
    purple: 'bg-purple-900 text-white hover:bg-purple-800 focus:ring-purple-700 shadow-sm hover:shadow active:scale-[0.98]',
    saffron: 'bg-saffron-600 text-white hover:bg-saffron-500 focus:ring-saffron-400 shadow-sm hover:shadow active:scale-[0.98]',
    danger: 'bg-coral-600 text-white hover:bg-coral-500 focus:ring-coral-400 shadow-sm hover:shadow active:scale-[0.98]',
    outline: 'border border-linen-300 text-linen-800 bg-white hover:bg-linen-100 focus:ring-indigo-500 shadow-sm',
    ghost: 'text-linen-600 hover:text-linen-900 hover:bg-linen-200/60 focus:ring-linen-400',
  };

  const sizes = {
    xs: 'text-xs px-2.5 py-1.5 gap-1.5',
    sm: 'text-xs px-3 py-2 gap-2',
    md: 'text-sm px-4 py-2.5 gap-2',
    lg: 'text-base px-5 py-3 gap-2.5',
  };

  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={`${baseClasses} ${variants[variant] || variants.primary} ${sizes[size] || sizes.md} ${className}`}
      {...props}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin text-current" />
      ) : Icon ? (
        <Icon className="w-4 h-4 shrink-0" />
      ) : null}
      <span>{children}</span>
    </button>
  );
}
