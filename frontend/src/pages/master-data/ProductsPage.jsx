import React, { useState, useEffect } from 'react';
import { Package, Plus, Edit2, Trash2, Search, Filter, IndianRupee, Layers, Tag } from 'lucide-react';
import { productService, fabricService, designService, colourService, uomService } from '../../services/masterDataService';
import { useToast } from '../../context/ToastContext';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import StatusBadge from '../../components/common/StatusBadge';
import Modal from '../../components/common/Modal';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';

const CATEGORIES = [
  { value: 'Sarees', label: 'Sarees (Traditional & Bridal)' },
  { value: 'Dhotis', label: 'Dhotis & Veshtis' },
  { value: 'Stoles', label: 'Dupattas & Stoles' },
  { value: 'Shawls', label: 'Shawls & Wraps' },
  { value: 'Fabrics', label: 'Running Fabric Yardage' },
  { value: 'Home Linen', label: 'Home Furnishings & Linen' },
  { value: 'Garments', label: 'Apparel & Ready-to-Wear' },
];

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [fabrics, setFabrics] = useState([]);
  const [designs, setDesigns] = useState([]);
  const [colours, setColours] = useState([]);
  const [uoms, setUoms] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  const [saveLoading, setSaveLoading] = useState(false);

  const [formData, setFormData] = useState({
    code: '',
    name: '',
    category: 'Saree',
    product_type: 'Silk Saree',
    fabric_id: '',
    design_id: '',
    colour_id: '',
    size: 'Standard 6.25m',
    uom_id: '',
    cost_price: 0,
    selling_price: 0,
    description: '',
    status: 'ACTIVE',
  });

  const toast = useToast();

  const fetchDependencies = async () => {
    try {
      const [fabRes, desRes, colRes, uomRes] = await Promise.all([
        fabricService.getAll(),
        designService.getAll(),
        colourService.getAll(),
        uomService.getAll(),
      ]);
      setFabrics(Array.isArray(fabRes) ? fabRes : (fabRes.items || []));
      setDesigns(Array.isArray(desRes) ? desRes : (desRes.items || []));
      setColours(Array.isArray(colRes) ? colRes : (colRes.items || []));
      setUoms(Array.isArray(uomRes) ? uomRes : (uomRes.items || []));
    } catch (err) {
      console.error('Failed to load related master lists:', err);
    }
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (categoryFilter) params.category = categoryFilter;
      if (statusFilter) params.status = statusFilter;

      const res = await productService.getAll(params);
      setProducts(Array.isArray(res) ? res : (res.items || []));
    } catch (err) {
      toast.error('Failed to fetch products: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDependencies();
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [search, categoryFilter, statusFilter]);

  const handleOpenCreate = () => {
    setEditingProduct(null);
    setFormData({
      code: `PROD-${Math.floor(1000 + Math.random() * 9000)}`,
      name: '',
      category: 'Sarees',
      product_type: 'Pure Zari Silk Saree',
      fabric_id: fabrics[0]?.id || '',
      design_id: designs[0]?.id || '',
      colour_id: colours[0]?.id || '',
      size: '6.25m with Blouse',
      uom_id: uoms[0]?.id || '',
      cost_price: 6500,
      selling_price: 14500,
      description: '',
      status: 'ACTIVE',
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (p) => {
    setEditingProduct(p);
    setFormData({
      code: p.code,
      name: p.name,
      category: p.category,
      product_type: p.product_type || '',
      fabric_id: p.fabric_id || '',
      design_id: p.design_id || '',
      colour_id: p.colour_id || '',
      size: p.size || '',
      uom_id: p.uom_id || '',
      cost_price: p.cost_price || 0,
      selling_price: p.selling_price || 0,
      description: p.description || '',
      status: p.status,
    });
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.code || !formData.name) {
      toast.error('Product code and name are required');
      return;
    }
    setSaveLoading(true);
    try {
      const payload = {
        ...formData,
        cost_price: parseFloat(formData.cost_price) || 0,
        selling_price: parseFloat(formData.selling_price) || 0,
        fabric_id: formData.fabric_id || null,
        design_id: formData.design_id || null,
        colour_id: formData.colour_id || null,
        uom_id: formData.uom_id || null,
      };

      if (editingProduct) {
        await productService.update(editingProduct.id, payload);
        toast.success(`Product '${formData.name}' updated successfully.`);
      } else {
        await productService.create(payload);
        toast.success(`Product '${formData.name}' created successfully.`);
      }
      setModalOpen(false);
      fetchProducts();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaveLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!productToDelete) return;
    try {
      await productService.delete(productToDelete.id);
      toast.success(`Product '${productToDelete.name}' deleted.`);
      setDeleteDialogOpen(false);
      fetchProducts();
    } catch (err) {
      toast.error('Failed to delete product: ' + err.message);
    }
  };

  const calculateMargin = (cost, sell) => {
    if (!sell || sell <= 0) return 0;
    return (((sell - cost) / sell) * 100).toFixed(1);
  };

  const columns = [
    {
      header: 'Product',
      accessor: (p) => (
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg bg-saffron-50 dark:bg-saffron-950/40 text-saffron-600 dark:text-saffron-400 flex items-center justify-center border border-saffron-200/60 flex-shrink-0">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <span className="font-semibold text-surface-900 dark:text-surface-100 block text-sm">
              {p.name}
            </span>
            <span className="font-mono text-xs text-surface-500">{p.code}</span>
          </div>
        </div>
      ),
    },
    {
      header: 'Category & Type',
      accessor: (p) => (
        <div>
          <span className="text-xs font-medium text-surface-800 dark:text-surface-200 block">
            {p.category}
          </span>
          <span className="text-[11px] text-surface-500">{p.product_type || '—'}</span>
        </div>
      ),
    },
    {
      header: 'Specs & Shade',
      accessor: (p) => (
        <div className="space-y-1">
          <div className="text-xs text-surface-600 dark:text-surface-300">
            {p.fabric_name || 'Fabric: Standard'}
          </div>
          <div className="flex items-center space-x-1.5 text-xs text-surface-500">
            {p.colour_hex && (
              <span
                className="w-3 h-3 rounded-full border border-black/10 inline-block"
                style={{ backgroundColor: p.colour_hex }}
              />
            )}
            <span>{p.colour_name || 'Unassigned'}</span>
          </div>
        </div>
      ),
    },
    {
      header: 'Cost Price',
      accessor: (p) => (
        <span className="text-xs font-mono text-surface-600 dark:text-surface-400">
          ₹{Number(p.cost_price || 0).toLocaleString('en-IN')}
        </span>
      ),
    },
    {
      header: 'Selling Price',
      accessor: (p) => (
        <div className="space-y-0.5">
          <span className="text-xs font-mono font-bold text-surface-900 dark:text-surface-100 block">
            ₹{Number(p.selling_price || 0).toLocaleString('en-IN')}
          </span>
          <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
            {calculateMargin(p.cost_price, p.selling_price)}% margin
          </span>
        </div>
      ),
    },
    {
      header: 'Status',
      accessor: (p) => <StatusBadge status={p.status} />,
    },
    {
      header: 'Actions',
      align: 'right',
      accessor: (p) => (
        <div className="flex items-center justify-end space-x-1">
          <Button
            variant="ghost"
            size="sm"
            className="p-1.5 text-surface-500 hover:text-textile-purple"
            onClick={() => handleOpenEdit(p)}
          >
            <Edit2 className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="p-1.5 text-surface-500 hover:text-rose-600"
            onClick={() => {
              setProductToDelete(p);
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
            <Package className="w-7 h-7 text-amber-600" />
            Products Master
          </h1>
          <p className="text-sm text-surface-500 dark:text-surface-400 mt-1">
            Manage your handloom product line, pricing structures, design variations, and catalog specifications.
          </p>
        </div>
        <Button variant="primary" icon={Plus} onClick={handleOpenCreate}>
          Add Product
        </Button>
      </div>

      {/* Filter Bar */}
      <div className="bg-surface-0 dark:bg-surface-900 p-4 rounded-xl border border-border flex flex-col md:flex-row gap-4 items-center justify-between shadow-sm">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
          <input
            type="text"
            placeholder="Search by code, product name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-surface-50 dark:bg-surface-800 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-textile-purple/30"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 text-xs bg-surface-50 dark:bg-surface-800 border border-border rounded-lg text-surface-700 dark:text-surface-300 focus:outline-none focus:ring-2 focus:ring-textile-purple/30"
          >
            <option value="">All Categories</option>
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>{c.value}</option>
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
          data={products}
          emptyMessage="No products found matching the criteria."
        />
      )}

      {/* Product Form Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingProduct ? `Edit Product: ${editingProduct.code}` : 'Create New Product'}
        size="lg"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Product Code *"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              required
              placeholder="e.g. PROD-KJM-01"
            />
            <Input
              label="Product Name *"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              placeholder="e.g. Royal Kanjeevaram Silk Saree"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Select
              label="Category *"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              options={CATEGORIES}
            />
            <Input
              label="Product Type"
              value={formData.product_type}
              onChange={(e) => setFormData({ ...formData, product_type: e.target.value })}
              placeholder="e.g. Pure Zari Brocade"
            />
            <Input
              label="Standard Size / Length"
              value={formData.size}
              onChange={(e) => setFormData({ ...formData, size: e.target.value })}
              placeholder="e.g. 6.25m with Blouse"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Select
              label="Base Fabric"
              value={formData.fabric_id}
              onChange={(e) => setFormData({ ...formData, fabric_id: e.target.value })}
              options={[
                { value: '', label: 'Select Fabric...' },
                ...fabrics.map((f) => ({ value: f.id, label: `${f.code} - ${f.name}` })),
              ]}
            />
            <Select
              label="Design & Motif"
              value={formData.design_id}
              onChange={(e) => setFormData({ ...formData, design_id: e.target.value })}
              options={[
                { value: '', label: 'Select Design...' },
                ...designs.map((d) => ({ value: d.id, label: `${d.code} - ${d.name}` })),
              ]}
            />
            <Select
              label="Colour Shade"
              value={formData.colour_id}
              onChange={(e) => setFormData({ ...formData, colour_id: e.target.value })}
              options={[
                { value: '', label: 'Select Colour...' },
                ...colours.map((c) => ({ value: c.id, label: `${c.name} (${c.code})` })),
              ]}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="Cost Price (₹) *"
              type="number"
              value={formData.cost_price}
              onChange={(e) => setFormData({ ...formData, cost_price: e.target.value })}
              required
            />
            <Input
              label="Selling Price (₹) *"
              type="number"
              value={formData.selling_price}
              onChange={(e) => setFormData({ ...formData, selling_price: e.target.value })}
              required
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

          <Input
            label="Description & Specifications"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Weave details, thread counts, care instructions..."
          />

          <Select
            label="Status"
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            options={[
              { value: 'ACTIVE', label: 'Active (Available for Orders)' },
              { value: 'INACTIVE', label: 'Inactive / Archived' },
            ]}
          />

          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-border">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" loading={saveLoading}>
              {editingProduct ? 'Save Changes' : 'Create Product'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Dialog */}
      <ConfirmDialog
        isOpen={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDelete}
        title="Delete Product"
        message={`Are you sure you want to delete '${productToDelete?.name}' (${productToDelete?.code})? This action cannot be undone.`}
        confirmText="Delete Product"
        variant="danger"
      />
    </div>
  );
}
