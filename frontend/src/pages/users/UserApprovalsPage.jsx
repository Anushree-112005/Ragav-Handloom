import React, { useState, useEffect } from 'react';
import { UserCheck, Check, X, Clock, MessageSquare } from 'lucide-react';
import { auditService } from '../../services/adminServices';
import { useToast } from '../../context/ToastContext';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import StatusBadge from '../../components/common/StatusBadge';
import Modal from '../../components/common/Modal';
import Input from '../../components/common/Input';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';
import EmptyState from '../../components/common/EmptyState';
import UserManagementHeader from '../../components/common/UserManagementHeader';

export default function UserApprovalsPage() {
  const [approvals, setApprovals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Decision Modal
  const [decisionModalOpen, setDecisionModalOpen] = useState(false);
  const [selectedApproval, setSelectedApproval] = useState(null);
  const [decisionAction, setDecisionAction] = useState('APPROVE');
  const [decisionNotes, setDecisionNotes] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const toast = useToast();

  const fetchApprovals = async () => {
    setLoading(true);
    try {
      const data = await auditService.getUserApprovals({
        status: statusFilter === 'ALL' ? undefined : statusFilter,
      });
      setApprovals(data);
    } catch (err) {
      toast.error('Failed to load user approvals: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApprovals();
  }, [statusFilter]);

  const handleOpenDecision = (appr, action) => {
    setSelectedApproval(appr);
    setDecisionAction(action);
    setDecisionNotes(action === 'APPROVE' ? 'Approved user onboarding.' : 'Access denied.');
    setDecisionModalOpen(true);
  };

  const handleConfirmDecision = async (e) => {
    e.preventDefault();
    if (!selectedApproval) return;
    setActionLoading(true);
    try {
      await auditService.decideApproval(selectedApproval.id, decisionAction, decisionNotes);
      toast.success(
        `User request ${decisionAction.toLowerCase()}d successfully.`
      );
      setDecisionModalOpen(false);
      fetchApprovals();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const columns = [
    { header: 'Requested User', width: 'w-56' },
    { header: 'Department', width: 'w-36' },
    { header: 'Requested Role', width: 'w-44' },
    { header: 'Requested Plant', width: 'w-44' },
    { header: 'Requested By', width: 'w-44' },
    { header: 'Date', width: 'w-32' },
    { header: 'Status', width: 'w-28' },
    { header: 'Actions', width: 'w-36', align: 'right' },
  ];

  return (
    <div className="space-y-6">
      {/* Unified User Management Header & Tabs */}
      <UserManagementHeader
        title="User Access Approvals"
        subtitle="Review and approve pending access requests, plant allocations, and role elevations."
      >
        <div className="flex items-center gap-1.5 p-1 bg-white border border-linen-200 rounded-xl shadow-subtle dark:bg-gray-800 dark:border-gray-700">
          {['ALL', 'PENDING', 'APPROVED', 'REJECTED'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                statusFilter === st
                  ? 'bg-indigo-900 text-white shadow-xs dark:bg-indigo-600'
                  : 'text-linen-600 hover:text-linen-900 dark:text-gray-400 dark:hover:text-gray-200'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </UserManagementHeader>

      {loading ? (
        <LoadingSkeleton type="table" rows={4} />
      ) : approvals.length === 0 ? (
        <EmptyState
          icon={UserCheck}
          title="No approval requests found"
          description="There are currently no user access requests in this status."
        />
      ) : (
        <Table columns={columns}>
          {approvals.map((a) => (
            <tr key={a.id} className="table-row-hover">
              <td className="py-3.5 px-4">
                <p className="font-bold text-linen-900 text-xs">{a.user_name}</p>
                <p className="text-[11px] text-linen-500">{a.user_email}</p>
              </td>

              <td className="py-3.5 px-4 text-xs text-linen-700">
                {a.department_name || 'General'}
              </td>

              <td className="py-3.5 px-4">
                <span className="inline-block px-2 py-0.5 rounded text-xs font-bold bg-indigo-50 text-indigo-900">
                  {a.requested_role_name || 'Operator'}
                </span>
              </td>

              <td className="py-3.5 px-4 text-xs text-linen-600">
                {a.requested_plant_name || 'Global'}
              </td>

              <td className="py-3.5 px-4 text-xs text-linen-700">
                {a.requested_by}
              </td>

              <td className="py-3.5 px-4 text-xs text-linen-500 font-medium">
                {new Date(a.created_at).toLocaleDateString()}
              </td>

              <td className="py-3.5 px-4">
                <StatusBadge status={a.status} size="sm" />
              </td>

              <td className="py-3.5 px-4 text-right">
                {a.status === 'PENDING' ? (
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="teal"
                      size="xs"
                      icon={Check}
                      onClick={() => handleOpenDecision(a, 'APPROVE')}
                    >
                      Approve
                    </Button>
                    <Button
                      variant="danger"
                      size="xs"
                      icon={X}
                      onClick={() => handleOpenDecision(a, 'REJECT')}
                    >
                      Reject
                    </Button>
                  </div>
                ) : (
                  <span className="text-[11px] text-linen-400 italic">
                    Decided by {a.decided_by || 'Admin'}
                  </span>
                )}
              </td>
            </tr>
          ))}
        </Table>
      )}

      {/* Decision Dialog Modal */}
      <Modal
        isOpen={decisionModalOpen}
        onClose={() => setDecisionModalOpen(false)}
        title={`${decisionAction === 'APPROVE' ? 'Approve' : 'Reject'} Request`}
        subtitle={`User: ${selectedApproval?.user_name} (${selectedApproval?.requested_role_name})`}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleConfirmDecision} className="space-y-4">
          <Input
            label="Decision Notes / Remarks"
            required
            value={decisionNotes}
            onChange={(e) => setDecisionNotes(e.target.value)}
            placeholder="Provide context or authorization notes..."
          />

          <div className="flex justify-end gap-2 pt-3 border-t border-linen-100">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDecisionModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant={decisionAction === 'APPROVE' ? 'teal' : 'danger'}
              size="sm"
              loading={actionLoading}
            >
              Confirm {decisionAction}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
