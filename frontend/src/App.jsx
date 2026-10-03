import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { ThemeProvider } from './context/ThemeContext';
import AppLayout from './components/layout/AppLayout';
import LoadingSkeleton from './components/common/LoadingSkeleton';

// Auth Page
import LoginPage from './pages/auth/LoginPage';

// Dashboard
import DashboardPage from './pages/dashboard/DashboardPage';

// User Management Pages
import UsersListPage from './pages/users/UsersListPage';
import UserDetailPage from './pages/users/UserDetailPage';
import RolesPermissionsPage from './pages/users/RolesPermissionsPage';
import DepartmentsPage from './pages/users/DepartmentsPage';
import PlantsPage from './pages/users/PlantsPage';
import UserApprovalsPage from './pages/users/UserApprovalsPage';
import LoginActivityPage from './pages/users/LoginActivityPage';
import AuditLogsPage from './pages/users/AuditLogsPage';

// Master Data Pages
import MasterDataDashboardPage from './pages/master-data/MasterDataDashboardPage';
import ProductsPage from './pages/master-data/ProductsPage';
import FabricsPage from './pages/master-data/FabricsPage';
import YarnsPage from './pages/master-data/YarnsPage';
import ColoursPage from './pages/master-data/ColoursPage';
import DesignsPage from './pages/master-data/DesignsPage';
import LoomsPage from './pages/master-data/LoomsPage';
import ArtisansPage from './pages/master-data/ArtisansPage';
import SuppliersPage from './pages/master-data/SuppliersPage';
import CustomersPage from './pages/master-data/CustomersPage';
import WarehousesPage from './pages/master-data/WarehousesPage';
import UomPage from './pages/master-data/UomPage';
import TaxRatesPage from './pages/master-data/TaxRatesPage';

// Operations Pages
import ProductionPage from './pages/operations/ProductionPage';
import InventoryPage from './pages/operations/InventoryPage';
import PurchasePage from './pages/operations/PurchasePage';
import SalesPage from './pages/operations/SalesPage';
import QualityPage from './pages/operations/QualityPage';

// Reports & Settings
import ReportsPage from './pages/reports/ReportsPage';
import SettingsPage from './pages/settings/SettingsPage';

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-50 dark:bg-surface-950">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-4 border-textile-purple border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-serif font-semibold text-surface-600 dark:text-surface-400">
            Loading Loomora ERP...
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function PublicRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) return null;

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              {/* Public Auth Route */}
              <Route
                path="/login"
                element={
                  <PublicRoute>
                    <LoginPage />
                  </PublicRoute>
                }
              />

              {/* Protected Application Routes inside AppLayout */}
              <Route
                element={
                  <ProtectedRoute>
                    <AppLayout />
                  </ProtectedRoute>
                }
              >
                {/* Dashboard */}
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<DashboardPage />} />

                {/* User Management */}
                <Route path="/users" element={<UsersListPage />} />
                <Route path="/users/:id" element={<UserDetailPage />} />
                <Route path="/roles" element={<RolesPermissionsPage />} />
                <Route path="/users/roles" element={<RolesPermissionsPage />} />
                <Route path="/departments" element={<DepartmentsPage />} />
                <Route path="/users/departments" element={<DepartmentsPage />} />
                <Route path="/plants" element={<PlantsPage />} />
                <Route path="/users/plants" element={<PlantsPage />} />
                <Route path="/user-approvals" element={<UserApprovalsPage />} />
                <Route path="/users/approvals" element={<UserApprovalsPage />} />
                <Route path="/login-activity" element={<LoginActivityPage />} />
                <Route path="/users/login-activity" element={<LoginActivityPage />} />
                <Route path="/audit-logs" element={<AuditLogsPage />} />
                <Route path="/users/audit-logs" element={<AuditLogsPage />} />

                {/* Master Data */}
                <Route path="/master-data" element={<MasterDataDashboardPage />} />
                <Route path="/products" element={<ProductsPage />} />
                <Route path="/master-data/products" element={<ProductsPage />} />
                <Route path="/fabrics" element={<FabricsPage />} />
                <Route path="/master-data/fabrics" element={<FabricsPage />} />
                <Route path="/yarns" element={<YarnsPage />} />
                <Route path="/master-data/yarns" element={<YarnsPage />} />
                <Route path="/colours" element={<ColoursPage />} />
                <Route path="/master-data/colours" element={<ColoursPage />} />
                <Route path="/designs" element={<DesignsPage />} />
                <Route path="/master-data/designs" element={<DesignsPage />} />
                <Route path="/looms" element={<LoomsPage />} />
                <Route path="/master-data/looms" element={<LoomsPage />} />
                <Route path="/artisans" element={<ArtisansPage />} />
                <Route path="/master-data/artisans" element={<ArtisansPage />} />
                <Route path="/suppliers" element={<SuppliersPage />} />
                <Route path="/master-data/suppliers" element={<SuppliersPage />} />
                <Route path="/customers" element={<CustomersPage />} />
                <Route path="/master-data/customers" element={<CustomersPage />} />
                <Route path="/warehouses" element={<WarehousesPage />} />
                <Route path="/master-data/warehouses" element={<WarehousesPage />} />
                <Route path="/uom" element={<UomPage />} />
                <Route path="/master-data/uom" element={<UomPage />} />
                <Route path="/tax-rates" element={<TaxRatesPage />} />
                <Route path="/master-data/tax-rates" element={<TaxRatesPage />} />

                {/* Operations */}
                <Route path="/production" element={<ProductionPage />} />
                <Route path="/operations/production" element={<ProductionPage />} />
                <Route path="/inventory" element={<InventoryPage />} />
                <Route path="/operations/inventory" element={<InventoryPage />} />
                <Route path="/purchase" element={<PurchasePage />} />
                <Route path="/operations/purchase" element={<PurchasePage />} />
                <Route path="/sales" element={<SalesPage />} />
                <Route path="/operations/sales" element={<SalesPage />} />
                <Route path="/quality" element={<QualityPage />} />
                <Route path="/operations/quality" element={<QualityPage />} />

                {/* Analytics & System */}
                <Route path="/reports" element={<ReportsPage />} />
                <Route path="/settings" element={<SettingsPage />} />

                {/* Catch-all */}
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
