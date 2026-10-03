import React, { useState, useEffect } from 'react';
import { Activity, Boxes, UserCheck, Calendar, Clock, CheckCircle2, AlertTriangle, ArrowUpRight } from 'lucide-react';
import { operationsService } from '../../services/operationalServices';
import { useToast } from '../../context/ToastContext';
import Table from '../../components/common/Table';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';
import Card from '../../components/common/Card';
import TextileHero from '../../components/common/TextileHero';

export default function ProductionPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  const fetchProduction = async () => {
    setLoading(true);
    try {
      const data = await operationsService.getProduction();
      setOrders(data || []);
    } catch (err) {
      toast.error('Failed to load production orders: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProduction();
  }, []);

  const totalMetersTarget = orders.reduce((sum, o) => sum + (o.target_quantity || 0), 0);
  const totalMetersCompleted = orders.reduce((sum, o) => sum + (o.completed_quantity || 0), 0);
  const overallEfficiency = totalMetersTarget > 0 ? ((totalMetersCompleted / totalMetersTarget) * 100).toFixed(1) : 0;

  const columns = [
    {
      header: 'Production Batch',
      accessor: (o) => (
        <div>
          <span className="font-mono text-xs font-bold text-surface-900 dark:text-surface-100 block">
            {o.order_number}
          </span>
          <span className="text-xs text-surface-600 dark:text-surface-400 font-medium">
            {o.product_name}
          </span>
        </div>
      ),
    },
    {
      header: 'Loom & Weaver',
      accessor: (o) => (
        <div className="space-y-1">
          <div className="flex items-center space-x-1.5 text-xs text-surface-800 dark:text-surface-200">
            <Boxes className="w-3.5 h-3.5 text-amber-600" />
            <span className="font-mono font-semibold">{o.loom_number}</span>
          </div>
          <div className="flex items-center space-x-1.5 text-[11px] text-surface-500">
            <UserCheck className="w-3 h-3 text-textile-purple" />
            <span>{o.artisan_name}</span>
          </div>
        </div>
      ),
    },
    {
      header: 'Progress Meters',
      accessor: (o) => {
        const pct = o.target_quantity > 0 ? Math.min(100, Math.round((o.completed_quantity / o.target_quantity) * 100)) : 0;
        return (
          <div className="w-40 space-y-1.5">
            <div className="flex justify-between text-xs font-mono">
              <span className="font-semibold text-surface-800 dark:text-surface-200">{o.completed_quantity}m</span>
              <span className="text-surface-500">/ {o.target_quantity}m</span>
            </div>
            <div className="w-full bg-surface-100 dark:bg-surface-800 h-2 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-textile-purple to-textile-teal h-full rounded-full transition-all"
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="text-[10px] text-surface-500 block text-right font-medium">{pct}% done</span>
          </div>
        );
      },
    },
    {
      header: 'Timeline',
      accessor: (o) => (
        <div className="text-xs font-mono text-surface-600 dark:text-surface-400 space-y-0.5">
          <div>Start: {o.start_date || '—'}</div>
          <div>Target: {o.target_end_date || '—'}</div>
        </div>
      ),
    },
    {
      header: 'Status',
      accessor: (o) => <StatusBadge status={o.status} />,
    },
    {
      header: 'Notes',
      accessor: (o) => (
        <span className="text-xs text-surface-500 line-clamp-1 max-w-xs">
          {o.notes || 'Normal weaving schedule'}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <TextileHero
        title="Weaving Floor & Loom Production"
        subtitle="Live tracking of handloom weaving batches, daily yardage progress, artisan allocations, and target schedules."
        variant="indigo"
        badge="Loom Floor Operations"
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <Card className="flex items-center space-x-4 p-5">
          <div className="p-3 bg-textile-purple/10 text-textile-purple rounded-xl">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-surface-500">Active Batches</div>
            <div className="text-2xl font-bold font-mono text-surface-900 dark:text-surface-100">{orders.length}</div>
          </div>
        </Card>

        <Card className="flex items-center space-x-4 p-5">
          <div className="p-3 bg-teal-500/10 text-teal-600 rounded-xl">
            <Boxes className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-surface-500">Woven Yardage</div>
            <div className="text-2xl font-bold font-mono text-surface-900 dark:text-surface-100">
              {totalMetersCompleted.toLocaleString()} <span className="text-sm font-normal text-surface-500">/ {totalMetersTarget.toLocaleString()} m</span>
            </div>
          </div>
        </Card>

        <Card className="flex items-center space-x-4 p-5">
          <div className="p-3 bg-amber-500/10 text-amber-600 rounded-xl">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-surface-500">Floor Efficiency</div>
            <div className="text-2xl font-bold font-mono text-surface-900 dark:text-surface-100">
              {overallEfficiency}%
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
          emptyMessage="No active production orders found."
        />
      )}
    </div>
  );
}
