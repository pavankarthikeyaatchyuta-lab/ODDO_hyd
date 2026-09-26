import React, { useState, useEffect } from 'react';
import { operationsApi, productsApi, warehousesApi } from '../services/api';
import { StockAdjustmentDetail, ProductSummary, BinOption, AdjustmentReasonCode } from '../types';
import { Modal } from '../components/common/Modal';
import { EmptyState } from '../components/common/EmptyState';
import { useAuth } from '../context/AuthContext';
import {
  SlidersHorizontal,
  Plus,
  RefreshCw,
  Scale,
} from 'lucide-react';

export const AdjustmentsView: React.FC = () => {
  const { hasPermission } = useAuth();
  const [adjustments, setAdjustments] = useState<StockAdjustmentDetail[]>([]);
  const [loading, setLoading] = useState(true);

  // Pagination
  const [page] = useState(1);

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [products, setProducts] = useState<ProductSummary[]>([]);
  const [bins, setBins] = useState<BinOption[]>([]);

  const [selectedProductId, setSelectedProductId] = useState('');
  const [selectedBinId, setSelectedBinId] = useState('');
  const [countedQty, setCountedQty] = useState<number>(0);
  const [recordedQty, setRecordedQty] = useState<number>(0);
  const [loadingRecorded, setLoadingRecorded] = useState(false);
  const [reasonCode, setReasonCode] = useState<AdjustmentReasonCode>('COUNTING_ERROR');
  const [notes, setNotes] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const fetchAdjustments = async () => {
    setLoading(true);
    try {
      const res = await operationsApi.listAdjustments({ page, limit: 15 });
      setAdjustments(res.items);
    } catch (err) {
      console.error('Failed to load adjustments:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDependencies = async () => {
    try {
      const [prodList, binList] = await Promise.all([
        productsApi.listProducts({ limit: 100 }),
        warehousesApi.getAllBins(),
      ]);
      setProducts(prodList.items);
      setBins(binList);
      if (prodList.items.length > 0) setSelectedProductId(prodList.items[0].id);
      if (binList.length > 0) setSelectedBinId(binList[0].id);
    } catch (err) {
      console.error('Failed to fetch dependencies:', err);
    }
  };

  useEffect(() => {
    fetchAdjustments();
  }, [page]);

  useEffect(() => {
    fetchDependencies();
  }, []);

  // Whenever product or bin changes in modal, look up current recorded stock in that location
  useEffect(() => {
    const fetchRecorded = async () => {
      if (!selectedProductId || !selectedBinId) return;
      setLoadingRecorded(true);
      try {
        const prod = await productsApi.getProduct(selectedProductId);
        const match = prod.stockByLocation.find((l) => l.binId === selectedBinId);
        const currentInBin = match ? match.quantity : 0;
        setRecordedQty(currentInBin);
        setCountedQty(currentInBin);
      } catch {
        setRecordedQty(0);
      } finally {
        setLoadingRecorded(false);
      }
    };

    if (showModal) {
      fetchRecorded();
    }
  }, [selectedProductId, selectedBinId, showModal]);

  const differenceQty = countedQty - recordedQty;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError(null);
    try {
      await operationsApi.createAdjustment({
        productId: selectedProductId,
        binId: selectedBinId,
        countedQty: Number(countedQty),
        reasonCode,
        notes: notes.trim() || undefined,
      });

      setShowModal(false);
      setNotes('');
      fetchAdjustments();
    } catch (err: any) {
      setSubmitError(err.response?.data?.error?.message || err.message || 'Failed to submit adjustment');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-900 border border-slate-800">
        <div>
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4 text-purple-400" /> Physical Stock Adjustments
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Difference = Physical Count - Recorded Stock
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={fetchAdjustments}
            title="Refresh"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          {hasPermission('stock:adjust') && (
            <button
              onClick={() => setShowModal(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-md shadow-purple-600/20 transition-all hover:scale-[1.02]"
            >
              <Plus className="h-4 w-4" /> New Stock Adjustment
            </button>
          )}
        </div>
      </div>

      {/* Adjustments Table */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 text-slate-400 uppercase tracking-wider text-[11px] border-b border-slate-800">
              <tr>
                <th className="px-5 py-3 font-bold">Adjustment Ref</th>
                <th className="px-4 py-3 font-bold">Product / SKU</th>
                <th className="px-4 py-3 font-bold">Location</th>
                <th className="px-4 py-3 font-bold text-right">Recorded</th>
                <th className="px-4 py-3 font-bold text-right">Counted</th>
                <th className="px-4 py-3 font-bold text-right">Difference</th>
                <th className="px-4 py-3 font-bold">Reason</th>
                <th className="px-5 py-3 font-bold">Adjusted By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center text-slate-400">
                    <div className="flex items-center justify-center space-x-2">
                      <div className="h-4 w-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                      <span>Loading physical stock adjustments...</span>
                    </div>
                  </td>
                </tr>
              ) : adjustments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8">
                    <EmptyState
                      icon={<Scale className="h-8 w-8 text-purple-400" />}
                      title="No stock adjustments recorded"
                      description="Record physical inventory count discrepancies to maintain ledger accuracy."
                      actionText={hasPermission('stock:adjust') ? 'New Adjustment' : undefined}
                      onAction={() => setShowModal(true)}
                    />
                  </td>
                </tr>
              ) : (
                adjustments.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-5 py-3.5 font-bold font-mono text-purple-300">
                      {a.adjustmentNumber}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="font-bold text-white">{a.productName}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{a.productSku}</div>
                    </td>
                    <td className="px-4 py-3.5 text-slate-300 font-mono text-[11px]">
                      {a.binPath}
                    </td>
                    <td className="px-4 py-3.5 text-right font-mono text-slate-400">
                      {a.recordedQty} {a.uom}
                    </td>
                    <td className="px-4 py-3.5 text-right font-mono text-white font-bold">
                      {a.countedQty} {a.uom}
                    </td>
                    <td className="px-4 py-3.5 text-right font-mono font-extrabold">
                      <span
                        className={
                          a.differenceQty > 0
                            ? 'text-emerald-400'
                            : a.differenceQty < 0
                            ? 'text-rose-400'
                            : 'text-slate-400'
                        }
                      >
                        {a.differenceQty > 0 ? `+${a.differenceQty}` : a.differenceQty} {a.uom}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                        {a.reasonCode}
                      </span>
                      {a.notes && <div className="text-[10px] text-slate-400 mt-1">{a.notes}</div>}
                    </td>
                    <td className="px-5 py-3.5 text-slate-300 text-[11px]">
                      <div>{a.adjustedByName}</div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {new Date(a.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Stock Adjustment Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Execute Physical Stock Adjustment"
        subtitle="Reconcile recorded stock with physical count"
        maxWidth="2xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {submitError && (
            <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300">
              {submitError}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Product</label>
              <select
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                className="w-full rounded-xl bg-slate-950 border border-slate-700/80 px-3 py-2 text-white focus:outline-none focus:border-purple-500"
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.sku})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Physical Location (Bin)</label>
              <select
                value={selectedBinId}
                onChange={(e) => setSelectedBinId(e.target.value)}
                className="w-full rounded-xl bg-slate-950 border border-slate-700/80 px-3 py-2 text-white focus:outline-none focus:border-purple-500"
              >
                {bins.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.locationPath}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Formula Reconciliation Box */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
            <span className="font-bold text-purple-400 uppercase tracking-wider text-[11px] block">
              Count Reconciliation Formula
            </span>

            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-slate-400 text-[10px] block">Recorded Stock</span>
                <span className="text-lg font-bold font-mono text-white block mt-1">
                  {loadingRecorded ? '...' : recordedQty}
                </span>
              </div>

              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-slate-400 text-[10px] block">Physical Count</span>
                <input
                  type="number"
                  min="0"
                  step="any"
                  required
                  value={countedQty}
                  onChange={(e) => setCountedQty(Number(e.target.value))}
                  className="w-full text-center text-lg font-bold font-mono text-white bg-slate-950 border border-purple-500/50 rounded mt-1 focus:outline-none"
                />
              </div>

              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-slate-400 text-[10px] block">Difference</span>
                <span
                  className={`text-lg font-black font-mono block mt-1 ${
                    differenceQty > 0
                      ? 'text-emerald-400'
                      : differenceQty < 0
                      ? 'text-rose-400'
                      : 'text-slate-400'
                  }`}
                >
                  {differenceQty > 0 ? `+${differenceQty}` : differenceQty}
                </span>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 text-center">
              New Recorded Stock = {countedQty} units (Adjustment: {differenceQty})
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Adjustment Reason Code <span className="text-rose-400">*</span>
              </label>
              <select
                value={reasonCode}
                onChange={(e) => setReasonCode(e.target.value as any)}
                className="w-full rounded-xl bg-slate-950 border border-slate-700/80 px-3 py-2 text-white focus:outline-none focus:border-purple-500"
              >
                <option value="DAMAGED">Damaged Goods</option>
                <option value="LOST">Lost or Stolen</option>
                <option value="FOUND">Found Extra Stock</option>
                <option value="COUNTING_ERROR">Physical Counting Error</option>
                <option value="DATA_CORRECTION">Data Correction</option>
                <option value="OTHER">Other Discrepancy</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Explanatory Notes</label>
              <input
                type="text"
                placeholder="e.g. Broken packaging discovered during weekly cycle count"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full rounded-xl bg-slate-950 border border-slate-700/80 px-3 py-2 text-white focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold shadow-md shadow-purple-600/20 disabled:opacity-50"
            >
              {submitting ? 'Applying...' : 'Confirm Adjustment'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
