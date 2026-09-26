import React, { useState, useEffect } from 'react';
import { operationsApi, productsApi, warehousesApi } from '../services/api';
import { TransferDetail, ProductSummary, BinOption } from '../types';
import { DocumentStatusBadge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { EmptyState } from '../components/common/EmptyState';
import { useAuth } from '../context/AuthContext';
import {
  ArrowLeftRight,
  Plus,
  Search,
  RefreshCw,
  CheckCircle,
  Eye,
  Trash2,
  Truck,
} from 'lucide-react';

export const TransfersView: React.FC = () => {
  const { hasPermission } = useAuth();
  const [transfers, setTransfers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);

  // Detail Modal
  const [selectedTransfer, setSelectedTransfer] = useState<TransferDetail | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Create Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [products, setProducts] = useState<ProductSummary[]>([]);
  const [bins, setBins] = useState<BinOption[]>([]);

  const [sourceWarehouseId, setSourceWarehouseId] = useState('');
  const [destWarehouseId, setDestWarehouseId] = useState('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<Array<{ productId: string; sourceBinId: string; destBinId: string; quantity: number }>>([
    { productId: '', sourceBinId: '', destBinId: '', quantity: 1 },
  ]);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const fetchTransfers = async () => {
    setLoading(true);
    try {
      const res = await operationsApi.listTransfers({
        page,
        limit: 15,
        search: search || undefined,
        status: statusFilter || undefined,
      });
      setTransfers(res.items);
    } catch (err) {
      console.error('Failed to load transfers:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDependencies = async () => {
    try {
      const [whList, prodList, binList] = await Promise.all([
        warehousesApi.listWarehouses(),
        productsApi.listProducts({ limit: 100 }),
        warehousesApi.getAllBins(),
      ]);
      setWarehouses(whList);
      setProducts(prodList.items);
      setBins(binList);
      if (whList.length > 0) {
        setSourceWarehouseId(whList[0].id);
        setDestWarehouseId(whList[1]?.id || whList[0].id);
      }
      if (prodList.items.length > 0 && binList.length >= 2) {
        setItems([
          {
            productId: prodList.items[0].id,
            sourceBinId: binList[0].id,
            destBinId: binList[1].id,
            quantity: 5,
          },
        ]);
      }
    } catch (err) {
      console.error('Failed to fetch transfer dependencies:', err);
    }
  };

  useEffect(() => {
    fetchTransfers();
  }, [page, search, statusFilter]);

  useEffect(() => {
    fetchDependencies();
  }, []);

  const handleOpenDetail = async (id: string) => {
    setActionMessage(null);
    try {
      const detail = await operationsApi.getTransfer(id);
      setSelectedTransfer(detail);
    } catch (err) {
      console.error('Failed to load transfer detail:', err);
    }
  };

  const handleAdvanceStatus = async (status: 'READY' | 'IN_TRANSIT' | 'CANCELLED') => {
    if (!selectedTransfer) return;
    setActionLoading(true);
    setActionMessage(null);
    try {
      await operationsApi.updateTransferStatus(selectedTransfer.id, status);
      setActionMessage({ type: 'success', text: `Transfer status advanced to ${status}` });
      handleOpenDetail(selectedTransfer.id);
      fetchTransfers();
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.response?.data?.error?.message || err.message });
    } finally {
      setActionLoading(false);
    }
  };

  const handleCompleteTransfer = async () => {
    if (!selectedTransfer) return;
    setActionLoading(true);
    setActionMessage(null);
    try {
      await operationsApi.completeTransfer(selectedTransfer.id);
      setActionMessage({
        type: 'success',
        text: 'Transfer successfully completed! Stock moved between locations with zero company net change.',
      });
      handleOpenDetail(selectedTransfer.id);
      fetchTransfers();
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.response?.data?.error?.message || err.message });
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddItem = () => {
    if (products.length > 0 && bins.length >= 2) {
      setItems([
        ...items,
        {
          productId: products[0].id,
          sourceBinId: bins[0].id,
          destBinId: bins[1].id,
          quantity: 1,
        },
      ]);
    }
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setCreateError(null);
    try {
      await operationsApi.createTransfer({
        sourceWarehouseId: sourceWarehouseId || undefined,
        destWarehouseId: destWarehouseId || undefined,
        notes: notes.trim() || undefined,
        items: items.map((i) => ({
          productId: i.productId,
          sourceBinId: i.sourceBinId,
          destBinId: i.destBinId,
          quantity: Number(i.quantity),
        })),
      });

      setShowCreateModal(false);
      setNotes('');
      fetchTransfers();
    } catch (err: any) {
      setCreateError(err.response?.data?.error?.message || err.message || 'Failed to create transfer');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Filter and Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900 border border-slate-800">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          <div className="relative min-w-[200px] flex-1 sm:max-w-xs">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search transfer number..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full rounded-xl bg-slate-950 border border-slate-700/80 pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-sky-500"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="rounded-xl bg-slate-950 border border-slate-700/80 px-3 py-1.5 text-xs text-white focus:outline-none focus:border-sky-500"
          >
            <option value="">All Statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="READY">Ready</option>
            <option value="IN_TRANSIT">In Transit</option>
            <option value="DONE">Done / Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>

          <button
            onClick={fetchTransfers}
            title="Refresh"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {hasPermission('stock:transfer') && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold shadow-md shadow-sky-600/20 transition-all hover:scale-[1.02]"
          >
            <Plus className="h-4 w-4" /> New Transfer
          </button>
        )}
      </div>

      {/* Transfers Table */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 text-slate-400 uppercase tracking-wider text-[11px] border-b border-slate-800">
              <tr>
                <th className="px-5 py-3 font-bold">Transfer Number</th>
                <th className="px-4 py-3 font-bold">Source Warehouse</th>
                <th className="px-4 py-3 font-bold">Destination Warehouse</th>
                <th className="px-4 py-3 font-bold text-center">Items / Qty</th>
                <th className="px-4 py-3 font-bold text-center">Status</th>
                <th className="px-4 py-3 font-bold">Initiated Date</th>
                <th className="px-5 py-3 font-bold text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-slate-400">
                    <div className="flex items-center justify-center space-x-2">
                      <div className="h-4 w-4 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
                      <span>Loading scheduled transfers...</span>
                    </div>
                  </td>
                </tr>
              ) : transfers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8">
                    <EmptyState
                      icon={<ArrowLeftRight className="h-8 w-8 text-sky-400" />}
                      title="No internal transfers found"
                      description="Schedule a stock movement between warehouse racks, zones, or facilities."
                      actionText={hasPermission('stock:transfer') ? 'New Transfer' : undefined}
                      onAction={() => setShowCreateModal(true)}
                    />
                  </td>
                </tr>
              ) : (
                transfers.map((t) => (
                  <tr
                    key={t.id}
                    onClick={() => handleOpenDetail(t.id)}
                    className="hover:bg-slate-800/40 transition-colors cursor-pointer group"
                  >
                    <td className="px-5 py-3.5 font-bold font-mono text-white group-hover:text-sky-300 transition-colors">
                      {t.transferNumber}
                    </td>
                    <td className="px-4 py-3.5 text-slate-200">{t.sourceWarehouseName}</td>
                    <td className="px-4 py-3.5 text-slate-200">{t.destWarehouseName}</td>
                    <td className="px-4 py-3.5 text-center font-mono">
                      <span className="text-white font-bold">{t.itemCount}</span> items (
                      <span className="text-sky-400 font-bold">{t.totalQuantity}</span> units)
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <DocumentStatusBadge status={t.status} />
                    </td>
                    <td className="px-4 py-3.5 text-slate-400 text-[11px]">
                      {new Date(t.initiatedAt).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenDetail(t.id);
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
      </div>

      {/* Transfer Detail Modal */}
      <Modal
        isOpen={Boolean(selectedTransfer)}
        onClose={() => setSelectedTransfer(null)}
        title={`Transfer: ${selectedTransfer?.transferNumber}`}
        subtitle="Zero-delta location relocation with double-entry ledger guarantee"
        maxWidth="3xl"
      >
        {selectedTransfer && (
          <div className="space-y-6 text-xs">
            {actionMessage && (
              <div
                className={`p-3 rounded-xl border ${
                  actionMessage.type === 'success'
                    ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                    : 'bg-rose-500/15 border-rose-500/30 text-rose-300'
                }`}
              >
                {actionMessage.text}
              </div>
            )}

            {/* Workflow Control Bar */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
              <div>
                <span className="text-slate-400 block text-[11px]">Current Status</span>
                <div className="mt-1 flex items-center space-x-2">
                  <DocumentStatusBadge status={selectedTransfer.status} />
                  {selectedTransfer.status === 'DONE' && (
                    <span className="text-[11px] text-emerald-400 font-semibold">
                      ✓ Stock relocated (Net company variance = 0)
                    </span>
                  )}
                </div>
              </div>

              {hasPermission('stock:transfer') && (
                <div className="flex flex-wrap items-center gap-2">
                  {selectedTransfer.status === 'DRAFT' && (
                    <button
                      disabled={actionLoading}
                      onClick={() => handleAdvanceStatus('READY')}
                      className="px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-semibold transition-all"
                    >
                      Mark Ready
                    </button>
                  )}

                  {(selectedTransfer.status === 'DRAFT' || selectedTransfer.status === 'READY') && (
                    <button
                      disabled={actionLoading}
                      onClick={() => handleAdvanceStatus('IN_TRANSIT')}
                      className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold flex items-center gap-1.5 transition-all"
                    >
                      <Truck className="h-3.5 w-3.5" /> Dispatch In-Transit
                    </button>
                  )}

                  {selectedTransfer.status !== 'DONE' && selectedTransfer.status !== 'CANCELLED' && (
                    <button
                      disabled={actionLoading}
                      onClick={handleCompleteTransfer}
                      className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold flex items-center gap-1.5 shadow-md shadow-emerald-600/30 transition-all hover:scale-[1.02]"
                    >
                      <CheckCircle className="h-3.5 w-3.5" /> Complete Transfer
                    </button>
                  )}

                  {selectedTransfer.status !== 'DONE' && selectedTransfer.status !== 'CANCELLED' && (
                    <button
                      disabled={actionLoading}
                      onClick={() => handleAdvanceStatus('CANCELLED')}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-rose-950/60 hover:text-rose-300 text-slate-400 font-semibold transition-colors"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Transfer Items Table */}
            <div className="space-y-2">
              <h4 className="font-bold text-white text-xs uppercase tracking-wider">
                Relocation Items ({selectedTransfer.items.length})
              </h4>
              <div className="divide-y divide-slate-800/80 rounded-xl bg-slate-950 border border-slate-800 overflow-hidden">
                {selectedTransfer.items.map((item: any) => (
                  <div key={item.id} className="p-3.5 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="font-bold text-white text-sm">{item.productName}</div>
                      <div className="text-right">
                        <span className="text-sm font-extrabold text-sky-400 font-mono">
                          {item.quantity}
                        </span>{' '}
                        <span className="text-[10px] text-slate-400">{item.uom}</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] pt-1 border-t border-slate-800/60">
                      <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                        <span className="text-slate-400 block text-[10px]">Source Location (-{item.quantity})</span>
                        <span className="text-rose-300 font-mono">{item.sourceBinPath}</span>
                      </div>
                      <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                        <span className="text-slate-400 block text-[10px]">Destination Location (+{item.quantity})</span>
                        <span className="text-emerald-300 font-mono">{item.destBinPath}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Create Transfer Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Schedule Internal Stock Transfer"
        subtitle="Move items between warehouse bins without changing company net balance"
        maxWidth="3xl"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
          {createError && (
            <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300">
              {createError}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Source Warehouse</label>
              <select
                value={sourceWarehouseId}
                onChange={(e) => setSourceWarehouseId(e.target.value)}
                className="w-full rounded-xl bg-slate-950 border border-slate-700/80 px-3 py-2 text-white focus:outline-none focus:border-sky-500"
              >
                <option value="">Select origin warehouse...</option>
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name} ({w.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Destination Warehouse</label>
              <select
                value={destWarehouseId}
                onChange={(e) => setDestWarehouseId(e.target.value)}
                className="w-full rounded-xl bg-slate-950 border border-slate-700/80 px-3 py-2 text-white focus:outline-none focus:border-sky-500"
              >
                <option value="">Select destination warehouse...</option>
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name} ({w.code})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Transfer Notes</label>
            <input
              type="text"
              placeholder="e.g. Replenishment transfer from Main to Production Floor"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-xl bg-slate-950 border border-slate-700/80 px-3 py-2 text-white focus:outline-none focus:border-sky-500"
            />
          </div>

          {/* Transfer Items */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-white uppercase tracking-wider text-[11px]">
                Items to Transfer
              </span>
              <button
                type="button"
                onClick={handleAddItem}
                className="text-xs text-sky-400 hover:text-sky-300 font-semibold flex items-center gap-1"
              >
                <Plus className="h-3.5 w-3.5" /> Add Another Product
              </button>
            </div>

            <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
              {items.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2.5"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex-1">
                      <label className="block text-slate-400 text-[10px] mb-1">Product</label>
                      <select
                        value={item.productId}
                        onChange={(e) => {
                          const copy = [...items];
                          copy[idx].productId = e.target.value;
                          setItems(copy);
                        }}
                        className="w-full rounded-lg bg-slate-900 border border-slate-700 px-2.5 py-1.5 text-white"
                      >
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} ({p.sku})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="w-28">
                      <label className="block text-slate-400 text-[10px] mb-1">Quantity</label>
                      <input
                        type="number"
                        min="1"
                        required
                        value={item.quantity}
                        onChange={(e) => {
                          const copy = [...items];
                          copy[idx].quantity = Number(e.target.value);
                          setItems(copy);
                        }}
                        className="w-full rounded-lg bg-slate-900 border border-slate-700 px-2.5 py-1.5 text-white font-mono"
                      />
                    </div>

                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(idx)}
                        className="p-2 text-slate-400 hover:text-rose-400 self-end"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px]">
                    <div>
                      <label className="block text-slate-400 mb-1">Source Location</label>
                      <select
                        value={item.sourceBinId}
                        onChange={(e) => {
                          const copy = [...items];
                          copy[idx].sourceBinId = e.target.value;
                          setItems(copy);
                        }}
                        className="w-full rounded-lg bg-slate-900 border border-slate-700 px-2.5 py-1 text-white"
                      >
                        {bins.map((b) => (
                          <option key={b.id} value={b.id}>
                            {b.locationPath}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-400 mb-1">Destination Location</label>
                      <select
                        value={item.destBinId}
                        onChange={(e) => {
                          const copy = [...items];
                          copy[idx].destBinId = e.target.value;
                          setItems(copy);
                        }}
                        className="w-full rounded-lg bg-slate-900 border border-slate-700 px-2.5 py-1 text-white"
                      >
                        {bins.map((b) => (
                          <option key={b.id} value={b.id}>
                            {b.locationPath}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setShowCreateModal(false)}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={creating}
              className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-semibold shadow-md shadow-sky-600/20 disabled:opacity-50"
            >
              {creating ? 'Saving...' : 'Schedule Transfer'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
