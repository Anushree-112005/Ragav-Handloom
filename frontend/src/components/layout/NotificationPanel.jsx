import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, UserCheck, AlertTriangle, Package, CheckCircle2, Clock } from 'lucide-react';

export default function NotificationPanel({ isOpen, onClose }) {
  const navigate = useNavigate();

  const notifications = [
    {
      id: 1,
      icon: UserCheck,
      color: 'text-saffron-600 bg-saffron-100',
      title: 'New user awaiting access approval',
      time: '10m ago',
      unread: true,
      link: '/user-approvals',
    },
    {
      id: 2,
      icon: AlertTriangle,
      color: 'text-coral-600 bg-coral-100',
      title: 'Loom LOOM-ERD-07 scheduled maintenance due',
      time: '1h ago',
      unread: true,
      link: '/looms',
    },
    {
      id: 3,
      icon: Package,
      color: 'text-teal-600 bg-teal-100',
      title: 'New Fabric Kanchipuram Mulberry Silk created',
      time: '3h ago',
      unread: false,
      link: '/fabrics',
    },
    {
      id: 4,
      icon: CheckCircle2,
      color: 'text-indigo-600 bg-indigo-100',
      title: 'Quality inspection QC-INSP-101 passed',
      time: '5h ago',
      unread: false,
      link: '/quality',
    },
  ];

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-30" onClick={onClose} />
      <div className="absolute right-0 top-12 z-40 w-80 sm:w-96 rounded-2xl bg-white border border-linen-200 shadow-modal overflow-hidden animate-slide-up">
        <div className="flex items-center justify-between px-4 py-3 border-b border-linen-100 bg-linen-50/70">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-indigo-900" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-linen-900">Notifications</h4>
          </div>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-saffron-100 text-saffron-800">
            2 New
          </span>
        </div>

        <div className="divide-y divide-linen-100 max-h-80 overflow-y-auto">
          {notifications.map((n) => {
            const Icon = n.icon;
            return (
              <div
                key={n.id}
                onClick={() => {
                  navigate(n.link);
                  onClose();
                }}
                className={`p-3.5 flex items-start gap-3 cursor-pointer transition-colors hover:bg-linen-50 ${
                  n.unread ? 'bg-indigo-50/20' : ''
                }`}
              >
                <div className={`p-2 rounded-xl shrink-0 ${n.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-xs ${n.unread ? 'font-bold text-linen-900' : 'text-linen-700'} leading-snug`}>
                    {n.title}
                  </p>
                  <p className="text-[10px] text-linen-400 mt-1 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {n.time}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="p-2 border-t border-linen-100 bg-linen-50/50 text-center">
          <button
            onClick={onClose}
            className="text-xs font-semibold text-indigo-900 hover:text-indigo-700 transition-colors py-1"
          >
            Mark all as read
          </button>
        </div>
      </div>
    </>
  );
}
