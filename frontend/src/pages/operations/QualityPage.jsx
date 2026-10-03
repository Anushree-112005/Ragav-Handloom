import React, { useState, useEffect } from 'react';
import { ShieldCheck, CheckCircle2, AlertOctagon, UserCheck, Calendar, Award } from 'lucide-react';
import { operationsService } from '../../services/operationalServices';
import { useToast } from '../../context/ToastContext';
import Table from '../../components/common/Table';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';
import Card from '../../components/common/Card';
import TextileHero from '../../components/common/TextileHero';

export default function QualityPage() {
  const [inspections, setInspections] = useState([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  const fetchQuality = async () => {
    setLoading(true);
    try {
      const data = await operationsService.getQuality();
      setInspections(data || []);
    } catch (err) {
      toast.error('Failed to load quality inspections: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuality();
  }, []);

  const passedCount = inspections.filter((i) => i.status === 'PASSED' || i.fabric_grade === 'GRADE_A').length;
  const passRate = inspections.length > 0 ? Math.round((passedCount / inspections.length) * 100) : 100;

  const renderGradeBadge = (grade) => {
    switch (grade) {
      case 'GRADE_A':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
            <Award className="w-3 h-3 mr-1 text-emerald-600" />
            Grade A (Export / Silk Mark)
          </span>
        );
      case 'GRADE_B':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
            Grade B (Domestic Market)
          </span>
        );
      case 'REJECT':
      case 'REJECTED':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300">
            <AlertOctagon className="w-3 h-3 mr-1 text-rose-600" />
            Defective / Seconds
          </span>
        );
      default:
        return <span className="text-xs text-surface-600 font-mono">{grade || 'Under Review'}</span>;
    }
  };

  const columns = [
    {
      header: 'Inspection Report',
      accessor: (q) => (
        <div>
          <span className="font-mono text-sm font-bold text-surface-900 dark:text-surface-100 block">
            {q.inspection_number}
          </span>
          <span className="text-xs text-surface-600 dark:text-surface-400 font-medium">
            {q.product_name}
          </span>
        </div>
      ),
    },
    {
      header: 'Quality Grade',
      accessor: (q) => renderGradeBadge(q.fabric_grade),
    },
    {
      header: 'Defects / Discrepancies',
      accessor: (q) => (
        <span className="text-xs text-surface-700 dark:text-surface-300 line-clamp-1 max-w-xs">
          {q.defects_found || 'Zero defects detected; warp tension uniform'}
        </span>
      ),
    },
    {
      header: 'QA Inspector',
      accessor: (q) => (
        <div className="flex items-center space-x-1 text-xs text-surface-800 dark:text-surface-200">
          <UserCheck className="w-3.5 h-3.5 text-textile-purple" />
          <span>{q.inspector_name}</span>
        </div>
      ),
    },
    {
      header: 'Audit Date',
      accessor: (q) => (
        <span className="font-mono text-xs text-surface-600 dark:text-surface-400">
          {q.inspection_date || '—'}
        </span>
      ),
    },
    {
      header: 'Inspection Status',
      accessor: (q) => <StatusBadge status={q.status} />,
    },
  ];

  return (
    <div className="space-y-6">
      <TextileHero
        title="Quality Control & Silk Mark Audits"
        subtitle="Verification of fabric GSM, warp/weft density, colorfastness, zari purity, and defect tagging."
        variant="teal"
        badge="Quality Assurance"
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <Card className="flex items-center space-x-4 p-5">
          <div className="p-3 bg-teal-500/10 text-teal-600 rounded-xl">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-surface-500">Audits Completed</div>
            <div className="text-2xl font-bold font-mono text-surface-900 dark:text-surface-100">{inspections.length}</div>
          </div>
        </Card>

        <Card className="flex items-center space-x-4 p-5">
          <div className="p-3 bg-emerald-500/10 text-emerald-600 rounded-xl">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-surface-500">First-Pass Yield</div>
            <div className="text-2xl font-bold font-mono text-surface-900 dark:text-surface-100">{passRate}%</div>
          </div>
        </Card>

        <Card className="flex items-center space-x-4 p-5">
          <div className="p-3 bg-amber-500/10 text-amber-600 rounded-xl">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-surface-500">Silk Mark Certified</div>
            <div className="text-2xl font-bold font-mono text-surface-900 dark:text-surface-100">{passedCount}</div>
          </div>
        </Card>
      </div>

      {/* Table */}
      {loading ? (
        <LoadingSkeleton type="table" rows={6} />
      ) : (
        <Table
          columns={columns}
          data={inspections}
          emptyMessage="No quality inspections logged."
        />
      )}
    </div>
  );
}
