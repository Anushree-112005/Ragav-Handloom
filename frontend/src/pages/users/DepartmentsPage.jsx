import React, { useState, useEffect } from 'react';
import { Building2, Plus, Edit2, Trash2, Users, Factory } from 'lucide-react';
import { departmentService, plantService } from '../../services/adminServices';
import { useToast } from '../../context/ToastContext';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import StatusBadge from '../../components/common/StatusBadge';
import Modal from '../../components/common/Modal';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';
import UserManagementHeader from '../../components/common/UserManagementHeader';

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState([]);
  const [plants, setPlants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingDept, setEditingDept] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deptToDelete, setDeptToDelete] = useState(null);
  const [saveLoading, setSaveLoading] = useState(false);

  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    department_head: '',
    plant_id: '',
    status: 'ACTIVE',
  });

  const toast = useToast();

  const fetchDepartments = async () => {
    setLoading(true);
    try {
      const [depts, plts] = await Promise.all([
        departmentService.getDepartments(),
        plantService.getPlants(),
      ]);
      setDepartments(depts);
      setPlants(plts);
    } catch (err) {
      toast.error('Failed to load departments: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  const handleOpenCreate = () => {
    setEditingDept(null);
    setFormData({
      code: `DEPT-${Math.floor(100 + Math.random() * 900)}`,
      name: '',
      description: '',
      department_head: '',
      plant_id: plants[0]?.id || '',
      status: 'ACTIVE',
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (d) => {
    setEditingDept(d);
    setFormData({
      code: d.code,
      name: d.name,
      description: d.description || '',
      department_head: d.department_head || '',
      plant_id: d.plant_id || '',
      status: d.status,
    });
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.code || !formData.name) {
      toast.error('Department code and name are required');
      return;
    }
    setSaveLoading(true);
    try {
      if (editingDept) {
        await departmentService.updateDepartment(editingDept.id, formData);
        toast.success(`Department '${formData.name}' updated.`);
      } else {
        await departmentService.createDepartment(formData);
        toast.success(`Department '${formData.name}' created.`);
      }
      setModalOpen(false);
      fetchDepartments();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaveLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deptToDelete) return;
    setSaveLoading(true);
    try {
      await departmentService.deleteDepartment(deptToDelete.id);
      toast.success(`Department '${deptToDelete.name}' deleted.`);
      setDeleteDialogOpen(false);
      fetchDepartments();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaveLoading(false);
    }
  };

  const columns = [
    { header: 'Dept Code', width: 'w-28' },
    { header: 'Department Name', width: 'w-56' },
    { header: 'Department Head', width: 'w-48' },
    { header: 'Manufacturing Plant', width: 'w-48' },
    { header: 'Staff Count', width: 'w-32' },
    { header: 'Status', width: 'w-28' },
    { header: 'Actions', width: 'w-28', align: 'right' },
  ];

  return (
    <div className="space-y-6">
      {/* Unified User Management Header & Tabs */}
      <UserManagementHeader
        title="Department Management"
        subtitle="Organize handloom weaving, spinning, dyeing, and corporate divisions."
      >
        <Button variant="primary" size="md" icon={Plus} onClick={handleOpenCreate}>
          Add Department
        </Button>
      </UserManagementHeader>

      {loading ? (
        <LoadingSkeleton type="table" rows={6} />
      ) : (
        <Table columns={columns}>
          {departments.map((d) => (
            <tr key={d.id} className="table-row-hover">
              <td className="py-3.5 px-4 font-mono font-bold text-xs text-indigo-950">
                {d.code}
              </td>
              <td className="py-3.5 px-4">
                <p className="font-bold text-linen-900 text-xs">{d.name}</p>
                {d.description && (
                  <p className="text-[11px] text-linen-500 mt-0.5">{d.description}</p>
                )}
              </td>
              <td className="py-3.5 px-4 text-xs font-semibold text-linen-800">
                {d.department_head || 'Unassigned'}
              </td>
              <td className="py-3.5 px-4 text-xs text-linen-600">
                {d.plant_name || 'Global HQ'}
              </td>
              <td className="py-3.5 px-4 text-xs font-bold text-indigo-900">
                {d.user_count} Staff
              </td>
              <td className="py-3.5 px-4">
                <StatusBadge status={d.status} size="sm" />
              </td>
              <td className="py-3.5 px-4 text-right">
                <div className="flex items-center justify-end gap-1">
                  <button
                    onClick={() => handleOpenEdit(d)}
                    className="p-1.5 rounded-lg text-linen-400 hover:text-indigo-900 hover:bg-linen-100"
                    title="Edit Department"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      setDeptToDelete(d);
                      setDeleteDialogOpen(true);
                    }}
                    className="p-1.5 rounded-lg text-linen-400 hover:text-coral-600 hover:bg-coral-50"
                    title="Delete Department"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </Table>
      )}

      {/* Add / Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingDept ? `Edit Department: ${editingDept.name}` : 'Create New Department'}
        subtitle="Department codes and designations for workflow routing."
        maxWidth="max-w-md"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <Input
            label="Department Code"
            required
            value={formData.code}
            onChange={(e) => setFormData({ ...formData, code: e.target.value })}
            placeholder="e.g. WEAV"
          />
          <Input
            label="Department Name"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g. Handloom Weaving"
          />
          <Input
            label="Department Head"
            value={formData.department_head}
            onChange={(e) => setFormData({ ...formData, department_head: e.target.value })}
            placeholder="e.g. Arun Kumar"
          />
          <Select
            label="Manufacturing Plant Link"
            value={formData.plant_id}
            onChange={(e) => setFormData({ ...formData, plant_id: e.target.value })}
            options={plants.map((p) => ({ value: p.id, label: p.name }))}
            placeholder="Select Plant"
          />
          <Input
            label="Description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Short scope of department"
          />

          <div className="flex justify-end gap-2 pt-3 border-t border-linen-100">
            <Button variant="outline" size="sm" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" loading={saveLoading}>
              Save Department
            </Button>
          </div>
        </form>
      </Modal>

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDelete}
        title="Delete Department"
        message={`Are you sure you want to delete department '${deptToDelete?.name}'?`}
        type="danger"
        loading={saveLoading}
      />
    </div>
  );
}
