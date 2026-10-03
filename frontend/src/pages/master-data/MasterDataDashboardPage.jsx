import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Layers, Package, Palette, Sparkles, Scissors, UserCheck,
  Building, Users, Home, Ruler, Percent, ArrowRight, Plus,
  Boxes, RefreshCw
} from 'lucide-react';
import { masterDataHubService } from '../../services/masterDataService';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';
import TextileHero from '../../components/common/TextileHero';

const MASTER_MODULES = [
  {
    id: 'products',
    title: 'Products Master',
    description: 'Catalog of finished handloom goods, sarees, dhotis, yardage, and pricing.',
    icon: Package,
    href: '/master-data/products',
    color: 'from-amber-500 to-orange-600',
    countKey: 'products',
    tag: 'Catalog',
  },
  {
    id: 'fabrics',
    title: 'Fabrics Master',
    description: 'Specifications of woven fabrics, weaves, GSM, compositions, and yardage widths.',
    icon: Layers,
    href: '/master-data/fabrics',
    color: 'from-indigo-600 to-purple-700',
    countKey: 'fabrics',
    tag: 'Materials',
  },
  {
    id: 'yarns',
    title: 'Yarns Master',
    description: 'Yarn counts, fiber composition, filament types, and raw spinning materials.',
    icon: Scissors,
    href: '/master-data/yarns',
    color: 'from-purple-600 to-pink-600',
    countKey: 'yarns',
    tag: 'Materials',
  },
  {
    id: 'colours',
    title: 'Colours & Dyes',
    description: 'Shade palette, hex color codes, natural and synthetic dyeing recipes.',
    icon: Palette,
    href: '/master-data/colours',
    color: 'from-teal-600 to-emerald-600',
    countKey: 'colours',
    tag: 'Finishing',
  },
  {
    id: 'designs',
    title: 'Designs & Motifs',
    description: 'Traditional patterns, Jacquard punch cards, temple borders, and collections.',
    icon: Sparkles,
    href: '/master-data/designs',
    color: 'from-rose-500 to-red-600',
    countKey: 'designs',
    tag: 'Design',
  },
  {
    id: 'looms',
    title: 'Looms Master',
    description: 'Pit looms, frame looms, Jacquards, daily meter capacities, and maintenance.',
    icon: Boxes,
    href: '/master-data/looms',
    color: 'from-amber-600 to-yellow-600',
    countKey: 'looms',
    tag: 'Machinery',
  },
  {
    id: 'artisans',
    title: 'Artisans & Weavers',
    description: 'Master weavers, traditional craft skill ratings, experience, and loom linkages.',
    icon: UserCheck,
    href: '/master-data/artisans',
    color: 'from-cyan-600 to-blue-600',
    countKey: 'artisans',
    tag: 'Workforce',
  },
  {
    id: 'suppliers',
    title: 'Suppliers Master',
    description: 'Raw silk vendors, organic cotton suppliers, Zari dealers, and credit terms.',
    icon: Building,
    href: '/master-data/suppliers',
    color: 'from-emerald-600 to-green-700',
    countKey: 'suppliers',
    tag: 'Procurement',
  },
  {
    id: 'customers',
    title: 'Customers Master',
    description: 'Wholesale textile houses, boutique designers, retail chains, and export buyers.',
    icon: Users,
    href: '/master-data/customers',
    color: 'from-blue-600 to-indigo-700',
    countKey: 'customers',
    tag: 'Sales',
  },
  {
    id: 'warehouses',
    title: 'Warehouses Master',
    description: 'Raw yarn godowns, finished textile warehouses, and storage depots.',
    icon: Home,
    href: '/master-data/warehouses',
    color: 'from-violet-600 to-purple-800',
    countKey: 'warehouses',
    tag: 'Logistics',
  },
  {
    id: 'uom',
    title: 'Units of Measure (UOM)',
    description: 'Meters, kilograms, pieces, yards, than, and square feet conversions.',
    icon: Ruler,
    href: '/master-data/uom',
    color: 'from-slate-600 to-gray-700',
    countKey: 'uom',
    tag: 'Standard',
  },
  {
    id: 'tax-rates',
    title: 'Tax & GST Rates',
    description: 'Textile GST slabs (5%, 12%, 18%), HSN codes (5007, 5208), and categories.',
    icon: Percent,
    href: '/master-data/tax-rates',
    color: 'from-rose-600 to-pink-700',
    countKey: 'tax_rates',
    tag: 'Compliance',
  },
];

export default function MasterDataDashboardPage() {
  const [counts, setCounts] = useState({});
  const [loading, setLoading] = useState(true);

  const fetchSummary = async () => {
    setLoading(true);
    try {
      const data = await masterDataHubService.getSummary();
      setCounts(data);
    } catch (err) {
      console.error('Failed to load master data summary:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  return (
    <div className="space-y-6">
      {/* Textile Banner */}
      <TextileHero
        title="Master Data Management Hub"
        subtitle="Centralized repository of textile standards, specifications, artisan profiles, equipment registries, and tax configurations for Loomora ERP."
        variant="purple"
        badge="Master Data Core"
        actions={
          <Button
            variant="secondary"
            icon={RefreshCw}
            onClick={fetchSummary}
            className="text-xs bg-white/10 hover:bg-white/20 text-white border-white/20 backdrop-blur-sm"
          >
            Refresh Records
          </Button>
        }
      />

      {/* Grid of 12 Master Entities */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {MASTER_MODULES.map((module) => {
          const Icon = module.icon;
          const count = counts[module.countKey] ?? (loading ? '...' : 0);

          return (
            <Card
              key={module.id}
              className="group hover:shadow-lg transition-all duration-200 border-border/80 hover:border-textile-purple/30 flex flex-col justify-between"
            >
              <div>
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className={`p-2.5 rounded-xl bg-gradient-to-br ${module.color} text-white shadow-sm`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full bg-surface-100 text-surface-600 dark:bg-surface-800 dark:text-surface-400">
                      {module.tag}
                    </span>
                    <span className="font-mono text-sm font-bold px-2 py-0.5 rounded-lg bg-textile-purple/10 text-textile-purple dark:bg-textile-purple/20">
                      {count}
                    </span>
                  </div>
                </div>

                {/* Title & Description */}
                <h3 className="font-semibold text-base text-surface-900 dark:text-surface-100 group-hover:text-textile-purple transition-colors">
                  {module.title}
                </h3>
                <p className="text-xs text-surface-500 dark:text-surface-400 mt-1 line-clamp-2 leading-relaxed">
                  {module.description}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="mt-4 pt-3 border-t border-border/60 flex items-center justify-between">
                <Link
                  to={module.href}
                  className="inline-flex items-center text-xs font-medium text-textile-purple hover:text-textile-purple-dark group-hover:underline space-x-1"
                >
                  <span>Manage Records</span>
                  <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                </Link>
                <Link
                  to={`${module.href}?action=new`}
                  className="p-1.5 rounded-lg text-surface-400 hover:text-textile-purple hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
                  title="Add New Record"
                >
                  <Plus className="w-4 h-4" />
                </Link>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
