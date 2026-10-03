import React, { useState, useEffect } from 'react';
import { Sparkles, Plus, Edit2, Trash2, Search, Filter } from 'lucide-react';
import { designService } from '../../services/masterDataService';
import { useToast } from '../../context/ToastContext';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import StatusBadge from '../../components/common/StatusBadge';
import Modal from '../../components/common/Modal';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';

const PATTERN_TYPES = [
  { value: 'Jacquard Brocade', label: 'Jacquard Brocade' },
  { value: 'Temple Border (Korvai)', label: 'Temple Border (Korvai)' },
  { value: 'Jamdani Floral', label: 'Jamdani Extra-Weft Floral' },
  { value: 'Ikat Geometric', label: 'Pochampally / Patola Ikat' },
  { value: 'Zari Butti', label: 'All-over Zari Butti' },
  { value: 'Stripes & Checks', label: 'Traditional Checks & Gingham' },
  { value: 'Plain Border', label: 'Minimalist Contrast Border' },
];

const MOTIFS = [
  { value: 'Peacock (Mayil)', label: 'Peacock (Mayil)' },
  { value: 'Paisley / Mango (Kalka)', label: 'Paisley / Mango (Kalka)' },
  { value: 'Lotus (Kamal)', label: 'Lotus (Kamal)' },
  { value: 'Temple Gopuram', label: 'Temple Gopuram (Spire)' },
  { value: 'Elephant (Yaanai)', label: 'Elephant (Yaanai / Gaja)' },
  { value: 'Floral Vine (Bel)', label: 'Floral Vine (Bel)' },
  { value: 'Geometric / Chevron', label: 'Geometric / Chevron' },
  { value: 'Rudraksha', label: 'Rudraksha Bead Border' },
];

export default function DesignsPage() {
  const [designs, setDesigns] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [patternFilter, setPatternFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingDesign, setEditingDesign] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [designToDelete, setDesignToDelete] = useState(null);
  const [saveLoading, setSaveLoading] = useState(false);

  const [formData, setFormData] = useState({
    code: '',
    name: '',
    pattern_type: 'Jacquard Brocade',
    motif: 'Peacock (Mayil)',
    collection: 'Royal Heritage 2026',
    description: '',
    status: 'ACTIVE',
  });

  const toast = useToast();

  const fetchDesigns = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (patternFilter) params.pattern_type = patternFilter;
      if (statusFilter) params.status = statusFilter;

      const res = await designService.getAll(params);
      setDesigns(Array.isArray(res) ? res : (res.items || []));
    } catch (err) {
      toast.error('Failed to load designs: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDesigns();
  }, [search, patternFilter, statusFilter]);

  const handleOpenCreate = () => {
    setEditingDesign(null);
    setFormData({
      code: `DSG-${Math.floor(100 + Math.random() * 900)}`,
      name: '',
      pattern_type: 'Jacquard Brocade',
      motif: 'Peacock (Mayil)',
      collection: 'Heritage Varanasi 2026',
      description: '',
      status: 'ACTIVE',
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (d) => {
    setEditingDesign(d);
    setFormData({
      code: d.code,
      name: d.name,
      pattern_type: d.pattern_type || '',
      motif: d.motif || '',
      collection: d.collection || '',
      description: d.description || '',
      status: d.status,
    });
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.code || !formData.name) {
      toast.error('Design code and name are required');
      return;
    }
    setSaveLoading(true);
    try {
      if (editingDesign) {
        await designService.update(editingDesign.id, formData);
        toast.success(`Design '${formData.name}' updated.`);
      } else {
        await designService.create(formData);
        toast.success(`Design '${formData.name}' created.`);
      }
      setModalOpen(false);
      fetchDesigns();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaveLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!designToDelete) return;
    try {
      await designService.delete(designToDelete.id);
      toast.success(`Design '${designToDelete.name}' deleted.`);
      setDeleteDialogOpen(false);
      fetchDesigns();
    } catch (err) {
      toast.error('Failed to delete design: ' + err.message);
    }
  };

  const columns = [
    {
      header: 'Pattern / Artwork',
      accessor: (d) => (
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-300 flex items-center justify-center border border-purple-200/60 flex-shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <span className="font-semibold text-surface-900 dark:text-surface-100 block text-sm">
              {d.name}
            </span>
            <span className="font-mono text-xs text-surface-500">{d.code}</span>
          </div>
        </div>
      ),
    },
    {
      header: 'Pattern Type',
      accessor: (d) => (
        <span className="text-xs font-semibold text-surface-800 dark:text-surface-200">
          {d.pattern_type}
        </span>
      ),
    },
    {
      header: 'Motif',
      accessor: (d) => (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
          {d.motif || 'Geometric'}
        </span>
      ),
    },
    {
      header: 'Collection',
      accessor: (d) => (
        <span className="text-xs text-surface-600 dark:text-surface-400">
          {d.collection || 'Core Archive'}
        </span>
      ),
    },
    {
      header: 'Status',
      accessor: (d) => <StatusBadge status={d.status} />,
    },
    {
      header: 'Actions',
      align: 'right',
      accessor: (d) => (
        <div className="flex items-center justify-end space-x-1">
          <Button
            variant="ghost"
            size="sm"
            className="p-1.5 text-surface-500 hover:text-textile-purple"
            onClick={() => handleOpenEdit(d)}
          >
            <Edit2 className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="p-1.5 text-surface-500 hover:text-rose-600"
            onClick={() => {
              setDesignToDelete(d);
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
            <Sparkles className="w-7 h-7 text-rose-600" />
            Designs & Motifs Master
          </h1>
          <p className="text-sm text-surface-500 dark:text-surface-400 mt-1">
            Catalog traditional Jacquard motifs, Korvai borders, punch card graphs, and festive collections.
          </p>
        </div>
        <Button variant="primary" icon={Plus} onClick={handleOpenCreate}>
          Add Design Pattern
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-surface-0 dark:bg-surface-900 p-4 rounded-xl border border-border flex flex-col md:flex-row gap-4 items-center justify-between shadow-sm">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
          <input
            type="text"
            placeholder="Search motif, design code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-surface-50 dark:bg-surface-800 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-textile-purple/30"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <select
            value={patternFilter}
            onChange={(e) => setPatternFilter(e.target.value)}
            className="px-3 py-2 text-xs bg-surface-50 dark:bg-surface-800 border border-border rounded-lg text-surface-700 dark:text-surface-300 focus:outline-none focus:ring-2 focus:ring-textile-purple/30"
          >
            <option value="">All Pattern Types</option>
            {PATTERN_TYPES.map((t) => (
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
          data={designs}
          emptyMessage="No designs found matching the criteria."
        />
      )}

      {/* Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingDesign ? `Edit Design: ${editingDesign.name}` : 'Create Design Motif'}
        size="lg"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Design Code *"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              required
              placeholder="e.g. DSG-BTT-01"
            />
            <Input
              label="Design / Pattern Name *"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              placeholder="e.g. Royal Mayil (Peacock) Zari Brocade"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Select
              label="Pattern Type *"
              value={formData.pattern_type}
              onChange={(e) => setFormData({ ...formData, pattern_type: e.target.value })}
              options={PATTERN_TYPES}
            />
            <Select
              label="Primary Motif *"
              value={formData.motif}
              onChange={(e) => setFormData({ ...formData, motif: e.target.value })}
              options={MOTIFS}
            />
            <Input
              label="Collection / Theme"
              value={formData.collection}
              onChange={(e) => setFormData({ ...formData, collection: e.target.value })}
              placeholder="e.g. Heritage Kanjeevaram 2026"
            />
          </div>

          <Input
            label="Punch Card & Weave Description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Hooks count (e.g. 240 Hooks Jacquard), border repeat size, pallu detail..."
          />

          <Select
            label="Status"
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            options={[
              { value: 'ACTIVE', label: 'Active (Ready for Looms)' },
              { value: 'INACTIVE', label: 'Archived Pattern' },
            ]}
          />

          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-border">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" loading={saveLoading}>
              {editingDesign ? 'Save Changes' : 'Create Design'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Dialog */}
      <ConfirmDialog
        isOpen={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDelete}
        title="Delete Design"
        message={`Are you sure you want to delete '${designToDelete?.name}' (${designToDelete?.code})?`}
        confirmText="Delete Design"
        variant="danger"
      />
    </div>
  );
}
