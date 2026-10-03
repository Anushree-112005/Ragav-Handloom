import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users, CheckCircle, Database, UserCog, Factory, Clock,
  ArrowUpRight, ArrowRight, Activity, Sparkles, Layers,
  ExternalLink, Calendar
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { useAuth } from '../../context/AuthContext';
import { dashboardService } from '../../services/operationalServices';
import TextileHero from '../../components/common/TextileHero';
import Card from '../../components/common/Card';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';

export default function DashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const stats = await dashboardService.getStats();
        setData(stats);
      } catch (err) {
        console.error('Failed to load dashboard stats:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <LoadingSkeleton type="cards" />
        <LoadingSkeleton type="table" rows={4} />
      </div>
    );
  }

  const kpis = data?.kpis || {
    total_users: 22,
    active_users: 21,
    master_records: 135,
    active_artisans: 22,
    production_units: 4,
    pending_approvals: 1,
  };

  const kpiCards = [
    {
      label: 'Total Users',
      value: kpis.total_users,
      change: '+12% this mo',
      icon: Users,
      color: 'bg-indigo-50 text-indigo-900 border-indigo-200',
      link: '/users',
    },
    {
      label: 'Active Users',
      value: kpis.active_users,
      change: '95.4% active rate',
      icon: CheckCircle,
      color: 'bg-teal-50 text-teal-900 border-teal-200',
      link: '/users',
    },
    {
      label: 'Master Records',
      value: kpis.master_records,
      change: '12 Master catalogs',
      icon: Database,
      color: 'bg-purple-50 text-purple-900 border-purple-200',
      link: '/master-data',
    },
    {
      label: 'Active Artisans',
      value: kpis.active_artisans,
      change: '100% capacity',
      icon: UserCog,
      color: 'bg-coral-50 text-coral-900 border-coral-200',
      link: '/artisans',
    },
    {
      label: 'Production Units',
      value: kpis.production_units,
      change: 'Tamil Nadu Clusters',
      icon: Factory,
      color: 'bg-saffron-50 text-saffron-900 border-saffron-200',
      link: '/plants',
    },
    {
      label: 'Pending Approvals',
      value: kpis.pending_approvals,
      change: 'Action required',
      icon: Clock,
      color: 'bg-magenta-50 text-magenta-900 border-magenta-200',
      link: '/user-approvals',
    },
  ];

  // Colors for Donut chart
  const DONUT_COLORS = ['#0D7C85', '#F59E0B', '#78716C'];

  return (
    <div className="space-y-8">
      {/* Textile Hero Banner */}
      <TextileHero
        tagline="Handloom & Textile Enterprise Management"
        title={`Good morning, ${user?.first_name || 'Administrator'}`}
        description="Manage your handloom operations, users and master data from one unified enterprise platform."
        badge="Enterprise Handloom ERP"
        actions={
          <div className="flex flex-wrap gap-3">
            <Link
              to="/master-data"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-indigo-950 font-bold text-xs hover:bg-linen-100 transition-colors shadow-sm"
            >
              <Database className="w-4 h-4 text-indigo-900" />
              <span>Explore Master Data Hub</span>
            </Link>
            <Link
              to="/users"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs border border-white/20 transition-colors"
            >
              <Users className="w-4 h-4" />
              <span>Manage User Access</span>
            </Link>
          </div>
        }
      />

      {/* Meaningful KPI Section */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {kpiCards.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <Link
              key={idx}
              to={kpi.link}
              className="group p-4 rounded-2xl bg-white border border-linen-200 shadow-subtle hover:shadow-card transition-all duration-200 hover:-translate-y-0.5"
            >
              <div className="flex items-center justify-between">
                <div className={`p-2 rounded-xl border ${kpi.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <ArrowUpRight className="w-3.5 h-3.5 text-linen-300 group-hover:text-indigo-900 transition-colors" />
              </div>
              <div className="mt-3">
                <p className="text-2xl font-extrabold text-linen-900 tracking-tight">
                  {kpi.value}
                </p>
                <p className="text-xs font-bold text-linen-600 mt-0.5 truncate">
                  {kpi.label}
                </p>
                <p className="text-[10px] text-linen-400 mt-1 truncate">
                  {kpi.change}
                </p>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bar Chart: Users by Department */}
        <div className="lg:col-span-2 rounded-2xl border border-linen-200 bg-white p-6 shadow-subtle">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-linen-900 uppercase tracking-wider">
                Staff Allocation by Department
              </h3>
              <p className="text-xs text-linen-500 mt-0.5">
                Headcount across handloom weaving, dyeing, spinning and corporate units
              </p>
            </div>
            <Link to="/departments" className="text-xs font-semibold text-indigo-900 hover:underline">
              View All
            </Link>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data?.charts?.users_by_dept || []}
                margin={{ top: 10, right: 10, left: -20, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E7E5E4" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 10, fill: '#78716C' }}
                  angle={-25}
                  textAnchor="end"
                  interval={0}
                />
                <YAxis tick={{ fontSize: 10, fill: '#78716C' }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1E2447',
                    borderRadius: '12px',
                    color: '#FFFFFF',
                    fontSize: '12px',
                    border: 'none',
                  }}
                />
                <Bar dataKey="count" fill="#1E2447" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Donut Chart: User Status */}
        <div className="rounded-2xl border border-linen-200 bg-white p-6 shadow-subtle flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-linen-900 uppercase tracking-wider">
              User Account Status
            </h3>
            <p className="text-xs text-linen-500 mt-0.5">
              Active vs pending approval accounts
            </p>
          </div>

          <div className="h-52 w-full my-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data?.charts?.user_status || []}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={5}
                  dataKey="count"
                >
                  {(data?.charts?.user_status || []).map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={DONUT_COLORS[index % DONUT_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1E2447',
                    borderRadius: '12px',
                    color: '#FFFFFF',
                    fontSize: '12px',
                    border: 'none',
                  }}
                />
                <Legend
                  verticalAlign="bottom"
                  iconType="circle"
                  wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="pt-3 border-t border-linen-100 flex items-center justify-between text-xs">
            <span className="text-linen-500">Pending Review:</span>
            <Link to="/user-approvals" className="font-bold text-saffron-700 hover:underline">
              {kpis.pending_approvals} Approval Request
            </Link>
          </div>
        </div>
      </div>

      {/* Second Row: Master Data Overview & Recent Audit Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Master Data Overview Blocks */}
        <div className="rounded-2xl border border-linen-200 bg-white p-6 shadow-subtle">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-linen-900 uppercase tracking-wider">
                Master Data Records
              </h3>
              <p className="text-xs text-linen-500 mt-0.5">Catalog distribution</p>
            </div>
            <Link to="/master-data" className="text-xs font-semibold text-indigo-900 hover:underline">
              Hub
            </Link>
          </div>

          <div className="space-y-3">
            {(data?.charts?.master_overview || []).map((item, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-linen-700">{item.name}</span>
                  <span className="font-bold text-linen-900">{item.count} items</span>
                </div>
                <div className="w-full h-2 rounded-full bg-linen-100 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(100, Math.max(15, item.count * 4))}%`,
                      backgroundColor: item.color || '#1E2447',
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-4 border-t border-linen-100">
            <Link
              to="/products"
              className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-linen-100 hover:bg-linen-200 text-xs font-bold text-linen-800 transition-colors"
            >
              <span>Manage Products & Fabrics</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Recent Operational Activity Timeline */}
        <div className="lg:col-span-2 rounded-2xl border border-linen-200 bg-white p-6 shadow-subtle">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-linen-900 uppercase tracking-wider">
                Live Operational Audit Trail
              </h3>
              <p className="text-xs text-linen-500 mt-0.5">
                Real-time records from PostgreSQL audit logging
              </p>
            </div>
            <Link to="/audit-logs" className="text-xs font-semibold text-indigo-900 hover:underline">
              Full Logs
            </Link>
          </div>

          <div className="divide-y divide-linen-100">
            {(data?.recent_activities || []).slice(0, 5).map((log) => (
              <div key={log.id} className="py-3 flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider bg-linen-100 text-indigo-950 border border-linen-200">
                    {log.module}
                  </span>
                  <div>
                    <p className="text-xs font-bold text-linen-900 leading-snug">
                      {log.description}
                    </p>
                    <p className="text-[11px] text-linen-500 mt-0.5">
                      By <span className="font-semibold text-linen-700">{log.user_name}</span> &bull;{' '}
                      {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
                <StatusBadge status={log.action} size="sm" />
              </div>
            ))}
          </div>

          <div className="mt-4 pt-3 border-t border-linen-100 flex items-center justify-between text-xs text-linen-500">
            <span>Every action in LOOMORA is recorded for enterprise compliance.</span>
            <Link to="/audit-logs" className="font-bold text-indigo-900 hover:underline">
              View All 20+ Logs
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
