import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('loomora_token');
      const savedUser = localStorage.getItem('loomora_user');

      if (token && savedUser) {
        try {
          setUser(JSON.parse(savedUser));
          // Refresh user data in background
          const refreshed = await authService.getCurrentUser();
          setUser(refreshed);
          localStorage.setItem('loomora_user', JSON.stringify(refreshed));
        } catch (e) {
          console.warn('Auth token verification error:', e);
          localStorage.removeItem('loomora_token');
          localStorage.removeItem('loomora_user');
          setUser(null);
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email, password, rememberMe = false) => {
    const res = await authService.login(email, password, rememberMe);
    localStorage.setItem('loomora_token', res.access_token);
    localStorage.setItem('loomora_user', JSON.stringify(res.user));
    setUser(res.user);
    return res;
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
  };

  const isSuperAdmin = Boolean(
    user && (user.role_code === 'SUPER_ADMIN' || user.email === 'admin@loomora.com' || user.role === 'Super Administrator')
  );

  const canEditModule = (moduleKey) => {
    if (!user) return false;
    if (isSuperAdmin) return true;

    const role = user.role_code || '';
    const key = (moduleKey || '').toUpperCase();

    switch (key) {
      case 'PRODUCTION':
      case 'LOOMS':
      case 'ARTISANS':
      case 'FABRICS':
      case 'DESIGNS':
        return ['PROD_MANAGER', 'PROD_SUPERVISOR'].includes(role);
      case 'INVENTORY':
      case 'YARNS':
      case 'WAREHOUSES':
      case 'COLOURS':
      case 'UOM':
        return ['INV_MANAGER'].includes(role);
      case 'PURCHASE':
      case 'SUPPLIERS':
        return ['PURCH_MANAGER', 'INV_MANAGER'].includes(role);
      case 'SALES':
      case 'CUSTOMERS':
        return ['SALES_MANAGER'].includes(role);
      case 'QUALITY':
        return ['QC_MANAGER'].includes(role);
      case 'USERS':
      case 'DEPARTMENTS':
      case 'PLANTS':
        return ['HR_MANAGER'].includes(role);
      case 'ROLES':
        return false; // Only Super Admin can control Roles
      default:
        return false;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        isAuthenticated: !!user,
        isSuperAdmin,
        canEditModule,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
