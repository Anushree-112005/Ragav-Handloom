import React, { useState, useEffect } from 'react';
import { Layers, Plus, Edit2, Trash2, Search, Filter, Palette, Building } from 'lucide-react';
import { fabricService, colourService, supplierService, uomService } from '../../services/masterDataService';
import { useToast } from '../../context/ToastContext';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import StatusBadge from '../../components/common/StatusBadge';
import Modal from '../../components/common/Modal';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';

const FABRIC_TYPES = [
  { value: 'Pure Silk', label: 'Pure Mulberry Silk' },
  { value: 'Tussar Silk', label: 'Tussar / Wild Silk' },
  { value: 'Cotton', label: 'Organic Handspun Cotton' },
  { value: 'Linen', label: 'Pure Linen' },
  { value: 'Silk-Cotton', label: 'Silk-Cotton Blend (Sico)' },
  { value: 'Pashmina/Wool', label: 'Pashmina / Wool' },
  { value: 'Matka Silk', label: 'Matka Silk' },
];

export default function FabricsPage() {
  const [fabrics, setFabrics] = useState([]);
  const [colours, setColours] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [uoms, setUoms] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [fabricTypeFilter, setFabricTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingFabric, setEditingFabric] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [fabricToDelete, setFabricToDelete] = useState(null);
  const [saveLoading, setSaveLoading] = useState(false);

  const [formData, setFormData] = useState({
    code: '',
    name: '',
    fabric_type: 'Pure Silk',
    composition: '100% Mulberry Silk',
    gsm: 80,
    width_inches: 48,
    uom_id: '',
    colour_id: '',
    supplier_id: '',
    description: '',
    status: 'ACTIVE',
  });

  const toast = useToast();

  const fetchDependencies = async () => {
    try {
      const [colRes, supRes, uomRes] = await Promise.all([
        colourService.getAll(),
        supplierService.getAll(),
        uomService.getAll(),
      ]);
      setColours(Array.isArray(colRes) ? colRes : (colRes.items || []));
      setSuppliers(Array.isArray(supRes) ? supRes : (supRes.items || []));
      setUoms(Array.isArray(uomRes) ? uomRes : (uomRes.items || []));
    } catch (err) {
      console.error('Failed to load related data:', err);
    }
  };

  const fetchFabrics = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (fabricTypeFilter) params.fabric_type = fabricTypeFilter;
      if (statusFilter) params.status = statusFilter;

      const res = await fabricService.getAll(params);
      setFabrics(Array.isArray(res) ? res : (res.items || []));
    } catch (err) {
      toast.error('Failed to load fabrics: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDependencies();
  }, []);

  useEffect(() => {
    fetchFabrics();
  }, [search, fabricTypeFilter, statusFilter]);

  const handleOpenCreate = () => {
    setEditingFabric(null);
    setFormData({
      code: `FAB-${Math.floor(100 + Math.random() * 900)}`,
      name: '',
      fabric_type: 'Pure Silk',
      composition: '100% Pure Mulberry Silk',
      gsm: 85,
      width_inches: 48,
      uom_id: uoms[0]?.id || '',
      colour_id: colours[0]?.id || '',
      supplier_id: suppliers[0]?.id || '',
      description: '',
      status: 'ACTIVE',
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (f) => {
    setEditingFabric(f);
    setFormData({
      code: f.code,
      name: f.name,
      fabric_type: f.fabric_type,
      composition: f.composition || '',
      gsm: f.gsm || 0,
      width_inches: f.width_inches || 0,
      uom_id: f.uom_id || '',
      colour_id: f.colour_id || '',
      supplier_id: f.supplier_id || '',
      description: f.description || '',
      status: f.status,
    });
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.code || !formData.name) {
      toast.error('Fabric code and name are required');
      return;
    }
    setSaveLoading(true);
    try {
      const payload = {
        ...formData,
        gsm: parseInt(formData.gsm, 10) || null,
        width_inches: parseFloat(formData.width_inches) || null,
        uom_id: formData.uom_id || null,
        colour_id: formData.colour_id || null,
        supplier_id: formData.supplier_id || null,
      };

      if (editingFabric) {
        await fabricService.update(editingFabric.id, payload);
        toast.success(`Fabric '${formData.name}' updated.`);
      } else {
        await fabricService.create(payload);
        toast.success(`Fabric '${formData.name}' created.`);
      }
      setModalOpen(false);
      fetchFabrics();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaveLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!fabricToDelete) return;
    try {
      await fabricService.delete(fabricToDelete.id);
      toast.success(`Fabric '${fabricToDelete.name}' deleted.`);
      setDeleteDialogOpen(false);
      fetchFabrics();
    } catch (err) {
      toast.error('Failed to delete fabric: ' + err.message);
    }
  };

  const columns = [
    {
      header: 'Fabric',
      accessor: (f) => (
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-300 flex items-center justify-center border border-teal-200/60 flex-shrink-0">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <span className="font-semibold text-surface-900 dark:text-surface-100 block text-sm">
              {f.name}
            </span>
            <span className="font-mono text-xs text-surface-500">{f.code}</span>
          </div>
        </div>
      ),
    },
    {
      header: 'Type & Composition',
      accessor: (f) => (
        <div>
          <span className="text-xs font-semibold text-surface-800 dark:text-surface-200 block">
            {f.fabric_type}
          </span>
          <span className="text-[11px] text-surface-500">{f.composition}</span>
        </div>
      ),
    },
    {
      header: 'GSM & Width',
      accessor: (f) => (
        <div className="space-y-0.5">
          <span className="text-xs font-mono font-medium text-surface-700 dark:text-surface-300 block">
            {f.gsm ? `${f.gsm} GSM` : '—'}
          </span>
          <span className="text-[11px] text-surface-500">
            {f.width_inches ? `${f.width_inches}" Width` : '—'}
          </span>
        </div>
      ),
    },
    {
      header: 'Shade / Colour',
      accessor: (f) => (
        <div className="flex items-center space-x-2">
          {f.colour_hex && (
            <span
              className="w-4 h-4 rounded-full border border-black/10 inline-block shadow-xs"
              style={{ backgroundColor: f.colour_hex }}
            />
          )}
          <span className="text-xs text-surface-700 dark:text-surface-300">
            {f.colour_name || 'Natural / Raw'}
          </span>
        </div>
      ),
    },
    {
      header: 'Supplier',
      accessor: (f) => (
        <span className="text-xs text-surface-600 dark:text-surface-400">
          {f.supplier_name || 'Internal Weaving'}
        </span>
      ),
    },
    {
      header: 'Status',
      accessor: (f) => <StatusBadge status={f.status} />,
    },
    {
      header: 'Actions',
      align: 'right',
      accessor: (f) => (
        <div className="flex items-center justify-end space-x-1">
          <Button
            variant="ghost"
            size="sm"
            className="p-1.5 text-surface-500 hover:text-textile-purple"
            onClick={() => handleOpenEdit(f)}
          >
            <Edit2 className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="p-1.5 text-surface-500 hover:text-rose-600"
            onClick={() => {
              setFabricToDelete(f);
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
            <Layers className="w-7 h-7 text-indigo-600" />
            Fabrics Master
          </h1>
          <p className="text-sm text-surface-500 dark:text-surface-400 mt-1">
            Configure textile weave specifications, fiber compositions, GSM weights, and yardage dimensions.
          </p>
        </div>
        <Button variant="primary" icon={Plus} onClick={handleOpenCreate}>
          Add Fabric
        </Button>
      </div>

      {/* Filter Bar */}
      <div className="bg-surface-0 dark:bg-surface-900 p-4 rounded-xl border border-border flex flex-col md:flex-row gap-4 items-center justify-between shadow-sm">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
          <input
            type="text"
            placeholder="Search fabric code, weave..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-surface-50 dark:bg-surface-800 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-textile-purple/30"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <select
            value={fabricTypeFilter}
            onChange={(e) => setFabricTypeFilter(e.target.value)}
            className="px-3 py-2 text-xs bg-surface-50 dark:bg-surface-800 border border-border rounded-lg text-surface-700 dark:text-surface-300 focus:outline-none focus:ring-2 focus:ring-textile-purple/30"
          >
            <option value="">All Fabric Types</option>
            {FABRIC_TYPES.map((t) => (
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
          data={fabrics}
          emptyMessage="No fabrics found matching the criteria."
        />
      )}

      {/* Fabric Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingFabric ? `Edit Fabric: ${editingFabric.code}` : 'Create New Fabric'}
        size="lg"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Fabric Code *"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              required
              placeholder="e.g. FAB-KJ-01"
            />
            <Input
              label="Fabric Name *"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              placeholder="e.g. Heavy Mulberry Silk Jacquard"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Fabric Type *"
              value={formData.fabric_type}
              onChange={(e) => setFormData({ ...formData, fabric_type: e.target.value })}
              options={FABRIC_TYPES}
            />
            <Input
              label="Composition *"
              value={formData.composition}
              onChange={(e) => setFormData({ ...formData, composition: e.target.value })}
              required
              placeholder="e.g. 100% Mulberry Silk / 80% Cotton 20% Silk"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="GSM (Grams per Sq. Mtr)"
              type="number"
              value={formData.gsm}
              onChange={(e) => setFormData({ ...formData, gsm: e.target.value })}
              placeholder="e.g. 85"
            />
            <Input
              label="Width (Inches)"
              type="number"
              step="0.5"
              value={formData.width_inches}
              onChange={(e) => setFormData({ ...formData, width_inches: e.target.value })}
              placeholder="e.g. 48.0"
            />
            <Select
              label="Unit of Measure"
              value={formData.uom_id}
              onChange={(e) => setFormData({ ...formData, uom_id: e.target.value })}
              options={[
                { value: '', label: 'Select UOM...' },
                ...uoms.map((u) => ({ value: u.id, label: `${u.code} (${u.name})` })),
              ]}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Colour / Shade"
              value={formData.colour_id}
              onChange={(e) => setFormData({ ...formData, colour_id: e.target.value })}
              options={[
                { value: '', label: 'Select Colour...' },
                ...colours.map((c) => ({ value: c.id, label: `${c.name} (${c.code})` })),
              ]}
            />
            <Select
              label="Primary Supplier"
              value={formData.supplier_id}
              onChange={(e) => setFormData({ ...formData, supplier_id: e.target.value })}
              options={[
                { value: '', label: 'Internal Production / Weaver' },
                ...suppliers.map((s) => ({ value: s.id, label: `${s.name} (${s.supplier_code})` })),
              ]}
            />
          </div>

          <Input
            label="Weave Description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Warp/Weft density, pick counts, wash and shrinkage info..."
          />

          <Select
            label="Status"
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            options={[
              { value: 'ACTIVE', label: 'Active (Approved for Weaving)' },
              { value: 'INACTIVE', label: 'Inactive / Discontinued' },
            ]}
          />

          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-border">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" loading={saveLoading}>
              {editingFabric ? 'Save Changes' : 'Create Fabric'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Dialog */}
      <ConfirmDialog
        isOpen={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDelete}
        title="Delete Fabric"
        message={`Are you sure you want to delete '${fabricToDelete?.name}' (${fabricToDelete?.code})?`}
        confirmText="Delete Fabric"
        variant="danger"
      />
    </div>
  );
}
