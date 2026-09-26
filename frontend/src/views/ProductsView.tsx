import React, { useState, useEffect } from 'react';
import { productsApi, warehousesApi } from '../services/api';
import { ProductSummary, ProductDetail, CategorySummary, BinOption, StockStatus } from '../types';
import { StockStatusBadge, MovementTypeBadge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { EmptyState } from '../components/common/EmptyState';
import { useAuth } from '../context/AuthContext';
import {
  Search,
  Plus,
  Eye,
  Warehouse,
  MapPin,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';

interface ProductsViewProps {
  onCreateProductTrigger?: boolean;
}

export const ProductsView: React.FC<ProductsViewProps> = () => {
  const { hasPermission } = useAuth();
  const [products, setProducts] = useState<ProductSummary[]>([]);
  const [categories, setCategories] = useState<CategorySummary[]>([]);
  const [bins, setBins] = useState<BinOption[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Pagination
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedStockStatus, setSelectedStockStatus] = useState<StockStatus | ''>('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Detail Modal
  const [selectedProduct, setSelectedProduct] = useState<ProductDetail | null>(null);

  // Create Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    sku: '',
    name: '',
    description: '',
    categoryId: '',
    uom: 'PCS',
    costPrice: 0,
    salePrice: 0,
    minStock: 0,
    maxStock: 0,
    reorderQuantity: 0,
    initialStock: 0,
    initialBinId: '',
  });

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await productsApi.listProducts({
        page,
        limit: 15,
        search: search || undefined,
        categoryId: selectedCategory || undefined,
        stockStatus: (selectedStockStatus as StockStatus) || undefined,
      });
      setProducts(res.items);
      setTotalPages(res.pagination.totalPages);
    } catch (err) {
      console.error('Failed to load products:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMeta = async () => {
    try {
      const [cats, binList] = await Promise.all([
        productsApi.listCategories(),
        warehousesApi.getAllBins(),
      ]);
      setCategories(cats);
      setBins(binList);
      if (cats.length > 0 && !formData.categoryId) {
        setFormData((prev) => ({ ...prev, categoryId: cats[0].id }));
      }
    } catch (err) {
      console.error('Failed to load meta:', err);
    }
  };

  useEffect(() => {
    fetchMeta();
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [page, search, selectedCategory, selectedStockStatus]);

  const handleOpenDetail = async (id: string) => {
    try {
      const detail = await productsApi.getProduct(id);
      setSelectedProduct(detail);
    } catch (err) {
      console.error('Failed to load product details:', err);
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setCreateError(null);
    try {
      await productsApi.createProduct({
        ...formData,
        costPrice: Number(formData.costPrice),
        salePrice: Number(formData.salePrice),
        minStock: Number(formData.minStock),
        maxStock: Number(formData.maxStock),
        reorderQuantity: Number(formData.reorderQuantity),
        initialStock: formData.initialStock ? Number(formData.initialStock) : undefined,
        initialBinId: formData.initialBinId || undefined,
      });

      setShowCreateModal(false);
      setFormData({
        sku: '',
        name: '',
        description: '',
        categoryId: categories[0]?.id || '',
        uom: 'PCS',
        costPrice: 0,
        salePrice: 0,
        minStock: 0,
        maxStock: 0,
        reorderQuantity: 0,
        initialStock: 0,
        initialBinId: '',
      });
      fetchProducts();
    } catch (err: any) {
      setCreateError(err.response?.data?.error?.message || err.message || 'Failed to create product');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Filter and Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900 border border-slate-800">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          {/* Search Box */}
          <div className="relative min-w-[200px] flex-1 sm:max-w-xs">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by SKU or name..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full rounded-xl bg-slate-950 border border-slate-700/80 pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-sky-500"
            />
          </div>

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              setPage(1);
            }}
            className="rounded-xl bg-slate-950 border border-slate-700/80 px-3 py-1.5 text-xs text-white focus:outline-none focus:border-sky-500"
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Stock Status Filter */}
          <select
            value={selectedStockStatus}
            onChange={(e) => {
              setSelectedStockStatus(e.target.value as any);
              setPage(1);
            }}
            className="rounded-xl bg-slate-950 border border-slate-700/80 px-3 py-1.5 text-xs text-white focus:outline-none focus:border-sky-500"
          >
            <option value="">All Stock Statuses</option>
            <option value="IN_STOCK">In Stock</option>
            <option value="LOW_STOCK">Low Stock (Alert)</option>
            <option value="OUT_OF_STOCK">Out of Stock</option>
          </select>

          <button
            onClick={fetchProducts}
            title="Refresh"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Add Product Button */}
        {hasPermission('products:create_update') && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold shadow-md shadow-sky-600/20 transition-all hover:scale-[1.02]"
          >
            <Plus className="h-4 w-4" /> Add Product
          </button>
        )}
      </div>

      {/* Products Table */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 text-slate-400 uppercase tracking-wider text-[11px] border-b border-slate-800">
              <tr>
                <th className="px-5 py-3 font-bold">Product / SKU</th>
                <th className="px-4 py-3 font-bold">Category</th>
                <th className="px-4 py-3 font-bold text-right">Unit Price</th>
                <th className="px-4 py-3 font-bold text-center">Reorder Rules</th>
                <th className="px-4 py-3 font-bold text-right">Total Stock</th>
                <th className="px-4 py-3 font-bold text-center">Status</th>
                <th className="px-5 py-3 font-bold text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-slate-400">
                    <div className="flex items-center justify-center space-x-2">
                      <div className="h-4 w-4 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
                      <span>Loading products catalog...</span>
                    </div>
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8">
                    <EmptyState
                      title="No products found"
                      description="Create your first inventory product or adjust your filters."
                      actionText={hasPermission('products:create_update') ? 'Create Product' : undefined}
                      onAction={() => setShowCreateModal(true)}
                    />
                  </td>
                </tr>
              ) : (
                products.map((p) => (
                  <tr
                    key={p.id}
                    onClick={() => handleOpenDetail(p.id)}
                    className="hover:bg-slate-800/40 transition-colors cursor-pointer group"
                  >
                    <td className="px-5 py-3.5">
                      <div className="font-bold text-white group-hover:text-sky-300 transition-colors">
                        {p.name}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono mt-0.5">{p.sku}</div>
                    </td>
                    <td className="px-4 py-3.5 text-slate-300">{p.categoryName}</td>
                    <td className="px-4 py-3.5 text-right font-mono text-slate-200">
                      ${p.salePrice.toFixed(2)}
                    </td>
                    <td className="px-4 py-3.5 text-center text-slate-400 text-[11px] font-mono">
                      Min: <strong className="text-slate-300">{p.minStock}</strong> | Max: {p.maxStock}
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <span className="font-extrabold text-sm text-white font-mono">
                        {p.totalStock}
                      </span>{' '}
                      <span className="text-[10px] text-slate-400">{p.uom}</span>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <StockStatusBadge status={p.stockStatus} />
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenDetail(p.id);
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

      {/* Product Detail Modal */}
      <Modal
        isOpen={Boolean(selectedProduct)}
        onClose={() => setSelectedProduct(null)}
        title={selectedProduct?.name || 'Product Details'}
        subtitle={`SKU: ${selectedProduct?.sku}`}
        maxWidth="3xl"
      >
        {selectedProduct && (
          <div className="space-y-6 text-xs">
            {/* Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-400 text-[11px] block">Category</span>
                <strong className="text-white text-xs mt-1 block">
                  {selectedProduct.category.name}
                </strong>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-400 text-[11px] block">Total Stock</span>
                <div className="flex items-center space-x-2 mt-1">
                  <strong className="text-white text-sm font-mono">
                    {selectedProduct.totalStock} {selectedProduct.uom}
                  </strong>
                  <StockStatusBadge status={selectedProduct.stockStatus} />
                </div>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-400 text-[11px] block">Pricing</span>
                <span className="text-slate-200 mt-1 block font-mono">
                  Cost: ${selectedProduct.costPrice.toFixed(2)} | Sale: ${selectedProduct.salePrice.toFixed(2)}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-400 text-[11px] block">Reorder Rule</span>
                <span className="text-amber-400 font-semibold mt-1 block font-mono">
                  Min: {selectedProduct.minStock} | Order: +{selectedProduct.reorderQuantity}
                </span>
              </div>
            </div>

            {/* Warehouse Stock Breakdown */}
            <div className="space-y-2">
              <h4 className="font-bold text-white text-xs uppercase tracking-wider flex items-center gap-1.5">
                <Warehouse className="h-4 w-4 text-sky-400" /> Stock by Warehouse
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {selectedProduct.stockByWarehouse.map((w: any) => (
                  <div
                    key={w.warehouseId}
                    className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between"
                  >
                    <div>
                      <div className="font-bold text-white">{w.warehouseName}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{w.warehouseCode}</div>
                    </div>
                    <div className="text-right font-mono font-bold text-sky-400 text-sm">
                      {w.quantity} {selectedProduct.uom}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Spatial Location Breakdown */}
            <div className="space-y-2">
              <h4 className="font-bold text-white text-xs uppercase tracking-wider flex items-center gap-1.5">
                <MapPin className="h-4 w-4 text-emerald-400" /> Stock by Location (Bins)
              </h4>
              <div className="divide-y divide-slate-800/80 rounded-xl bg-slate-950 border border-slate-800 max-h-48 overflow-y-auto">
                {selectedProduct.stockByLocation.length === 0 ? (
                  <div className="p-4 text-center text-slate-400">No active stock in any bin.</div>
                ) : (
                  selectedProduct.stockByLocation.map((loc: any) => (
                    <div key={loc.binId} className="p-3 flex items-center justify-between">
                      <div>
                        <div className="font-mono text-slate-200">{loc.locationPath}</div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          Barcode: {loc.barcode}
                        </div>
                      </div>
                      <span className="font-bold font-mono text-white text-xs">
                        {loc.quantity} {selectedProduct.uom}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Recent Ledger History */}
            <div className="space-y-2">
              <h4 className="font-bold text-white text-xs uppercase tracking-wider flex items-center gap-1.5">
                <TrendingUp className="h-4 w-4 text-purple-400" /> Recent Move History
              </h4>
              <div className="divide-y divide-slate-800/80 rounded-xl bg-slate-950 border border-slate-800 max-h-48 overflow-y-auto">
                {selectedProduct.recentMovements.length === 0 ? (
                  <div className="p-4 text-center text-slate-400">No movements recorded yet.</div>
                ) : (
                  selectedProduct.recentMovements.map((m: any) => (
                    <div key={m.id} className="p-2.5 flex items-center justify-between">
                      <div>
                        <div className="text-[11px] text-slate-300 font-medium">
                          {m.referenceDocNumber || m.movementType}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {new Date(m.timestamp).toLocaleDateString()} by {m.performedByName}
                        </div>
                      </div>
                      <div className="text-right">
                        <MovementTypeBadge type={m.movementType} quantity={m.quantity} />
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                          New Balance: {m.qtyAfter}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Create Product Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create New Inventory Product"
        subtitle="Configure product details, reordering thresholds and optional opening stock"
        maxWidth="2xl"
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
                Product SKU / Code <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. STL-ROD-02"
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value.toUpperCase() })}
                className="w-full rounded-xl bg-slate-950 border border-slate-700/80 px-3 py-2 text-white font-mono focus:outline-none focus:border-sky-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Product Name <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Steel Rods 16mm"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full rounded-xl bg-slate-950 border border-slate-700/80 px-3 py-2 text-white focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Category <span className="text-rose-400">*</span>
              </label>
              <select
                required
                value={formData.categoryId}
                onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                className="w-full rounded-xl bg-slate-950 border border-slate-700/80 px-3 py-2 text-white focus:outline-none focus:border-sky-500"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Unit of Measure (UoM)
              </label>
              <select
                value={formData.uom}
                onChange={(e) => setFormData({ ...formData, uom: e.target.value })}
                className="w-full rounded-xl bg-slate-950 border border-slate-700/80 px-3 py-2 text-white focus:outline-none focus:border-sky-500"
              >
                <option value="PCS">PCS (Pieces)</option>
                <option value="KG">KG (Kilograms)</option>
                <option value="BOX">BOX (Cartons)</option>
                <option value="METER">METER (Meters)</option>
                <option value="LITER">LITER (Liters)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Cost Price ($)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.costPrice}
                onChange={(e) => setFormData({ ...formData, costPrice: Number(e.target.value) })}
                className="w-full rounded-xl bg-slate-950 border border-slate-700/80 px-3 py-2 text-white font-mono focus:outline-none focus:border-sky-500"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Sale Price ($)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.salePrice}
                onChange={(e) => setFormData({ ...formData, salePrice: Number(e.target.value) })}
                className="w-full rounded-xl bg-slate-950 border border-slate-700/80 px-3 py-2 text-white font-mono focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>

          {/* Reordering Rules Section */}
          <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
            <span className="font-bold text-amber-400 uppercase tracking-wider text-[11px] block">
              Deterministic Reordering Thresholds
            </span>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-400 mb-1">Minimum Stock</label>
                <input
                  type="number"
                  min="0"
                  value={formData.minStock}
                  onChange={(e) => setFormData({ ...formData, minStock: Number(e.target.value) })}
                  className="w-full rounded-lg bg-slate-900 border border-slate-700 px-2.5 py-1.5 text-white font-mono focus:outline-none focus:border-sky-500"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Maximum Stock</label>
                <input
                  type="number"
                  min="0"
                  value={formData.maxStock}
                  onChange={(e) => setFormData({ ...formData, maxStock: Number(e.target.value) })}
                  className="w-full rounded-lg bg-slate-900 border border-slate-700 px-2.5 py-1.5 text-white font-mono focus:outline-none focus:border-sky-500"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Reorder Quantity</label>
                <input
                  type="number"
                  min="0"
                  value={formData.reorderQuantity}
                  onChange={(e) => setFormData({ ...formData, reorderQuantity: Number(e.target.value) })}
                  className="w-full rounded-lg bg-slate-900 border border-slate-700 px-2.5 py-1.5 text-white font-mono focus:outline-none focus:border-sky-500"
                />
              </div>
            </div>
          </div>

          {/* Opening Stock (Optional) */}
          <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
            <span className="font-bold text-sky-400 uppercase tracking-wider text-[11px] block">
              Initial Opening Stock (Optional)
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 mb-1">Opening Quantity</label>
                <input
                  type="number"
                  min="0"
                  value={formData.initialStock}
                  onChange={(e) => setFormData({ ...formData, initialStock: Number(e.target.value) })}
                  placeholder="0"
                  className="w-full rounded-lg bg-slate-900 border border-slate-700 px-2.5 py-1.5 text-white font-mono focus:outline-none focus:border-sky-500"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Initial Location (Bin)</label>
                <select
                  disabled={formData.initialStock <= 0}
                  value={formData.initialBinId}
                  onChange={(e) => setFormData({ ...formData, initialBinId: e.target.value })}
                  className="w-full rounded-lg bg-slate-900 border border-slate-700 px-2.5 py-1.5 text-white disabled:opacity-40 focus:outline-none focus:border-sky-500"
                >
                  <option value="">Select a location bin...</option>
                  {bins.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.locationPath}
                    </option>
                  ))}
                </select>
              </div>
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
              {creating ? 'Saving...' : 'Create Product'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
