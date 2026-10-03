import React, { useState, useEffect } from 'react';
import { History, Laptop, Smartphone, Search, RefreshCw } from 'lucide-react';
import { auditService } from '../../services/adminServices';
import { useToast } from '../../context/ToastContext';
import Table from '../../components/common/Table';
import Pagination from '../../components/common/Pagination';
import SearchInput from '../../components/common/SearchInput';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';
import UserManagementHeader from '../../components/common/UserManagementHeader';

export default function LoginActivityPage() {
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);

  const toast = useToast();

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const data = await auditService.getLoginActivity({
        search,
        status: statusFilter || undefined,
        page,
        page_size: pageSize,
      });
      setLogs(data.items);
      setTotal(data.total);
      setTotalPages(data.total_pages);
    } catch (err) {
      toast.error('Failed to load login history: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [search, statusFilter, page, pageSize]);

  const columns = [
    { header: 'Account / User', width: 'w-56' },
    { header: 'Login Timestamp', width: 'w-44' },
    { header: 'IP Address', width: 'w-36' },
    { header: 'Device / Client', width: 'w-44' },
    { header: 'Browser', width: 'w-36' },
    { header: 'Status', width: 'w-28' },
    { header: 'Failure Notes', width: 'w-48' },
  ];

  return (
    <div className="space-y-6">
      {/* Unified User Management Header & Tabs */}
      <UserManagementHeader
        title="Login Activity & Access Auditing"
        subtitle="Historical log of user authentications, IP origins, operating devices, and failure reasons."
      />

      <div className="p-4 rounded-2xl bg-white border border-linen-200 shadow-subtle flex flex-col sm:flex-row items-center gap-3">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Filter by email, IP or device..."
          className="flex-1"
        />

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-xl border border-linen-300 text-xs px-3 py-2 bg-white text-linen-800 focus:outline-none focus:ring-2 focus:ring-indigo-100"
        >
          <option value="">All Statuses</option>
          <option value="SUCCESS">Successful Logins</option>
          <option value="FAILED">Failed Attempts</option>
        </select>

        <button
          type="button"
          onClick={fetchLogs}
          title="Refresh login logs"
          className="p-2 rounded-xl border border-linen-200 hover:bg-linen-100 text-linen-500 hover:text-indigo-900 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {loading ? (
        <LoadingSkeleton type="table" rows={6} />
      ) : (
        <>
          <Table columns={columns}>
            {logs.map((log) => (
              <tr key={log.id} className="table-row-hover">
                <td className="py-3.5 px-4 font-bold text-xs text-linen-900">
                  {log.email}
                </td>

                <td className="py-3.5 px-4 text-xs text-linen-600 font-medium">
                  {new Date(log.login_time).toLocaleString()}
                </td>

                <td className="py-3.5 px-4 text-xs font-mono text-linen-700">
                  {log.ip_address}
                </td>

                <td className="py-3.5 px-4 text-xs text-linen-800">
                  <div className="flex items-center gap-1.5">
                    {log.device.includes('Mobile') ? (
                      <Smartphone className="w-3.5 h-3.5 text-linen-400" />
                    ) : (
                      <Laptop className="w-3.5 h-3.5 text-linen-400" />
                    )}
                    <span>{log.device}</span>
                  </div>
                </td>

                <td className="py-3.5 px-4 text-xs text-linen-600">
                  {log.browser}
                </td>

                <td className="py-3.5 px-4">
                  <StatusBadge status={log.status} size="sm" />
                </td>

                <td className="py-3.5 px-4 text-xs text-linen-500 italic">
                  {log.failure_reason || '—'}
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
