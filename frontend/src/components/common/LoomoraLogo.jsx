import React from 'react';

export default function LoomoraLogo({ size = 'default', showSubtitle = true, light = false }) {
  const isSmall = size === 'small';
  const isLarge = size === 'large';

  return (
    <div className="flex items-center gap-3 select-none">
      {/* Artisanal Loom & Weave SVG Emblem */}
      <div className={`relative flex items-center justify-center rounded-xl transition-transform hover:scale-105 ${
        isSmall ? 'w-8 h-8 p-1.5' : isLarge ? 'w-12 h-12 p-2.5' : 'w-10 h-10 p-2'
      } ${light ? 'bg-white/10 text-white' : 'bg-gradient-to-br from-indigo-900 via-purple-900 to-teal-800 text-white shadow-md'}`}>
        <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
          {/* Vertical Warp Threads */}
          <line x1="10" y1="6" x2="10" y2="34" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" opacity="0.85" />
          <line x1="17" y1="6" x2="17" y2="34" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" opacity="0.85" />
          <line x1="24" y1="6" x2="24" y2="34" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" opacity="0.85" />
          <line x1="31" y1="6" x2="31" y2="34" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" opacity="0.85" />

          {/* Horizontal Interlocking Weft Weave in Saffron/Coral */}
          <path d="M6 14 C14 11, 26 17, 34 14" stroke="#F59E0B" strokeWidth="2.8" strokeLinecap="round" />
          <path d="M6 22 C14 25, 26 19, 34 22" stroke="#14B8A6" strokeWidth="2.8" strokeLinecap="round" />
          <path d="M6 30 C14 27, 26 33, 34 30" stroke="#F43F5E" strokeWidth="2.8" strokeLinecap="round" />
        </svg>
      </div>

      <div>
        <div className="flex items-center gap-1.5 leading-none">
          <span className={`font-extrabold tracking-tight ${
            isSmall ? 'text-lg' : isLarge ? 'text-2xl' : 'text-xl'
          } ${light ? 'text-white' : 'text-indigo-950'}`}>
            LOOMORA
          </span>
          <span className={`px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ${
            isSmall ? 'text-[9px]' : 'text-[10px]'
          } ${light ? 'bg-teal-500/20 text-teal-300' : 'bg-indigo-100 text-indigo-900 border border-indigo-200'}`}>
            ERP
          </span>
        </div>
        {showSubtitle && (
          <p className={`font-medium tracking-wide uppercase ${
            isSmall ? 'text-[9px]' : isLarge ? 'text-xs' : 'text-[10px]'
          } ${light ? 'text-purple-200/70' : 'text-linen-500'} mt-0.5`}>
            Handloom & Textile Platform
          </p>
        )}
      </div>
    </div>
  );
}
