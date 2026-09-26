import React, { useState, useEffect } from 'react';
import { operationsApi, productsApi, warehousesApi } from '../services/api';
import { ReceiptDetail, ProductSummary, BinOption } from '../types';
import { DocumentStatusBadge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { EmptyState } from '../components/common/EmptyState';
import { useAuth } from '../context/AuthContext';
import {
  ArrowDownLeft,
  Plus,
  Search,
  RefreshCw,
  CheckCircle,
  Clock,
  Eye,
  Trash2,
} from 'lucide-react';

export const ReceiptsView: React.FC = () => {
  const { hasPermission } = useAuth();
  const [receipts, setReceipts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);

  // Detail Modal
  const [selectedReceipt, setSelectedReceipt] = useState<ReceiptDetail | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Create Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [products, setProducts] = useState<ProductSummary[]>([]);
  const [bins, setBins] = useState<BinOption[]>([]);

  const [supplierId, setSupplierId] = useState('');
  const [warehouseId, setWarehouseId] = useState('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<Array<{ productId: string; binId: string; quantityReceived: number }>>([
    { productId: '', binId: '', quantityReceived: 1 },
  ]);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const fetchReceipts = async () => {
    setLoading(true);
    try {
      const res = await operationsApi.listReceipts({
        page,
        limit: 15,
        search: search || undefined,
        status: statusFilter || undefined,
      });
      setReceipts(res.items);
    } catch (err) {
      console.error('Failed to load receipts:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDependencies = async () => {
    try {
      const [supList, whList, prodList, binList] = await Promise.all([
        operationsApi.listSuppliers(),
        warehousesApi.listWarehouses(),
        productsApi.listProducts({ limit: 100 }),
        warehousesApi.getAllBins(),
      ]);
      setSuppliers(supList);
      setWarehouses(whList);
      setProducts(prodList.items);
      setBins(binList);
      if (supList.length > 0) setSupplierId(supList[0].id);
      if (whList.length > 0) setWarehouseId(whList[0].id);
      if (prodList.items.length > 0 && binList.length > 0) {
        setItems([{ productId: prodList.items[0].id, binId: binList[0].id, quantityReceived: 10 }]);
      }
    } catch (err) {
      console.error('Failed to fetch dependencies:', err);
    }
  };

  useEffect(() => {
    fetchReceipts();
  }, [page, search, statusFilter]);

  useEffect(() => {
    fetchDependencies();
  }, []);

  const handleOpenDetail = async (id: string) => {
    setActionMessage(null);
    try {
      const detail = await operationsApi.getReceipt(id);
      setSelectedReceipt(detail);
    } catch (err) {
      console.error('Failed to load receipt details:', err);
    }
  };

  const handleAdvanceStatus = async (status: 'READY' | 'CANCELLED') => {
    if (!selectedReceipt) return;
    setActionLoading(true);
    setActionMessage(null);
    try {
      await operationsApi.updateReceiptStatus(selectedReceipt.id, status);
      setActionMessage({ type: 'success', text: `Receipt status transitioned to ${status}` });
      handleOpenDetail(selectedReceipt.id);
      fetchReceipts();
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.response?.data?.error?.message || err.message });
    } finally {
      setActionLoading(false);
    }
  };

  const handleValidateReceipt = async () => {
    if (!selectedReceipt) return;
    setActionLoading(true);
    setActionMessage(null);
    try {
      await operationsApi.validateReceipt(selectedReceipt.id);
      setActionMessage({
        type: 'success',
        text: 'Receipt successfully validated! Inventory balances increased and recorded in Stock Ledger.',
      });
      handleOpenDetail(selectedReceipt.id);
      fetchReceipts();
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.response?.data?.error?.message || err.message });
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddItem = () => {
    if (products.length > 0 && bins.length > 0) {
      setItems([...items, { productId: products[0].id, binId: bins[0].id, quantityReceived: 1 }]);
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
      await operationsApi.createReceipt({
        supplierId: supplierId || undefined,
        warehouseId: warehouseId || undefined,
        notes: notes.trim() || undefined,
        items: items.map((i) => ({
          productId: i.productId,
          binId: i.binId,
          quantityReceived: Number(i.quantityReceived),
        })),
      });

      setShowCreateModal(false);
      setNotes('');
      fetchReceipts();
    } catch (err: any) {
      setCreateError(err.response?.data?.error?.message || err.message || 'Failed to create receipt');
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
              placeholder="Search receipt number or supplier..."
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
            <option value="DONE">Done / Validated</option>
            <option value="CANCELLED">Cancelled</option>
          </select>

          <button
            onClick={fetchReceipts}
            title="Refresh"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {hasPermission('stock:receive') && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md shadow-emerald-600/20 transition-all hover:scale-[1.02]"
          >
            <Plus className="h-4 w-4" /> New Receipt
          </button>
        )}
      </div>

      {/* Receipts List Table */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 text-slate-400 uppercase tracking-wider text-[11px] border-b border-slate-800">
              <tr>
                <th className="px-5 py-3 font-bold">Receipt Number</th>
                <th className="px-4 py-3 font-bold">Supplier</th>
                <th className="px-4 py-3 font-bold">Warehouse</th>
                <th className="px-4 py-3 font-bold text-center">Items / Qty</th>
                <th className="px-4 py-3 font-bold text-center">Status</th>
                <th className="px-4 py-3 font-bold">Date Created</th>
                <th className="px-5 py-3 font-bold text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-slate-400">
                    <div className="flex items-center justify-center space-x-2">
                      <div className="h-4 w-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                      <span>Loading incoming receipts...</span>
                    </div>
                  </td>
                </tr>
              ) : receipts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8">
                    <EmptyState
                      icon={<ArrowDownLeft className="h-8 w-8 text-emerald-400" />}
                      title="No receipts found"
                      description="Create an incoming receipt to record vendor shipments and increment stock."
                      actionText={hasPermission('stock:receive') ? 'New Receipt' : undefined}
                      onAction={() => setShowCreateModal(true)}
                    />
                  </td>
                </tr>
              ) : (
                receipts.map((r) => (
                  <tr
                    key={r.id}
                    onClick={() => handleOpenDetail(r.id)}
                    className="hover:bg-slate-800/40 transition-colors cursor-pointer group"
                  >
                    <td className="px-5 py-3.5 font-bold font-mono text-white group-hover:text-emerald-300 transition-colors">
                      {r.receiptNumber}
                    </td>
                    <td className="px-4 py-3.5 text-slate-200">{r.supplierName}</td>
                    <td className="px-4 py-3.5 text-slate-400">{r.warehouseName}</td>
                    <td className="px-4 py-3.5 text-center font-mono">
                      <span className="text-white font-bold">{r.itemCount}</span> items (
                      <span className="text-emerald-400 font-bold">+{r.totalQuantity}</span> units)
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <DocumentStatusBadge status={r.status} />
                    </td>
                    <td className="px-4 py-3.5 text-slate-400 text-[11px]">
                      {new Date(r.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenDetail(r.id);
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

      {/* Receipt Detail Modal */}
      <Modal
        isOpen={Boolean(selectedReceipt)}
        onClose={() => setSelectedReceipt(null)}
        title={`Receipt: ${selectedReceipt?.receiptNumber}`}
        subtitle={`Workflow: Draft → Ready → Validated → Done`}
        maxWidth="3xl"
      >
        {selectedReceipt && (
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

            {/* Workflow Banner */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
              <div>
                <span className="text-slate-400 block text-[11px]">Current Status</span>
                <div className="mt-1 flex items-center space-x-2">
                  <DocumentStatusBadge status={selectedReceipt.status} />
                  {selectedReceipt.status === 'DONE' && (
                    <span className="text-[11px] text-emerald-400 font-semibold">
                      ✓ Stock balances updated & written to ledger
                    </span>
                  )}
                </div>
              </div>

              {/* Action Buttons based on status & permissions */}
              {hasPermission('stock:receive') && (
                <div className="flex items-center space-x-2">
                  {selectedReceipt.status === 'DRAFT' && (
                    <button
                      disabled={actionLoading}
                      onClick={() => handleAdvanceStatus('READY')}
                      className="px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-semibold flex items-center gap-1.5 transition-all"
                    >
                      <Clock className="h-3.5 w-3.5" /> Mark Ready
                    </button>
                  )}

                  {(selectedReceipt.status === 'DRAFT' || selectedReceipt.status === 'READY') && (
                    <button
                      disabled={actionLoading}
                      onClick={handleValidateReceipt}
                      className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold flex items-center gap-1.5 shadow-md shadow-emerald-600/30 transition-all hover:scale-[1.02]"
                    >
                      <CheckCircle className="h-3.5 w-3.5" /> Validate & Receive Stock
                    </button>
                  )}

                  {selectedReceipt.status !== 'DONE' && selectedReceipt.status !== 'CANCELLED' && (
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

            {/* Receipt Metadata */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-400 text-[11px] block">Supplier</span>
                <strong className="text-white text-xs mt-1 block">
                  {selectedReceipt.supplierName || 'N/A'}
                </strong>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-400 text-[11px] block">Warehouse</span>
                <strong className="text-white text-xs mt-1 block">
                  {selectedReceipt.warehouseName || 'N/A'}
                </strong>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-400 text-[11px] block">Date Created</span>
                <span className="text-slate-200 mt-1 block font-mono">
                  {new Date(selectedReceipt.createdAt).toLocaleDateString()}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-400 text-[11px] block">Validated At</span>
                <span className="text-slate-200 mt-1 block font-mono">
                  {selectedReceipt.validatedAt
                    ? new Date(selectedReceipt.validatedAt).toLocaleDateString()
                    : 'Pending'}
                </span>
              </div>
            </div>

            {/* Items Table */}
            <div className="space-y-2">
              <h4 className="font-bold text-white text-xs uppercase tracking-wider">
                Consignment Items ({selectedReceipt.items.length})
              </h4>
              <div className="divide-y divide-slate-800/80 rounded-xl bg-slate-950 border border-slate-800 overflow-hidden">
                {selectedReceipt.items.map((item: any) => (
                  <div key={item.id} className="p-3 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-white">{item.productName}</div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        SKU: {item.productSku} | Destination: {item.binPath}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-extrabold text-emerald-400 font-mono">
                        +{item.quantityReceived}
                      </span>{' '}
                      <span className="text-[10px] text-slate-400">{item.uom}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Create Receipt Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create Incoming Goods Receipt"
        subtitle="Record incoming supplier consignments in DRAFT state"
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
              <label className="block text-slate-300 font-semibold mb-1">Supplier</label>
              <select
                value={supplierId}
                onChange={(e) => setSupplierId(e.target.value)}
                className="w-full rounded-xl bg-slate-950 border border-slate-700/80 px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="">Select a supplier...</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Target Warehouse</label>
              <select
                value={warehouseId}
                onChange={(e) => setWarehouseId(e.target.value)}
                className="w-full rounded-xl bg-slate-950 border border-slate-700/80 px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="">Select receiving warehouse...</option>
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name} ({w.code})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Consignment Notes</label>
            <input
              type="text"
              placeholder="e.g. Purchase order PO-991 dock intake"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-xl bg-slate-950 border border-slate-700/80 px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Consignment Items */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-white uppercase tracking-wider text-[11px]">
                Consignment Products
              </span>
              <button
                type="button"
                onClick={handleAddItem}
                className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1"
              >
                <Plus className="h-3.5 w-3.5" /> Add Another Product
              </button>
            </div>

            <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
              {items.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col sm:flex-row items-center gap-3"
                >
                  <div className="flex-1 w-full sm:w-auto">
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

                  <div className="flex-1 w-full sm:w-auto">
                    <label className="block text-slate-400 text-[10px] mb-1">Destination Bin</label>
                    <select
                      value={item.binId}
                      onChange={(e) => {
                        const copy = [...items];
                        copy[idx].binId = e.target.value;
                        setItems(copy);
                      }}
                      className="w-full rounded-lg bg-slate-900 border border-slate-700 px-2.5 py-1.5 text-white"
                    >
                      {bins.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.locationPath}
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
                      value={item.quantityReceived}
                      onChange={(e) => {
                        const copy = [...items];
                        copy[idx].quantityReceived = Number(e.target.value);
                        setItems(copy);
                      }}
                      className="w-full rounded-lg bg-slate-900 border border-slate-700 px-2.5 py-1.5 text-white font-mono"
                    />
                  </div>

                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(idx)}
                      className="self-end sm:self-center p-2 text-slate-400 hover:text-rose-400"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
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
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shadow-md shadow-emerald-600/20 disabled:opacity-50"
            >
              {creating ? 'Saving...' : 'Create Draft Receipt'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
