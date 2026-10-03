import React, { useState, useEffect } from 'react';
import { Building, Plus, Edit2, Trash2, Search, Filter, Phone, Mail, MapPin, FileText } from 'lucide-react';
import { supplierService } from '../../services/masterDataService';
import { useToast } from '../../context/ToastContext';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import StatusBadge from '../../components/common/StatusBadge';
import Modal from '../../components/common/Modal';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [supplierToDelete, setSupplierToDelete] = useState(null);
  const [saveLoading, setSaveLoading] = useState(false);

  const [formData, setFormData] = useState({
    supplier_code: '',
    name: '',
    contact_person: '',
    email: '',
    phone: '',
    address: '',
    city: 'Bengaluru',
    state: 'Karnataka',
    gst_number: '29AAAAA0000A1Z5',
    materials_supplied: 'Mulberry Raw Silk Yarn, Organic Cotton',
    payment_terms: 'Net 30 Days',
    status: 'ACTIVE',
  });

  const toast = useToast();

  const fetchSuppliers = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;

      const res = await supplierService.getAll(params);
      setSuppliers(Array.isArray(res) ? res : (res?.items || []));
    } catch (err) {
      toast.error('Failed to load suppliers: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, [search, statusFilter]);

  const handleOpenCreate = () => {
    setEditingSupplier(null);
    setFormData({
      supplier_code: `SUP-${Math.floor(100 + Math.random() * 900)}`,
      name: '',
      contact_person: '',
      email: '',
      phone: '',
      address: '',
      city: 'Surat',
      state: 'Gujarat',
      gst_number: '24AAACT1234F1Z1',
      materials_supplied: 'Fine Zari Metallic Threads & Reeled Silk',
      payment_terms: 'Net 30 Days',
      status: 'ACTIVE',
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (s) => {
    setEditingSupplier(s);
    setFormData({
      supplier_code: s.supplier_code,
      name: s.name,
      contact_person: s.contact_person || '',
      email: s.email || '',
      phone: s.phone || '',
      address: s.address || '',
      city: s.city || '',
      state: s.state || '',
      gst_number: s.gst_number || '',
      materials_supplied: s.materials_supplied || '',
      payment_terms: s.payment_terms || '',
      status: s.status,
    });
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.supplier_code || !formData.name) {
      toast.error('Supplier code and name are required');
      return;
    }
    setSaveLoading(true);
    try {
      if (editingSupplier) {
        await supplierService.update(editingSupplier.id, formData);
        toast.success(`Supplier '${formData.name}' updated.`);
      } else {
        await supplierService.create(formData);
        toast.success(`Supplier '${formData.name}' created.`);
      }
      setModalOpen(false);
      fetchSuppliers();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaveLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!supplierToDelete) return;
    try {
      await supplierService.delete(supplierToDelete.id);
      toast.success(`Supplier '${supplierToDelete.name}' deleted.`);
      setDeleteDialogOpen(false);
      fetchSuppliers();
    } catch (err) {
      toast.error('Failed to delete supplier: ' + err.message);
    }
  };

  const columns = [
    {
      header: 'Supplier',
      accessor: (s) => (
        <div>
          <span className="font-semibold text-surface-900 dark:text-surface-100 block text-sm">
            {s.name}
          </span>
          <span className="font-mono text-xs text-surface-500">{s.supplier_code}</span>
        </div>
      ),
    },
    {
      header: 'Contact Person',
      accessor: (s) => (
        <div>
          <span className="text-xs font-medium text-surface-800 dark:text-surface-200 block">
            {s.contact_person || '—'}
          </span>
          <div className="flex items-center space-x-2 text-[11px] text-surface-500 mt-0.5">
            {s.phone && (
              <span className="flex items-center space-x-1">
                <Phone className="w-3 h-3" />
                <span>{s.phone}</span>
              </span>
            )}
            {s.email && (
              <span className="flex items-center space-x-1">
                <Mail className="w-3 h-3" />
                <span>{s.email}</span>
              </span>
            )}
          </div>
        </div>
      ),
    },
    {
      header: 'Location & GST',
      accessor: (s) => (
        <div>
          <div className="flex items-center space-x-1 text-xs text-surface-700 dark:text-surface-300">
            <MapPin className="w-3 h-3 text-surface-400" />
            <span>{s.city ? `${s.city}, ${s.state}` : '—'}</span>
          </div>
          <span className="font-mono text-[11px] text-surface-500 block mt-0.5">
            {s.gst_number || 'No GST'}
          </span>
        </div>
      ),
    },
    {
      header: 'Materials Supplied',
      accessor: (s) => (
        <span className="text-xs text-surface-700 dark:text-surface-300 line-clamp-2 max-w-xs">
          {s.materials_supplied || 'Raw Silk, Yarn, Dyes'}
        </span>
      ),
    },
    {
      header: 'Terms',
      accessor: (s) => (
        <span className="text-xs text-surface-600 dark:text-surface-400 font-medium">
          {s.payment_terms || 'Net 30'}
        </span>
      ),
    },
    {
      header: 'Status',
      accessor: (s) => <StatusBadge status={s.status} />,
    },
    {
      header: 'Actions',
      align: 'right',
      accessor: (s) => (
        <div className="flex items-center justify-end space-x-1">
          <Button
            variant="ghost"
            size="sm"
            className="p-1.5 text-surface-500 hover:text-textile-purple"
            onClick={() => handleOpenEdit(s)}
          >
            <Edit2 className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="p-1.5 text-surface-500 hover:text-rose-600"
            onClick={() => {
              setSupplierToDelete(s);
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
            <Building className="w-7 h-7 text-emerald-600" />
            Suppliers Master
          </h1>
          <p className="text-sm text-surface-500 dark:text-surface-400 mt-1">
            Maintain raw material vendors, silk reelers, zari suppliers, GSTIN numbers, and credit terms.
          </p>
        </div>
        <Button variant="primary" icon={Plus} onClick={handleOpenCreate}>
          Add Supplier
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-surface-0 dark:bg-surface-900 p-4 rounded-xl border border-border flex flex-col md:flex-row gap-4 items-center justify-between shadow-sm">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
          <input
            type="text"
            placeholder="Search supplier, GST, city..."
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
          data={suppliers}
          emptyMessage="No suppliers found matching the criteria."
        />
      )}

      {/* Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingSupplier ? `Edit Supplier: ${editingSupplier.name}` : 'Register New Supplier'}
        size="lg"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Supplier Code *"
              value={formData.supplier_code}
              onChange={(e) => setFormData({ ...formData, supplier_code: e.target.value })}
              required
              placeholder="e.g. SUP-SLK-01"
            />
            <Input
              label="Supplier / Company Name *"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              placeholder="e.g. Karnataka Silk Reeling Corp."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="Contact Person"
              value={formData.contact_person}
              onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
              placeholder="e.g. S. Narayanan"
            />
            <Input
              label="Phone Number"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="+91 98450 12345"
            />
            <Input
              label="Email Address"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="sales@supplier.com"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="City"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              placeholder="Bengaluru"
            />
            <Input
              label="State"
              value={formData.state}
              onChange={(e) => setFormData({ ...formData, state: e.target.value })}
              placeholder="Karnataka"
            />
            <Input
              label="GSTIN Number"
              value={formData.gst_number}
              onChange={(e) => setFormData({ ...formData, gst_number: e.target.value.toUpperCase() })}
              placeholder="29AAAAA0000A1Z5"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Materials Supplied"
              value={formData.materials_supplied}
              onChange={(e) => setFormData({ ...formData, materials_supplied: e.target.value })}
              placeholder="e.g. Mulberry Warp Silk 20/22D, Organic Dyes"
            />
            <Input
              label="Payment Terms"
              value={formData.payment_terms}
              onChange={(e) => setFormData({ ...formData, payment_terms: e.target.value })}
              placeholder="e.g. Net 30 Days / Advance 20%"
            />
          </div>

          <Input
            label="Registered Address"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            placeholder="Plot 45, Textile Industrial Estate..."
          />

          <Select
            label="Status"
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            options={[
              { value: 'ACTIVE', label: 'Active Vendor' },
              { value: 'INACTIVE', label: 'Inactive / Blacklisted' },
            ]}
          />

          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-border">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" loading={saveLoading}>
              {editingSupplier ? 'Save Changes' : 'Register Supplier'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Dialog */}
      <ConfirmDialog
        isOpen={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDelete}
        title="Delete Supplier"
        message={`Are you sure you want to delete supplier '${supplierToDelete?.name}' (${supplierToDelete?.supplier_code})?`}
        confirmText="Delete Supplier"
        variant="danger"
      />
    </div>
  );
}
