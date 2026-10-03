import React, { useState, useEffect } from 'react';
import { TrendingUp, Users, Calendar, IndianRupee, Truck, CheckCircle2 } from 'lucide-react';
import { operationsService } from '../../services/operationalServices';
import { useToast } from '../../context/ToastContext';
import Table from '../../components/common/Table';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';
import Card from '../../components/common/Card';
import TextileHero from '../../components/common/TextileHero';

export default function SalesPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  const fetchSales = async () => {
    setLoading(true);
    try {
      const data = await operationsService.getSales();
      setOrders(data || []);
    } catch (err) {
      toast.error('Failed to load sales orders: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSales();
  }, []);

  const totalSalesRevenue = orders.reduce((sum, o) => sum + (o.total_amount || 0), 0);

  const columns = [
    {
      header: 'Sales Order',
      accessor: (s) => (
        <span className="font-mono text-sm font-bold text-surface-900 dark:text-surface-100">
          {s.so_number}
        </span>
      ),
    },
    {
      header: 'Customer / Buyer',
      accessor: (s) => (
        <div className="flex items-center space-x-1.5 text-xs text-surface-800 dark:text-surface-200">
          <Users className="w-3.5 h-3.5 text-blue-600" />
          <span className="font-semibold">{s.customer_name}</span>
        </div>
      ),
    },
    {
      header: 'Order Value (₹)',
      accessor: (s) => (
        <span className="font-mono text-sm font-bold text-surface-900 dark:text-surface-100">
          ₹{Number(s.total_amount || 0).toLocaleString('en-IN')}
        </span>
      ),
    },
    {
      header: 'Order Date',
      accessor: (s) => (
        <span className="font-mono text-xs text-surface-600 dark:text-surface-400">
          {s.order_date || '—'}
        </span>
      ),
    },
    {
      header: 'Dispatch Date',
      accessor: (s) => (
        <span className="font-mono text-xs text-surface-600 dark:text-surface-400">
          {s.dispatch_date || '—'}
        </span>
      ),
    },
    {
      header: 'Status',
      accessor: (s) => <StatusBadge status={s.status} />,
    },
  ];

  return (
    <div className="space-y-6">
      <TextileHero
        title="Sales Orders & Shipments"
        subtitle="Manage wholesale orders, boutique shipments, export consignments, and invoice statuses."
        variant="amber"
        badge="Sales Operations"
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <Card className="flex items-center space-x-4 p-5">
          <div className="p-3 bg-amber-500/10 text-amber-600 rounded-xl">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-surface-500">Sales Invoices</div>
            <div className="text-2xl font-bold font-mono text-surface-900 dark:text-surface-100">{orders.length}</div>
          </div>
        </Card>

        <Card className="flex items-center space-x-4 p-5">
          <div className="p-3 bg-emerald-500/10 text-emerald-600 rounded-xl">
            <IndianRupee className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-surface-500">Total Bookings</div>
            <div className="text-2xl font-bold font-mono text-surface-900 dark:text-surface-100">
              ₹{totalSalesRevenue.toLocaleString('en-IN')}
            </div>
          </div>
        </Card>

        <Card className="flex items-center space-x-4 p-5">
          <div className="p-3 bg-blue-500/10 text-blue-600 rounded-xl">
            <Truck className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-surface-500">Commercial Clients</div>
            <div className="text-2xl font-bold font-mono text-surface-900 dark:text-surface-100">
              {new Set(orders.map((o) => o.customer_name)).size}
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
          emptyMessage="No sales orders found."
        />
      )}
    </div>
  );
}
