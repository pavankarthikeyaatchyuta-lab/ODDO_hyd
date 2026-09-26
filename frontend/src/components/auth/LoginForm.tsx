import React, { useState } from 'react';
import { Lock, Mail, KeyRound, UserCheck, ArrowRight, UserPlus, Key } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';

interface Props {
  onOpenRegister: () => void;
  onOpenOTPReset: () => void;
}

export const LoginForm: React.FC<Props> = ({ onOpenRegister, onOpenOTPReset }) => {
  const { login, quickLogin } = useAuth();
  const [email, setEmail] = useState('admin@stocksense.io');
  const [password, setPassword] = useState('Password123!');
  const [loading, setLoading] = useState(false);
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

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-sm shadow-xl">
      <div className="flex items-center justify-between pb-4 border-b border-slate-800/80">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
            <Lock className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-white">StockSense Secure Authentication</h3>
            <p className="text-xs text-slate-400">Sign in with role-based credentials or test quick role switching</p>
          </div>
        </div>
        <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
          JWT + RBAC Guard
        </span>
      </div>

      {errorMsg && (
        <div className="mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
          {errorMsg}
        </div>
      )}

      {/* 1-Click Role Switcher */}
      <div className="mt-4 p-4 rounded-xl bg-slate-950/60 border border-slate-800/80">
        <span className="text-xs font-semibold text-slate-300 block mb-2">
          ⚡ 1-Click Role Switcher (Seeded Demo Accounts)
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <button
            type="button"
            onClick={() => handleQuickRole('ADMIN')}
            disabled={loading}
            className="p-2.5 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 text-purple-300 text-xs font-medium text-left transition disabled:opacity-50"
          >
            <div className="font-bold flex items-center justify-between">
              <span>Admin</span>
              <span className="text-[10px]">👑</span>
            </div>
            <div className="text-[10px] text-purple-400/80 font-mono mt-0.5 truncate">admin@stocksense.io</div>
          </button>

          <button
            type="button"
            onClick={() => handleQuickRole('INVENTORY_MANAGER')}
            disabled={loading}
            className="p-2.5 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/20 text-sky-300 text-xs font-medium text-left transition disabled:opacity-50"
          >
            <div className="font-bold flex items-center justify-between">
              <span>Manager</span>
              <span className="text-[10px]">📋</span>
            </div>
            <div className="text-[10px] text-sky-400/80 font-mono mt-0.5 truncate">manager@stocksense.io</div>
          </button>

          <button
            type="button"
            onClick={() => handleQuickRole('WAREHOUSE_STAFF')}
            disabled={loading}
            className="p-2.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-300 text-xs font-medium text-left transition disabled:opacity-50"
          >
            <div className="font-bold flex items-center justify-between">
              <span>Staff</span>
              <span className="text-[10px]">📦</span>
            </div>
            <div className="text-[10px] text-emerald-400/80 font-mono mt-0.5 truncate">staff@stocksense.io</div>
          </button>

          <button
            type="button"
            onClick={() => handleQuickRole('VIEWER_AUDITOR')}
            disabled={loading}
            className="p-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 text-amber-300 text-xs font-medium text-left transition disabled:opacity-50"
          >
            <div className="font-bold flex items-center justify-between">
              <span>Auditor</span>
              <span className="text-[10px]">🔍</span>
            </div>
            <div className="text-[10px] text-amber-400/80 font-mono mt-0.5 truncate">auditor@stocksense.io</div>
          </button>
        </div>
      </div>

      {/* Manual Login Form */}
      <form onSubmit={handleSubmit} className="mt-4 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center gap-1.5">
              <Mail className="h-3.5 w-3.5 text-slate-400" /> Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-sky-500 font-mono"
              placeholder="admin@stocksense.io"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center gap-1.5">
              <KeyRound className="h-3.5 w-3.5 text-slate-400" /> Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-sky-500 font-mono"
              placeholder="Password123!"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <div className="flex items-center space-x-3 text-xs">
            <button
              type="button"
              onClick={onOpenOTPReset}
              className="text-amber-400 hover:text-amber-300 font-medium transition flex items-center gap-1 underline underline-offset-4"
            >
              <Key className="h-3.5 w-3.5" />
              <span>Forgot Password? (OTP)</span>
            </button>

            <span className="text-slate-600">|</span>

            <button
              type="button"
              onClick={onOpenRegister}
              className="text-sky-400 hover:text-sky-300 font-medium transition flex items-center gap-1 underline underline-offset-4"
            >
              <UserPlus className="h-3.5 w-3.5" />
              <span>Register New User</span>
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold transition duration-150 shadow-md shadow-sky-600/20 disabled:opacity-50"
          >
            <UserCheck className="h-4 w-4" />
            <span>{loading ? 'Authenticating...' : 'Sign In with Credentials'}</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </form>
    </div>
  );
};
