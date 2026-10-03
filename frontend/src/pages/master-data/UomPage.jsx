import React, { useState, useEffect } from 'react';
import { Ruler, Plus, Edit2, Trash2, Search, Filter } from 'lucide-react';
import { uomService } from '../../services/masterDataService';
import { useToast } from '../../context/ToastContext';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import StatusBadge from '../../components/common/StatusBadge';
import Modal from '../../components/common/Modal';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';

export default function UomPage() {
  const [uoms, setUoms] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingUom, setEditingUom] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [uomToDelete, setUomToDelete] = useState(null);
  const [saveLoading, setSaveLoading] = useState(false);

  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    status: 'ACTIVE',
  });

  const toast = useToast();

  const fetchUoms = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;

      const res = await uomService.getAll(params);
      setUoms(Array.isArray(res) ? res : (res?.items || []));
    } catch (err) {
      toast.error('Failed to load UOMs: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUoms();
  }, [search, statusFilter]);

  const handleOpenCreate = () => {
    setEditingUom(null);
    setFormData({
      code: '',
      name: '',
      description: '',
      status: 'ACTIVE',
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (u) => {
    setEditingUom(u);
    setFormData({
      code: u.code,
      name: u.name,
      description: u.description || '',
      status: u.status,
    });
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.code || !formData.name) {
      toast.error('UOM code and name are required');
      return;
    }
    setSaveLoading(true);
    try {
      if (editingUom) {
        await uomService.update(editingUom.id, formData);
        toast.success(`UOM '${formData.code}' updated.`);
      } else {
        await uomService.create(formData);
        toast.success(`UOM '${formData.code}' created.`);
      }
      setModalOpen(false);
      fetchUoms();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaveLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!uomToDelete) return;
    try {
      await uomService.delete(uomToDelete.id);
      toast.success(`UOM '${uomToDelete.code}' deleted.`);
      setDeleteDialogOpen(false);
      fetchUoms();
    } catch (err) {
      toast.error('Failed to delete UOM: ' + err.message);
    }
  };

  const columns = [
    {
      header: 'Code',
      accessor: (u) => (
        <span className="font-mono text-sm font-bold text-surface-900 dark:text-surface-100 uppercase">
          {u.code}
        </span>
      ),
    },
    {
      header: 'Unit Name',
      accessor: (u) => (
        <span className="font-medium text-surface-900 dark:text-surface-100 text-sm">
          {u.name}
        </span>
      ),
    },
    {
      header: 'Description',
      accessor: (u) => (
        <span className="text-xs text-surface-600 dark:text-surface-400">
          {u.description || '—'}
        </span>
      ),
    },
    {
      header: 'Status',
      accessor: (u) => <StatusBadge status={u.status} />,
    },
    {
      header: 'Actions',
      align: 'right',
      accessor: (u) => (
        <div className="flex items-center justify-end space-x-1">
          <Button
            variant="ghost"
            size="sm"
            className="p-1.5 text-surface-500 hover:text-textile-purple"
            onClick={() => handleOpenEdit(u)}
          >
            <Edit2 className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="p-1.5 text-surface-500 hover:text-rose-600"
            onClick={() => {
              setUomToDelete(u);
              setDeleteDialogOpen(true);
            }}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-surface-900 dark:text-surface-50 flex items-center gap-2">
            <Ruler className="w-7 h-7 text-slate-600" />
            Units of Measure (UOM)
          </h1>
          <p className="text-sm text-surface-500 dark:text-surface-400 mt-1">
            Standardize units of measurement for meters, kilograms, yardage, than, and sarees.
          </p>
        </div>
        <Button variant="primary" icon={Plus} onClick={handleOpenCreate}>
          Add UOM
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-surface-0 dark:bg-surface-900 p-4 rounded-xl border border-border flex flex-col md:flex-row gap-4 items-center justify-between shadow-sm">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
          <input
            type="text"
            placeholder="Search code, name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-surface-50 dark:bg-surface-800 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-textile-purple/30"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 text-xs bg-surface-50 dark:bg-surface-800 border border-border rounded-lg text-surface-700 dark:text-surface-300 focus:outline-none focus:ring-2 focus:ring-textile-purple/30"
        >
          <option value="">All Statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <LoadingSkeleton type="table" rows={6} />
      ) : (
        <Table
          columns={columns}
          data={uoms}
          emptyMessage="No units of measure found matching the criteria."
        />
      )}

      {/* Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingUom ? `Edit UOM: ${editingUom.code}` : 'Add Unit of Measure'}
        size="md"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="UOM Code *"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
              required
              placeholder="e.g. MTR, KG, PCS, THN"
            />
            <Input
              label="UOM Full Name *"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              placeholder="e.g. Linear Meters"
            />
          </div>

          <Input
            label="Description & Conversion Notes"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Standard metric meter for running woven lengths"
          />

          <Select
            label="Status"
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            options={[
              { value: 'ACTIVE', label: 'Active Standard' },
              { value: 'INACTIVE', label: 'Inactive' },
            ]}
          />

          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-border">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" loading={saveLoading}>
              {editingUom ? 'Save Changes' : 'Create UOM'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Dialog */}
      <ConfirmDialog
        isOpen={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDelete}
        title="Delete Unit of Measure"
        message={`Are you sure you want to delete UOM '${uomToDelete?.code}'?`}
        confirmText="Delete UOM"
        variant="danger"
      />
    </div>
  );
}
