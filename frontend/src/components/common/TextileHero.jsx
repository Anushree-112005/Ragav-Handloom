import React from 'react';

export default function TextileHero({
  tagline = 'Handloom & Textile Management Platform',
  title = 'From thread to finished fabric, manage your textile operations in one place.',
  description = 'Build a trusted foundation for every product, material, artisan, loom and production process.',
  badge = 'Handcrafted Heritage & Enterprise ERP',
  badgeColor = 'bg-teal-500/20 text-teal-300 border border-teal-400/30',
  actions,
  className = '',
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-950 via-purple-950 to-teal-950 text-white p-6 sm:p-8 md:p-10 shadow-xl border border-indigo-900/50 mb-8 ${className}`}
    >

      {/* Decorative Warp Thread Lines SVG Overlay */}
      <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-10 pointer-events-none hidden md:block">
        <svg viewBox="0 0 200 400" className="w-full h-full" fill="none" stroke="currentColor">
          {[...Array(20)].map((_, i) => (
            <line
              key={i}
              x1={i * 10}
              y1="0"
              x2={i * 10 + 40}
              y2="400"
              strokeWidth="1.2"
              strokeDasharray="4 4"
            />
          ))}
        </svg>
      </div>

      {/* Hero Content */}
      <div className="relative z-10 max-w-3xl">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider mb-4 shadow-sm backdrop-blur-md bg-white/10 text-saffron-300 border border-saffron-400/30">
          <span className="w-1.5 h-1.5 rounded-full bg-saffron-400 animate-pulse" />
          {badge}
        </div>

        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white leading-tight">
          {title}
        </h1>

        <p className="mt-3 text-sm sm:text-base text-linen-300 font-normal leading-relaxed max-w-2xl">
          {description}
        </p>

        {actions && <div className="mt-6 flex flex-wrap gap-3">{actions}</div>}
      </div>
    </div>
  );
}
