import React from 'react';
import { Package, ArrowDownLeft, ArrowUpRight, Repeat, ShieldAlert } from 'lucide-react';

export const QuickStats: React.FC = () => {
  const kpis = [
    {
      title: 'Total Catalog SKUs',
      value: '1 Active',
      subtext: 'Steel Rods 12mm (STL-12M)',
      icon: Package,
      color: 'text-sky-400 bg-sky-500/10 border-sky-500/20',
    },
    {
      title: 'Inbound Receipts',
      value: '0 Pending',
      subtext: 'PO fulfillment tracking active',
      icon: ArrowDownLeft,
      color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    },
    {
      title: 'Outgoing Deliveries',
      value: '0 Ready',
      subtext: 'Pick, pack & dispatch queue',
      icon: ArrowUpRight,
      color: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    },
    {
      title: 'Internal Transfers',
      value: '0 Scheduled',
      subtext: 'Main Store -> Production Rack',
      icon: Repeat,
      color: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
    },
    {
      title: 'Stock Ledger Journal',
      value: '1 Movement',
      subtext: 'Initial seed stock logged',
      icon: ShieldAlert,
      color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      {kpis.map((kpi, index) => {
        const Icon = kpi.icon;
        return (
          <div
            key={index}
            className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm hover:border-slate-700/80 transition duration-150"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">{kpi.title}</span>
              <div className={`p-2 rounded-xl border ${kpi.color}`}>
                <Icon className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-xl font-bold text-white tracking-tight">{kpi.value}</div>
              <p className="text-[11px] text-slate-500 mt-0.5 truncate">{kpi.subtext}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
};
