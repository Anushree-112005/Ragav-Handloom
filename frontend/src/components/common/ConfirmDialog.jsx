import React from 'react';
import { AlertTriangle, AlertCircle, HelpCircle } from 'lucide-react';
import Modal from './Modal';
import Button from './Button';

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed with this action?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'danger',
  loading = false,
}) {
  const iconMap = {
    danger: <AlertCircle className="w-8 h-8 text-coral-600" />,
    warning: <AlertTriangle className="w-8 h-8 text-saffron-600" />,
    info: <HelpCircle className="w-8 h-8 text-indigo-600" />,
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="max-w-md" showClose={!loading}>
      <div className="flex items-start gap-4">
        <div className="p-3 bg-linen-100 rounded-2xl shrink-0">
          {iconMap[type] || iconMap.danger}
        </div>
        <div>
          <h4 className="text-base font-bold text-linen-900">{title}</h4>
          <p className="mt-1 text-sm text-linen-600 leading-relaxed">{message}</p>
        </div>
      </div>

      <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-linen-100">
        <Button variant="outline" size="sm" onClick={onClose} disabled={loading}>
          {cancelText}
        </Button>
        <Button
          variant={type === 'danger' ? 'danger' : 'primary'}
          size="sm"
          loading={loading}
          onClick={onConfirm}
        >
          {confirmText}
        </Button>
      </div>
    </Modal>
  );
}
