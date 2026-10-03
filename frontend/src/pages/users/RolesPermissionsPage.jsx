import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Plus, Check, Save, Lock, AlertCircle, Trash2 } from 'lucide-react';
import { roleService } from '../../services/adminServices';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import Input from '../../components/common/Input';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';
import UserManagementHeader from '../../components/common/UserManagementHeader';

export default function RolesPermissionsPage() {
  const { user, isSuperAdmin } = useAuth();
  const navigate = useNavigate();
  const [roles, setRoles] = useState([]);
  const [selectedRoleId, setSelectedRoleId] = useState(null);
  const [currentRole, setCurrentRole] = useState(null);
  const [permissionsMatrix, setPermissionsMatrix] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saveLoading, setSaveLoading] = useState(false);

  // New role modal
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleCode, setNewRoleCode] = useState('');
  const [newRoleDesc, setNewRoleDesc] = useState('');

  const toast = useToast();

  const fetchRoles = async (targetId = null) => {
    setLoading(true);
    try {
      const data = await roleService.getRoles();
      setRoles(data);
      const idToSelect = targetId || selectedRoleId || (data.length > 0 ? data[0].id : null);
      if (idToSelect) {
        const found = data.find((r) => r.id === idToSelect) || data[0];
        if (found) {
          setSelectedRoleId(found.id);
          setCurrentRole(found);
          setPermissionsMatrix(found.permissions || []);
        }
      }
    } catch (err) {
      toast.error('Failed to load roles: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  const handleSelectRole = (r) => {
    setSelectedRoleId(r.id);
    setCurrentRole(r);
    setPermissionsMatrix(r.permissions || []);
  };

  const handleTogglePerm = (moduleIndex, permField) => {
    setPermissionsMatrix((prev) => {
      const copy = [...prev];
      copy[moduleIndex] = {
        ...copy[moduleIndex],
        [permField]: !copy[moduleIndex][permField],
      };
      return copy;
    });
  };

  const handleSavePermissions = async () => {
    if (!currentRole) return;
    setSaveLoading(true);
    try {
      await roleService.updateRole(currentRole.id, {
        permissions: permissionsMatrix,
      });
      toast.success(`Permissions for '${currentRole.name}' saved to PostgreSQL.`);
      await fetchRoles(currentRole.id);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaveLoading(false);
    }
  };

  const handleCreateRole = async (e) => {
    e.preventDefault();
    if (!newRoleName || !newRoleCode) {
      toast.error('Please specify both role name and code');
      return;
    }
    setSaveLoading(true);
    try {
      const created = await roleService.createRole({
        name: newRoleName.trim(),
        code: newRoleCode.trim().toUpperCase(),
        description: newRoleDesc.trim(),
        is_system: false,
      });
      toast.success(`Role '${created.name}' created and loaded!`);
      setCreateModalOpen(false);
      setNewRoleName('');
      setNewRoleCode('');
      setNewRoleDesc('');
      await fetchRoles(created.id);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaveLoading(false);
    }
  };

  const handleDeleteRole = async (e, r) => {
    e.stopPropagation();
    if (r.is_system) {
      toast.error("System default roles cannot be deleted.");
      return;
    }
    if (r.user_count > 0) {
      toast.error(`Cannot delete role '${r.name}' because ${r.user_count} users are assigned to it.`);
      return;
    }
    if (!window.confirm(`Are you sure you want to permanently delete custom role '${r.name}'?`)) {
      return;
    }
    try {
      await roleService.deleteRole(r.id);
      toast.success(`Role '${r.name}' deleted successfully.`);
      await fetchRoles();
    } catch (err) {
      toast.error(err.message);
    }
  };

  if (loading) {
    return <LoadingSkeleton type="table" rows={6} />;
  }

  // Super Admin Access Guard
  if (!isSuperAdmin) {
    return (
      <div className="space-y-6">
        <UserManagementHeader
          title="Roles & Permissions Matrix"
          subtitle="Restricted System Administration Section"
        />
        <div className="p-8 rounded-3xl border border-amber-200 bg-amber-50/70 text-center max-w-xl mx-auto space-y-4 shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center mx-auto">
            <Lock className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-linen-900">Access Restricted</h3>
            <p className="text-xs text-linen-600 mt-1">
              Only the <strong>Super Administrator</strong> has authorization to view and configure Roles & Permissions matrices.
            </p>
            <p className="text-xs text-linen-500 mt-2">
              You are currently signed in as <strong>{user?.full_name}</strong> (<span className="text-indigo-900 font-semibold">{user?.role}</span> &bull; {user?.department}).
            </p>
          </div>
          <div className="pt-2">
            <Button variant="primary" size="sm" onClick={() => navigate('/dashboard')}>
              Return to Department Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Unified User Management Header & Tabs */}
      <UserManagementHeader
        title="Roles & Permissions Matrix"
        subtitle="Configure module-level access control across handloom management operations."
      >
        <Button
          variant="primary"
          size="md"
          icon={Plus}
          onClick={() => setCreateModalOpen(true)}
        >
          Create Custom Role
        </Button>
      </UserManagementHeader>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Column: Role Selector List */}
        <div className="space-y-2">
          <p className="text-xs font-bold text-linen-400 uppercase tracking-wider px-2">
            System & Custom Roles ({roles.length})
          </p>
          <div className="rounded-2xl border border-linen-200 bg-white shadow-subtle p-2 space-y-1">
            {roles.map((r) => {
              const isSelected = selectedRoleId === r.id;
              return (
                <div
                  key={r.id}
                  onClick={() => handleSelectRole(r)}
                  className={`group w-full flex items-center justify-between p-3 rounded-xl text-left text-xs transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-900 text-white font-bold shadow-sm'
                      : 'hover:bg-linen-100 text-linen-800'
                  }`}
                >
                  <div className="truncate flex-1">
                    <p className="font-bold flex items-center gap-1.5">
                      {r.is_system && <Lock className="w-3 h-3 text-saffron-300" />}
                      <span className="truncate">{r.name}</span>
                    </p>
                    <p
                      className={`text-[10px] mt-0.5 truncate ${
                        isSelected ? 'text-indigo-200' : 'text-linen-400'
                      }`}
                    >
                      {r.user_count} assigned users
                    </p>
                  </div>

                  {!r.is_system && (
                    <button
                      type="button"
                      title="Delete Custom Role"
                      onClick={(e) => handleDeleteRole(e, r)}
                      className={`p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity ${
                        isSelected
                          ? 'text-indigo-200 hover:text-white hover:bg-white/10'
                          : 'text-linen-400 hover:text-crimson-600 hover:bg-crimson-50'
                      }`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Interactive Permission Matrix */}
        <div className="lg:col-span-3">
          <Card
            title={`Permission Matrix: ${currentRole?.name || ''}`}
            subtitle={currentRole?.description || 'Module permissions configuration'}
            headerAction={
              <Button
                variant="primary"
                size="sm"
                icon={Save}
                loading={saveLoading}
                onClick={handleSavePermissions}
              >
                Save Matrix
              </Button>
            }
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-linen-200 bg-linen-50/70 text-linen-700 font-bold uppercase tracking-wider">
                    <th className="py-3 px-4">ERP Module</th>
                    <th className="py-3 px-4 text-center">View</th>
                    <th className="py-3 px-4 text-center">Create</th>
                    <th className="py-3 px-4 text-center">Edit</th>
                    <th className="py-3 px-4 text-center">Delete</th>
                    <th className="py-3 px-4 text-center">Approve</th>
                    <th className="py-3 px-4 text-center">Export</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-linen-100">
                  {permissionsMatrix.map((perm, idx) => (
                    <tr key={perm.id || idx} className="hover:bg-linen-50/60">
                      <td className="py-3 px-4 font-bold text-linen-900">
                        {perm.module}
                      </td>

                      {['can_view', 'can_create', 'can_edit', 'can_delete', 'can_approve', 'can_export'].map(
                        (field) => (
                          <td key={field} className="py-3 px-4 text-center">
                            <label className="inline-flex items-center justify-center cursor-pointer p-1">
                              <input
                                type="checkbox"
                                checked={!!perm[field]}
                                onChange={() => handleTogglePerm(idx, field)}
                                className="w-4 h-4 rounded border-linen-300 text-indigo-900 focus:ring-indigo-600 cursor-pointer"
                              />
                            </label>
                          </td>
                        )
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-6 pt-4 border-t border-linen-100 flex items-center justify-between text-xs text-linen-500">
              <span className="flex items-center gap-1.5 text-linen-600">
                <ShieldCheck className="w-4 h-4 text-teal-600" />
                Changes take effect immediately upon saving and apply to all users assigned to this role.
              </span>
              <Button
                variant="primary"
                size="sm"
                icon={Save}
                loading={saveLoading}
                onClick={handleSavePermissions}
              >
                Save Changes
              </Button>
            </div>
          </Card>
        </div>
      </div>

      {/* Create Custom Role Modal */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Create Custom Access Role"
        subtitle="Define a new role and configure tailored module authorization."
        maxWidth="max-w-md"
      >
        <form onSubmit={handleCreateRole} className="space-y-4">
          <Input
            label="Role Name"
            required
            value={newRoleName}
            onChange={(e) => setNewRoleName(e.target.value)}
            placeholder="e.g. Master Weaving Auditor"
          />
          <Input
            label="Role Code"
            required
            value={newRoleCode}
            onChange={(e) => setNewRoleCode(e.target.value)}
            placeholder="e.g. WEAVING_AUDITOR"
          />
          <Input
            label="Description"
            value={newRoleDesc}
            onChange={(e) => setNewRoleDesc(e.target.value)}
            placeholder="Brief scope of responsibilities"
          />

          <div className="flex justify-end gap-2 pt-3 border-t border-linen-100">
            <Button variant="outline" size="sm" onClick={() => setCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" loading={saveLoading}>
              Create Role
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
