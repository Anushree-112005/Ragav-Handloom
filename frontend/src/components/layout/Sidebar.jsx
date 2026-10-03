import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Users, ShieldCheck, Building2, Factory,
  UserCheck, History, FileText, Database, Package, Sparkles,
  Layers, Palette, Grid, Settings2, UserCog, Truck, Users2,
  Warehouse, Scale, Receipt, Cpu, Boxes, ShoppingCart, TrendingUp,
  Award, BarChart3, Settings, ChevronLeft, ChevronRight, Menu, X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import LoomoraLogo from '../common/LoomoraLogo';

export default function Sidebar({ collapsed, setCollapsed, mobileOpen, setMobileOpen }) {
  const location = useLocation();
  const { user, isSuperAdmin } = useAuth();
  const role = user?.role_code || '';

  // Build dynamic navigation sections according to user role
  const userManagementItems = [
    { name: 'Users', path: '/users', icon: Users },
    // Only Super Admin can control Roles & Permissions
    ...(isSuperAdmin ? [{ name: 'Roles & Permissions', path: '/roles', icon: ShieldCheck }] : []),
    ...(isSuperAdmin || role === 'HR_MANAGER'
      ? [
          { name: 'Departments', path: '/departments', icon: Building2 },
          { name: 'Plant / Unit Access', path: '/plants', icon: Factory },
          { name: 'User Approvals', path: '/user-approvals', icon: UserCheck, badge: '1' },
          { name: 'Login Activity', path: '/login-activity', icon: History },
          { name: 'Audit Logs', path: '/audit-logs', icon: FileText },
        ]
      : []),
  ];

  const navSections = [
    {
      title: 'MAIN',
      items: [
        { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
      ],
    },
    ...(userManagementItems.length > 0
      ? [
          {
            title: isSuperAdmin ? 'USER MANAGEMENT (ADMIN)' : 'USER MANAGEMENT',
            items: userManagementItems,
          },
        ]
      : []),
    {
      title: 'MASTER DATA',
      items: [
        { name: 'Master Data Hub', path: '/master-data', icon: Database },
        { name: 'Product Master', path: '/products', icon: Package },
        { name: 'Fabric Master', path: '/fabrics', icon: Layers },
        { name: 'Yarn Master', path: '/yarns', icon: Sparkles },
        { name: 'Colour Master', path: '/colours', icon: Palette },
        { name: 'Design & Pattern', path: '/designs', icon: Grid },
        { name: 'Loom Master', path: '/looms', icon: Settings2 },
        { name: 'Weaver / Artisan', path: '/artisans', icon: UserCog },
        { name: 'Supplier Master', path: '/suppliers', icon: Truck },
        { name: 'Customer Master', path: '/customers', icon: Users2 },
        { name: 'Warehouse / Location', path: '/warehouses', icon: Warehouse },
        { name: 'UOM Master', path: '/uom', icon: Scale },
        { name: 'Tax / GST', path: '/tax-rates', icon: Receipt },
      ],
    },
    {
      title: 'OPERATIONS',
      items: [
        { name: 'Production', path: '/production', icon: Cpu },
        { name: 'Inventory', path: '/inventory', icon: Boxes },
        { name: 'Purchase', path: '/purchase', icon: ShoppingCart },
        { name: 'Sales', path: '/sales', icon: TrendingUp },
        { name: 'Quality Control', path: '/quality', icon: Award },
      ],
    },
    {
      title: 'ANALYTICS & SYSTEM',
      items: [
        { name: 'Reports & Export', path: '/reports', icon: BarChart3 },
        { name: 'Settings', path: '/settings', icon: Settings },
      ],
    },
  ];

  return (
    <>
      {/* Mobile Drawer Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-indigo-950/50 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 flex flex-col bg-white border-r border-linen-200 transition-all duration-300 ease-in-out ${
          collapsed ? 'w-20' : 'w-64'
        } ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Sidebar Header with Brand */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-linen-100 bg-linen-50/50">
          {!collapsed ? (
            <LoomoraLogo size="default" />
          ) : (
            <div className="mx-auto">
              <LoomoraLogo size="small" showSubtitle={false} />
            </div>
          )}

          <button
            type="button"
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex items-center justify-center p-1.5 rounded-lg text-linen-400 hover:text-linen-700 hover:bg-linen-100 transition-colors"
            title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>

          {/* Mobile close button */}
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="lg:hidden p-1.5 rounded-lg text-linen-400 hover:text-linen-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Navigation Items */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          {navSections.map((section, idx) => (
            <div key={idx} className="space-y-1">
              {!collapsed && (
                <p className="px-3 text-[10px] font-bold text-linen-400 uppercase tracking-widest">
                  {section.title}
                </p>
              )}
              {collapsed && <div className="h-px bg-linen-200 my-2 mx-2" />}

              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path || (item.path !== '/dashboard' && item.path !== '/master-data' && location.pathname.startsWith(item.path));

                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileOpen(false)}
                    title={collapsed ? item.name : undefined}
                    className={`group flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all select-none ${
                      isActive
                        ? 'bg-indigo-900 text-white shadow-sm'
                        : 'text-linen-600 hover:text-linen-900 hover:bg-linen-100'
                    }`}
                  >
                    <Icon
                      className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-110 ${
                        isActive ? 'text-saffron-300' : 'text-linen-400 group-hover:text-indigo-900'
                      }`}
                    />
                    {!collapsed && (
                      <span className="truncate flex-1 tracking-tight">{item.name}</span>
                    )}
                    {!collapsed && item.badge && (
                      <span
                        className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                          isActive
                            ? 'bg-saffron-400 text-indigo-950'
                            : 'bg-saffron-100 text-saffron-800'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </NavLink>
                );
              })}
            </div>
          ))}
        </div>

        {/* Sidebar Footer Plant Status Indicator */}
        {!collapsed && (
          <div className="p-3 border-t border-linen-100 bg-linen-50/50">
            <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-white border border-linen-200 text-xs">
              <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
              <div className="truncate">
                <p className="font-bold text-linen-900 leading-none">Erode Cluster Hub</p>
                <p className="text-[10px] text-linen-500 mt-0.5">Connected: PostgreSQL 18</p>
              </div>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}
