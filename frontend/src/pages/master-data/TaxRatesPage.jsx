import React, { useState, useEffect } from 'react';
import { Percent, Plus, Edit2, Trash2, Search, Filter, Calendar } from 'lucide-react';
import { taxRateService } from '../../services/masterDataService';
import { useToast } from '../../context/ToastContext';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import StatusBadge from '../../components/common/StatusBadge';
import Modal from '../../components/common/Modal';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';

export default function TaxRatesPage() {
  const [taxRates, setTaxRates] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingTax, setEditingTax] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [taxToDelete, setTaxToDelete] = useState(null);
  const [saveLoading, setSaveLoading] = useState(false);

  const [formData, setFormData] = useState({
    tax_code: '',
    tax_name: '',
    gst_percentage: 5,
    hsn_code: '5007',
    tax_category: 'Handloom Silk Fabrics',
    effective_from: '2022-01-01',
    effective_to: '',
    status: 'ACTIVE',
  });

  const toast = useToast();

  const fetchTaxRates = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;

      const res = await taxRateService.getAll(params);
      setTaxRates(Array.isArray(res) ? res : (res?.items || []));
    } catch (err) {
      toast.error('Failed to load tax rates: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTaxRates();
  }, [search, statusFilter]);

  const handleOpenCreate = () => {
    setEditingTax(null);
    setFormData({
      tax_code: `GST-${Math.floor(10 + Math.random() * 90)}`,
      tax_name: '',
      gst_percentage: 5,
      hsn_code: '5007',
      tax_category: 'Handloom Silk Sarees',
      effective_from: '2024-04-01',
      effective_to: '',
      status: 'ACTIVE',
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (t) => {
    setEditingTax(t);
    setFormData({
      tax_code: t.tax_code,
      tax_name: t.tax_name,
      gst_percentage: t.gst_percentage || 0,
      hsn_code: t.hsn_code || '',
      tax_category: t.tax_category || '',
      effective_from: t.effective_from || '',
      effective_to: t.effective_to || '',
      status: t.status,
    });
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.tax_code || !formData.tax_name) {
      toast.error('Tax code and name are required');
      return;
    }
    setSaveLoading(true);
    try {
      const payload = {
        ...formData,
        gst_percentage: parseFloat(formData.gst_percentage) || 0,
        effective_to: formData.effective_to || null,
      };

      if (editingTax) {
        await taxRateService.update(editingTax.id, payload);
        toast.success(`Tax Rate '${formData.tax_code}' updated.`);
      } else {
        await taxRateService.create(payload);
        toast.success(`Tax Rate '${formData.tax_code}' created.`);
      }
      setModalOpen(false);
      fetchTaxRates();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaveLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!taxToDelete) return;
    try {
      await taxRateService.delete(taxToDelete.id);
      toast.success(`Tax Rate '${taxToDelete.tax_code}' deleted.`);
      setDeleteDialogOpen(false);
      fetchTaxRates();
    } catch (err) {
      toast.error('Failed to delete tax rate: ' + err.message);
    }
  };

  const columns = [
    {
      header: 'Tax Code & Rate',
      accessor: (t) => (
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 flex items-center justify-center text-rose-700 dark:text-rose-300 font-bold font-mono text-sm">
            {t.gst_percentage}%
          </div>
          <div>
            <span className="font-semibold text-surface-900 dark:text-surface-100 block text-sm">
              {t.tax_name}
            </span>
            <span className="font-mono text-xs text-surface-500">{t.tax_code}</span>
          </div>
        </div>
      ),
    },
    {
      header: 'HSN / SAC Code',
      accessor: (t) => (
        <span className="font-mono text-xs font-bold text-surface-800 dark:text-surface-200">
          {t.hsn_code}
        </span>
      ),
    },
    {
      header: 'Category',
      accessor: (t) => (
        <span className="text-xs text-surface-700 dark:text-surface-300">
          {t.tax_category || 'General Textile'}
        </span>
      ),
    },
    {
      header: 'Effective Period',
      accessor: (t) => (
        <div className="flex items-center space-x-1 text-xs text-surface-600 dark:text-surface-400 font-mono">
          <Calendar className="w-3.5 h-3.5 text-surface-400" />
          <span>{t.effective_from || '—'} {t.effective_to ? `to ${t.effective_to}` : '(Current)'}</span>
        </div>
      ),
    },
    {
      header: 'Status',
      accessor: (t) => <StatusBadge status={t.status} />,
    },
    {
      header: 'Actions',
      align: 'right',
      accessor: (t) => (
        <div className="flex items-center justify-end space-x-1">
          <Button
            variant="ghost"
            size="sm"
            className="p-1.5 text-surface-500 hover:text-textile-purple"
            onClick={() => handleOpenEdit(t)}
          >
            <Edit2 className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="p-1.5 text-surface-500 hover:text-rose-600"
            onClick={() => {
              setTaxToDelete(t);
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
            <Percent className="w-7 h-7 text-rose-600" />
            Tax & GST Rates Master
          </h1>
          <p className="text-sm text-surface-500 dark:text-surface-400 mt-1">
            Maintain Indian GST slabs (5%, 12%, 18%), HSN codes (5007 Silk, 5208 Cotton), and tax classifications.
          </p>
        </div>
        <Button variant="primary" icon={Plus} onClick={handleOpenCreate}>
          Add Tax Rate
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-surface-0 dark:bg-surface-900 p-4 rounded-xl border border-border flex flex-col md:flex-row gap-4 items-center justify-between shadow-sm">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
          <input
            type="text"
            placeholder="Search tax code, HSN..."
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
          data={taxRates}
          emptyMessage="No tax rates found matching the criteria."
        />
      )}

      {/* Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingTax ? `Edit Tax Rate: ${editingTax.tax_code}` : 'Create Tax Rate'}
        size="md"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Tax Code *"
              value={formData.tax_code}
              onChange={(e) => setFormData({ ...formData, tax_code: e.target.value.toUpperCase() })}
              required
              placeholder="e.g. GST-5-SILK"
            />
            <Input
              label="Tax Label / Name *"
              value={formData.tax_name}
              onChange={(e) => setFormData({ ...formData, tax_name: e.target.value })}
              required
              placeholder="e.g. GST 5% Handloom Silk"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="GST Percentage (%) *"
              type="number"
              step="0.1"
              value={formData.gst_percentage}
              onChange={(e) => setFormData({ ...formData, gst_percentage: e.target.value })}
              required
              placeholder="5.0"
            />
            <Input
              label="HSN / SAC Code *"
              value={formData.hsn_code}
              onChange={(e) => setFormData({ ...formData, hsn_code: e.target.value })}
              required
              placeholder="e.g. 5007"
            />
          </div>

          <Input
            label="Tax Category / Material Group"
            value={formData.tax_category}
            onChange={(e) => setFormData({ ...formData, tax_category: e.target.value })}
            placeholder="e.g. Woven fabrics of silk or silk waste"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Effective From"
              type="date"
              value={formData.effective_from}
              onChange={(e) => setFormData({ ...formData, effective_from: e.target.value })}
            />
            <Input
              label="Effective To (Optional)"
              type="date"
              value={formData.effective_to}
              onChange={(e) => setFormData({ ...formData, effective_to: e.target.value })}
            />
          </div>

          <Select
            label="Status"
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            options={[
              { value: 'ACTIVE', label: 'Active GST Slab' },
              { value: 'INACTIVE', label: 'Inactive / Superseded' },
            ]}
          />

          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-border">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" loading={saveLoading}>
              {editingTax ? 'Save Changes' : 'Create Tax Rate'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Dialog */}
      <ConfirmDialog
        isOpen={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDelete}
        title="Delete Tax Rate"
        message={`Are you sure you want to delete tax rate '${taxToDelete?.tax_code}'?`}
        confirmText="Delete Tax Rate"
        variant="danger"
      />
    </div>
  );
}
