import React, { useState, useEffect } from 'react';
import { Package, AlertTriangle, CheckCircle, Home, Layers, Search, Filter } from 'lucide-react';
import { operationsService } from '../../services/operationalServices';
import { useToast } from '../../context/ToastContext';
import Table from '../../components/common/Table';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';
import Card from '../../components/common/Card';
import TextileHero from '../../components/common/TextileHero';

export default function InventoryPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const toast = useToast();

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const data = await operationsService.getInventory();
      setItems(data || []);
    } catch (err) {
      toast.error('Failed to load inventory stocks: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const filteredItems = items.filter((i) =>
    i.item_name?.toLowerCase().includes(search.toLowerCase()) ||
    i.item_code?.toLowerCase().includes(search.toLowerCase()) ||
    i.warehouse_name?.toLowerCase().includes(search.toLowerCase())
  );

  const lowStockCount = items.filter((i) => (i.quantity_on_hand || 0) <= (i.min_reorder_level || 0)).length;

  const columns = [
    {
      header: 'Item & Batch',
      accessor: (i) => (
        <div>
          <span className="font-semibold text-surface-900 dark:text-surface-100 block text-sm">
            {i.item_name}
          </span>
          <div className="flex items-center space-x-2 text-xs text-surface-500 font-mono">
            <span>{i.item_code}</span>
            {i.batch_number && <span>• Batch: {i.batch_number}</span>}
          </div>
        </div>
      ),
    },
    {
      header: 'Category',
      accessor: (i) => (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300">
          {i.category}
        </span>
      ),
    },
    {
      header: 'Warehouse Godown',
      accessor: (i) => (
        <div className="flex items-center space-x-1.5 text-xs text-surface-800 dark:text-surface-200">
          <Home className="w-3.5 h-3.5 text-violet-600" />
          <span>{i.warehouse_name}</span>
        </div>
      ),
    },
    {
      header: 'Current Stock',
      accessor: (i) => {
        const isLow = (i.quantity_on_hand || 0) <= (i.min_reorder_level || 0);
        return (
          <div className="space-y-0.5">
            <span className={`font-mono text-sm font-bold block ${isLow ? 'text-rose-600' : 'text-surface-900 dark:text-surface-100'}`}>
              {i.quantity_on_hand} {i.unit_of_measure}
            </span>
            <span className="text-[11px] text-surface-500 font-mono">
              Min Reorder: {i.min_reorder_level} {i.unit_of_measure}
            </span>
          </div>
        );
      },
    },
    {
      header: 'Stock Health',
      accessor: (i) => {
        const isLow = (i.quantity_on_hand || 0) <= (i.min_reorder_level || 0);
        return isLow ? (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">
            <AlertTriangle className="w-3 h-3 mr-1 text-rose-500" />
            Reorder Needed
          </span>
        ) : (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
            <CheckCircle className="w-3 h-3 mr-1 text-emerald-500" />
            Adequate
          </span>
        );
      },
    },
    {
      header: 'Status',
      accessor: (i) => <StatusBadge status={i.status} />,
    },
  ];

  return (
    <div className="space-y-6">
      <TextileHero
        title="Inventory & Raw Materials Stock"
        subtitle="Real-time stock valuation and level tracking across silk yarn godowns, dye warehouses, and finished textile depots."
        variant="purple"
        badge="Stock & Godown Balances"
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <Card className="flex items-center space-x-4 p-5">
          <div className="p-3 bg-textile-purple/10 text-textile-purple rounded-xl">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-surface-500">Tracked SKUs</div>
            <div className="text-2xl font-bold font-mono text-surface-900 dark:text-surface-100">{items.length}</div>
          </div>
        </Card>

        <Card className="flex items-center space-x-4 p-5">
          <div className="p-3 bg-rose-500/10 text-rose-600 rounded-xl">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-surface-500">Low Stock Warnings</div>
            <div className="text-2xl font-bold font-mono text-surface-900 dark:text-surface-100">{lowStockCount}</div>
          </div>
        </Card>

        <Card className="flex items-center space-x-4 p-5">
          <div className="p-3 bg-emerald-500/10 text-emerald-600 rounded-xl">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-surface-500">Fulfillment Status</div>
            <div className="text-2xl font-bold font-mono text-surface-900 dark:text-surface-100">
              {items.length > 0 ? `${Math.round(((items.length - lowStockCount) / items.length) * 100)}%` : '100%'}
            </div>
          </div>
        </Card>
      </div>

      {/* Search Bar */}
      <div className="bg-surface-0 dark:bg-surface-900 p-4 rounded-xl border border-border flex items-center justify-between shadow-sm">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
          <input
            type="text"
            placeholder="Search stock code, item name, warehouse..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-surface-50 dark:bg-surface-800 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-textile-purple/30"
          />
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <LoadingSkeleton type="table" rows={6} />
      ) : (
        <Table
          columns={columns}
          data={filteredItems}
          emptyMessage="No inventory items found matching the search."
        />
      )}
    </div>
  );
}
