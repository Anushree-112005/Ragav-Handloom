import React from 'react';

export default function Tabs({
  tabs = [],
  activeTab,
  onChange,
  className = '',
}) {
  return (
    <div className={`flex items-center gap-1 border-b border-linen-200 overflow-x-auto ${className}`}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        const Icon = tab.icon;

        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={`flex items-center gap-2 py-3 px-4 text-xs font-semibold uppercase tracking-wider border-b-2 transition-all whitespace-nowrap select-none ${
              isActive
                ? 'border-indigo-900 text-indigo-900'
                : 'border-transparent text-linen-500 hover:text-linen-900 hover:border-linen-300'
            }`}
          >
            {Icon && <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-900' : 'text-linen-400'}`} />}
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span
                className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                  isActive
                    ? 'bg-indigo-100 text-indigo-950'
                    : 'bg-linen-100 text-linen-600'
                }`}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
