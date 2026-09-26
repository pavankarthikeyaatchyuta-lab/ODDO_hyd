import React, { useState, useEffect } from 'react';
import { ledgerApi, warehousesApi } from '../services/api';
import { StockLedgerEntry, MovementType } from '../types';
import { MovementTypeBadge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { EmptyState } from '../components/common/EmptyState';
import {
  BookOpen,
  Search,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Eye,
} from 'lucide-react';

export const StockLedgerView: React.FC = () => {
  const [entries, setEntries] = useState<StockLedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Pagination
  const [search, setSearch] = useState('');
  const [movementType, setMovementType] = useState<MovementType | ''>('');
  const [selectedWarehouse, setSelectedWarehouse] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Detail Modal
  const [selectedEntry, setSelectedEntry] = useState<StockLedgerEntry | null>(null);

  const [warehouses, setWarehouses] = useState<any[]>([]);

  const fetchLedger = async () => {
    setLoading(true);
    try {
      const res = await ledgerApi.getStockLedger({
        page,
        limit: 15,
        search: search || undefined,
        movementType: (movementType as MovementType) || undefined,
        warehouseId: selectedWarehouse || undefined,
        startDate: startDate ? new Date(startDate).toISOString() : undefined,
        endDate: endDate ? new Date(endDate).toISOString() : undefined,
      });
      setEntries(res.items);
      setTotalPages(res.pagination.totalPages);
    } catch (err) {
      console.error('Failed to load ledger journal:', err);
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
    fetchLedger();
  }, [page, search, movementType, selectedWarehouse, startDate, endDate]);

  return (
    <div className="space-y-6">
      {/* Top Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3 flex-1">
            {/* Search */}
            <div className="relative min-w-[220px] flex-1 sm:max-w-xs">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search SKU, reference, or reason..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="w-full rounded-xl bg-slate-950 border border-slate-700/80 pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Movement Type Filter */}
            <select
              value={movementType}
              onChange={(e) => {
                setMovementType(e.target.value as any);
                setPage(1);
              }}
              className="rounded-xl bg-slate-950 border border-slate-700/80 px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
            >
              <option value="">All Movement Types</option>
              <option value="RECEIPT">Receipt</option>
              <option value="DELIVERY">Delivery</option>
              <option value="INTERNAL_TRANSFER">Internal Transfer</option>
              <option value="ADJUSTMENT">Stock Adjustment</option>
            </select>

            {/* Warehouse Filter */}
            <select
              value={selectedWarehouse}
              onChange={(e) => {
                setSelectedWarehouse(e.target.value);
                setPage(1);
              }}
              className="rounded-xl bg-slate-950 border border-slate-700/80 px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
            >
              <option value="">All Warehouses</option>
              {warehouses.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name} ({w.code})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1.5 text-xs text-slate-400 bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-xl">
              <Calendar className="h-3.5 w-3.5 text-sky-400" />
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-transparent text-white focus:outline-none"
              />
              <span>to</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-transparent text-white focus:outline-none"
              />
            </div>

            <button
              onClick={fetchLedger}
              title="Refresh"
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Ledger Journal Table */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 text-slate-400 uppercase tracking-wider text-[11px] border-b border-slate-800">
              <tr>
                <th className="px-5 py-3 font-bold">Timestamp</th>
                <th className="px-4 py-3 font-bold">Product / SKU</th>
                <th className="px-4 py-3 font-bold">Movement Type</th>
                <th className="px-4 py-3 font-bold">Location Path</th>
                <th className="px-4 py-3 font-bold text-right">Quantity</th>
                <th className="px-4 py-3 font-bold text-center">Before → After</th>
                <th className="px-4 py-3 font-bold">Reference Doc</th>
                <th className="px-4 py-3 font-bold">Performed By</th>
                <th className="px-4 py-3 font-bold text-center">Detail</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={9} className="px-5 py-12 text-center text-slate-400">
                    <div className="flex items-center justify-center space-x-2">
                      <div className="h-4 w-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                      <span>Loading immutable stock ledger journal...</span>
                    </div>
                  </td>
                </tr>
              ) : entries.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8">
                    <EmptyState
                      icon={<BookOpen className="h-8 w-8 text-emerald-400" />}
                      title="No ledger records found"
                      description="Inventory transactions and movements will be permanently audited here."
                    />
                  </td>
                </tr>
              ) : (
                entries.map((entry) => (
                  <tr
                    key={entry.id}
                    onClick={() => setSelectedEntry(entry)}
                    className="hover:bg-slate-800/40 transition-colors cursor-pointer group"
                  >
                    <td className="px-5 py-3.5 text-slate-400 font-mono text-[11px] whitespace-nowrap">
                      <div>{new Date(entry.timestamp).toLocaleDateString()}</div>
                      <div className="text-[10px] text-slate-400">{new Date(entry.timestamp).toLocaleTimeString()}</div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="font-bold text-white group-hover:text-emerald-300 transition-colors">
                        {entry.productName}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">{entry.sku}</div>
                    </td>
                    <td className="px-4 py-3.5">
                      <MovementTypeBadge type={entry.movementType} />
                    </td>
                    <td className="px-4 py-3.5 text-slate-300 font-mono text-[11px] max-w-[200px] truncate" title={entry.locationPath}>
                      {entry.locationPath}
                    </td>
                    <td className="px-4 py-3.5 text-right font-mono font-extrabold whitespace-nowrap">
                      <span
                        className={
                          entry.quantity > 0
                            ? 'text-emerald-400'
                            : entry.quantity < 0
                            ? 'text-rose-400'
                            : 'text-slate-300'
                        }
                      >
                        {entry.quantity > 0 ? `+${entry.quantity}` : entry.quantity} {entry.uom}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-center font-mono text-[11px] whitespace-nowrap">
                      <span className="text-slate-400">{entry.qtyBefore}</span>
                      <span className="text-slate-400 mx-1">→</span>
                      <strong className="text-white">{entry.qtyAfter}</strong>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="font-mono text-xs font-semibold text-sky-400">
                        {entry.referenceDocNumber || entry.referenceDocType || 'Direct'}
                      </span>
                      {entry.reason && (
                        <div className="text-[10px] text-slate-400 truncate max-w-[150px]" title={entry.reason}>
                          {entry.reason}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-slate-300 text-[11px]">
                      {entry.performedByName || 'System'}
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedEntry(entry);
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-slate-800 bg-slate-950/40 text-xs">
            <span className="text-slate-400">
              Page {page} of {totalPages}
            </span>
            <div className="flex items-center space-x-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white disabled:opacity-40 transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white disabled:opacity-40 transition-colors"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Ledger Entry Detail Modal */}
      <Modal
        isOpen={Boolean(selectedEntry)}
        onClose={() => setSelectedEntry(null)}
        title="Stock Ledger Audit Entry"
        subtitle={`Audit ID: ${selectedEntry?.id}`}
        maxWidth="2xl"
      >
        {selectedEntry && (
          <div className="space-y-4 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-slate-400 text-[11px] block">Movement Type</span>
                <div className="mt-1">
                  <MovementTypeBadge type={selectedEntry.movementType} quantity={selectedEntry.quantity} />
                </div>
              </div>
              <div className="text-right">
                <span className="text-slate-400 text-[11px] block">Timestamp</span>
                <span className="text-slate-200 font-mono text-xs mt-1 block">
                  {new Date(selectedEntry.timestamp).toLocaleString()}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-400 text-[11px] block">Product & SKU</span>
                <strong className="text-white text-xs mt-1 block">
                  {selectedEntry.productName}
                </strong>
                <span className="text-[10px] text-slate-400 font-mono">
                  SKU: {selectedEntry.sku}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-400 text-[11px] block">Stock Delta</span>
                <div className="mt-1 font-mono text-xs">
                  <span className="text-slate-400">Before: {selectedEntry.qtyBefore}</span>
                  <span className="text-slate-400 mx-1.5">→</span>
                  <strong className="text-white">After: {selectedEntry.qtyAfter}</strong>
                </div>
                <span className="text-[10px] text-emerald-400 font-mono">
                  Net: {selectedEntry.quantity > 0 ? `+${selectedEntry.quantity}` : selectedEntry.quantity} {selectedEntry.uom}
                </span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
              <span className="text-slate-400 text-[11px] block">Location Breadcrumb</span>
              <span className="text-white font-mono text-xs block">{selectedEntry.locationPath}</span>
              {selectedEntry.sourceLocation && selectedEntry.destLocation && (
                <div className="text-[11px] text-sky-400 pt-1 font-mono">
                  {selectedEntry.sourceLocation} → {selectedEntry.destLocation}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-400 text-[11px] block">Reference Document</span>
                <span className="text-sky-400 font-bold font-mono text-xs mt-1 block">
                  {selectedEntry.referenceDocNumber || 'None'}
                </span>
                <span className="text-[10px] text-slate-400">
                  Type: {selectedEntry.referenceDocType || 'Direct'}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-400 text-[11px] block">Performed By</span>
                <span className="text-white text-xs mt-1 block font-semibold">
                  {selectedEntry.performedByName || 'System Automated'}
                </span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-slate-400 text-[11px] block">Audit Reason / Description</span>
              <p className="text-slate-200 mt-1">{selectedEntry.reason || 'Standard inventory operation transaction'}</p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
