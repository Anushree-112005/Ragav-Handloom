import React, { useState, useEffect } from 'react';
import {
  FileText, Download, Users, Package, Layers, UserCheck,
  Boxes, Building, ShoppingBag, CheckCircle, RefreshCw
} from 'lucide-react';
import { reportsService } from '../../services/operationalServices';
import { useToast } from '../../context/ToastContext';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import TextileHero from '../../components/common/TextileHero';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';

const REPORT_CARDS = [
  {
    id: 'users',
    title: 'Enterprise Users & Staff Directory',
    description: 'Complete user profiles, employee IDs, roles, department units, phone numbers, and last activity timestamps.',
    icon: Users,
    color: 'from-blue-600 to-indigo-700',
    countKey: 'user_reports.total_users',
    badge: 'Security & Access',
  },
  {
    id: 'products',
    title: 'Handloom Products Catalog & Margins',
    description: 'Finished handloom sarees, yardages, cost pricing, retail selling prices, gross margins, and fabric links.',
    icon: Package,
    color: 'from-amber-500 to-orange-600',
    countKey: 'master_reports.products',
    badge: 'Merchandising',
  },
  {
    id: 'fabrics',
    title: 'Fabric Specifications & Weave Roster',
    description: 'Weave types, GSM density, silk/cotton compositions, reed widths, dyed shade names, and supplier references.',
    icon: Layers,
    color: 'from-indigo-600 to-purple-700',
    countKey: 'master_reports.fabrics',
    badge: 'Manufacturing',
  },
  {
    id: 'artisans',
    title: 'Artisans & Master Weavers Guild',
    description: 'Master weaver names, craft specialization, years of heritage experience, weaving clusters, and contact info.',
    icon: UserCheck,
    color: 'from-cyan-600 to-blue-600',
    countKey: 'master_reports.artisans',
    badge: 'Workforce',
  },
  {
    id: 'looms',
    title: 'Looms Machinery & Maintenance Log',
    description: 'Pit looms, frame looms, Jacquards, plant locations, daily meter capacity ratings, and service histories.',
    icon: Boxes,
    color: 'from-amber-600 to-yellow-600',
    countKey: 'master_reports.looms',
    badge: 'Equipment',
  },
  {
    id: 'suppliers',
    title: 'Raw Material Suppliers & GST Registry',
    description: 'Silk yarn reelers, cotton farmers, metallic zari traders, contact details, GSTIN compliance, and payment terms.',
    icon: Building,
    color: 'from-emerald-600 to-green-700',
    countKey: 'master_reports.suppliers',
    badge: 'Procurement',
  },
  {
    id: 'customers',
    title: 'B2B Customers & Wholesale Buyers',
    description: 'Textile houses, designer boutiques, credit limits, authorized contact persons, and billing GST numbers.',
    icon: ShoppingBag,
    color: 'from-rose-500 to-red-600',
    countKey: 'master_reports.customers',
    badge: 'Sales',
  },
];

export default function ReportsPage() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exportingId, setExportingId] = useState(null);
  const toast = useToast();

  const fetchSummary = async () => {
    setLoading(true);
    try {
      const data = await reportsService.getSummary();
      setSummary(data);
    } catch (err) {
      toast.error('Failed to load reports summary: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  const handleExport = async (reportId, title) => {
    setExportingId(reportId);
    try {
      await reportsService.downloadCsv(reportId);
      toast.success(`Exported ${title} to CSV.`);
    } catch (err) {
      toast.error('Failed to export CSV: ' + err.message);
    } finally {
      setExportingId(null);
    }
  };

  const getNestedCount = (path) => {
    if (!summary) return '...';
    const parts = path.split('.');
    return summary[parts[0]]?.[parts[1]] ?? 0;
  };

  return (
    <div className="space-y-6">
      <TextileHero
        title="Reports & Data Export Center"
        subtitle="Generate formatted CSV audit reports, enterprise rosters, production catalogs, and GST compliance logs."
        variant="purple"
        badge="Analytics & Export"
        actions={
          <Button
            variant="secondary"
            icon={RefreshCw}
            onClick={fetchSummary}
            className="text-xs bg-white/10 hover:bg-white/20 text-white border-white/20 backdrop-blur-sm"
          >
            Refresh Counts
          </Button>
        }
      />

      {/* Grid of Report Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {REPORT_CARDS.map((card) => {
          const Icon = card.icon;
          const count = getNestedCount(card.countKey);
          const isExporting = exportingId === card.id;

          return (
            <Card
              key={card.id}
              className="flex flex-col justify-between hover:shadow-lg transition-all duration-200 border-border/80 hover:border-textile-purple/30"
            >
              <div>
                <div className="flex items-start justify-between mb-3">
                  <div className={`p-2.5 rounded-xl bg-gradient-to-br ${card.color} text-white shadow-sm`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-surface-100 text-surface-600 dark:bg-surface-800 dark:text-surface-400">
                      {card.badge}
                    </span>
                    <span className="font-mono text-sm font-bold px-2 py-0.5 rounded-lg bg-textile-purple/10 text-textile-purple dark:bg-textile-purple/20">
                      {count} records
                    </span>
                  </div>
                </div>

                <h3 className="font-semibold text-base text-surface-900 dark:text-surface-100 mb-1">
                  {card.title}
                </h3>
                <p className="text-xs text-surface-500 dark:text-surface-400 leading-relaxed">
                  {card.description}
                </p>
              </div>

              <div className="mt-5 pt-3 border-t border-border/60 flex items-center justify-between">
                <span className="text-[11px] text-surface-400 font-mono">Format: .CSV</span>
                <Button
                  variant="primary"
                  size="sm"
                  icon={Download}
                  loading={isExporting}
                  onClick={() => handleExport(card.id, card.title)}
                >
                  {isExporting ? 'Exporting...' : 'Export CSV'}
                </Button>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
