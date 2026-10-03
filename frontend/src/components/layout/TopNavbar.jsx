import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import {
  Menu, Search, Bell, HelpCircle, ChevronDown, User, Key,
  Settings, LogOut, Sun, Moon
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import NotificationPanel from './NotificationPanel';
import GlobalSearchModal from './GlobalSearchModal';

export default function TopNavbar({ onMenuClick, sidebarCollapsed }) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();

  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);

  // Global Ctrl+K / Cmd+K listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchModalOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Compute breadcrumbs and title
  const pathParts = location.pathname.split('/').filter(Boolean);
  const currentPageTitle = pathParts.length > 0
    ? pathParts[pathParts.length - 1].replace(/-/g, ' ').toUpperCase()
    : 'DASHBOARD';

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <>
      <header
        className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 sm:px-6 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 transition-all duration-300"
      >
        {/* Left: Mobile Menu Trigger + Breadcrumb */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-xl text-linen-600 hover:bg-linen-100 transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div>
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-linen-400 uppercase tracking-wider">
              <Link to="/dashboard" className="hover:text-indigo-900 transition-colors">
                LOOMORA
              </Link>
              {pathParts.length > 0 && <span>/</span>}
              {pathParts.map((part, idx) => (
                <span key={idx} className="capitalize text-linen-600">
                  {part.replace(/-/g, ' ')}
                </span>
              ))}
            </div>
            <h2 className="text-base font-extrabold text-linen-900 tracking-tight leading-none mt-0.5">
              {currentPageTitle}
            </h2>
          </div>
        </div>

        {/* Right Action Icons & User Profile */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Global Search Button */}
          <button
            type="button"
            onClick={() => setSearchModalOpen(true)}
            className="flex items-center gap-2 px-3 py-2 rounded-xl border border-linen-200 bg-linen-50/70 hover:bg-linen-100/70 text-xs font-medium text-linen-500 hover:text-linen-900 transition-colors shadow-subtle"
          >
            <Search className="w-3.5 h-3.5 text-linen-400" />
            <span className="hidden sm:inline">Search ERP...</span>
            <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-semibold text-linen-500 bg-white border border-linen-300 rounded shadow-xs">
              Ctrl K
            </kbd>
          </button>

          {/* Theme Toggle Button */}
          <button
            type="button"
            onClick={toggleTheme}
            className="p-2 rounded-xl text-linen-500 hover:text-indigo-900 hover:bg-linen-100 transition-colors"
            title={theme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-saffron-500" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Notifications Trigger */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setNotificationOpen(!notificationOpen)}
              className="relative p-2 rounded-xl text-linen-500 hover:text-indigo-900 hover:bg-linen-100 transition-colors"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-coral-500 ring-2 ring-white" />
            </button>
            <NotificationPanel
              isOpen={notificationOpen}
              onClose={() => setNotificationOpen(false)}
            />
          </div>

          {/* Help Button */}
          <Link
            to="/reports"
            className="p-2 rounded-xl text-linen-500 hover:text-indigo-900 hover:bg-linen-100 transition-colors hidden sm:block"
            title="Help & Reports"
          >
            <HelpCircle className="w-4 h-4" />
          </Link>

          <div className="h-6 w-px bg-linen-200 mx-1 hidden sm:block" />

          {/* User Profile Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
              className="flex items-center gap-2.5 p-1 rounded-xl hover:bg-linen-100 transition-colors select-none"
            >
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-900 to-indigo-700 text-white font-bold text-xs flex items-center justify-center ring-2 ring-indigo-900/10 shadow-sm flex-shrink-0">
                {(user?.full_name || 'Admin').charAt(0).toUpperCase()}
              </div>
              <div className="text-left hidden md:block">
                <p className="text-xs font-bold text-linen-900 leading-tight">
                  {user?.full_name || 'Super Admin'}
                </p>
                <p className="text-[10px] font-semibold text-indigo-700 leading-tight mt-0.5">
                  {user?.role || 'Super Administrator'}
                </p>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-linen-400 hidden sm:block" />
            </button>

            {/* Profile Menu Dropdown */}
            {profileDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-30"
                  onClick={() => setProfileDropdownOpen(false)}
                />
                <div className="absolute right-0 top-12 z-40 w-56 rounded-2xl bg-white border border-linen-200 shadow-modal overflow-hidden animate-slide-up">
                  <div className="px-4 py-3 border-b border-linen-100 bg-linen-50/60">
                    <p className="text-xs font-bold text-linen-900">{user?.full_name}</p>
                    <p className="text-[11px] text-linen-500 truncate">{user?.email}</p>
                    <span className="inline-block mt-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-100 text-indigo-900">
                      {user?.role}
                    </span>
                  </div>

                  <div className="p-1.5 space-y-0.5">
                    <Link
                      to={user?.id ? `/users/${user.id}` : '/users'}
                      onClick={() => setProfileDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-linen-700 hover:text-indigo-900 hover:bg-linen-100 transition-colors"
                    >
                      <User className="w-4 h-4 text-linen-400" />
                      <span>My Profile</span>
                    </Link>

                    <Link
                      to="/settings"
                      onClick={() => setProfileDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-linen-700 hover:text-indigo-900 hover:bg-linen-100 transition-colors"
                    >
                      <Key className="w-4 h-4 text-linen-400" />
                      <span>Change Password</span>
                    </Link>

                    <Link
                      to="/settings"
                      onClick={() => setProfileDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-linen-700 hover:text-indigo-900 hover:bg-linen-100 transition-colors"
                    >
                      <Settings className="w-4 h-4 text-linen-400" />
                      <span>ERP Settings</span>
                    </Link>
                  </div>

                  <div className="p-1.5 border-t border-linen-100">
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-coral-700 hover:bg-coral-50 transition-colors text-left"
                    >
                      <LogOut className="w-4 h-4 text-coral-600" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Global Search Modal */}
      <GlobalSearchModal
        isOpen={searchModalOpen}
        onClose={() => setSearchModalOpen(false)}
      />
    </>
  );
}
