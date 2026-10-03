import React, { useState, useEffect } from 'react';
import { ShoppingCart, Building, Calendar, IndianRupee, Clock, CheckCircle2 } from 'lucide-react';
import { operationsService } from '../../services/operationalServices';
import { useToast } from '../../context/ToastContext';
import Table from '../../components/common/Table';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';
import Card from '../../components/common/Card';
import TextileHero from '../../components/common/TextileHero';

export default function PurchasePage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  const fetchPurchase = async () => {
    setLoading(true);
    try {
      const data = await operationsService.getPurchase();
      setOrders(data || []);
    } catch (err) {
      toast.error('Failed to load purchase orders: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPurchase();
  }, []);

  const totalProcurement = orders.reduce((sum, o) => sum + (o.total_amount || 0), 0);

  const columns = [
    {
      header: 'PO Number',
      accessor: (p) => (
        <span className="font-mono text-sm font-bold text-surface-900 dark:text-surface-100">
          {p.po_number}
        </span>
      ),
    },
    {
      header: 'Supplier / Vendor',
      accessor: (p) => (
        <div className="flex items-center space-x-1.5 text-xs text-surface-800 dark:text-surface-200">
          <Building className="w-3.5 h-3.5 text-emerald-600" />
          <span className="font-semibold">{p.supplier_name}</span>
        </div>
      ),
    },
    {
      header: 'PO Value (₹)',
      accessor: (p) => (
        <span className="font-mono text-sm font-bold text-surface-900 dark:text-surface-100">
          ₹{Number(p.total_amount || 0).toLocaleString('en-IN')}
        </span>
      ),
    },
    {
      header: 'Order Date',
      accessor: (p) => (
        <span className="font-mono text-xs text-surface-600 dark:text-surface-400">
          {p.order_date || '—'}
        </span>
      ),
    },
    {
      header: 'Expected Delivery',
      accessor: (p) => (
        <span className="font-mono text-xs text-surface-600 dark:text-surface-400">
          {p.expected_delivery_date || '—'}
        </span>
      ),
    },
    {
      header: 'Status',
      accessor: (p) => <StatusBadge status={p.status} />,
    },
  ];

  return (
    <div className="space-y-6">
      <TextileHero
        title="Procurement & Purchase Orders"
        subtitle="Manage raw silk fiber consignments, zari metallic thread procurement, and chemical dye orders."
        variant="emerald"
        badge="Procurement Operations"
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <Card className="flex items-center space-x-4 p-5">
          <div className="p-3 bg-emerald-500/10 text-emerald-600 rounded-xl">
            <ShoppingCart className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-surface-500">Total Purchase Orders</div>
            <div className="text-2xl font-bold font-mono text-surface-900 dark:text-surface-100">{orders.length}</div>
          </div>
        </Card>

        <Card className="flex items-center space-x-4 p-5">
          <div className="p-3 bg-indigo-500/10 text-indigo-600 rounded-xl">
            <IndianRupee className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-surface-500">Committed Value</div>
            <div className="text-2xl font-bold font-mono text-surface-900 dark:text-surface-100">
              ₹{totalProcurement.toLocaleString('en-IN')}
            </div>
          </div>
        </Card>

        <Card className="flex items-center space-x-4 p-5">
          <div className="p-3 bg-textile-purple/10 text-textile-purple rounded-xl">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-surface-500">Active Suppliers</div>
            <div className="text-2xl font-bold font-mono text-surface-900 dark:text-surface-100">
              {new Set(orders.map((o) => o.supplier_name)).size}
            </div>
          </div>
        </Card>
      </div>

      {/* Table */}
      {loading ? (
        <LoadingSkeleton type="table" rows={6} />
      ) : (
        <Table
          columns={columns}
          data={orders}
          emptyMessage="No purchase orders found."
        />
      )}
    </div>
  );
}
