import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, Mail, Phone, Building2, ShieldCheck, Factory,
  Calendar, Clock, Laptop, CheckCircle2, XCircle, FileText,
  User as UserIcon, Shield
} from 'lucide-react';
import { userService } from '../../services/userService';
import { useToast } from '../../context/ToastContext';
import Tabs from '../../components/common/Tabs';
import Card from '../../components/common/Card';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';
import Button from '../../components/common/Button';

export default function UserDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const fetchUser = async () => {
      setLoading(true);
      try {
        const data = await userService.getUserById(id);
        setUser(data);
      } catch (err) {
        toast.error('Failed to load user details: ' + err.message);
        navigate('/users');
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [id, navigate, toast]);

  if (loading) {
    return <LoadingSkeleton type="table" rows={6} />;
  }

  if (!user) return null;

  const tabs = [
    { id: 'overview', label: 'Overview', icon: UserIcon },
    { id: 'permissions', label: 'Role Permissions', icon: Shield, count: user.permissions?.length || 0 },
    { id: 'activity', label: 'System Activity', icon: FileText, count: user.recent_activity?.length || 0 },
    { id: 'login-history', label: 'Login History', icon: Clock, count: user.login_history?.length || 0 },
  ];

  return (
    <div className="space-y-6">
      {/* Back navigation */}
      <Link
        to="/users"
        className="inline-flex items-center gap-2 text-xs font-bold text-linen-600 hover:text-indigo-900 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to All Users</span>
      </Link>

      {/* User Header Profile Card */}
      <div className="rounded-3xl border border-linen-200 bg-white p-6 sm:p-8 shadow-subtle flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-900 to-indigo-700 text-white font-extrabold text-2xl flex items-center justify-center ring-4 ring-linen-100 shadow-md flex-shrink-0">
            {(user.full_name || 'U').charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-extrabold text-linen-900 tracking-tight">
                {user.full_name}
              </h1>
              <StatusBadge status={user.status} />
            </div>
            <p className="text-xs font-semibold text-linen-500 mt-1 flex items-center gap-2">
              <span className="font-mono bg-linen-100 px-2 py-0.5 rounded text-indigo-950 font-bold">
                {user.employee_id}
              </span>
              <span>&bull;</span>
              <span>{user.designation || user.role_name}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/users')}
          >
            Edit Profile
          </Button>
        </div>
      </div>

      {/* Tabs Bar */}
      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {/* Tab Content */}
      <div className="pt-2">
        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card title="Organization & Contact Details">
              <dl className="divide-y divide-linen-100 text-xs">
                <div className="py-3 flex justify-between">
                  <dt className="font-semibold text-linen-500">Email Address</dt>
                  <dd className="font-bold text-linen-900">{user.email}</dd>
                </div>
                <div className="py-3 flex justify-between">
                  <dt className="font-semibold text-linen-500">Phone</dt>
                  <dd className="font-bold text-linen-900">{user.phone || 'Not provided'}</dd>
                </div>
                <div className="py-3 flex justify-between">
                  <dt className="font-semibold text-linen-500">Department</dt>
                  <dd className="font-bold text-linen-900">{user.department_name || 'Unassigned'}</dd>
                </div>
                <div className="py-3 flex justify-between">
                  <dt className="font-semibold text-linen-500">Role Title</dt>
                  <dd className="font-bold text-indigo-900">{user.role_name}</dd>
                </div>
                <div className="py-3 flex justify-between">
                  <dt className="font-semibold text-linen-500">Created At</dt>
                  <dd className="font-medium text-linen-700">
                    {new Date(user.created_at).toLocaleDateString()}
                  </dd>
                </div>
                <div className="py-3 flex justify-between">
                  <dt className="font-semibold text-linen-500">Last System Login</dt>
                  <dd className="font-medium text-linen-700">
                    {user.last_login
                      ? new Date(user.last_login).toLocaleString()
                      : 'Never'}
                  </dd>
                </div>
              </dl>
            </Card>

            <Card title="Assigned Plant & Facility Units">
              <div className="space-y-3">
                {user.plants && user.plants.length > 0 ? (
                  user.plants.map((p, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl border border-linen-200 bg-linen-50/50 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-teal-100 text-teal-800">
                          <Factory className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-linen-900">{p.plant_name}</p>
                          <p className="text-[10px] text-linen-500">Manufacturing Node</p>
                        </div>
                      </div>
                      {p.is_primary && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-teal-50 text-teal-800 border border-teal-200">
                          Primary Plant
                        </span>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-linen-500">No specific plants assigned. Global access.</p>
                )}
              </div>
            </Card>
          </div>
        )}

        {/* TAB 2: ROLE PERMISSIONS */}
        {activeTab === 'permissions' && (
          <Card
            title={`Assigned Permissions: ${user.role_name}`}
            subtitle="Granular permissions granted to this user via their role matrix"
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-linen-200 bg-linen-50 text-linen-700 font-bold uppercase tracking-wider">
                    <th className="py-3 px-4">Module</th>
                    <th className="py-3 px-4 text-center">View</th>
                    <th className="py-3 px-4 text-center">Create</th>
                    <th className="py-3 px-4 text-center">Edit</th>
                    <th className="py-3 px-4 text-center">Delete</th>
                    <th className="py-3 px-4 text-center">Approve</th>
                    <th className="py-3 px-4 text-center">Export</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-linen-100">
                  {user.permissions?.map((p, idx) => (
                    <tr key={idx} className="hover:bg-linen-50">
                      <td className="py-3 px-4 font-bold text-linen-900">{p.module}</td>
                      <td className="py-3 px-4 text-center">
                        {p.can_view ? (
                          <CheckCircle2 className="w-4 h-4 text-teal-600 inline" />
                        ) : (
                          <XCircle className="w-4 h-4 text-linen-300 inline" />
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {p.can_create ? (
                          <CheckCircle2 className="w-4 h-4 text-teal-600 inline" />
                        ) : (
                          <XCircle className="w-4 h-4 text-linen-300 inline" />
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {p.can_edit ? (
                          <CheckCircle2 className="w-4 h-4 text-teal-600 inline" />
                        ) : (
                          <XCircle className="w-4 h-4 text-linen-300 inline" />
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {p.can_delete ? (
                          <CheckCircle2 className="w-4 h-4 text-teal-600 inline" />
                        ) : (
                          <XCircle className="w-4 h-4 text-linen-300 inline" />
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {p.can_approve ? (
                          <CheckCircle2 className="w-4 h-4 text-teal-600 inline" />
                        ) : (
                          <XCircle className="w-4 h-4 text-linen-300 inline" />
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {p.can_export ? (
                          <CheckCircle2 className="w-4 h-4 text-teal-600 inline" />
                        ) : (
                          <XCircle className="w-4 h-4 text-linen-300 inline" />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* TAB 3: RECENT ACTIVITY */}
        {activeTab === 'activity' && (
          <Card
            title="User System Activity"
            subtitle="Audit logs generated by actions performed by this user"
          >
            {user.recent_activity && user.recent_activity.length > 0 ? (
              <div className="divide-y divide-linen-100">
                {user.recent_activity.map((act) => (
                  <div key={act.id} className="py-3 flex items-start justify-between gap-4">
                    <div>
                      <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-900 mr-2">
                        {act.module}
                      </span>
                      <span className="text-xs font-bold text-linen-900">{act.description}</span>
                      <p className="text-[11px] text-linen-500 mt-1">
                        {new Date(act.created_at).toLocaleString()}
                      </p>
                    </div>
                    <StatusBadge status={act.action} size="sm" />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-linen-500 py-6 text-center">
                No recent actions recorded for this user yet.
              </p>
            )}
          </Card>
        )}

        {/* TAB 4: LOGIN HISTORY */}
        {activeTab === 'login-history' && (
          <Card
            title="Login History & Security Logs"
            subtitle="IP addresses and devices used to access LOOMORA"
          >
            {user.login_history && user.login_history.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-linen-200 bg-linen-50 text-linen-700 font-bold uppercase tracking-wider">
                      <th className="py-3 px-4">Login Time</th>
                      <th className="py-3 px-4">IP Address</th>
                      <th className="py-3 px-4">Device</th>
                      <th className="py-3 px-4">Browser</th>
                      <th className="py-3 px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-linen-100">
                    {user.login_history.map((lh) => (
                      <tr key={lh.id} className="hover:bg-linen-50">
                        <td className="py-3 px-4 text-linen-900 font-medium">
                          {new Date(lh.login_time).toLocaleString()}
                        </td>
                        <td className="py-3 px-4 font-mono text-linen-600">{lh.ip_address}</td>
                        <td className="py-3 px-4 text-linen-700">{lh.device}</td>
                        <td className="py-3 px-4 text-linen-700">{lh.browser}</td>
                        <td className="py-3 px-4">
                          <StatusBadge status={lh.status} size="sm" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-xs text-linen-500 py-6 text-center">
                No login history entries found for this user.
              </p>
            )}
          </Card>
        )}
      </div>
    </div>
  );
}
