import React, { useState, useEffect } from 'react';
import { Palette, Plus, Edit2, Trash2, Search, Filter, Droplet } from 'lucide-react';
import { colourService } from '../../services/masterDataService';
import { useToast } from '../../context/ToastContext';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import StatusBadge from '../../components/common/StatusBadge';
import Modal from '../../components/common/Modal';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';

const COLOUR_FAMILIES = [
  { value: 'Red/Crimson', label: 'Red & Crimson' },
  { value: 'Blue/Indigo', label: 'Blue & Indigo' },
  { value: 'Green/Emerald', label: 'Green & Emerald' },
  { value: 'Yellow/Gold/Saffron', label: 'Yellow, Gold & Saffron' },
  { value: 'Pink/Magenta', label: 'Pink & Magenta' },
  { value: 'Purple/Violet', label: 'Purple & Violet' },
  { value: 'Black/Grey', label: 'Black & Charcoal' },
  { value: 'White/Cream/Beige', label: 'Ivory, Cream & Beige' },
  { value: 'Brown/Earth', label: 'Brown & Terracotta' },
];

const DYE_TYPES = [
  { value: 'Natural Indigo', label: 'Natural Indigo Ferment' },
  { value: 'Madder Root (Manjistha)', label: 'Madder Root (Manjistha)' },
  { value: 'Pomegranate Rind', label: 'Pomegranate Rind (Harda)' },
  { value: 'Azo-Free Reactive', label: 'Azo-Free Eco Reactive Dye' },
  { value: 'Vat Dye', label: 'Fast Vat Dye' },
  { value: 'Acid Dye for Silk', label: 'Non-Toxic Silk Acid Dye' },
  { value: 'Vegetable / Forest', label: 'Forest Wild Dye' },
];

export default function ColoursPage() {
  const [colours, setColours] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [familyFilter, setFamilyFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingColour, setEditingColour] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [colourToDelete, setColourToDelete] = useState(null);
  const [saveLoading, setSaveLoading] = useState(false);

  const [formData, setFormData] = useState({
    code: '',
    name: '',
    colour_family: 'Red/Crimson',
    hex_code: '#B91C1C',
    dye_type: 'Azo-Free Reactive',
    description: '',
    status: 'ACTIVE',
  });

  const toast = useToast();

  const fetchColours = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (familyFilter) params.colour_family = familyFilter;
      if (statusFilter) params.status = statusFilter;

      const res = await colourService.getAll(params);
      setColours(Array.isArray(res) ? res : (res.items || []));
    } catch (err) {
      toast.error('Failed to load colours: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchColours();
  }, [search, familyFilter, statusFilter]);

  const handleOpenCreate = () => {
    setEditingColour(null);
    setFormData({
      code: `CLR-${Math.floor(100 + Math.random() * 900)}`,
      name: '',
      colour_family: 'Red/Crimson',
      hex_code: '#991B1B',
      dye_type: 'Madder Root (Manjistha)',
      description: '',
      status: 'ACTIVE',
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (c) => {
    setEditingColour(c);
    setFormData({
      code: c.code,
      name: c.name,
      colour_family: c.colour_family || 'Red/Crimson',
      hex_code: c.hex_code || '#000000',
      dye_type: c.dye_type || '',
      description: c.description || '',
      status: c.status,
    });
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.code || !formData.name || !formData.hex_code) {
      toast.error('Code, name, and valid hex code are required');
      return;
    }
    setSaveLoading(true);
    try {
      if (editingColour) {
        await colourService.update(editingColour.id, formData);
        toast.success(`Colour '${formData.name}' updated.`);
      } else {
        await colourService.create(formData);
        toast.success(`Colour '${formData.name}' created.`);
      }
      setModalOpen(false);
      fetchColours();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaveLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!colourToDelete) return;
    try {
      await colourService.delete(colourToDelete.id);
      toast.success(`Colour '${colourToDelete.name}' deleted.`);
      setDeleteDialogOpen(false);
      fetchColours();
    } catch (err) {
      toast.error('Failed to delete colour: ' + err.message);
    }
  };

  const columns = [
    {
      header: 'Swatch & Hex',
      accessor: (c) => (
        <div className="flex items-center space-x-3">
          <div
            className="w-10 h-10 rounded-xl shadow-inner border border-black/15 flex-shrink-0"
            style={{ backgroundColor: c.hex_code }}
          />
          <div>
            <span className="font-mono text-xs font-bold text-surface-900 dark:text-surface-100 block uppercase">
              {c.hex_code}
            </span>
            <span className="font-mono text-[11px] text-surface-500">{c.code}</span>
          </div>
        </div>
      ),
    },
    {
      header: 'Shade Name',
      accessor: (c) => (
        <div>
          <span className="font-semibold text-surface-900 dark:text-surface-100 block text-sm">
            {c.name}
          </span>
          <span className="text-xs text-surface-500">{c.colour_family}</span>
        </div>
      ),
    },
    {
      header: 'Dyeing Method & Recipe',
      accessor: (c) => (
        <div className="flex items-center space-x-1.5">
          <Droplet className="w-3.5 h-3.5 text-textile-teal" />
          <span className="text-xs text-surface-700 dark:text-surface-300">
            {c.dye_type || 'Standard Dye'}
          </span>
        </div>
      ),
    },
    {
      header: 'Description',
      accessor: (c) => (
        <span className="text-xs text-surface-500 dark:text-surface-400 line-clamp-1 max-w-xs">
          {c.description || '—'}
        </span>
      ),
    },
    {
      header: 'Status',
      accessor: (c) => <StatusBadge status={c.status} />,
    },
    {
      header: 'Actions',
      align: 'right',
      accessor: (c) => (
        <div className="flex items-center justify-end space-x-1">
          <Button
            variant="ghost"
            size="sm"
            className="p-1.5 text-surface-500 hover:text-textile-purple"
            onClick={() => handleOpenEdit(c)}
          >
            <Edit2 className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="p-1.5 text-surface-500 hover:text-rose-600"
            onClick={() => {
              setColourToDelete(c);
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
            <Palette className="w-7 h-7 text-teal-600" />
            Colours & Dyes Master
          </h1>
          <p className="text-sm text-surface-500 dark:text-surface-400 mt-1">
            Maintain handloom dye formulas, natural botanical pigments, hex palettes, and eco-dye recipes.
          </p>
        </div>
        <Button variant="primary" icon={Plus} onClick={handleOpenCreate}>
          Add Colour Shade
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-surface-0 dark:bg-surface-900 p-4 rounded-xl border border-border flex flex-col md:flex-row gap-4 items-center justify-between shadow-sm">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
          <input
            type="text"
            placeholder="Search shade name, hex, code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-surface-50 dark:bg-surface-800 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-textile-purple/30"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <select
            value={familyFilter}
            onChange={(e) => setFamilyFilter(e.target.value)}
            className="px-3 py-2 text-xs bg-surface-50 dark:bg-surface-800 border border-border rounded-lg text-surface-700 dark:text-surface-300 focus:outline-none focus:ring-2 focus:ring-textile-purple/30"
          >
            <option value="">All Colour Families</option>
            {COLOUR_FAMILIES.map((f) => (
              <option key={f.value} value={f.value}>{f.label}</option>
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
          data={colours}
          emptyMessage="No colours found matching the criteria."
        />
      )}

      {/* Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingColour ? `Edit Shade: ${editingColour.name}` : 'Create New Colour Shade'}
        size="md"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Colour Code *"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              required
              placeholder="e.g. CLR-IND-01"
            />
            <Input
              label="Shade Name *"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              placeholder="e.g. Royal Neelambari Indigo"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Colour Family *"
              value={formData.colour_family}
              onChange={(e) => setFormData({ ...formData, colour_family: e.target.value })}
              options={COLOUR_FAMILIES}
            />
            <div>
              <label className="block text-xs font-semibold text-surface-700 dark:text-surface-300 mb-1.5">
                Hex Code & Swatch *
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="color"
                  value={formData.hex_code}
                  onChange={(e) => setFormData({ ...formData, hex_code: e.target.value.toUpperCase() })}
                  className="w-10 h-10 rounded-lg cursor-pointer border border-border p-0.5 bg-transparent"
                />
                <input
                  type="text"
                  value={formData.hex_code}
                  onChange={(e) => setFormData({ ...formData, hex_code: e.target.value.toUpperCase() })}
                  required
                  placeholder="#1E2447"
                  className="flex-1 px-3 py-2 text-sm font-mono uppercase bg-surface-50 dark:bg-surface-800 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-textile-purple/30"
                />
              </div>
            </div>
          </div>

          <Select
            label="Dye Method / Recipe Type"
            value={formData.dye_type}
            onChange={(e) => setFormData({ ...formData, dye_type: e.target.value })}
            options={DYE_TYPES}
          />

          <Input
            label="Recipe & Mordant Description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Alum mordant, pH level, vat temperature, lightfastness rating..."
          />

          <Select
            label="Status"
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            options={[
              { value: 'ACTIVE', label: 'Active (Approved for Dyeing)' },
              { value: 'INACTIVE', label: 'Inactive / Archived' },
            ]}
          />

          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-border">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" loading={saveLoading}>
              {editingColour ? 'Save Changes' : 'Create Colour'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Dialog */}
      <ConfirmDialog
        isOpen={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDelete}
        title="Delete Colour"
        message={`Are you sure you want to delete colour '${colourToDelete?.name}' (${colourToDelete?.code})?`}
        confirmText="Delete Colour"
        variant="danger"
      />
    </div>
  );
}
