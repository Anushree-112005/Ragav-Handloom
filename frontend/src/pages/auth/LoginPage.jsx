import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import LoomoraLogo from '../../components/common/LoomoraLogo';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';

export default function LoginPage() {
  const [email, setEmail] = useState('admin@loomora.com');
  const [password, setPassword] = useState('Admin@123');
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [forgotModal, setForgotModal] = useState(false);

  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please enter both email and password');
      return;
    }

    setLoading(true);
    try {
      const data = await login(email, password, rememberMe);
      toast.success(`Welcome back, ${data.user.full_name}!`);
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const autofillDemo = (demoEmail, demoPwd) => {
    setEmail(demoEmail);
    setPassword(demoPwd);
  };

  return (
    <div className="min-h-screen flex bg-linen-50">
      {/* Left Column: High-End Artisanal Handloom Editorial Showcase */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-indigo-950 via-purple-950 to-teal-950 text-white p-12 flex-col justify-between overflow-hidden">
        {/* Decorative Grid Lines Overlay */}
        <div className="absolute inset-0 bg-weave-lines pointer-events-none" />

        {/* Header Branding */}
        <div className="relative z-10">
          <LoomoraLogo size="large" light={true} />
        </div>

        {/* Storytelling Quote */}
        <div className="relative z-10 max-w-lg space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-white/10 text-saffron-300 border border-saffron-400/30 backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5 text-saffron-400" />
            Craftsmanship Meets Enterprise ERP
          </div>

          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight text-white">
            "From thread to finished fabric, manage your handloom operations in one place."
          </h2>

          <p className="text-sm text-linen-300 font-normal leading-relaxed">
            Empowering textile manufacturers, cooperative federations, master weavers and artisans
            with unified user access, 12 master data modules, and end-to-end operational visibility.
          </p>

          <div className="pt-4 flex items-center gap-6 border-t border-white/15">
            <div>
              <p className="text-2xl font-extrabold text-white">100%</p>
              <p className="text-xs text-linen-400 uppercase tracking-wider mt-0.5">PostgreSQL Driven</p>
            </div>
            <div className="h-8 w-px bg-white/15" />
            <div>
              <p className="text-2xl font-extrabold text-white">12+</p>
              <p className="text-xs text-linen-400 uppercase tracking-wider mt-0.5">Master Data Modules</p>
            </div>
            <div className="h-8 w-px bg-white/15" />
            <div>
              <p className="text-2xl font-extrabold text-white">Role Matrix</p>
              <p className="text-xs text-linen-400 uppercase tracking-wider mt-0.5">Enterprise Security</p>
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <div className="relative z-10 text-xs text-linen-400">
          LOOMORA ERP Platform &bull; Production Release v1.0.0
        </div>
      </div>

      {/* Right Column: Premium Enterprise Login Form */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 sm:p-12 lg:p-16">
        <div className="w-full max-w-md space-y-8">
          {/* Mobile Logo View */}
          <div className="lg:hidden flex justify-center mb-6">
            <LoomoraLogo size="large" />
          </div>

          <div className="text-center sm:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-900 border border-indigo-200 mb-3">
              <ShieldCheck className="w-4 h-4 text-indigo-700" />
              Secure Enterprise Portal
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-linen-900 tracking-tight">
              Welcome back
            </h1>
            <p className="mt-1 text-sm text-linen-500">
              Sign in to your LOOMORA account to manage your handloom operations.
            </p>
          </div>

          {/* Quick Demo Credentials Autofill Helpers */}
          <div className="p-3.5 rounded-2xl border border-linen-200 bg-white shadow-subtle space-y-2.5">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-bold text-linen-600 uppercase tracking-wider">
                1-Click Demo Accounts:
              </p>
              <span className="text-[10px] text-linen-400">Click to autofill</span>
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { name: 'Super Admin', email: 'admin@loomora.com', pwd: 'Admin@123', color: 'indigo' },
                { name: 'Production', email: 'production@loomora.com', pwd: 'Prod@123', color: 'teal' },
                { name: 'Master Weaver', email: 'weaver@loomora.com', pwd: 'Weaver@123', color: 'amber' },
                { name: 'Inventory Mgr', email: 'inventory@loomora.com', pwd: 'Stock@123', color: 'blue' },
                { name: 'Quality QC', email: 'quality@loomora.com', pwd: 'Quality@123', color: 'emerald' },
                { name: 'HR Manager', email: 'hr@loomora.com', pwd: 'Admin@123', color: 'purple' },
              ].map((account) => {
                const isSelected = email === account.email;
                return (
                  <button
                    key={account.email}
                    type="button"
                    onClick={() => autofillDemo(account.email, account.pwd)}
                    className={`px-2 py-1.5 text-xs font-semibold rounded-lg border transition-all text-center truncate ${
                      isSelected
                        ? 'bg-indigo-900 text-white border-indigo-900 shadow-sm ring-2 ring-indigo-200'
                        : 'bg-linen-50 text-linen-700 border-linen-200 hover:bg-linen-100'
                    }`}
                  >
                    {account.name}
                  </button>
                );
              })}
            </div>
            <div className="pt-1 text-[11px] text-linen-500 flex justify-between items-center border-t border-linen-100">
              <span>Loaded: <strong className="text-linen-900">{email}</strong></span>
              <span className="font-mono text-indigo-700 font-medium">Pwd: {password}</span>
            </div>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Username or Work Email"
              name="email"
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. inventory or inventory@loomora.com"
              icon={Mail}
              required
            />

            <Input
              label="Account Password"
              name="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              icon={Lock}
              required
            />

            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-linen-300 text-indigo-900 focus:ring-indigo-600 w-4 h-4"
                />
                <span className="font-medium text-linen-700">Remember me for 24h</span>
              </label>

              <button
                type="button"
                onClick={() => setForgotModal(true)}
                className="font-semibold text-indigo-900 hover:text-indigo-700 hover:underline"
              >
                Forgot password?
              </button>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={loading}
              className="w-full mt-2"
              icon={ArrowRight}
            >
              Sign In to LOOMORA
            </Button>
          </form>

          {/* Universal Demo Credentials Reference */}
          <div className="p-3 bg-linen-100/70 rounded-xl border border-linen-200 text-center space-y-1">
            <p className="text-[11px] text-linen-600">
              Universal demo password: <code className="px-1.5 py-0.5 rounded bg-white text-indigo-900 font-bold border border-linen-200">Admin@123</code>
            </p>
            <p className="text-[10px] text-linen-400">
              All demo roles and employee accounts are active and connected to PostgreSQL
            </p>
          </div>
        </div>
      </div>

      {/* Forgot Password Dialog */}
      {forgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-indigo-950/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full border border-linen-200 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-linen-900">Reset Password</h3>
            <p className="text-xs text-linen-600 leading-relaxed">
              For enterprise security, password resets are handled by your LOOMORA System Administrator or HR department. Please contact <span className="font-semibold text-indigo-900">admin@loomora.com</span> or your plant IT administrator.
            </p>
            <Button variant="primary" size="sm" className="w-full" onClick={() => setForgotModal(false)}>
              Got it
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
