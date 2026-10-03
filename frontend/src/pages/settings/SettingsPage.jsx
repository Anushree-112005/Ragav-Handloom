import React, { useState } from 'react';
import { Settings, User, Lock, Building2, Moon, Sun, Bell, Shield, Save, CheckCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useToast } from '../../context/ToastContext';
import { userService } from '../../services/userService';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import TextileHero from '../../components/common/TextileHero';

export default function SettingsPage() {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState('profile');

  // Profile Form
  const [profileForm, setProfileForm] = useState({
    first_name: user?.first_name || 'Admin',
    last_name: user?.last_name || 'User',
    email: user?.email || 'admin@loomora.com',
    phone: user?.phone || '+91 98765 43210',
    employee_id: user?.employee_id || 'EMP-ADM-001',
    role: user?.role_name || 'System Administrator',
  });
  const [profileSaving, setProfileSaving] = useState(false);

  // Password Form
  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });
  const [passwordSaving, setPasswordSaving] = useState(false);

  // Enterprise Settings Form
  const [orgForm, setOrgForm] = useState({
    company_name: 'Loomora Handloom Textiles Pvt. Ltd.',
    handloom_board_reg: 'TN/KJM/HL-2024/098',
    gstin: '33AAACL9876E1Z4',
    currency: 'INR (₹)',
    financial_year: '2026 - 2027',
    primary_cluster: 'Kanchipuram Heritage Silk Weaving Zone',
  });
  const [orgSaving, setOrgSaving] = useState(false);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setProfileSaving(true);
    try {
      if (user?.id) {
        await userService.updateUser(user.id, {
          first_name: profileForm.first_name,
          last_name: profileForm.last_name,
          phone: profileForm.phone,
        });
      }
      toast.success('User profile updated successfully.');
    } catch (err) {
      toast.error('Failed to update profile: ' + err.message);
    } finally {
      setProfileSaving(false);
    }
  };

  const handleSavePassword = async (e) => {
    e.preventDefault();
    if (!passwordForm.new_password || passwordForm.new_password.length < 6) {
      toast.error('New password must be at least 6 characters long.');
      return;
    }
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      toast.error('New password and confirmation do not match.');
      return;
    }
    setPasswordSaving(true);
    try {
      if (user?.id) {
        await userService.resetPassword(user.id, passwordForm.new_password);
        toast.success('Password updated successfully.');
        setPasswordForm({ current_password: '', new_password: '', confirm_password: '' });
      }
    } catch (err) {
      toast.error('Failed to change password: ' + err.message);
    } finally {
      setPasswordSaving(false);
    }
  };

  const handleSaveOrg = (e) => {
    e.preventDefault();
    setOrgSaving(true);
    setTimeout(() => {
      setOrgSaving(false);
      toast.success('Textile enterprise configurations saved.');
    }, 400);
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <TextileHero
        title="Settings & System Preferences"
        subtitle="Manage your personal credentials, appearance mode, notification channels, and handloom organization parameters."
        variant="indigo"
        badge="Platform Configuration"
      />

      {/* Tabs */}
      <div className="flex border-b border-border space-x-6">
        <button
          onClick={() => setActiveTab('profile')}
          className={`pb-3 text-sm font-medium transition-colors border-b-2 flex items-center space-x-2 ${
            activeTab === 'profile'
              ? 'border-textile-purple text-textile-purple'
              : 'border-transparent text-surface-500 hover:text-surface-700 dark:hover:text-surface-300'
          }`}
        >
          <User className="w-4 h-4" />
          <span>My Profile</span>
        </button>

        <button
          onClick={() => setActiveTab('security')}
          className={`pb-3 text-sm font-medium transition-colors border-b-2 flex items-center space-x-2 ${
            activeTab === 'security'
              ? 'border-textile-purple text-textile-purple'
              : 'border-transparent text-surface-500 hover:text-surface-700 dark:hover:text-surface-300'
          }`}
        >
          <Lock className="w-4 h-4" />
          <span>Security & Password</span>
        </button>

        <button
          onClick={() => setActiveTab('enterprise')}
          className={`pb-3 text-sm font-medium transition-colors border-b-2 flex items-center space-x-2 ${
            activeTab === 'enterprise'
              ? 'border-textile-purple text-textile-purple'
              : 'border-transparent text-surface-500 hover:text-surface-700 dark:hover:text-surface-300'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Textile Enterprise Setup</span>
        </button>
      </div>

      {/* Tab 1: Profile */}
      {activeTab === 'profile' && (
        <Card className="p-6">
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <h2 className="text-base font-semibold text-surface-900 dark:text-surface-100">
              Personal Information
            </h2>
            <p className="text-xs text-surface-500">
              Update your contact details and view your role permissions.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <Input
                label="First Name"
                value={profileForm.first_name}
                onChange={(e) => setProfileForm({ ...profileForm, first_name: e.target.value })}
                required
              />
              <Input
                label="Last Name"
                value={profileForm.last_name}
                onChange={(e) => setProfileForm({ ...profileForm, last_name: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Email Address"
                value={profileForm.email}
                disabled
                helperText="Email address is tied to your login identity."
              />
              <Input
                label="Phone Number"
                value={profileForm.phone}
                onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Employee ID"
                value={profileForm.employee_id}
                disabled
              />
              <Input
                label="Assigned System Role"
                value={profileForm.role}
                disabled
              />
            </div>

            <div className="pt-4 flex justify-end">
              <Button variant="primary" type="submit" icon={Save} loading={profileSaving}>
                Save Profile
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Tab 2: Security & Password */}
      {activeTab === 'security' && (
        <Card className="p-6">
          <form onSubmit={handleSavePassword} className="space-y-4">
            <h2 className="text-base font-semibold text-surface-900 dark:text-surface-100">
              Update Access Credentials
            </h2>
            <p className="text-xs text-surface-500">
              Ensure your account is using a secure password (minimum 6 characters).
            </p>

            <div className="space-y-4 max-w-md pt-2">
              <Input
                label="Current Password"
                type="password"
                value={passwordForm.current_password}
                onChange={(e) => setPasswordForm({ ...passwordForm, current_password: e.target.value })}
                placeholder="••••••••"
              />
              <Input
                label="New Password"
                type="password"
                value={passwordForm.new_password}
                onChange={(e) => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
                placeholder="••••••••"
                required
              />
              <Input
                label="Confirm New Password"
                type="password"
                value={passwordForm.confirm_password}
                onChange={(e) => setPasswordForm({ ...passwordForm, confirm_password: e.target.value })}
                placeholder="••••••••"
                required
              />
            </div>

            <div className="pt-4 flex justify-start">
              <Button variant="primary" type="submit" icon={Lock} loading={passwordSaving}>
                Update Password
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Tab 3: Textile Enterprise */}
      {activeTab === 'enterprise' && (
        <Card className="p-6">
          <form onSubmit={handleSaveOrg} className="space-y-4">
            <h2 className="text-base font-semibold text-surface-900 dark:text-surface-100">
              Handloom Enterprise Parameters
            </h2>
            <p className="text-xs text-surface-500">
              Government registration codes, primary textile cluster, and invoicing configurations.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <Input
                label="Company Legal Name"
                value={orgForm.company_name}
                onChange={(e) => setOrgForm({ ...orgForm, company_name: e.target.value })}
              />
              <Input
                label="Handloom Board Registration No."
                value={orgForm.handloom_board_reg}
                onChange={(e) => setOrgForm({ ...orgForm, handloom_board_reg: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                label="GSTIN Number"
                value={orgForm.gstin}
                onChange={(e) => setOrgForm({ ...orgForm, gstin: e.target.value })}
              />
              <Input
                label="Operating Currency"
                value={orgForm.currency}
                disabled
              />
              <Input
                label="Current Financial Year"
                value={orgForm.financial_year}
                disabled
              />
            </div>

            <Input
              label="Primary Weaving Cluster"
              value={orgForm.primary_cluster}
              onChange={(e) => setOrgForm({ ...orgForm, primary_cluster: e.target.value })}
            />

            <div className="pt-4 flex justify-end">
              <Button variant="primary" type="submit" icon={Save} loading={orgSaving}>
                Save Enterprise Settings
              </Button>
            </div>
          </form>
        </Card>
      )}
    </div>
  );
}
