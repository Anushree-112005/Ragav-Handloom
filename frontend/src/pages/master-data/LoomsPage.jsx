import React, { useState, useEffect } from 'react';
import { Boxes, Plus, Edit2, Trash2, Search, Filter, Wrench, UserCheck, CheckCircle2, AlertTriangle, Clock } from 'lucide-react';
import { loomService, artisanService } from '../../services/masterDataService';
import { plantService } from '../../services/adminServices';
import { useToast } from '../../context/ToastContext';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';
import { useAuth } from '../../context/AuthContext';

const LOOM_TYPES = [
  { value: 'Traditional Pit Loom', label: 'Traditional Pit Loom (Korvai)' },
  { value: 'Frame Loom', label: 'Raised Wooden Frame Loom' },
  { value: 'Jacquard Handloom (240 Hooks)', label: 'Jacquard Handloom (240 Hooks)' },
  { value: 'Jacquard Handloom (480 Hooks)', label: 'Jacquard Handloom (480 Hooks)' },
  { value: 'Shuttleless Semi-Auto', label: 'Semi-Automatic Handloom' },
  { value: 'Loin / Backstrap Loom', label: 'Backstrap / Loin Loom' },
];

const LOOM_STATUSES = [
  { value: 'RUNNING', label: 'Running / Active Production' },
  { value: 'MAINTENANCE', label: 'Under Maintenance / Tuning' },
  { value: 'IDLE', label: 'Idle / Warp Empty' },
];

export default function LoomsPage() {
  const { canEditModule } = useAuth();
  const canEdit = canEditModule('LOOMS');
  const [looms, setLooms] = useState([]);
  const [plants, setPlants] = useState([]);
  const [artisans, setArtisans] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingLoom, setEditingLoom] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [loomToDelete, setLoomToDelete] = useState(null);
  const [saveLoading, setSaveLoading] = useState(false);

  const [formData, setFormData] = useState({
    loom_number: '',
    loom_type: 'Jacquard Handloom (240 Hooks)',
    plant_id: '',
    location: 'Shed A - Bay 1',
    capacity_meters_per_day: 4.5,
    width_inches: 48.0,
    assigned_artisan_id: '',
    installation_date: '2022-01-15',
    last_maintenance_date: '2026-08-10',
    status: 'RUNNING',
  });

  const toast = useToast();

  const fetchDependencies = async () => {
    try {
      const [pltRes, artRes] = await Promise.all([
        plantService.getPlants(),
        artisanService.getAll(),
      ]);
      setPlants(Array.isArray(pltRes) ? pltRes : (pltRes?.items || []));
      setArtisans(Array.isArray(artRes) ? artRes : (artRes?.items || []));
    } catch (err) {
      console.error('Failed to load loom dependencies:', err);
    }
  };

  const fetchLooms = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (typeFilter) params.loom_type = typeFilter;
      if (statusFilter) params.status = statusFilter;

      const res = await loomService.getAll(params);
      setLooms(Array.isArray(res) ? res : (res.items || []));
    } catch (err) {
      toast.error('Failed to load looms: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDependencies();
  }, []);

  useEffect(() => {
    fetchLooms();
  }, [search, typeFilter, statusFilter]);

  const handleOpenCreate = () => {
    setEditingLoom(null);
    setFormData({
      loom_number: `LM-${Math.floor(100 + Math.random() * 900)}`,
      loom_type: 'Jacquard Handloom (240 Hooks)',
      plant_id: plants[0]?.id || '',
      location: 'Weaving Hall 1',
      capacity_meters_per_day: 5.0,
      width_inches: 48.0,
      assigned_artisan_id: artisans[0]?.id || '',
      installation_date: new Date().toISOString().split('T')[0],
      last_maintenance_date: new Date().toISOString().split('T')[0],
      status: 'RUNNING',
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (l) => {
    setEditingLoom(l);
    setFormData({
      loom_number: l.loom_number,
      loom_type: l.loom_type,
      plant_id: l.plant_id || '',
      location: l.location || '',
      capacity_meters_per_day: l.capacity_meters_per_day || 0,
      width_inches: l.width_inches || 0,
      assigned_artisan_id: l.assigned_artisan_id || '',
      installation_date: l.installation_date || '',
      last_maintenance_date: l.last_maintenance_date || '',
      status: l.status,
    });
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.loom_number || !formData.loom_type) {
      toast.error('Loom number and type are required');
      return;
    }
    setSaveLoading(true);
    try {
      const payload = {
        ...formData,
        capacity_meters_per_day: parseFloat(formData.capacity_meters_per_day) || 0,
        width_inches: parseFloat(formData.width_inches) || 0,
        plant_id: formData.plant_id || null,
        assigned_artisan_id: formData.assigned_artisan_id || null,
      };

      if (editingLoom) {
        await loomService.update(editingLoom.id, payload);
        toast.success(`Loom '${formData.loom_number}' updated.`);
      } else {
        await loomService.create(payload);
        toast.success(`Loom '${formData.loom_number}' registered.`);
      }
      setModalOpen(false);
      fetchLooms();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaveLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!loomToDelete) return;
    try {
      await loomService.delete(loomToDelete.id);
      toast.success(`Loom '${loomToDelete.loom_number}' deleted.`);
      setDeleteDialogOpen(false);
      fetchLooms();
    } catch (err) {
      toast.error('Failed to delete loom: ' + err.message);
    }
  };

  const renderLoomStatus = (st) => {
    switch (st) {
      case 'RUNNING':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
            <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-500" />
            Running
          </span>
        );
      case 'MAINTENANCE':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
            <Wrench className="w-3 h-3 mr-1 text-amber-500" />
            Maintenance
          </span>
        );
      case 'IDLE':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 dark:bg-surface-800 dark:text-slate-300">
            <Clock className="w-3 h-3 mr-1 text-slate-400" />
            Idle
          </span>
        );
      default:
        return <span className="text-xs text-surface-500">{st}</span>;
    }
  };

  const columns = [
    {
      header: 'Loom Unit',
      accessor: (l) => (
        <div>
          <span className="font-semibold text-surface-900 dark:text-surface-100 block text-sm font-mono">
            {l.loom_number}
          </span>
          <span className="text-xs text-surface-500">{l.plant_name || 'Central Unit'}</span>
        </div>
      ),
    },
    {
      header: 'Type & Specs',
      accessor: (l) => (
        <div>
          <span className="text-xs font-semibold text-surface-800 dark:text-surface-200 block">
            {l.loom_type}
          </span>
          <span className="text-[11px] text-surface-500">
            {l.width_inches}" Width • {l.location || 'Floor'}
          </span>
        </div>
      ),
    },
    {
      header: 'Daily Capacity',
      accessor: (l) => (
        <span className="font-mono text-xs font-medium text-surface-800 dark:text-surface-200">
          {l.capacity_meters_per_day} m/day
        </span>
      ),
    },
    {
      header: 'Assigned Artisan',
      accessor: (l) => (
        <div className="flex items-center space-x-1.5">
          <UserCheck className="w-3.5 h-3.5 text-textile-purple" />
          <span className="text-xs font-medium text-surface-800 dark:text-surface-200">
            {l.artisan_name || 'Unassigned'}
          </span>
        </div>
      ),
    },
    {
      header: 'Last Serviced',
      accessor: (l) => (
        <span className="font-mono text-xs text-surface-600 dark:text-surface-400">
          {l.last_maintenance_date || '—'}
        </span>
      ),
    },
    {
      header: 'Loom State',
      accessor: (l) => renderLoomStatus(l.status),
    },
    {
      header: 'Actions',
      align: 'right',
      accessor: (l) => (
        <div className="flex items-center justify-end space-x-1">
          {canEdit ? (
            <>
              <Button
                variant="ghost"
                size="sm"
                className="p-1.5 text-surface-500 hover:text-textile-purple"
                onClick={() => handleOpenEdit(l)}
              >
                <Edit2 className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="p-1.5 text-surface-500 hover:text-rose-600"
                onClick={() => {
                  setLoomToDelete(l);
                  setDeleteDialogOpen(true);
                }}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </>
          ) : (
            <span className="text-[11px] text-linen-400 font-medium px-2 py-0.5">Read-Only</span>
          )}
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
            <Boxes className="w-7 h-7 text-amber-600" />
            Looms Master Registry
          </h1>
          <p className="text-sm text-surface-500 dark:text-surface-400 mt-1">
            Track weaving machinery, pit loom bays, Jacquard configurations, capacity outputs, and maintenance cycles.
          </p>
        </div>
        {canEdit ? (
          <Button variant="primary" icon={Plus} onClick={handleOpenCreate}>
            Register Loom
          </Button>
        ) : (
          <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold bg-linen-100 text-linen-600 border border-linen-200 shadow-sm">
            Read-Only (Production Dept)
          </span>
        )}
      </div>

      {/* Filters */}
      <div className="bg-surface-0 dark:bg-surface-900 p-4 rounded-xl border border-border flex flex-col md:flex-row gap-4 items-center justify-between shadow-sm">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
          <input
            type="text"
            placeholder="Search loom number, location..."
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
            <option value="">All Loom Types</option>
            {LOOM_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs bg-surface-50 dark:bg-surface-800 border border-border rounded-lg text-surface-700 dark:text-surface-300 focus:outline-none focus:ring-2 focus:ring-textile-purple/30"
          >
            <option value="">All States</option>
            {LOOM_STATUSES.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <LoadingSkeleton type="table" rows={6} />
      ) : (
        <Table
          columns={columns}
          data={looms}
          emptyMessage="No looms found matching the criteria."
        />
      )}

      {/* Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingLoom ? `Edit Loom: ${editingLoom.loom_number}` : 'Register New Loom'}
        size="lg"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Loom Identifier / Number *"
              value={formData.loom_number}
              onChange={(e) => setFormData({ ...formData, loom_number: e.target.value })}
              required
              placeholder="e.g. LM-KJ-01"
            />
            <Select
              label="Loom Type *"
              value={formData.loom_type}
              onChange={(e) => setFormData({ ...formData, loom_type: e.target.value })}
              options={LOOM_TYPES}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Manufacturing Plant"
              value={formData.plant_id}
              onChange={(e) => setFormData({ ...formData, plant_id: e.target.value })}
              options={[
                { value: '', label: 'Select Plant...' },
                ...plants.map((p) => ({ value: p.id, label: `${p.name} (${p.code})` })),
              ]}
            />
            <Input
              label="Location / Bay in Shed"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="e.g. South Weaving Shed Bay 4"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="Capacity (Meters / Day) *"
              type="number"
              step="0.5"
              value={formData.capacity_meters_per_day}
              onChange={(e) => setFormData({ ...formData, capacity_meters_per_day: e.target.value })}
              required
            />
            <Input
              label="Reed Width (Inches) *"
              type="number"
              step="0.5"
              value={formData.width_inches}
              onChange={(e) => setFormData({ ...formData, width_inches: e.target.value })}
              required
            />
            <Select
              label="Assigned Master Weaver"
              value={formData.assigned_artisan_id}
              onChange={(e) => setFormData({ ...formData, assigned_artisan_id: e.target.value })}
              options={[
                { value: '', label: 'Unassigned' },
                ...artisans.map((a) => ({ value: a.id, label: `${a.name} (${a.artisan_code})` })),
              ]}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="Installation Date"
              type="date"
              value={formData.installation_date}
              onChange={(e) => setFormData({ ...formData, installation_date: e.target.value })}
            />
            <Input
              label="Last Maintenance Date"
              type="date"
              value={formData.last_maintenance_date}
              onChange={(e) => setFormData({ ...formData, last_maintenance_date: e.target.value })}
            />
            <Select
              label="Loom Status"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              options={LOOM_STATUSES}
            />
          </div>

          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-border">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" loading={saveLoading}>
              {editingLoom ? 'Save Changes' : 'Register Loom'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Dialog */}
      <ConfirmDialog
        isOpen={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDelete}
        title="Delete Loom"
        message={`Are you sure you want to delete loom '${loomToDelete?.loom_number}'?`}
        confirmText="Delete Loom"
        variant="danger"
      />
    </div>
  );
}
