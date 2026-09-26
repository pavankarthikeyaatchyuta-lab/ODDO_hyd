import React, { useState, useEffect } from 'react';
import { ledgerApi, warehousesApi } from '../services/api';
import { MovementType } from '../types';
import { MovementTypeBadge } from '../components/common/Badge';
import { History, RefreshCw, ArrowDownLeft, ArrowUpRight, ArrowLeftRight, SlidersHorizontal } from 'lucide-react';

export const MoveHistoryView: React.FC = () => {
  const [history, setHistory] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedWarehouse, setSelectedWarehouse] = useState('');
  const [selectedType, setSelectedType] = useState<MovementType | ''>('');

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const data = await ledgerApi.getMoveHistory({
        warehouseId: selectedWarehouse || undefined,
        movementType: (selectedType as MovementType) || undefined,
        limit: 50,
      });
      setHistory(data);
    } catch (err) {
      console.error('Failed to load move history:', err);
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
    fetchHistory();
  }, [selectedWarehouse, selectedType]);

  const getMovementIcon = (type: string) => {
    switch (type) {
      case 'RECEIPT':
        return <ArrowDownLeft className="h-4 w-4 text-emerald-400" />;
      case 'DELIVERY':
        return <ArrowUpRight className="h-4 w-4 text-amber-400" />;
      case 'INTERNAL_TRANSFER':
        return <ArrowLeftRight className="h-4 w-4 text-sky-400" />;
      case 'ADJUSTMENT':
        return <SlidersHorizontal className="h-4 w-4 text-purple-400" />;
      default:
        return <History className="h-4 w-4 text-slate-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Filter Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900 border border-slate-800">
        <div>
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <History className="h-4 w-4 text-sky-400" /> Operational Move History
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Simplified operational timeline of warehouse stock changes
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value as any)}
            className="rounded-xl bg-slate-950 border border-slate-700/80 px-3 py-1.5 text-xs text-white focus:outline-none focus:border-sky-500"
          >
            <option value="">All Movement Types</option>
            <option value="RECEIPT">Receipt</option>
            <option value="DELIVERY">Delivery</option>
            <option value="INTERNAL_TRANSFER">Internal Transfer</option>
            <option value="ADJUSTMENT">Stock Adjustment</option>
          </select>

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

          <button
            onClick={fetchHistory}
            title="Refresh"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Timeline Stream */}
      {loading ? (
        <div className="p-12 text-center text-slate-400">
          <div className="flex items-center justify-center space-x-2">
            <div className="h-4 w-4 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
            <span>Loading movement timeline...</span>
          </div>
        </div>
      ) : history.length === 0 ? (
        <div className="p-8 text-center text-slate-400 bg-slate-900 rounded-2xl border border-slate-800">
          No stock movements recorded yet.
        </div>
      ) : (
        <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-800">
          {history.map((item) => (
            <div
              key={item.id}
              className="relative p-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              {/* Timeline Dot */}
              <div className="absolute -left-[27px] top-5 h-3.5 w-3.5 rounded-full bg-slate-950 border-2 border-sky-500 flex items-center justify-center" />

              <div className="flex items-start space-x-3 min-w-0 flex-1">
                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex-shrink-0 mt-0.5">
                  {getMovementIcon(item.movementType)}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold text-white text-sm">{item.productName}</span>
                    <span className="text-[11px] text-slate-400 font-mono">({item.sku})</span>
                    <MovementTypeBadge type={item.movementType} />
                  </div>

                  <div className="text-xs text-slate-300 mt-1 font-mono">
                    {item.locationSummary}
                  </div>

                  <div className="text-[11px] text-slate-400 mt-0.5">
                    Ref: <span className="text-sky-400">{item.referenceDocNumber || 'Direct'}</span> • By:{' '}
                    {item.performedBy}
                    {item.reason && ` • ${item.reason}`}
                  </div>
                </div>
              </div>

              {/* Quantity Shift & Timestamp */}
              <div className="sm:text-right flex sm:flex-col items-center sm:items-end justify-between border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-800/80">
                <div
                  className={`text-base font-black font-mono ${
                    item.quantity > 0
                      ? 'text-emerald-400'
                      : item.quantity < 0
                      ? 'text-amber-400'
                      : 'text-slate-300'
                  }`}
                >
                  {item.quantity > 0 ? `+${item.quantity}` : item.quantity} {item.uom}
                </div>
                <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                  {new Date(item.timestamp).toLocaleDateString()} {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
