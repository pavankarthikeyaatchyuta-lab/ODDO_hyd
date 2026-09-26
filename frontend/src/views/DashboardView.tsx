import React, { useState, useEffect } from 'react';
import { dashboardApi, warehousesApi, productsApi } from '../services/api';
import { DashboardKPIs, CategorySummary } from '../types';
import { StockStatusBadge, DocumentStatusBadge, MovementTypeBadge } from '../components/common/Badge';
import { NavigationPage } from '../components/layout/Sidebar';
import {
  PackageCheck,
  AlertTriangle,
  AlertOctagon,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeftRight,
  Plus,
  RefreshCw,
  SlidersHorizontal,
  ChevronRight,
  Boxes,
  Layers,
} from 'lucide-react';

interface DashboardViewProps {
  onNavigate: (page: NavigationPage) => void;
  onOpenQuickAction: (action: 'product' | 'receipt' | 'delivery' | 'transfer' | 'adjustment') => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onNavigate,
  onOpenQuickAction,
}) => {
  const [kpis, setKpis] = useState<DashboardKPIs | null>(null);
  const [recentActivity, setRecentActivity] = useState<any | null>(null);
  const [alerts, setAlerts] = useState<{ lowStock: any[]; outOfStock: any[] } | null>(null);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [categories, setCategories] = useState<CategorySummary[]>([]);
  
  // Filters
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [kpiRes, actRes, alertRes, whRes, catRes] = await Promise.all([
        dashboardApi.getKPIs({
          warehouseId: selectedWarehouseId || undefined,
          categoryId: selectedCategoryId || undefined,
        }),
        dashboardApi.getRecentActivity(5),
        dashboardApi.getAlerts(),
        warehousesApi.listWarehouses(),
        productsApi.listCategories(),
      ]);

      setKpis(kpiRes);
      setRecentActivity(actRes);
      setAlerts(alertRes);
      setWarehouses(whRes);
      setCategories(catRes);
    } catch (err) {
      console.error('Failed to load dashboard telemetry:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [selectedWarehouseId, selectedCategoryId]);

  return (
    <div className="space-y-6">
      {/* Dynamic Filters Bar & Quick Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm">
        {/* Dynamic Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Filters:
          </span>
          <select
            value={selectedWarehouseId}
            onChange={(e) => setSelectedWarehouseId(e.target.value)}
            className="rounded-xl bg-slate-950 border border-slate-700/80 px-3 py-1.5 text-xs text-white focus:outline-none focus:border-sky-500"
          >
            <option value="">All Warehouses</option>
            {warehouses.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name} ({w.code})
              </option>
            ))}
          </select>

          <select
            value={selectedCategoryId}
            onChange={(e) => setSelectedCategoryId(e.target.value)}
            className="rounded-xl bg-slate-950 border border-slate-700/80 px-3 py-1.5 text-xs text-white focus:outline-none focus:border-sky-500"
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <button
            onClick={fetchDashboardData}
            title="Refresh Metrics"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Quick Action Toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => onOpenQuickAction('product')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold border border-slate-700 transition-all hover:scale-[1.02]"
          >
            <Plus className="h-3.5 w-3.5 text-sky-400" /> Product
          </button>
          <button
            onClick={() => onOpenQuickAction('receipt')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-300 text-xs font-semibold border border-emerald-800/60 transition-all hover:scale-[1.02]"
          >
            <ArrowDownLeft className="h-3.5 w-3.5 text-emerald-400" /> Receipt
          </button>
          <button
            onClick={() => onOpenQuickAction('delivery')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-950/60 hover:bg-amber-900/60 text-amber-300 text-xs font-semibold border border-amber-800/60 transition-all hover:scale-[1.02]"
          >
            <ArrowUpRight className="h-3.5 w-3.5 text-amber-400" /> Delivery
          </button>
          <button
            onClick={() => onOpenQuickAction('transfer')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-950/60 hover:bg-sky-900/60 text-sky-300 text-xs font-semibold border border-sky-800/60 transition-all hover:scale-[1.02]"
          >
            <ArrowLeftRight className="h-3.5 w-3.5 text-sky-400" /> Transfer
          </button>
          <button
            onClick={() => onOpenQuickAction('adjustment')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-950/60 hover:bg-purple-900/60 text-purple-300 text-xs font-semibold border border-purple-800/60 transition-all hover:scale-[1.02]"
          >
            <SlidersHorizontal className="h-3.5 w-3.5 text-purple-400" /> Stock Adjustment
          </button>
        </div>
      </div>

      {/* Exact Required 6 KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* 1. Total Products in Stock */}
        <div 
          onClick={() => onNavigate('products')}
          className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-sky-500/50 transition-all cursor-pointer group shadow-sm"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">In Stock Products</span>
            <div className="p-2 rounded-xl bg-sky-500/10 text-sky-400 group-hover:scale-110 transition-transform">
              <PackageCheck className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-white">
            {loading ? '...' : kpis?.totalProductsInStock ?? 0}
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2 pt-2 border-t border-slate-800/60">
            <span>Total Units: {kpis?.totalStockUnits ?? 0}</span>
            <ChevronRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>

        {/* 2. Low Stock Items */}
        <div 
          onClick={() => onNavigate('products')}
          className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-amber-500/50 transition-all cursor-pointer group shadow-sm"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400/90">Low Stock Items</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 group-hover:scale-110 transition-transform">
              <AlertTriangle className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-300">
            {loading ? '...' : kpis?.lowStockItemsCount ?? 0}
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2 pt-2 border-t border-slate-800/60">
            <span>Below reorder rule</span>
            <ChevronRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>

        {/* 3. Out of Stock Items */}
        <div 
          onClick={() => onNavigate('products')}
          className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-rose-500/50 transition-all cursor-pointer group shadow-sm"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-400/90">Out of Stock</span>
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400 group-hover:scale-110 transition-transform">
              <AlertOctagon className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-rose-400">
            {loading ? '...' : kpis?.outOfStockItemsCount ?? 0}
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2 pt-2 border-t border-slate-800/60">
            <span>0 units remaining</span>
            <ChevronRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>

        {/* 4. Pending Receipts */}
        <div 
          onClick={() => onNavigate('receipts')}
          className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-emerald-500/50 transition-all cursor-pointer group shadow-sm"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400/90">Pending Receipts</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 group-hover:scale-110 transition-transform">
              <ArrowDownLeft className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-300">
            {loading ? '...' : kpis?.pendingReceiptsCount ?? 0}
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2 pt-2 border-t border-slate-800/60">
            <span>Awaiting validation</span>
            <ChevronRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>

        {/* 5. Pending Deliveries */}
        <div 
          onClick={() => onNavigate('deliveries')}
          className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-amber-500/50 transition-all cursor-pointer group shadow-sm"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400/90">Pending Deliveries</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 group-hover:scale-110 transition-transform">
              <ArrowUpRight className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-300">
            {loading ? '...' : kpis?.pendingDeliveriesCount ?? 0}
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2 pt-2 border-t border-slate-800/60">
            <span>Ready / Picking / Packed</span>
            <ChevronRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>

        {/* 6. Internal Transfers Scheduled */}
        <div 
          onClick={() => onNavigate('transfers')}
          className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-sky-500/50 transition-all cursor-pointer group shadow-sm"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-sky-400/90">Scheduled Transfers</span>
            <div className="p-2 rounded-xl bg-sky-500/10 text-sky-400 group-hover:scale-110 transition-transform">
              <ArrowLeftRight className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-sky-300">
            {loading ? '...' : kpis?.scheduledTransfersCount ?? 0}
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2 pt-2 border-t border-slate-800/60">
            <span>In Transit / Scheduled</span>
            <ChevronRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>
      </div>

      {/* Stock Alerts & Reorder Guidance Banner */}
      {(alerts?.lowStock?.length || alerts?.outOfStock?.length) ? (
        <div className="p-4 rounded-2xl bg-amber-950/20 border border-amber-800/40">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-4 w-4 text-amber-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-amber-300">
                Action Required: Low Stock & Reordering Alerts
              </h3>
            </div>
            <button
              onClick={() => onNavigate('products')}
              className="text-xs text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1"
            >
              View All Products <ChevronRight className="h-3 w-3" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {[...(alerts.outOfStock || []), ...(alerts.lowStock || [])].slice(0, 3).map((item) => (
              <div
                key={item.id}
                className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between"
              >
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold text-white">{item.name}</span>
                    <StockStatusBadge status={item.stockStatus} />
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1 font-mono">
                    SKU: {item.sku} | Current: <strong className="text-white">{item.currentStock}</strong> {item.uom} (Min: {item.minStock})
                  </div>
                </div>
                <button
                  onClick={() => onOpenQuickAction('receipt')}
                  className="px-2.5 py-1 rounded-lg bg-emerald-600/30 text-emerald-300 text-[11px] font-semibold hover:bg-emerald-600/50 transition-colors"
                >
                  Reorder
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {/* Dual Activity Grid: Recent Operations & Live Movement Ledger */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Recent Operations (Receipts & Deliveries) */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Boxes className="h-4 w-4 text-sky-400" /> Recent Operations
            </h3>
            <span className="text-xs text-slate-400">Live Intake & Dispatch</span>
          </div>

          <div className="space-y-3">
            {recentActivity?.recentReceipts?.slice(0, 3).map((r: any) => (
              <div
                key={r.id}
                onClick={() => onNavigate('receipts')}
                className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 transition-colors cursor-pointer flex items-center justify-between"
              >
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                    <ArrowDownLeft className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">{r.receiptNumber}</div>
                    <div className="text-[11px] text-slate-400">
                      From: {r.supplierName} • {r.itemCount} items
                    </div>
                  </div>
                </div>
                <DocumentStatusBadge status={r.status} />
              </div>
            ))}

            {recentActivity?.recentDeliveries?.slice(0, 3).map((d: any) => (
              <div
                key={d.id}
                onClick={() => onNavigate('deliveries')}
                className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 transition-colors cursor-pointer flex items-center justify-between"
              >
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
                    <ArrowUpRight className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">{d.doNumber}</div>
                    <div className="text-[11px] text-slate-400">
                      To: {d.customerName} • {d.itemCount} items
                    </div>
                  </div>
                </div>
                <DocumentStatusBadge status={d.status} />
              </div>
            ))}
          </div>
        </div>

        {/* Right: Live Stock Ledger Stream */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Layers className="h-4 w-4 text-emerald-400" /> Recent Move History
            </h3>
            <button
              onClick={() => onNavigate('stock-ledger')}
              className="text-xs text-sky-400 hover:text-sky-300 font-semibold"
            >
              Open Ledger →
            </button>
          </div>

          <div className="space-y-3">
            {recentActivity?.recentMovements?.slice(0, 6).map((m: any) => (
              <div
                key={m.id}
                className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between text-xs"
              >
                <div className="min-w-0 pr-3">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-white truncate">{m.productName}</span>
                    <span className="text-[10px] text-slate-400 font-mono">({m.sku})</span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    Ref: {m.reference || 'Manual'} • By: {m.performedBy}
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <MovementTypeBadge type={m.movementType} quantity={m.quantity} />
                  <div className="text-[10px] text-slate-400 font-mono mt-1">
                    Balance: {m.qtyAfter} {m.uom}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
