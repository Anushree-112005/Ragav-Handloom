import React, { useState, useEffect } from 'react';
import { Users, Plus, Edit2, Trash2, Search, Filter, Phone, Mail, MapPin, IndianRupee } from 'lucide-react';
import { customerService } from '../../services/masterDataService';
import { useToast } from '../../context/ToastContext';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import StatusBadge from '../../components/common/StatusBadge';
import Modal from '../../components/common/Modal';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';

const CUSTOMER_TYPES = [
  { value: 'WHOLESALE', label: 'Wholesale Textile House' },
  { value: 'BOUTIQUE', label: 'Designer Saree Boutique' },
  { value: 'RETAIL', label: 'Retail Showroom' },
  { value: 'EXPORT', label: 'International Export Client' },
  { value: 'CORPORATE', label: 'Corporate Gifting Client' },
];

export default function CustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState(null);
  const [saveLoading, setSaveLoading] = useState(false);

  const [formData, setFormData] = useState({
    customer_code: '',
    name: '',
    customer_type: 'WHOLESALE',
    contact_person: '',
    email: '',
    phone: '',
    address: '',
    city: 'Chennai',
    state: 'Tamil Nadu',
    gst_number: '33AAACL1234E1Z0',
    credit_limit: 500000,
    payment_terms: 'Net 30 Days',
    status: 'ACTIVE',
  });

  const toast = useToast();

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (typeFilter) params.customer_type = typeFilter;
      if (statusFilter) params.status = statusFilter;

      const res = await customerService.getAll(params);
      setCustomers(Array.isArray(res) ? res : (res?.items || []));
    } catch (err) {
      toast.error('Failed to load customers: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [search, typeFilter, statusFilter]);

  const handleOpenCreate = () => {
    setEditingCustomer(null);
    setFormData({
      customer_code: `CUST-${Math.floor(100 + Math.random() * 900)}`,
      name: '',
      customer_type: 'WHOLESALE',
      contact_person: '',
      email: '',
      phone: '',
      address: '',
      city: 'Hyderabad',
      state: 'Telangana',
      gst_number: '36AAACB4567D1Z8',
      credit_limit: 500000,
      payment_terms: 'Net 30 Days',
      status: 'ACTIVE',
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (c) => {
    setEditingCustomer(c);
    setFormData({
      customer_code: c.customer_code,
      name: c.name,
      customer_type: c.customer_type || 'WHOLESALE',
      contact_person: c.contact_person || '',
      email: c.email || '',
      phone: c.phone || '',
      address: c.address || '',
      city: c.city || '',
      state: c.state || '',
      gst_number: c.gst_number || '',
      credit_limit: c.credit_limit || 0,
      payment_terms: c.payment_terms || '',
      status: c.status,
    });
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.customer_code || !formData.name) {
      toast.error('Customer code and name are required');
      return;
    }
    setSaveLoading(true);
    try {
      const payload = {
        ...formData,
        credit_limit: parseFloat(formData.credit_limit) || 0,
      };

      if (editingCustomer) {
        await customerService.update(editingCustomer.id, payload);
        toast.success(`Customer '${formData.name}' updated.`);
      } else {
        await customerService.create(payload);
        toast.success(`Customer '${formData.name}' created.`);
      }
      setModalOpen(false);
      fetchCustomers();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaveLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!customerToDelete) return;
    try {
      await customerService.delete(customerToDelete.id);
      toast.success(`Customer '${customerToDelete.name}' deleted.`);
      setDeleteDialogOpen(false);
      fetchCustomers();
    } catch (err) {
      toast.error('Failed to delete customer: ' + err.message);
    }
  };

  const columns = [
    {
      header: 'Customer',
      accessor: (c) => (
        <div>
          <span className="font-semibold text-surface-900 dark:text-surface-100 block text-sm">
            {c.name}
          </span>
          <span className="font-mono text-xs text-surface-500">{c.customer_code}</span>
        </div>
      ),
    },
    {
      header: 'Type',
      accessor: (c) => (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
          {c.customer_type}
        </span>
      ),
    },
    {
      header: 'Contact Person',
      accessor: (c) => (
        <div>
          <span className="text-xs font-medium text-surface-800 dark:text-surface-200 block">
            {c.contact_person || '—'}
          </span>
          <div className="flex items-center space-x-2 text-[11px] text-surface-500 mt-0.5">
            {c.phone && <span>{c.phone}</span>}
            {c.email && <span>• {c.email}</span>}
          </div>
        </div>
      ),
    },
    {
      header: 'Location & GST',
      accessor: (c) => (
        <div>
          <div className="flex items-center space-x-1 text-xs text-surface-700 dark:text-surface-300">
            <MapPin className="w-3 h-3 text-surface-400" />
            <span>{c.city ? `${c.city}, ${c.state}` : '—'}</span>
          </div>
          <span className="font-mono text-[11px] text-surface-500 block mt-0.5">
            {c.gst_number || 'No GST'}
          </span>
        </div>
      ),
    },
    {
      header: 'Credit Limit',
      accessor: (c) => (
        <span className="text-xs font-mono font-bold text-surface-900 dark:text-surface-100">
          ₹{Number(c.credit_limit || 0).toLocaleString('en-IN')}
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
              setCustomerToDelete(c);
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
            <Users className="w-7 h-7 text-blue-600" />
            Customers Master
          </h1>
          <p className="text-sm text-surface-500 dark:text-surface-400 mt-1">
            Manage wholesale clients, designer boutiques, retail buyers, credit terms, and GSTIN details.
          </p>
        </div>
        <Button variant="primary" icon={Plus} onClick={handleOpenCreate}>
          Add Customer
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-surface-0 dark:bg-surface-900 p-4 rounded-xl border border-border flex flex-col md:flex-row gap-4 items-center justify-between shadow-sm">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
          <input
            type="text"
            placeholder="Search customer, city, code..."
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
            <option value="">All Customer Types</option>
            {CUSTOMER_TYPES.map((t) => (
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
          data={customers}
          emptyMessage="No customers found matching the criteria."
        />
      )}

      {/* Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingCustomer ? `Edit Customer: ${editingCustomer.name}` : 'Create Customer Record'}
        size="lg"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Customer Code *"
              value={formData.customer_code}
              onChange={(e) => setFormData({ ...formData, customer_code: e.target.value })}
              required
              placeholder="e.g. CUST-CHN-01"
            />
            <Input
              label="Customer / Entity Name *"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              placeholder="e.g. Nalli Silk Sarees Pvt. Ltd."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Customer Segment *"
              value={formData.customer_type}
              onChange={(e) => setFormData({ ...formData, customer_type: e.target.value })}
              options={CUSTOMER_TYPES}
            />
            <Input
              label="Credit Limit (₹)"
              type="number"
              value={formData.credit_limit}
              onChange={(e) => setFormData({ ...formData, credit_limit: e.target.value })}
              placeholder="500000"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="Contact Person"
              value={formData.contact_person}
              onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
              placeholder="e.g. Mr. R. Ramanathan"
            />
            <Input
              label="Phone Number"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="+91 98400 54321"
            />
            <Input
              label="Email Address"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="procurement@client.com"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="City"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              placeholder="Chennai"
            />
            <Input
              label="State"
              value={formData.state}
              onChange={(e) => setFormData({ ...formData, state: e.target.value })}
              placeholder="Tamil Nadu"
            />
            <Input
              label="GSTIN Number"
              value={formData.gst_number}
              onChange={(e) => setFormData({ ...formData, gst_number: e.target.value.toUpperCase() })}
              placeholder="33AAACL1234E1Z0"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Payment Terms"
              value={formData.payment_terms}
              onChange={(e) => setFormData({ ...formData, payment_terms: e.target.value })}
              placeholder="Net 30 Days / Immediate"
            />
            <Select
              label="Status"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              options={[
                { value: 'ACTIVE', label: 'Active Client' },
                { value: 'INACTIVE', label: 'Inactive / On Hold' },
              ]}
            />
          </div>

          <Input
            label="Billing & Shipping Address"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            placeholder="No. 12, Usman Road, T. Nagar..."
          />

          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-border">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" loading={saveLoading}>
              {editingCustomer ? 'Save Changes' : 'Create Customer'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Dialog */}
      <ConfirmDialog
        isOpen={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDelete}
        title="Delete Customer"
        message={`Are you sure you want to delete customer '${customerToDelete?.name}' (${customerToDelete?.customer_code})?`}
        confirmText="Delete Customer"
        variant="danger"
      />
    </div>
  );
}
