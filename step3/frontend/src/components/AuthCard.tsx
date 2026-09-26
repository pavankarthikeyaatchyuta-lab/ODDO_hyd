import React, { useState } from 'react';
import { Lock, Mail, KeyRound, CheckCircle, ArrowRight, UserCheck } from 'lucide-react';
import { apiClient } from '../services/api';

export const AuthCard: React.FC = () => {
  const [email, setEmail] = useState('admin@stocksense.io');
  const [password, setPassword] = useState('Password123!');
  const [loading, setLoading] = useState(false);
  const [loginResult, setLoginResult] = useState<{ user: { email: string; role: string; firstName: string; lastName: string }; token: string } | null>(null);
  const [otpSent, setOtpSent] = useState(false);
  const [devOtpHint, setDevOtpHint] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await apiClient.post('/auth/login', { email, password });
      setLoginResult({
        user: res.data.data.user,
        token: res.data.data.accessToken,
      });
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: { message?: string } } } };
      setErrorMsg(error?.response?.data?.error?.message || 'Login failed. Ensure backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestOTP = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await apiClient.post('/auth/otp/request', { email });
      setOtpSent(true);
      if (res.data.data.devOtpHint) {
        setDevOtpHint(res.data.data.devOtpHint);
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: { message?: string } } } };
      setErrorMsg(error?.response?.data?.error?.message || 'OTP request failed.');
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
            <h3 className="text-base font-semibold text-white">Authentication & RBAC Foundation</h3>
            <p className="text-xs text-slate-400">Verifying JWT token issuance & OTP password recovery</p>
          </div>
        </div>
        <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
          POST /api/v1/auth/*
        </span>
      </div>

      {loginResult ? (
        <div className="mt-4 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
          <div className="flex items-center space-x-2 text-emerald-400 font-medium text-sm mb-2">
            <CheckCircle className="h-4 w-4" />
            <span>Authenticated Successfully</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
              <span className="text-slate-400 block mb-0.5">Active User</span>
              <span className="font-semibold text-white">{loginResult.user.firstName} {loginResult.user.lastName}</span>
              <span className="text-slate-400 block text-[11px]">{loginResult.user.email}</span>
            </div>
            <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
              <span className="text-slate-400 block mb-0.5">Assigned RBAC Role</span>
              <span className="inline-block px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 font-semibold text-[11px]">
                {loginResult.user.role}
              </span>
            </div>
          </div>
          <div className="mt-3 text-[11px] text-slate-400 font-mono truncate">
            Bearer Token: {loginResult.token.substring(0, 32)}...
          </div>
        </div>
      ) : (
        <form onSubmit={handleLogin} className="mt-4 space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
              {errorMsg}
            </div>
          )}

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
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={handleRequestOTP}
                disabled={loading}
                className="text-xs text-sky-400 hover:text-sky-300 font-medium transition underline underline-offset-4 disabled:opacity-50"
              >
                Test OTP Password Reset
              </button>
              {otpSent && (
                <span className="text-xs text-emerald-400">
                  OTP Dispatched! {devOtpHint && `(Hint: ${devOtpHint})`}
                </span>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-medium transition duration-150 shadow-md shadow-sky-600/20 disabled:opacity-50"
            >
              <UserCheck className="h-4 w-4" />
              <span>{loading ? 'Authenticating...' : 'Sign In with Seed Account'}</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
