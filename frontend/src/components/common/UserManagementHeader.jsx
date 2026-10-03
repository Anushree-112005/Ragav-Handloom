import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  Users, ShieldCheck, Building2, Factory,
  UserCheck, History, FileText
} from 'lucide-react';

export default function UserManagementHeader({ title, subtitle, children }) {
  const tabs = [
    { name: 'Users Directory', path: '/users', icon: Users },
    { name: 'Roles & Permissions', path: '/roles', icon: ShieldCheck },
    { name: 'Departments', path: '/departments', icon: Building2 },
    { name: 'Plant / Unit Access', path: '/plants', icon: Factory },
    { name: 'User Approvals', path: '/user-approvals', icon: UserCheck, badge: '1' },
    { name: 'Login Activity', path: '/login-activity', icon: History },
    { name: 'Audit Logs', path: '/audit-logs', icon: FileText },
  ];

  return (
    <div className="space-y-4">
      {/* Top Header Row with Title and Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider bg-indigo-100 text-indigo-950 dark:bg-indigo-900 dark:text-indigo-200">
              User Management
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-linen-900 dark:text-white tracking-tight mt-1">
            {title || 'User & Access Management'}
          </h1>
          {subtitle && (
            <p className="text-xs text-linen-500 dark:text-gray-400 mt-1">
              {subtitle}
            </p>
          )}
        </div>

        {children && (
          <div className="flex items-center gap-2.5 flex-wrap">
            {children}
          </div>
        )}
      </div>

      {/* Sub-Navigation Tabs Bar */}
      <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-white dark:bg-gray-900 border border-linen-200 dark:border-gray-800 shadow-sm overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <NavLink
              key={tab.path}
              to={tab.path}
              end={tab.path === '/users'}
              className={({ isActive }) =>
                `flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all select-none ${
                  isActive
                    ? 'bg-indigo-900 text-white shadow-sm dark:bg-indigo-600'
                    : 'text-linen-600 hover:text-linen-900 hover:bg-linen-100 dark:text-gray-400 dark:hover:text-gray-100 dark:hover:bg-gray-800'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon
                    className={`w-4 h-4 shrink-0 transition-transform ${
                      isActive
                        ? 'text-saffron-300 dark:text-saffron-200'
                        : 'text-linen-400 dark:text-gray-500'
                    }`}
                  />
                  <span>{tab.name}</span>
                  {tab.badge && (
                    <span
                      className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                        isActive
                          ? 'bg-saffron-400 text-indigo-950'
                          : 'bg-saffron-100 text-saffron-800 dark:bg-amber-900 dark:text-amber-200'
                      }`}
                    >
                      {tab.badge}
                    </span>
                  )}
                </>
              )}
            </NavLink>
          );
        })}
      </div>
    </div>
  );
}
