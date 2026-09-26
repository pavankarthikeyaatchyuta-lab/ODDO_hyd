import React from 'react';
import { Activity, CheckCircle2, AlertTriangle, XCircle, RefreshCw, Server, Cpu } from 'lucide-react';
import { HealthData } from '../services/api';

interface Props {
  health: HealthData | null;
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
}

export const SystemHealthBanner: React.FC<Props> = ({ health, loading, error, onRefresh }) => {
  const isHealthy = health?.status === 'healthy';

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-sm shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800/80">
        <div className="flex items-center space-x-3">
          <div className={`p-2.5 rounded-xl ${
            loading
              ? 'bg-slate-800 text-slate-400'
              : isHealthy
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
              : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
          }`}>
            <Activity className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              System Ingress & Infrastructure Status
              {loading ? (
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 animate-pulse">
                  Checking...
                </span>
              ) : isHealthy ? (
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1 font-medium">
                  <CheckCircle2 className="h-3 w-3" /> Operational
                </span>
              ) : (
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center gap-1 font-medium">
                  <XCircle className="h-3 w-3" /> Degraded
                </span>
              )}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Live heartbeat pinging backend API endpoint and transactional database engine
            </p>
          </div>
        </div>

        <button
          onClick={onRefresh}
          disabled={loading}
          className="inline-flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition duration-150 border border-slate-700/60 disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin text-sky-400' : ''}`} />
          <span>Ping Gateway</span>
        </button>
      </div>

      {error ? (
        <div className="mt-4 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0 text-rose-400" />
          <span>Cannot reach backend API at <code className="bg-slate-950/80 px-1.5 py-0.5 rounded">{import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1'}</code>. Ensure the backend server is running.</span>
        </div>
      ) : health ? (
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800/80">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span>Database Connection</span>
              <Server className="h-3.5 w-3.5 text-sky-400" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className={`text-base font-semibold ${health.database.connected ? 'text-emerald-400' : 'text-rose-400'}`}>
                {health.database.connected ? 'Connected' : 'Disconnected'}
              </span>
              <span className="text-[11px] text-slate-500 font-mono">({health.database.responseTimeMs}ms)</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1 capitalize">Provider: {health.database.provider}</p>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800/80">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span>Service Uptime</span>
              <Cpu className="h-3.5 w-3.5 text-purple-400" />
            </div>
            <span className="text-base font-semibold text-slate-100 font-mono">
              {health.uptimeSeconds}s
            </span>
            <p className="text-[11px] text-slate-400 mt-1">Env: {health.environment}</p>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800/80">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span>API Ingress Route</span>
              <Activity className="h-3.5 w-3.5 text-emerald-400" />
            </div>
            <span className="text-base font-semibold text-slate-100 font-mono">
              v{health.version}
            </span>
            <p className="text-[11px] text-slate-400 mt-1">Prefix: /api/v1/health</p>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800/80">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span>Core Services</span>
              <CheckCircle2 className="h-3.5 w-3.5 text-cyan-400" />
            </div>
            <span className="text-base font-semibold text-emerald-400">
              Operational
            </span>
            <p className="text-[11px] text-slate-400 mt-1">Auth, Ledger, Forecasts</p>
          </div>
        </div>
      ) : null}
    </div>
  );
};
