import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UserPlus, Download, RefreshCw, Eye, Edit2, ShieldAlert,
  KeyRound, Trash2, CheckCircle2, XCircle, Filter
} from 'lucide-react';
import { userService } from '../../services/userService';
import { roleService, departmentService, plantService } from '../../services/adminServices';
import { useToast } from '../../context/ToastContext';
import Table from '../../components/common/Table';
import Pagination from '../../components/common/Pagination';
import Button from '../../components/common/Button';
import SearchInput from '../../components/common/SearchInput';
import StatusBadge from '../../components/common/StatusBadge';
import EmptyState from '../../components/common/EmptyState';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';
import Modal from '../../components/common/Modal';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import UserManagementHeader from '../../components/common/UserManagementHeader';
import { useAuth } from '../../context/AuthContext';

export default function UsersListPage() {
  const { user, isSuperAdmin } = useAuth();
  const canManageUsers = Boolean(isSuperAdmin || user?.role_code === 'HR_MANAGER');
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [roleId, setRoleId] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [plantId, setPlantId] = useState('');

  // Dropdown options
  const [roles, setRoles] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [plants, setPlants] = useState([]);

  // Modals & Actions
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [resetPwdModalOpen, setResetPwdModalOpen] = useState(false);
  const [selectedUserForPwd, setSelectedUserForPwd] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    employee_id: '',
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    password: '',
    department_id: '',
    role_id: '',
    designation: '',
    status: 'ACTIVE',
    plant_ids: [],
  });

  const toast = useToast();
  const navigate = useNavigate();

  // Load supporting options once
  useEffect(() => {
    const loadOptions = async () => {
      try {
        const [rList, dList, pList] = await Promise.all([
          roleService.getRoles(),
          departmentService.getDepartments(),
          plantService.getPlants(),
        ]);
        setRoles(rList);
        setDepartments(dList);
        setPlants(pList);
      } catch (err) {
        console.error('Error fetching filter options:', err);
      }
    };
    loadOptions();
  }, []);

  // Fetch Users
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await userService.getUsers({
        search,
        department_id: departmentId || undefined,
        role_id: roleId || undefined,
        status: statusFilter || undefined,
        plant_id: plantId || undefined,
        page,
        page_size: pageSize,
      });
      setUsers(data.items);
      setTotal(data.total);
      setTotalPages(data.total_pages);
    } catch (err) {
      toast.error('Failed to load users: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, [search, departmentId, roleId, statusFilter, plantId, page, pageSize, toast]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Open Create Modal
  const handleOpenCreate = () => {
    setEditingUser(null);
    setFormData({
      employee_id: `EMP-${Math.floor(1000 + Math.random() * 9000)}`,
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      password: 'User@123',
      department_id: departments[0]?.id || '',
      role_id: roles[0]?.id || '',
      designation: '',
      status: 'ACTIVE',
      plant_ids: plants[0] ? [plants[0].id] : [],
    });
    setUserModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (u) => {
    setEditingUser(u);
    setFormData({
      employee_id: u.employee_id,
      first_name: u.first_name,
      last_name: u.last_name,
      email: u.email,
      phone: u.phone || '',
      password: '',
      department_id: u.department_id || '',
      role_id: u.role_id || '',
      designation: u.designation || '',
      status: u.status,
      plant_ids: u.plants ? u.plants.map((p) => p.plant_id) : [],
    });
    setUserModalOpen(true);
  };

  // Submit User Form (Create or Edit)
  const handleSaveUser = async (e) => {
    e.preventDefault();
    if (!formData.first_name || !formData.last_name || !formData.email || !formData.role_id) {
      toast.error('Please fill in all required fields');
      return;
    }

    setActionLoading(true);
    try {
      if (editingUser) {
        await userService.updateUser(editingUser.id, formData);
        toast.success(`User ${formData.first_name} updated successfully.`);
      } else {
        await userService.createUser(formData);
        toast.success(`User ${formData.first_name} created successfully.`);
      }
      setUserModalOpen(false);
      fetchUsers();
    } catch (err) {
      toast.error(err.message || 'Operation failed');
    } finally {
      setActionLoading(false);
    }
  };

  // Toggle User Active / Inactive
  const handleToggleStatus = async (u) => {
    const newStatus = u.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      await userService.updateStatus(u.id, newStatus);
      toast.success(`User status changed to ${newStatus}.`);
      fetchUsers();
    } catch (err) {
      toast.error(err.message);
    }
  };

  // Reset Password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setActionLoading(true);
    try {
      await userService.resetPassword(selectedUserForPwd.id, newPassword);
      toast.success(`Password reset for ${selectedUserForPwd.full_name}.`);
      setResetPwdModalOpen(false);
      setNewPassword('');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Delete User Confirmation
  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    setActionLoading(true);
    try {
      await userService.deleteUser(userToDelete.id);
      toast.success(`User ${userToDelete.full_name} deleted successfully.`);
      setDeleteDialogOpen(false);
      fetchUsers();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const columns = [
    { header: 'User / Employee ID', width: 'w-48' },
    { header: 'Contact & Email', width: 'w-56' },
    { header: 'Department', width: 'w-36' },
    { header: 'Assigned Role', width: 'w-40' },
    { header: 'Plant Access', width: 'w-36' },
    { header: 'Status', width: 'w-28' },
    { header: 'Last Login', width: 'w-36' },
    { header: 'Actions', width: 'w-36', align: 'right' },
  ];

  return (
    <div className="space-y-6">
      {/* Unified User Management Header & Tabs */}
      <UserManagementHeader
        title="Users Directory"
        subtitle="Manage employees, operators, artisans, and enterprise system users."
      >
        <a
          href="http://localhost:8000/api/reports/export-csv/users"
          className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-linen-300 bg-white text-xs font-semibold text-linen-700 hover:bg-linen-100 transition-colors shadow-sm dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200"
          download
        >
          <Download className="w-4 h-4 text-linen-500" />
          <span>Export CSV</span>
        </a>

        {canManageUsers ? (
          <Button
            variant="primary"
            size="md"
            icon={UserPlus}
            onClick={handleOpenCreate}
          >
            Add User
          </Button>
        ) : (
          <span className="inline-flex items-center px-3 py-2 text-xs font-bold rounded-xl bg-linen-100 text-linen-600 border border-linen-200 shadow-sm">
            Staff Directory (Read-Only)
          </span>
        )}
      </UserManagementHeader>

      {/* Filter Bar */}
      <div className="p-4 rounded-2xl bg-white border border-linen-200 shadow-subtle grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search by name, emp ID or email..."
        />

        <select
          value={departmentId}
          onChange={(e) => setDepartmentId(e.target.value)}
          className="rounded-xl border border-linen-300 text-xs px-3 py-2 bg-white text-linen-800 focus:outline-none focus:ring-2 focus:ring-indigo-100"
        >
          <option value="">All Departments</option>
          {departments.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>

        <select
          value={roleId}
          onChange={(e) => setRoleId(e.target.value)}
          className="rounded-xl border border-linen-300 text-xs px-3 py-2 bg-white text-linen-800 focus:outline-none focus:ring-2 focus:ring-indigo-100"
        >
          <option value="">All Roles</option>
          {roles.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-xl border border-linen-300 text-xs px-3 py-2 bg-white text-linen-800 focus:outline-none focus:ring-2 focus:ring-indigo-100"
        >
          <option value="">All Statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
          <option value="PENDING_APPROVAL">Pending Approval</option>
        </select>

        <div className="flex items-center gap-2">
          <select
            value={plantId}
            onChange={(e) => setPlantId(e.target.value)}
            className="w-full rounded-xl border border-linen-300 text-xs px-3 py-2 bg-white text-linen-800 focus:outline-none focus:ring-2 focus:ring-indigo-100"
          >
            <option value="">All Plants</option>
            {plants.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={fetchUsers}
            title="Refresh list"
            className="p-2 rounded-xl border border-linen-200 hover:bg-linen-100 text-linen-500 hover:text-indigo-900 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Users Table */}
      {loading ? (
        <LoadingSkeleton type="table" rows={6} />
      ) : users.length === 0 ? (
        <EmptyState
          title="No users found"
          description="No users match the selected filters. Clear filters or add a new user."
          actionText="Add New User"
          onAction={handleOpenCreate}
        />
      ) : (
        <>
          <Table columns={columns}>
            {users.map((u) => (
              <tr key={u.id} className="table-row-hover">
                <td className="py-3.5 px-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-900 to-indigo-700 text-white font-bold text-xs flex items-center justify-center ring-1 ring-linen-200 shadow-sm flex-shrink-0">
                      {(u.full_name || 'U').charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p
                        onClick={() => navigate(`/users/${u.id}`)}
                        className="font-bold text-linen-900 hover:text-indigo-900 cursor-pointer transition-colors"
                      >
                        {u.full_name}
                      </p>
                      <p className="text-xs text-linen-500 font-mono mt-0.5">
                        {u.employee_id}
                      </p>
                    </div>
                  </div>
                </td>

                <td className="py-3.5 px-4">
                  <p className="text-xs font-medium text-linen-800">{u.email}</p>
                  <p className="text-[11px] text-linen-400 mt-0.5">{u.phone || 'No phone'}</p>
                </td>

                <td className="py-3.5 px-4">
                  <span className="text-xs font-semibold text-linen-700">
                    {u.department_name || 'Unassigned'}
                  </span>
                </td>

                <td className="py-3.5 px-4">
                  <span className="inline-block px-2.5 py-1 rounded-lg text-xs font-bold bg-indigo-50 text-indigo-900 border border-indigo-100">
                    {u.role_name || 'No Role'}
                  </span>
                </td>

                <td className="py-3.5 px-4">
                  <span className="text-xs text-linen-600">
                    {u.plants && u.plants.length > 0
                      ? u.plants.map((p) => p.plant_name).join(', ')
                      : 'Global'}
                  </span>
                </td>

                <td className="py-3.5 px-4">
                  <StatusBadge status={u.status} size="sm" />
                </td>

                <td className="py-3.5 px-4 text-xs text-linen-500">
                  {u.last_login
                    ? new Date(u.last_login).toLocaleDateString()
                    : 'Never logged in'}
                </td>

                <td className="py-3.5 px-4 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      type="button"
                      onClick={() => navigate(`/users/${u.id}`)}
                      className="p-1.5 rounded-lg text-linen-400 hover:text-indigo-900 hover:bg-indigo-50 transition-colors"
                      title="View Profile Details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>

                    {canManageUsers && (
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(u)}
                        className="p-1.5 rounded-lg text-linen-400 hover:text-indigo-900 hover:bg-indigo-50 transition-colors"
                        title="Edit User"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    )}

                    {isSuperAdmin && (
                      <>
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(u)}
                          className={`p-1.5 rounded-lg transition-colors ${
                            u.status === 'ACTIVE'
                              ? 'text-linen-400 hover:text-coral-600 hover:bg-coral-50'
                              : 'text-linen-400 hover:text-teal-600 hover:bg-teal-50'
                          }`}
                          title={u.status === 'ACTIVE' ? 'Deactivate User' : 'Activate User'}
                        >
                          {u.status === 'ACTIVE' ? (
                            <XCircle className="w-4 h-4" />
                          ) : (
                            <CheckCircle2 className="w-4 h-4" />
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setSelectedUserForPwd(u);
                            setResetPwdModalOpen(true);
                          }}
                          className="p-1.5 rounded-lg text-linen-400 hover:text-saffron-600 hover:bg-saffron-50 transition-colors"
                          title="Reset Password"
                        >
                          <KeyRound className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setUserToDelete(u);
                            setDeleteDialogOpen(true);
                          }}
                          className="p-1.5 rounded-lg text-linen-400 hover:text-coral-600 hover:bg-coral-50 transition-colors"
                          title="Delete User"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </Table>

          {/* Pagination */}
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            totalItems={total}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
          />
        </>
      )}

      {/* Add / Edit User Modal */}
      <Modal
        isOpen={userModalOpen}
        onClose={() => setUserModalOpen(false)}
        title={editingUser ? `Edit User: ${editingUser.full_name}` : 'Add New Enterprise User'}
        subtitle="Configure personal information, department assignment, role permissions and plant access."
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleSaveUser} className="space-y-5">
          {/* Section 1: Personal Information */}
          <div>
            <h4 className="text-xs font-bold text-linen-500 uppercase tracking-wider mb-3">
              1. Personal Information
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="First Name"
                required
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                placeholder="e.g. Meena"
              />
              <Input
                label="Last Name"
                required
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                placeholder="e.g. Sundaram"
              />
              <Input
                label="Email Address"
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="e.g. meena.s@loomora.com"
              />
              <Input
                label="Phone Number"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+91 98421 11223"
              />
              <Input
                label="Employee ID"
                required
                value={formData.employee_id}
                onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
                placeholder="EMP-1005"
              />
              <Input
                label="Designation / Title"
                value={formData.designation}
                onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                placeholder="Quality Assurance Lead"
              />
            </div>
          </div>

          {/* Section 2: Department & Role */}
          <div className="pt-2 border-t border-linen-100">
            <h4 className="text-xs font-bold text-linen-500 uppercase tracking-wider mb-3">
              2. Organization & Access Role
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select
                label="Department"
                required
                value={formData.department_id}
                onChange={(e) => setFormData({ ...formData, department_id: e.target.value })}
                options={departments.map((d) => ({ value: d.id, label: d.name }))}
              />
              <Select
                label="Assigned Role"
                required
                value={formData.role_id}
                onChange={(e) => setFormData({ ...formData, role_id: e.target.value })}
                options={roles.map((r) => ({ value: r.id, label: r.name }))}
              />
            </div>
          </div>

          {/* Section 3: Plant / Unit Assignment */}
          <div className="pt-2 border-t border-linen-100">
            <h4 className="text-xs font-bold text-linen-500 uppercase tracking-wider mb-2">
              3. Manufacturing Plant Unit Access
            </h4>
            <p className="text-xs text-linen-500 mb-3">
              Select which handloom plants and processing facilities this user can access.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {plants.map((p) => {
                const isChecked = formData.plant_ids.includes(p.id);
                return (
                  <label
                    key={p.id}
                    className={`flex items-center gap-3 p-3 rounded-xl border text-xs font-semibold cursor-pointer transition-colors ${
                      isChecked
                        ? 'border-indigo-600 bg-indigo-50/50 text-indigo-950'
                        : 'border-linen-200 hover:bg-linen-50 text-linen-700'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData({ ...formData, plant_ids: [...formData.plant_ids, p.id] });
                        } else {
                          setFormData({
                            ...formData,
                            plant_ids: formData.plant_ids.filter((id) => id !== p.id),
                          });
                        }
                      }}
                      className="rounded border-linen-300 text-indigo-900 focus:ring-indigo-600"
                    />
                    <div>
                      <p>{p.name}</p>
                      <p className="text-[10px] text-linen-400 font-normal">{p.location}</p>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Section 4: Password (for new user) */}
          {!editingUser && (
            <div className="pt-2 border-t border-linen-100">
              <h4 className="text-xs font-bold text-linen-500 uppercase tracking-wider mb-3">
                4. Initial Security Credentials
              </h4>
              <Input
                label="Temporary Password"
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="••••••••"
                helperText="Password will be securely hashed with bcrypt in PostgreSQL."
              />
            </div>
          )}

          {/* Modal Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-linen-200">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setUserModalOpen(false)}
              disabled={actionLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              loading={actionLoading}
            >
              {editingUser ? 'Save Changes' : 'Create User'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Reset Password Modal */}
      <Modal
        isOpen={resetPwdModalOpen}
        onClose={() => setResetPwdModalOpen(false)}
        title="Admin Reset Password"
        subtitle={`Set a new login password for ${selectedUserForPwd?.full_name}.`}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleResetPassword} className="space-y-4">
          <Input
            label="New Password"
            type="password"
            required
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="At least 6 characters"
          />
          <div className="flex justify-end gap-2 pt-3">
            <Button variant="outline" size="sm" onClick={() => setResetPwdModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" loading={actionLoading}>
              Update Password
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirm Dialog */}
      <ConfirmDialog
        isOpen={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDeleteUser}
        title="Delete User Account"
        message={`Are you sure you want to permanently delete ${userToDelete?.full_name}? This user will be removed from PostgreSQL.`}
        confirmText="Delete User"
        type="danger"
        loading={actionLoading}
      />
    </div>
  );
}
