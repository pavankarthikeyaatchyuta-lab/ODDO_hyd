import React, { useState, useEffect } from 'react';
import { operationsApi, productsApi, warehousesApi } from '../services/api';
import { DeliveryOrderDetail, ProductSummary, BinOption } from '../types';
import { DocumentStatusBadge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { EmptyState } from '../components/common/EmptyState';
import { useAuth } from '../context/AuthContext';
import {
  ArrowUpRight,
  Plus,
  Search,
  RefreshCw,
  CheckCircle,
  Eye,
  Trash2,
  AlertTriangle,
} from 'lucide-react';

export const DeliveriesView: React.FC = () => {
  const { hasPermission } = useAuth();
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);

  // Detail Modal
  const [selectedDelivery, setSelectedDelivery] = useState<DeliveryOrderDetail | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Create Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [products, setProducts] = useState<ProductSummary[]>([]);
  const [bins, setBins] = useState<BinOption[]>([]);

  const [customerName, setCustomerName] = useState('');
  const [warehouseId, setWarehouseId] = useState('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<Array<{ productId: string; binId: string; quantityDemanded: number }>>([
    { productId: '', binId: '', quantityDemanded: 1 },
  ]);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const fetchDeliveries = async () => {
    setLoading(true);
    try {
      const res = await operationsApi.listDeliveries({
        page,
        limit: 15,
        search: search || undefined,
        status: statusFilter || undefined,
      });
      setDeliveries(res.items);
    } catch (err) {
      console.error('Failed to load delivery orders:', err);
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
      if (whList.length > 0) setWarehouseId(whList[0].id);
      if (prodList.items.length > 0 && binList.length > 0) {
        setItems([{ productId: prodList.items[0].id, binId: binList[0].id, quantityDemanded: 5 }]);
      }
    } catch (err) {
      console.error('Failed to fetch dependencies:', err);
    }
  };

  useEffect(() => {
    fetchDeliveries();
  }, [page, search, statusFilter]);

  useEffect(() => {
    fetchDependencies();
  }, []);

  const handleOpenDetail = async (id: string) => {
    setActionMessage(null);
    try {
      const detail = await operationsApi.getDelivery(id);
      setSelectedDelivery(detail);
    } catch (err) {
      console.error('Failed to load delivery order details:', err);
    }
  };

  const handleAdvanceStatus = async (status: 'READY' | 'PICKING' | 'PACKED' | 'CANCELLED') => {
    if (!selectedDelivery) return;
    setActionLoading(true);
    setActionMessage(null);
    try {
      await operationsApi.updateDeliveryStatus(selectedDelivery.id, status);
      setActionMessage({ type: 'success', text: `Order status advanced to ${status}` });
      handleOpenDetail(selectedDelivery.id);
      fetchDeliveries();
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.response?.data?.error?.message || err.message });
    } finally {
      setActionLoading(false);
    }
  };

  const handleValidateDelivery = async () => {
    if (!selectedDelivery) return;
    setActionLoading(true);
    setActionMessage(null);
    try {
      await operationsApi.validateDelivery(selectedDelivery.id);
      setActionMessage({
        type: 'success',
        text: 'Delivery Order validated! Inventory deducted and recorded in Stock Ledger.',
      });
      handleOpenDetail(selectedDelivery.id);
      fetchDeliveries();
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.response?.data?.error?.message || err.message });
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddItem = () => {
    if (products.length > 0 && bins.length > 0) {
      setItems([...items, { productId: products[0].id, binId: bins[0].id, quantityDemanded: 1 }]);
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
      await operationsApi.createDelivery({
        customerName: customerName.trim(),
        warehouseId: warehouseId || undefined,
        notes: notes.trim() || undefined,
        items: items.map((i) => ({
          productId: i.productId,
          binId: i.binId,
          quantityDemanded: Number(i.quantityDemanded),
        })),
      });

      setShowCreateModal(false);
      setCustomerName('');
      setNotes('');
      fetchDeliveries();
    } catch (err: any) {
      setCreateError(err.response?.data?.error?.message || err.message || 'Failed to create delivery order');
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
              placeholder="Search DO number or customer..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full rounded-xl bg-slate-950 border border-slate-700/80 pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-amber-500"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="rounded-xl bg-slate-950 border border-slate-700/80 px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
          >
            <option value="">All Statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="READY">Ready</option>
            <option value="PICKING">Picking</option>
            <option value="PACKED">Packed</option>
            <option value="DONE">Done / Dispatched</option>
            <option value="CANCELLED">Cancelled</option>
          </select>

          <button
            onClick={fetchDeliveries}
            title="Refresh"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {hasPermission('stock:deliver') && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold shadow-md shadow-amber-600/20 transition-all hover:scale-[1.02]"
          >
            <Plus className="h-4 w-4" /> New Delivery Order
          </button>
        )}
      </div>

      {/* Deliveries List Table */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 text-slate-400 uppercase tracking-wider text-[11px] border-b border-slate-800">
              <tr>
                <th className="px-5 py-3 font-bold">DO Number</th>
                <th className="px-4 py-3 font-bold">Customer</th>
                <th className="px-4 py-3 font-bold">Warehouse</th>
                <th className="px-4 py-3 font-bold text-center">Items / Demanded</th>
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
                      <div className="h-4 w-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                      <span>Loading delivery orders...</span>
                    </div>
                  </td>
                </tr>
              ) : deliveries.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8">
                    <EmptyState
                      icon={<ArrowUpRight className="h-8 w-8 text-amber-400" />}
                      title="No delivery orders found"
                      description="Create an outbound delivery order for customer picking, packing, and dispatch."
                      actionText={hasPermission('stock:deliver') ? 'New Delivery Order' : undefined}
                      onAction={() => setShowCreateModal(true)}
                    />
                  </td>
                </tr>
              ) : (
                deliveries.map((d) => (
                  <tr
                    key={d.id}
                    onClick={() => handleOpenDetail(d.id)}
                    className="hover:bg-slate-800/40 transition-colors cursor-pointer group"
                  >
                    <td className="px-5 py-3.5 font-bold font-mono text-white group-hover:text-amber-300 transition-colors">
                      {d.doNumber}
                    </td>
                    <td className="px-4 py-3.5 text-slate-200">{d.customerName}</td>
                    <td className="px-4 py-3.5 text-slate-400">{d.warehouseName}</td>
                    <td className="px-4 py-3.5 text-center font-mono">
                      <span className="text-white font-bold">{d.itemCount}</span> items (
                      <span className="text-amber-400 font-bold">-{d.totalQuantity}</span> units)
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <DocumentStatusBadge status={d.status} />
                    </td>
                    <td className="px-4 py-3.5 text-slate-400 text-[11px]">
                      {new Date(d.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenDetail(d.id);
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

      {/* Delivery Detail Modal */}
      <Modal
        isOpen={Boolean(selectedDelivery)}
        onClose={() => setSelectedDelivery(null)}
        title={`Delivery Order: ${selectedDelivery?.doNumber}`}
        subtitle="Workflow: Draft → Ready → Picking → Packed → Validated → Done"
        maxWidth="3xl"
      >
        {selectedDelivery && (
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
                  <DocumentStatusBadge status={selectedDelivery.status} />
                  {selectedDelivery.status === 'DONE' && (
                    <span className="text-[11px] text-emerald-400 font-semibold">
                      ✓ Stock deducted & written to ledger
                    </span>
                  )}
                </div>
              </div>

              {hasPermission('stock:deliver') && (
                <div className="flex flex-wrap items-center gap-2">
                  {selectedDelivery.status === 'DRAFT' && (
                    <button
                      disabled={actionLoading}
                      onClick={() => handleAdvanceStatus('READY')}
                      className="px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-semibold transition-all"
                    >
                      Mark Ready
                    </button>
                  )}

                  {selectedDelivery.status === 'READY' && (
                    <button
                      disabled={actionLoading}
                      onClick={() => handleAdvanceStatus('PICKING')}
                      className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition-all"
                    >
                      Start Picking
                    </button>
                  )}

                  {selectedDelivery.status === 'PICKING' && (
                    <button
                      disabled={actionLoading}
                      onClick={() => handleAdvanceStatus('PACKED')}
                      className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold transition-all"
                    >
                      Mark Packed
                    </button>
                  )}

                  {selectedDelivery.status !== 'DONE' && selectedDelivery.status !== 'CANCELLED' && (
                    <button
                      disabled={actionLoading}
                      onClick={handleValidateDelivery}
                      className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold flex items-center gap-1.5 shadow-md shadow-emerald-600/30 transition-all hover:scale-[1.02]"
                    >
                      <CheckCircle className="h-3.5 w-3.5" /> Validate & Dispatch
                    </button>
                  )}

                  {selectedDelivery.status !== 'DONE' && selectedDelivery.status !== 'CANCELLED' && (
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

            {/* Delivery Metadata */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-400 text-[11px] block">Customer</span>
                <strong className="text-white text-xs mt-1 block">
                  {selectedDelivery.customerName}
                </strong>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-400 text-[11px] block">Warehouse</span>
                <strong className="text-white text-xs mt-1 block">
                  {selectedDelivery.warehouseName || 'N/A'}
                </strong>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-400 text-[11px] block">Date Created</span>
                <span className="text-slate-200 mt-1 block font-mono">
                  {new Date(selectedDelivery.createdAt).toLocaleDateString()}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-400 text-[11px] block">Dispatched At</span>
                <span className="text-slate-200 mt-1 block font-mono">
                  {selectedDelivery.dispatchedAt
                    ? new Date(selectedDelivery.dispatchedAt).toLocaleDateString()
                    : 'Pending'}
                </span>
              </div>
            </div>

            {/* Outbound Items */}
            <div className="space-y-2">
              <h4 className="font-bold text-white text-xs uppercase tracking-wider">
                Fulfillment Items ({selectedDelivery.items.length})
              </h4>
              <div className="divide-y divide-slate-800/80 rounded-xl bg-slate-950 border border-slate-800 overflow-hidden">
                {selectedDelivery.items.map((item: any) => {
                  const isInsufficient = (item.availableStock ?? 0) < item.quantityDemanded;
                  return (
                    <div key={item.id} className="p-3 flex items-center justify-between">
                      <div>
                        <div className="font-bold text-white flex items-center gap-2">
                          {item.productName}
                          {isInsufficient && selectedDelivery.status !== 'DONE' && (
                            <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 font-bold text-[10px] flex items-center gap-1">
                              <AlertTriangle className="h-3 w-3" /> Insufficient Stock
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                          SKU: {item.productSku} | Location: {item.binPath}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          Available in Location: <strong className="text-white">{item.availableStock ?? 0}</strong> {item.uom}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-extrabold text-amber-400 font-mono">
                          -{item.quantityDemanded}
                        </span>{' '}
                        <span className="text-[10px] text-slate-400">{item.uom}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Create Delivery Order Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create Outbound Delivery Order"
        subtitle="Initiate customer fulfillment in DRAFT state"
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
              <label className="block text-slate-300 font-semibold mb-1">
                Customer / Consignee <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Acme Construction Corp"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full rounded-xl bg-slate-950 border border-slate-700/80 px-3 py-2 text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Fulfillment Warehouse</label>
              <select
                value={warehouseId}
                onChange={(e) => setWarehouseId(e.target.value)}
                className="w-full rounded-xl bg-slate-950 border border-slate-700/80 px-3 py-2 text-white focus:outline-none focus:border-amber-500"
              >
                <option value="">Select dispatch warehouse...</option>
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name} ({w.code})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Dispatch Notes</label>
            <input
              type="text"
              placeholder="e.g. Urgent framing consignment for Sector 9 site"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-xl bg-slate-950 border border-slate-700/80 px-3 py-2 text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Outbound Items */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-white uppercase tracking-wider text-[11px]">
                Ordered Products
              </span>
              <button
                type="button"
                onClick={handleAddItem}
                className="text-xs text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1"
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
                    <label className="block text-slate-400 text-[10px] mb-1">Pick Location (Bin)</label>
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
                    <label className="block text-slate-400 text-[10px] mb-1">Quantity Demanded</label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={item.quantityDemanded}
                      onChange={(e) => {
                        const copy = [...items];
                        copy[idx].quantityDemanded = Number(e.target.value);
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
              className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold shadow-md shadow-amber-600/20 disabled:opacity-50"
            >
              {creating ? 'Saving...' : 'Create Draft Delivery Order'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
