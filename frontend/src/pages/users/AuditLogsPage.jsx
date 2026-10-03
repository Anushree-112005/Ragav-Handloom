import React, { useState, useEffect } from 'react';
import { FileText, Filter, RefreshCw, Download } from 'lucide-react';
import { auditService } from '../../services/adminServices';
import { useToast } from '../../context/ToastContext';
import Table from '../../components/common/Table';
import Pagination from '../../components/common/Pagination';
import SearchInput from '../../components/common/SearchInput';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';
import UserManagementHeader from '../../components/common/UserManagementHeader';

export default function AuditLogsPage() {
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [moduleFilter, setModuleFilter] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [loading, setLoading] = useState(true);

  const toast = useToast();

  const modules = [
    'USERS', 'ROLES', 'DEPARTMENTS', 'PLANTS', 'PRODUCTS',
    'FABRICS', 'YARNS', 'COLOURS', 'DESIGNS', 'LOOMS',
    'ARTISANS', 'SUPPLIERS', 'CUSTOMERS', 'WAREHOUSES', 'UOM',
    'TAX_RATES', 'PRODUCTION', 'QUALITY', 'AUTH'
  ];

  const actions = ['CREATE', 'UPDATE', 'DELETE', 'DEACTIVATE', 'APPROVE', 'REJECT', 'LOGIN', 'LOGOUT'];

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const data = await auditService.getAuditLogs({
        search,
        module: moduleFilter || undefined,
        action: actionFilter || undefined,
        page,
        page_size: pageSize,
      });
      setLogs(data.items);
      setTotal(data.total);
      setTotalPages(data.total_pages);
    } catch (err) {
      toast.error('Failed to load audit logs: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [search, moduleFilter, actionFilter, page, pageSize]);

  const columns = [
    { header: 'Timestamp', width: 'w-44' },
    { header: 'User', width: 'w-40' },
    { header: 'Module', width: 'w-32' },
    { header: 'Action', width: 'w-28' },
    { header: 'Target Record', width: 'w-44' },
    { header: 'Audit Description', width: 'w-80' },
    { header: 'Status', width: 'w-24', align: 'right' },
  ];

  return (
    <div className="space-y-6">
      {/* Unified User Management Header & Tabs */}
      <UserManagementHeader
        title="System Audit Trail"
        subtitle="Tamper-evident logs of all data modifications, user creations, and operational state changes."
      />

      <div className="p-4 rounded-2xl bg-white border border-linen-200 shadow-subtle grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search by description, record or user..."
        />

        <select
          value={moduleFilter}
          onChange={(e) => setModuleFilter(e.target.value)}
          className="rounded-xl border border-linen-300 text-xs px-3 py-2 bg-white text-linen-800 focus:outline-none focus:ring-2 focus:ring-indigo-100"
        >
          <option value="">All Modules</option>
          {modules.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>

        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="rounded-xl border border-linen-300 text-xs px-3 py-2 bg-white text-linen-800 focus:outline-none focus:ring-2 focus:ring-indigo-100"
        >
          <option value="">All Actions</option>
          {actions.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchLogs}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl border border-linen-300 hover:bg-linen-100 text-xs font-semibold text-linen-700 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5 text-linen-500" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {loading ? (
        <LoadingSkeleton type="table" rows={8} />
      ) : (
        <>
          <Table columns={columns}>
            {logs.map((l) => (
              <tr key={l.id} className="table-row-hover">
                <td className="py-3.5 px-4 text-xs text-linen-600 font-medium">
                  {new Date(l.created_at).toLocaleString()}
                </td>

                <td className="py-3.5 px-4 text-xs font-bold text-linen-900">
                  {l.user_name}
                </td>

                <td className="py-3.5 px-4">
                  <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-linen-100 text-indigo-950 border border-linen-200">
                    {l.module}
                  </span>
                </td>

                <td className="py-3.5 px-4">
                  <StatusBadge status={l.action} size="sm" />
                </td>

                <td className="py-3.5 px-4 text-xs font-semibold text-linen-800">
                  {l.record_title || l.record_id || '—'}
                </td>

                <td className="py-3.5 px-4 text-xs text-linen-700 leading-relaxed">
                  {l.description}
                </td>

                <td className="py-3.5 px-4 text-right">
                  <StatusBadge status={l.status} size="sm" />
                </td>
              </tr>
            ))}
          </Table>

          <Pagination
            currentPage={page}
            totalPages={totalPages}
            totalItems={total}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
          />
        </>
      )}
    </div>
  );
}
