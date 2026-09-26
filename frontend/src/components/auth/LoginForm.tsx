import React, { useState } from 'react';
import { Lock, Mail, KeyRound, ArrowRight, UserPlus, Key, Shield, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';

interface Props {
  onOpenRegister: () => void;
  onOpenOTPReset: () => void;
}

export const LoginForm: React.FC<Props> = ({ onOpenRegister, onOpenOTPReset }) => {
  const { login, quickLogin } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'quick' | 'manual'>('quick');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    try {
      await login(email, password);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: { message?: string } } } };
      setErrorMsg(e.response?.data?.error?.message || 'Login failed. Check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickRole = async (role: UserRole) => {
    setLoading(true);
    setErrorMsg(null);
    try {
      await quickLogin(role);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: { message?: string } } } };
      setErrorMsg(e.response?.data?.error?.message || `Failed to authenticate as ${role}`);
    } finally {
      setLoading(false);
    }
  };

  const demoRoles = [
    {
      role: 'ADMIN' as UserRole,
      title: 'System Admin',
      email: 'admin@stocksense.io',
      icon: '👑',
      badge: 'Full RBAC Access',
      border: 'hover:border-purple-500/60 hover:bg-purple-950/20',
      activeBorder: 'border-purple-500/40 bg-purple-500/10 text-purple-300',
      desc: 'Users, Warehouses, Rules & All Operations',
    },
    {
      role: 'INVENTORY_MANAGER' as UserRole,
      title: 'Inventory Manager',
      email: 'manager@stocksense.io',
      icon: '📋',
      badge: 'Operations & Rules',
      border: 'hover:border-sky-500/60 hover:bg-sky-950/20',
      activeBorder: 'border-sky-500/40 bg-sky-500/10 text-sky-300',
      desc: 'Adjustments, Transfers, Catalog & Procurement',
    },
    {
      role: 'WAREHOUSE_STAFF' as UserRole,
      title: 'Warehouse Staff',
      email: 'staff@stocksense.io',
      icon: '📦',
      badge: 'Intake & Picking',
      border: 'hover:border-emerald-500/60 hover:bg-emerald-950/20',
      activeBorder: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300',
      desc: 'Receipt Validation, DO Picking & Transfers',
    },
    {
      role: 'VIEWER_AUDITOR' as UserRole,
      title: 'Viewer / Auditor',
      email: 'auditor@stocksense.io',
      icon: '🔍',
      badge: 'Audit & Compliance',
      border: 'hover:border-amber-500/60 hover:bg-amber-950/20',
      activeBorder: 'border-amber-500/40 bg-amber-500/10 text-amber-300',
      desc: 'Immutable Stock Ledger & History Inspection',
    },
  ];

  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 sm:p-8 backdrop-blur-xl shadow-2xl relative overflow-hidden">
      {/* Ambient background glow accent */}
      <div className="absolute -top-24 -right-24 w-48 h-48 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Card Header */}
      <div className="flex items-center justify-between pb-5 border-b border-slate-800/80 relative z-10">
        <div className="flex items-center space-x-3.5">
          <div className="p-3 rounded-2xl bg-gradient-to-tr from-sky-500/20 to-indigo-500/20 text-sky-400 border border-sky-500/30 shadow-inner">
            <Lock className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">StockSense Authentication</h3>
            <p className="text-xs text-slate-400">Enterprise Role-Based Access Control</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800/80 border border-slate-700/80 text-[11px] font-mono text-slate-300">
          <Shield className="h-3 w-3 text-emerald-400" />
          <span>RBAC Guard</span>
        </div>
      </div>

      {errorMsg && (
        <div className="mt-4 p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between">
          <span>{errorMsg}</span>
          <button onClick={() => setErrorMsg(null)} className="text-rose-400 hover:text-white text-xs">✕</button>
        </div>
      )}

      {/* Tab Switcher */}
      <div className="mt-5 grid grid-cols-2 p-1 rounded-2xl bg-slate-950/70 border border-slate-800 text-xs font-semibold">
        <button
          type="button"
          onClick={() => setActiveTab('quick')}
          className={`py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'quick'
              ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/25'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Sparkles className="h-3.5 w-3.5" />
          <span>1-Click Role Switcher</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('manual')}
          className={`py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'manual'
              ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/25'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <KeyRound className="h-3.5 w-3.5" />
          <span>Manual Credentials</span>
        </button>
      </div>

      {/* Tab 1: 1-Click Role Switcher */}
      {activeTab === 'quick' && (
        <div className="mt-5 space-y-2.5">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="font-semibold text-slate-300">Select role to test permissions:</span>
            <span className="text-[11px] font-mono text-sky-400">Instant Demo Login</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {demoRoles.map((d) => (
              <button
                key={d.role}
                type="button"
                onClick={() => handleQuickRole(d.role)}
                disabled={loading}
                className={`p-3.5 rounded-2xl border text-left transition-all duration-150 disabled:opacity-50 group ${d.activeBorder} ${d.border}`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center space-x-2 font-bold text-xs">
                    <span className="text-base">{d.icon}</span>
                    <span className="text-white group-hover:text-sky-300 transition-colors">{d.title}</span>
                  </div>
                  <ArrowRight className="h-3.5 w-3.5 opacity-40 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                </div>
                <div className="text-[11px] text-slate-400 line-clamp-1">{d.desc}</div>
                <div className="mt-2 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[10px] font-mono text-slate-400">
                  <span className="truncate">{d.email}</span>
                  <span className="font-sans px-1.5 py-0.5 rounded bg-slate-900/90 text-slate-300">{d.badge}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Tab 2: Manual Credentials Form */}
      {activeTab === 'manual' && (
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Work Email</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <Mail className="h-4 w-4" />
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                required
                className="w-full pl-10 pr-3.5 py-2.5 rounded-2xl bg-slate-950 border border-slate-700/80 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-300">Password</label>
              <button
                type="button"
                onClick={onOpenOTPReset}
                className="text-[11px] text-sky-400 hover:text-sky-300 font-medium"
              >
                Forgot password?
              </button>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <Key className="h-4 w-4" />
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                required
                className="w-full pl-10 pr-3.5 py-2.5 rounded-2xl bg-slate-950 border border-slate-700/80 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 font-mono"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 rounded-2xl bg-sky-500 hover:bg-sky-400 text-white text-xs font-bold transition shadow-lg shadow-sky-500/25 flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            {loading ? (
              <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>Sign In to StockSense</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>
      )}

      {/* Footer Navigation */}
      <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
        <button
          type="button"
          onClick={onOpenOTPReset}
          className="hover:text-white transition flex items-center space-x-1"
        >
          <KeyRound className="h-3.5 w-3.5 text-slate-500" />
          <span>OTP Password Reset</span>
        </button>

        <button
          type="button"
          onClick={onOpenRegister}
          className="text-sky-400 hover:text-sky-300 font-semibold transition flex items-center space-x-1"
        >
          <UserPlus className="h-3.5 w-3.5" />
          <span>Create Account</span>
        </button>
      </div>
    </div>
  );
};
