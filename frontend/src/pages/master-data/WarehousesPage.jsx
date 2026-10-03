import React, { useState, useEffect } from 'react';
import { Home, Plus, Edit2, Trash2, Search, Filter, MapPin, Phone, User, Building } from 'lucide-react';
import { warehouseService } from '../../services/masterDataService';
import { plantService } from '../../services/adminServices';
import { useToast } from '../../context/ToastContext';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import StatusBadge from '../../components/common/StatusBadge';
import Modal from '../../components/common/Modal';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';

const WAREHOUSE_TYPES = [
  { value: 'RAW_MATERIAL', label: 'Raw Yarn & Fiber Godown' },
  { value: 'FINISHED_GOODS', label: 'Finished Handloom Textiles Depot' },
  { value: 'DYES_CHEMICALS', label: 'Dyes & Mordant Store' },
  { value: 'TRANSIT', label: 'Transit & Dispatch Hub' },
];

export default function WarehousesPage() {
  const [warehouses, setWarehouses] = useState([]);
  const [plants, setPlants] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [warehouseToDelete, setWarehouseToDelete] = useState(null);
  const [saveLoading, setSaveLoading] = useState(false);

  const [formData, setFormData] = useState({
    code: '',
    name: '',
    plant_id: '',
    location: 'Kanchipuram Facility',
    warehouse_type: 'RAW_MATERIAL',
    capacity_sqft: 8000,
    manager_name: '',
    contact_phone: '',
    status: 'ACTIVE',
  });

  const toast = useToast();

  const fetchDependencies = async () => {
    try {
      const plts = await plantService.getPlants();
      setPlants(Array.isArray(plts) ? plts : (plts?.items || []));
    } catch (err) {
      console.error('Failed to load plants:', err);
    }
  };

  const fetchWarehouses = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (typeFilter) params.warehouse_type = typeFilter;
      if (statusFilter) params.status = statusFilter;

      const res = await warehouseService.getAll(params);
      setWarehouses(Array.isArray(res) ? res : (res?.items || []));
    } catch (err) {
      toast.error('Failed to load warehouses: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDependencies();
  }, []);

  useEffect(() => {
    fetchWarehouses();
  }, [search, typeFilter, statusFilter]);

  const handleOpenCreate = () => {
    setEditingWarehouse(null);
    setFormData({
      code: `WH-${Math.floor(100 + Math.random() * 900)}`,
      name: '',
      plant_id: plants[0]?.id || '',
      location: 'Central Plant Area',
      warehouse_type: 'RAW_MATERIAL',
      capacity_sqft: 10000,
      manager_name: '',
      contact_phone: '+91 98450 12345',
      status: 'ACTIVE',
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (w) => {
    setEditingWarehouse(w);
    setFormData({
      code: w.code,
      name: w.name,
      plant_id: w.plant_id || '',
      location: w.location || '',
      warehouse_type: w.warehouse_type,
      capacity_sqft: w.capacity_sqft || 0,
      manager_name: w.manager_name || '',
      contact_phone: w.contact_phone || '',
      status: w.status,
    });
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.code || !formData.name) {
      toast.error('Warehouse code and name are required');
      return;
    }
    setSaveLoading(true);
    try {
      const payload = {
        ...formData,
        capacity_sqft: parseInt(formData.capacity_sqft, 10) || 0,
        plant_id: formData.plant_id || null,
      };

      if (editingWarehouse) {
        await warehouseService.update(editingWarehouse.id, payload);
        toast.success(`Warehouse '${formData.name}' updated.`);
      } else {
        await warehouseService.create(payload);
        toast.success(`Warehouse '${formData.name}' created.`);
      }
      setModalOpen(false);
      fetchWarehouses();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaveLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!warehouseToDelete) return;
    try {
      await warehouseService.delete(warehouseToDelete.id);
      toast.success(`Warehouse '${warehouseToDelete.name}' deleted.`);
      setDeleteDialogOpen(false);
      fetchWarehouses();
    } catch (err) {
      toast.error('Failed to delete warehouse: ' + err.message);
    }
  };

  const columns = [
    {
      header: 'Warehouse',
      accessor: (w) => (
        <div>
          <span className="font-semibold text-surface-900 dark:text-surface-100 block text-sm">
            {w.name}
          </span>
          <span className="font-mono text-xs text-surface-500">{w.code}</span>
        </div>
      ),
    },
    {
      header: 'Type',
      accessor: (w) => (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300">
          {w.warehouse_type.replace('_', ' ')}
        </span>
      ),
    },
    {
      header: 'Plant & Location',
      accessor: (w) => (
        <div>
          <span className="text-xs font-medium text-surface-800 dark:text-surface-200 block">
            {w.plant_name || 'Central Facility'}
          </span>
          <div className="flex items-center space-x-1 text-[11px] text-surface-500">
            <MapPin className="w-3 h-3 text-surface-400" />
            <span>{w.location}</span>
          </div>
        </div>
      ),
    },
    {
      header: 'Capacity',
      accessor: (w) => (
        <span className="font-mono text-xs font-medium text-surface-800 dark:text-surface-200">
          {Number(w.capacity_sqft || 0).toLocaleString('en-IN')} sq.ft
        </span>
      ),
    },
    {
      header: 'Manager',
      accessor: (w) => (
        <div>
          <div className="flex items-center space-x-1 text-xs text-surface-700 dark:text-surface-300">
            <User className="w-3 h-3 text-surface-400" />
            <span>{w.manager_name || 'Unassigned'}</span>
          </div>
          {w.contact_phone && (
            <span className="font-mono text-[11px] text-surface-500 block">
              {w.contact_phone}
            </span>
          )}
        </div>
      ),
    },
    {
      header: 'Status',
      accessor: (w) => <StatusBadge status={w.status} />,
    },
    {
      header: 'Actions',
      align: 'right',
      accessor: (w) => (
        <div className="flex items-center justify-end space-x-1">
          <Button
            variant="ghost"
            size="sm"
            className="p-1.5 text-surface-500 hover:text-textile-purple"
            onClick={() => handleOpenEdit(w)}
          >
            <Edit2 className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="p-1.5 text-surface-500 hover:text-rose-600"
            onClick={() => {
              setWarehouseToDelete(w);
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
            <Home className="w-7 h-7 text-violet-600" />
            Warehouses & Godowns Master
          </h1>
          <p className="text-sm text-surface-500 dark:text-surface-400 mt-1">
            Configure storage facilities, raw yarn godowns, finished textile repositories, and capacity allocations.
          </p>
        </div>
        <Button variant="primary" icon={Plus} onClick={handleOpenCreate}>
          Add Warehouse
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-surface-0 dark:bg-surface-900 p-4 rounded-xl border border-border flex flex-col md:flex-row gap-4 items-center justify-between shadow-sm">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
          <input
            type="text"
            placeholder="Search warehouse code, name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-surface-50 dark:bg-surface-800 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-textile-purple/30"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 text-xs bg-surface-50 dark:bg-surface-800 border border-border rounded-lg text-surface-700 dark:text-surface-300 focus:outline-none focus:ring-2 focus:ring-textile-purple/30"
          >
            <option value="">All Storage Types</option>
            {WAREHOUSE_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>

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
      </div>

      {/* Table */}
      {loading ? (
        <LoadingSkeleton type="table" rows={6} />
      ) : (
        <Table
          columns={columns}
          data={warehouses}
          emptyMessage="No warehouses found matching the criteria."
        />
      )}

      {/* Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingWarehouse ? `Edit Warehouse: ${editingWarehouse.name}` : 'Create Warehouse'}
        size="lg"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Warehouse Code *"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              required
              placeholder="e.g. WH-RAW-01"
            />
            <Input
              label="Warehouse Name *"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              placeholder="e.g. Silk Yarn Godown No. 1"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Associated Plant"
              value={formData.plant_id}
              onChange={(e) => setFormData({ ...formData, plant_id: e.target.value })}
              options={[
                { value: '', label: 'Select Plant...' },
                ...plants.map((p) => ({ value: p.id, label: `${p.name} (${p.code})` })),
              ]}
            />
            <Select
              label="Warehouse Type *"
              value={formData.warehouse_type}
              onChange={(e) => setFormData({ ...formData, warehouse_type: e.target.value })}
              options={WAREHOUSE_TYPES}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="Capacity (Sq. Feet) *"
              type="number"
              value={formData.capacity_sqft}
              onChange={(e) => setFormData({ ...formData, capacity_sqft: e.target.value })}
              required
            />
            <Input
              label="Manager / In-charge Name"
              value={formData.manager_name}
              onChange={(e) => setFormData({ ...formData, manager_name: e.target.value })}
              placeholder="e.g. R. Sundaram"
            />
            <Input
              label="Contact Phone"
              value={formData.contact_phone}
              onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
              placeholder="+91 98450 12345"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Specific Location / Address *"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              required
              placeholder="e.g. Plot 12, South Weaver Colony"
            />
            <Select
              label="Status"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              options={[
                { value: 'ACTIVE', label: 'Active Godown' },
                { value: 'INACTIVE', label: 'Inactive / Under Renovation' },
              ]}
            />
          </div>

          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-border">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" loading={saveLoading}>
              {editingWarehouse ? 'Save Changes' : 'Create Warehouse'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Dialog */}
      <ConfirmDialog
        isOpen={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDelete}
        title="Delete Warehouse"
        message={`Are you sure you want to delete warehouse '${warehouseToDelete?.name}' (${warehouseToDelete?.code})?`}
        confirmText="Delete Warehouse"
        variant="danger"
      />
    </div>
  );
}
