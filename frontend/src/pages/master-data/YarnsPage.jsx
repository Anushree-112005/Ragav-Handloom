import React, { useState, useEffect } from 'react';
import { Scissors, Plus, Edit2, Trash2, Search, Filter, AlertCircle, CheckCircle } from 'lucide-react';
import { yarnService, colourService, supplierService, uomService } from '../../services/masterDataService';
import { useToast } from '../../context/ToastContext';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import StatusBadge from '../../components/common/StatusBadge';
import Modal from '../../components/common/Modal';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';
import { useAuth } from '../../context/AuthContext';

const YARN_TYPES = [
  { value: 'Mulberry Silk', label: 'Mulberry Reeled Silk' },
  { value: 'Tussar Silk', label: 'Tussar Handspun Silk' },
  { value: 'Zari Metallic', label: 'Pure Silver / Gold Zari' },
  { value: 'Cotton Combed', label: 'Organic Combed Cotton' },
  { value: 'Cotton Carded', label: 'Carded Handloom Cotton' },
  { value: 'Linen Flax', label: 'Belgian Linen Flax' },
  { value: 'Wool/Cashmere', label: 'Fine Pashmina / Cashmere' },
];

const STOCK_STATUSES = [
  { value: 'IN_STOCK', label: 'In Stock' },
  { value: 'LOW_STOCK', label: 'Low Stock' },
  { value: 'OUT_OF_STOCK', label: 'Out of Stock' },
];

export default function YarnsPage() {
  const { canEditModule } = useAuth();
  const canEdit = canEditModule('YARNS');
  const [yarns, setYarns] = useState([]);
  const [colours, setColours] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [uoms, setUoms] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [yarnTypeFilter, setYarnTypeFilter] = useState('');
  const [stockFilter, setStockFilter] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingYarn, setEditingYarn] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [yarnToDelete, setYarnToDelete] = useState(null);
  const [saveLoading, setSaveLoading] = useState(false);

  const [formData, setFormData] = useState({
    code: '',
    name: '',
    yarn_type: 'Mulberry Silk',
    count: '20/22 D',
    composition: '100% Pure Mulberry Silk',
    colour_id: '',
    uom_id: '',
    supplier_id: '',
    stock_status: 'IN_STOCK',
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
      console.error('Failed to load dependencies:', err);
    }
  };

  const fetchYarns = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (yarnTypeFilter) params.yarn_type = yarnTypeFilter;
      if (stockFilter) params.stock_status = stockFilter;

      const res = await yarnService.getAll(params);
      setYarns(Array.isArray(res) ? res : (res.items || []));
    } catch (err) {
      toast.error('Failed to load yarns: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDependencies();
  }, []);

  useEffect(() => {
    fetchYarns();
  }, [search, yarnTypeFilter, stockFilter]);

  const handleOpenCreate = () => {
    setEditingYarn(null);
    setFormData({
      code: `YRN-${Math.floor(100 + Math.random() * 900)}`,
      name: '',
      yarn_type: 'Mulberry Silk',
      count: '2/120s Ne',
      composition: '100% Filature Mulberry Silk',
      colour_id: colours[0]?.id || '',
      uom_id: uoms[0]?.id || '',
      supplier_id: suppliers[0]?.id || '',
      stock_status: 'IN_STOCK',
      status: 'ACTIVE',
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (y) => {
    setEditingYarn(y);
    setFormData({
      code: y.code,
      name: y.name,
      yarn_type: y.yarn_type,
      count: y.count || '',
      composition: y.composition || '',
      colour_id: y.colour_id || '',
      uom_id: y.uom_id || '',
      supplier_id: y.supplier_id || '',
      stock_status: y.stock_status || 'IN_STOCK',
      status: y.status,
    });
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.code || !formData.name) {
      toast.error('Yarn code and name are required');
      return;
    }
    setSaveLoading(true);
    try {
      const payload = {
        ...formData,
        colour_id: formData.colour_id || null,
        uom_id: formData.uom_id || null,
        supplier_id: formData.supplier_id || null,
      };

      if (editingYarn) {
        await yarnService.update(editingYarn.id, payload);
        toast.success(`Yarn '${formData.name}' updated.`);
      } else {
        await yarnService.create(payload);
        toast.success(`Yarn '${formData.name}' created.`);
      }
      setModalOpen(false);
      fetchYarns();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaveLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!yarnToDelete) return;
    try {
      await yarnService.delete(yarnToDelete.id);
      toast.success(`Yarn '${yarnToDelete.name}' deleted.`);
      setDeleteDialogOpen(false);
      fetchYarns();
    } catch (err) {
      toast.error('Failed to delete yarn: ' + err.message);
    }
  };

  const renderStockBadge = (stockStatus) => {
    switch (stockStatus) {
      case 'IN_STOCK':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
            <CheckCircle className="w-3 h-3 mr-1 text-emerald-500" />
            In Stock
          </span>
        );
      case 'LOW_STOCK':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
            <AlertCircle className="w-3 h-3 mr-1 text-amber-500" />
            Low Stock
          </span>
        );
      case 'OUT_OF_STOCK':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">
            <AlertCircle className="w-3 h-3 mr-1 text-rose-500" />
            Out of Stock
          </span>
        );
      default:
        return <span className="text-xs text-surface-500">{stockStatus || '—'}</span>;
    }
  };

  const columns = [
    {
      header: 'Yarn Info',
      accessor: (y) => (
        <div>
          <span className="font-semibold text-surface-900 dark:text-surface-100 block text-sm">
            {y.name}
          </span>
          <span className="font-mono text-xs text-surface-500">{y.code}</span>
        </div>
      ),
    },
    {
      header: 'Yarn Type & Count',
      accessor: (y) => (
        <div>
          <span className="text-xs font-semibold text-surface-800 dark:text-surface-200 block">
            {y.yarn_type}
          </span>
          <span className="text-[11px] font-mono text-surface-500">{y.count || '—'}</span>
        </div>
      ),
    },
    {
      header: 'Composition',
      accessor: (y) => (
        <span className="text-xs text-surface-700 dark:text-surface-300">
          {y.composition || '—'}
        </span>
      ),
    },
    {
      header: 'Dyed Shade',
      accessor: (y) => (
        <div className="flex items-center space-x-2">
          {y.colour_hex && (
            <span
              className="w-4 h-4 rounded-full border border-black/10 inline-block shadow-xs"
              style={{ backgroundColor: y.colour_hex }}
            />
          )}
          <span className="text-xs text-surface-700 dark:text-surface-300">
            {y.colour_name || 'Raw / Undyed'}
          </span>
        </div>
      ),
    },
    {
      header: 'Supplier & UOM',
      accessor: (y) => (
        <div>
          <span className="text-xs text-surface-800 dark:text-surface-200 block">
            {y.supplier_name || 'Internal'}
          </span>
          <span className="text-[11px] font-mono text-surface-500">{y.uom_name || 'KG'}</span>
        </div>
      ),
    },
    {
      header: 'Stock Status',
      accessor: (y) => renderStockBadge(y.stock_status),
    },
    {
      header: 'Status',
      accessor: (y) => <StatusBadge status={y.status} />,
    },
    {
      header: 'Actions',
      align: 'right',
      accessor: (y) => (
        <div className="flex items-center justify-end space-x-1">
          {canEdit ? (
            <>
              <Button
                variant="ghost"
                size="sm"
                className="p-1.5 text-surface-500 hover:text-textile-purple"
                onClick={() => handleOpenEdit(y)}
              >
                <Edit2 className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="p-1.5 text-surface-500 hover:text-rose-600"
                onClick={() => {
                  setYarnToDelete(y);
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
            <Scissors className="w-7 h-7 text-purple-600" />
            Yarns Master
          </h1>
          <p className="text-sm text-surface-500 dark:text-surface-400 mt-1">
            Manage fiber yarn counts, silk deniers, Zari metallic filaments, and supplier sourcing.
          </p>
        </div>
        {canEdit ? (
          <Button variant="primary" icon={Plus} onClick={handleOpenCreate}>
            Add Yarn
          </Button>
        ) : (
          <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold bg-linen-100 text-linen-600 border border-linen-200 shadow-sm">
            Read-Only (Inventory Dept)
          </span>
        )}
      </div>

      {/* Filters */}
      <div className="bg-surface-0 dark:bg-surface-900 p-4 rounded-xl border border-border flex flex-col md:flex-row gap-4 items-center justify-between shadow-sm">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
          <input
            type="text"
            placeholder="Search yarn name, code, count..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-surface-50 dark:bg-surface-800 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-textile-purple/30"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <select
            value={yarnTypeFilter}
            onChange={(e) => setYarnTypeFilter(e.target.value)}
            className="px-3 py-2 text-xs bg-surface-50 dark:bg-surface-800 border border-border rounded-lg text-surface-700 dark:text-surface-300 focus:outline-none focus:ring-2 focus:ring-textile-purple/30"
          >
            <option value="">All Yarn Types</option>
            {YARN_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>

          <select
            value={stockFilter}
            onChange={(e) => setStockFilter(e.target.value)}
            className="px-3 py-2 text-xs bg-surface-50 dark:bg-surface-800 border border-border rounded-lg text-surface-700 dark:text-surface-300 focus:outline-none focus:ring-2 focus:ring-textile-purple/30"
          >
            <option value="">All Stock Levels</option>
            <option value="IN_STOCK">In Stock</option>
            <option value="LOW_STOCK">Low Stock</option>
            <option value="OUT_OF_STOCK">Out of Stock</option>
          </select>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <LoadingSkeleton type="table" rows={6} />
      ) : (
        <Table
          columns={columns}
          data={yarns}
          emptyMessage="No yarn specifications found matching the criteria."
        />
      )}

      {/* Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingYarn ? `Edit Yarn: ${editingYarn.code}` : 'Add Yarn Specification'}
        size="lg"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Yarn Code *"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              required
              placeholder="e.g. YRN-SLK-01"
            />
            <Input
              label="Yarn Name *"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              placeholder="e.g. Mulberry Warp Silk 20/22D"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Yarn Type *"
              value={formData.yarn_type}
              onChange={(e) => setFormData({ ...formData, yarn_type: e.target.value })}
              options={YARN_TYPES}
            />
            <Input
              label="Yarn Count / Denier *"
              value={formData.count}
              onChange={(e) => setFormData({ ...formData, count: e.target.value })}
              required
              placeholder="e.g. 20/22 Denier or 2/120s Ne"
            />
          </div>

          <Input
            label="Composition *"
            value={formData.composition}
            onChange={(e) => setFormData({ ...formData, composition: e.target.value })}
            required
            placeholder="e.g. 100% Pure Mulberry Silk"
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Select
              label="Dyed Shade"
              value={formData.colour_id}
              onChange={(e) => setFormData({ ...formData, colour_id: e.target.value })}
              options={[
                { value: '', label: 'Raw / Undyed' },
                ...colours.map((c) => ({ value: c.id, label: `${c.name} (${c.code})` })),
              ]}
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
            <Select
              label="Supplier"
              value={formData.supplier_id}
              onChange={(e) => setFormData({ ...formData, supplier_id: e.target.value })}
              options={[
                { value: '', label: 'Select Supplier...' },
                ...suppliers.map((s) => ({ value: s.id, label: `${s.name}` })),
              ]}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Stock Status"
              value={formData.stock_status}
              onChange={(e) => setFormData({ ...formData, stock_status: e.target.value })}
              options={STOCK_STATUSES}
            />
            <Select
              label="Master Status"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              options={[
                { value: 'ACTIVE', label: 'Active (Approved for Production)' },
                { value: 'INACTIVE', label: 'Inactive' },
              ]}
            />
          </div>

          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-border">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" loading={saveLoading}>
              {editingYarn ? 'Save Changes' : 'Create Yarn'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Dialog */}
      <ConfirmDialog
        isOpen={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDelete}
        title="Delete Yarn"
        message={`Are you sure you want to delete yarn '${yarnToDelete?.name}' (${yarnToDelete?.code})?`}
        confirmText="Delete Yarn"
        variant="danger"
      />
    </div>
  );
}
