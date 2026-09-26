import React, { useEffect, useState } from 'react';
import { Package, ArrowDownLeft, ArrowUpRight, Repeat, Database, Layers } from 'lucide-react';
import { healthApi, dashboardApi } from '../services/api';
import { DashboardKPIs } from '../types';

export const QuickStats: React.FC = () => {
  const [kpis, setKpis] = useState<DashboardKPIs | null>(null);
  const [dbStatus, setDbStatus] = useState<{ connected: boolean; latency: number | null }>({
    connected: false,
    latency: null,
  });

  useEffect(() => {
    const fetchTelemetry = async () => {
      try {
        const [healthRes, kpiRes] = await Promise.allSettled([
          healthApi.getHealth(),
          dashboardApi.getKPIs(),
        ]);

        if (healthRes.status === 'fulfilled') {
          setDbStatus({
            connected: healthRes.value.database.connected,
            latency: healthRes.value.database.responseTimeMs,
          });
        }

        if (kpiRes.status === 'fulfilled') {
          setKpis(kpiRes.value);
        }
      } catch {
        // Fallback to initial display
      }
    };

    fetchTelemetry();
  }, []);

  const stats = [
    {
      title: 'Products In Stock',
      value: kpis ? `${kpis.totalProductsInStock} Active` : '—',
      subtext: kpis ? `${kpis.totalStockUnits} Total units recorded` : 'Loading inventory data...',
      icon: Package,
      badge: 'Stock Balance',
      color: 'text-sky-400 bg-sky-500/10 border-sky-500/30',
      glow: 'group-hover:border-sky-500/50',
    },
    {
      title: 'Inbound Receipts',
      value: kpis ? `${kpis.pendingReceiptsCount} Pending` : '—',
      subtext: 'Supplier intake tracking active',
      icon: ArrowDownLeft,
      badge: 'Procurement',
      color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
      glow: 'group-hover:border-emerald-500/50',
    },
    {
      title: 'Outbound Deliveries',
      value: kpis ? `${kpis.pendingDeliveriesCount} In Queue` : '—',
      subtext: 'Pick, pack & dispatch queue',
      icon: ArrowUpRight,
      badge: 'Fulfillment',
      color: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
      glow: 'group-hover:border-amber-500/50',
    },
    {
      title: 'Internal Transfers',
      value: kpis ? `${kpis.scheduledTransfersCount} Scheduled` : '—',
      subtext: 'Zero-delta spatial movement',
      icon: Repeat,
      badge: 'Zero-Delta',
      color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/30',
      glow: 'group-hover:border-indigo-500/50',
    },
    {
      title: 'Neon PostgreSQL Engine',
      value: dbStatus.connected ? 'Operational' : (dbStatus.latency === null ? 'Connecting...' : 'Disconnected'),
      subtext: dbStatus.latency !== null ? `${dbStatus.latency}ms cloud roundtrip` : 'Checking connectivity...',
      icon: Database,
      badge: 'Cloud Ledger',
      color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30',
      glow: 'group-hover:border-cyan-500/50',
    },
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs text-slate-400 px-1">
        <span className="font-semibold uppercase tracking-wider flex items-center gap-1.5">
          <Layers className="h-3.5 w-3.5 text-sky-400" /> Live Inventory Telemetry
        </span>
        <span className="font-mono text-[11px] flex items-center gap-1.5 text-emerald-400">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          Neon PostgreSQL Single Source of Truth
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={index}
              className={`p-4 rounded-2xl glass-card border border-slate-800/80 hover:border-slate-700 transition-all duration-200 group ${stat.glow}`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-300">{stat.title}</span>
                <div className={`p-2 rounded-xl border ${stat.color} transition-transform group-hover:scale-105`}>
                  <Icon className="h-4 w-4" />
                </div>
              </div>
              <div className="text-lg font-black text-white tracking-tight">{stat.value}</div>
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-800/50 text-[11px] text-slate-400">
                <span className="truncate">{stat.subtext}</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800/60 text-slate-300">
                  {stat.badge}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
