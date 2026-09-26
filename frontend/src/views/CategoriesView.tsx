import React, { useState, useEffect } from 'react';
import { productsApi } from '../services/api';
import { CategorySummary } from '../types';
import { Modal } from '../components/common/Modal';
import { EmptyState } from '../components/common/EmptyState';
import { useAuth } from '../context/AuthContext';
import { Boxes, Plus, RefreshCw, Tag } from 'lucide-react';

export const CategoriesView: React.FC = () => {
  const { hasPermission } = useAuth();
  const [categories, setCategories] = useState<CategorySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
  });

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const data = await productsApi.listCategories();
      setCategories(data);
    } catch (err) {
      console.error('Failed to load categories:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setCreateError(null);
    try {
      await productsApi.createCategory({
        name: formData.name.trim(),
        code: formData.code.trim().toUpperCase(),
        description: formData.description.trim() || undefined,
      });
      setShowCreateModal(false);
      setFormData({ name: '', code: '', description: '' });
      fetchCategories();
    } catch (err: any) {
      setCreateError(err.response?.data?.error?.message || err.message || 'Failed to create category');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Bar */}
      <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-900 border border-slate-800">
        <div className="flex items-center space-x-2">
          <Boxes className="h-5 w-5 text-sky-400" />
          <span className="text-sm font-bold text-white">Product Categories</span>
          <span className="text-xs text-slate-400">({categories.length} Total)</span>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={fetchCategories}
            title="Refresh"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          {hasPermission('products:create_update') && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold shadow-md shadow-sky-600/20 transition-all hover:scale-[1.02]"
            >
              <Plus className="h-4 w-4" /> Add Category
            </button>
          )}
        </div>
      </div>

      {/* Grid of Categories */}
      {loading ? (
        <div className="p-12 text-center text-slate-400">
          <div className="flex items-center justify-center space-x-2">
            <div className="h-4 w-4 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
            <span>Loading categories...</span>
          </div>
        </div>
      ) : categories.length === 0 ? (
        <EmptyState
          title="No categories found"
          description="Create your first catalog category to organize products."
          actionText="Create Category"
          onAction={() => setShowCreateModal(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((c) => (
            <div
              key={c.id}
              className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all shadow-sm space-y-3"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white tracking-tight">{c.name}</h3>
                  <div className="inline-flex items-center gap-1 text-[11px] font-mono text-sky-400 mt-0.5">
                    <Tag className="h-3 w-3" /> {c.code}
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-800 text-slate-300 border border-slate-700">
                  {c.productCount ?? 0} Products
                </span>
              </div>
              <p className="text-xs text-slate-400 line-clamp-2 min-h-[32px]">
                {c.description || 'No description provided.'}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Create Category Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Add Product Category"
        subtitle="Group products logically across the inventory catalog"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
          {createError && (
            <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300">
              {createError}
            </div>
          )}

          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              Category Name <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Electrical & Wiring"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full rounded-xl bg-slate-950 border border-slate-700/80 px-3 py-2 text-white focus:outline-none focus:border-sky-500"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              Category Code <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. ELECTRICAL"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
              className="w-full rounded-xl bg-slate-950 border border-slate-700/80 px-3 py-2 text-white font-mono focus:outline-none focus:border-sky-500"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Description</label>
            <textarea
              rows={3}
              placeholder="Brief description of this classification..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full rounded-xl bg-slate-950 border border-slate-700/80 px-3 py-2 text-white focus:outline-none focus:border-sky-500"
            />
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
              {creating ? 'Saving...' : 'Create Category'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
