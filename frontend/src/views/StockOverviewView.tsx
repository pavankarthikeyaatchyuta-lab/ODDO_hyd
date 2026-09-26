import React, { useState, useEffect } from 'react';
import { ledgerApi, warehousesApi } from '../services/api';
import { StockStatus } from '../types';
import { StockStatusBadge } from '../components/common/Badge';
import { Search, RefreshCw, MapPin } from 'lucide-react';

export const StockOverviewView: React.FC = () => {
  const [overview, setOverview] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [selectedWarehouse, setSelectedWarehouse] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<StockStatus | ''>('');

  const fetchOverview = async () => {
    setLoading(true);
    try {
      const data = await ledgerApi.getInventoryOverview({
        warehouseId: selectedWarehouse || undefined,
        stockStatus: (selectedStatus as StockStatus) || undefined,
        search: search || undefined,
      });
      setOverview(data);
    } catch (err) {
      console.error('Failed to load stock overview:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchWarehouses = async () => {
    try {
      const list = await warehousesApi.listWarehouses();
      setWarehouses(list);
    } catch (err) {
      console.error('Failed to load warehouses:', err);
    }
  };

  useEffect(() => {
    fetchWarehouses();
  }, []);

  useEffect(() => {
    fetchOverview();
  }, [search, selectedWarehouse, selectedStatus]);

  return (
    <div className="space-y-6">
      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900 border border-slate-800">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          <div className="relative min-w-[200px] flex-1 sm:max-w-xs">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search product or SKU..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl bg-slate-950 border border-slate-700/80 pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-sky-500"
            />
          </div>

          <select
            value={selectedWarehouse}
            onChange={(e) => setSelectedWarehouse(e.target.value)}
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
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value as any)}
            className="rounded-xl bg-slate-950 border border-slate-700/80 px-3 py-1.5 text-xs text-white focus:outline-none focus:border-sky-500"
          >
            <option value="">All Stock Statuses</option>
            <option value="IN_STOCK">In Stock</option>
            <option value="LOW_STOCK">Low Stock</option>
            <option value="OUT_OF_STOCK">Out of Stock</option>
          </select>

          <button
            onClick={fetchOverview}
            title="Refresh"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Stock Cards Matrix */}
      {loading ? (
        <div className="p-12 text-center text-slate-400">
          <div className="flex items-center justify-center space-x-2">
            <div className="h-4 w-4 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
            <span>Calculating live location balances...</span>
          </div>
        </div>
      ) : overview.length === 0 ? (
        <div className="p-8 text-center text-slate-400 bg-slate-900 rounded-2xl border border-slate-800">
          No inventory stock records matching criteria.
        </div>
      ) : (
        <div className="space-y-4">
          {overview.map((p) => (
            <div
              key={p.productId}
              className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                <div>
                  <div className="flex items-center space-x-2.5">
                    <h3 className="text-base font-bold text-white tracking-tight">{p.name}</h3>
                    <StockStatusBadge status={p.stockStatus} />
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    SKU: <span className="font-mono text-slate-200">{p.sku}</span> • Category:{' '}
                    <span className="text-slate-300">{p.categoryName}</span>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                      Total Company Stock
                    </span>
                    <span className="text-lg font-black text-white font-mono">
                      {p.totalStock}{' '}
                      <span className="text-xs font-normal text-slate-400">{p.uom}</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Location Breakdown */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                  Location Balances ({p.locations.length} Active Bins)
                </span>
                {p.locations.length === 0 ? (
                  <div className="p-3 text-xs text-slate-400 italic bg-slate-950/60 rounded-xl">
                    No active stock in any physical bin.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
                    {p.locations.map((loc: any) => (
                      <div
                        key={loc.binId}
                        className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 flex items-center justify-between"
                      >
                        <div className="min-w-0 pr-2">
                          <div className="flex items-center space-x-1.5 text-xs text-slate-200 font-mono truncate">
                            <MapPin className="h-3.5 w-3.5 text-emerald-400 flex-shrink-0" />
                            <span className="truncate">{loc.locationPath}</span>
                          </div>
                          <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
                            Barcode: {loc.barcode}
                          </span>
                        </div>
                        <span className="font-mono font-bold text-sky-400 text-sm whitespace-nowrap">
                          {loc.quantity} {p.uom}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
