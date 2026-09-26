import React, { useState, useEffect } from 'react';
import { warehousesApi } from '../services/api';
import { WarehouseHierarchy } from '../types';
import { Modal } from '../components/common/Modal';
import { useAuth } from '../context/AuthContext';
import {
  Plus,
  RefreshCw,
  FolderTree,
  MapPin,
  Barcode,
  Building,
} from 'lucide-react';

export const WarehousesView: React.FC = () => {
  const { hasPermission } = useAuth();
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string | null>(null);
  const [hierarchy, setHierarchy] = useState<WarehouseHierarchy | null>(null);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showCreateWarehouseModal, setShowCreateWarehouseModal] = useState(false);
  const [showCreateZoneModal, setShowCreateZoneModal] = useState(false);
  const [showCreateBinModal, setShowCreateBinModal] = useState(false);

  const [warehouseForm, setWarehouseForm] = useState({ code: '', name: '', address: '' });
  const [zoneForm, setZoneForm] = useState({ code: '', name: '' });
  const [binForm, setBinForm] = useState({ shelfId: '', code: '', barcode: '' });

  const [shelvesList, setShelvesList] = useState<Array<{ id: string; label: string }>>([]);

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchWarehouses = async () => {
    setLoading(true);
    try {
      const list = await warehousesApi.listWarehouses();
      setWarehouses(list);
      if (list.length > 0 && !selectedWarehouseId) {
        setSelectedWarehouseId(list[0].id);
      }
    } catch (err) {
      console.error('Failed to load warehouses:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchHierarchy = async (id: string) => {
    try {
      const data = await warehousesApi.getWarehouse(id);
      setHierarchy(data);

      // Collect flat list of shelves for bin creation modal
      const flatShelves: Array<{ id: string; label: string }> = [];
      data.zones.forEach((z: any) => {
        z.racks.forEach((r: any) => {
          r.shelves.forEach((s: any) => {
            flatShelves.push({
              id: s.id,
              label: `${z.name} > Rack ${r.code} > Shelf ${s.code}`,
            });
          });
        });
      });
      setShelvesList(flatShelves);
      if (flatShelves.length > 0 && !binForm.shelfId) {
        setBinForm((prev) => ({ ...prev, shelfId: flatShelves[0].id }));
      }
    } catch (err) {
      console.error('Failed to load warehouse hierarchy:', err);
    }
  };

  useEffect(() => {
    fetchWarehouses();
  }, []);

  useEffect(() => {
    if (selectedWarehouseId) {
      fetchHierarchy(selectedWarehouseId);
    }
  }, [selectedWarehouseId]);

  const handleCreateWarehouse = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg(null);
    try {
      await warehousesApi.createWarehouse({
        code: warehouseForm.code.trim().toUpperCase(),
        name: warehouseForm.name.trim(),
        address: warehouseForm.address.trim() || undefined,
      });
      setShowCreateWarehouseModal(false);
      setWarehouseForm({ code: '', name: '', address: '' });
      fetchWarehouses();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error?.message || err.message || 'Failed to create warehouse');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateZone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWarehouseId) return;
    setSubmitting(true);
    setErrorMsg(null);
    try {
      await warehousesApi.createZone(selectedWarehouseId, {
        code: zoneForm.code.trim().toUpperCase(),
        name: zoneForm.name.trim(),
      });
      setShowCreateZoneModal(false);
      setZoneForm({ code: '', name: '' });
      fetchHierarchy(selectedWarehouseId);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error?.message || err.message || 'Failed to create zone');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateBin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!binForm.shelfId) return;
    setSubmitting(true);
    setErrorMsg(null);
    try {
      await warehousesApi.createBin(binForm.shelfId, {
        code: binForm.code.trim().toUpperCase(),
        barcode: binForm.barcode.trim().toUpperCase(),
      });
      setShowCreateBinModal(false);
      setBinForm({ shelfId: shelvesList[0]?.id || '', code: '', barcode: '' });
      if (selectedWarehouseId) fetchHierarchy(selectedWarehouseId);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error?.message || err.message || 'Failed to create bin');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900 border border-slate-800">
        <div>
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Building className="h-4 w-4 text-sky-400" /> Multi-Warehouse & Spatial Locations
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Spatial breakdown: Warehouse → Zone → Rack → Shelf → Bin
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={fetchWarehouses}
            title="Refresh"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          {hasPermission('warehouses:manage') && (
            <button
              onClick={() => setShowCreateWarehouseModal(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold shadow-md shadow-sky-600/20 transition-all hover:scale-[1.02]"
            >
              <Plus className="h-4 w-4" /> Add Warehouse
            </button>
          )}
        </div>
      </div>

      {/* Warehouse Selector Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {warehouses.map((w) => {
          const isSelected = w.id === selectedWarehouseId;
          return (
            <div
              key={w.id}
              onClick={() => setSelectedWarehouseId(w.id)}
              className={`p-5 rounded-2xl border transition-all cursor-pointer shadow-sm ${
                isSelected
                  ? 'bg-slate-900 border-sky-500/60 shadow-sky-500/10'
                  : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white">{w.name}</h3>
                  <div className="inline-flex items-center gap-1 text-[11px] font-mono text-sky-400 mt-0.5">
                    Code: {w.code}
                  </div>
                </div>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    w.isActive
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {w.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-slate-800/80 text-center">
                <div>
                  <span className="text-[10px] text-slate-400 block">Zones</span>
                  <strong className="text-white text-xs mt-0.5 block">{w.zoneCount}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Total Bins</span>
                  <strong className="text-white text-xs mt-0.5 block">{w.totalBins}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Active Stock</span>
                  <strong className="text-sky-400 font-mono text-xs mt-0.5 block">
                    {w.totalStock}
                  </strong>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Warehouse Spatial Tree Explorer */}
      {hierarchy && (
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div>
              <div className="flex items-center space-x-2">
                <FolderTree className="h-5 w-5 text-sky-400" />
                <h3 className="text-base font-bold text-white tracking-tight">
                  {hierarchy.name} Spatial Hierarchy
                </h3>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">{hierarchy.address || 'No address specified'}</p>
            </div>

            {hasPermission('warehouses:manage') && (
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setShowCreateZoneModal(true)}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
                >
                  + Add Zone
                </button>
                <button
                  onClick={() => setShowCreateBinModal(true)}
                  className="px-3 py-1.5 rounded-xl bg-sky-600/30 hover:bg-sky-600/50 text-sky-300 text-xs font-semibold border border-sky-500/30 transition-colors"
                >
                  + Add Bin
                </button>
              </div>
            )}
          </div>

          {/* Zones, Racks, Shelves, Bins Tree */}
          {hierarchy.zones.length === 0 ? (
            <div className="p-8 text-center text-slate-400">
              No zones configured for this warehouse yet.
            </div>
          ) : (
            <div className="space-y-4">
              {hierarchy.zones.map((zone: any) => (
                <div
                  key={zone.id}
                  className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 font-mono font-bold text-xs">
                        {zone.code}
                      </span>
                      <span className="font-bold text-white text-xs">{zone.name}</span>
                    </div>
                    <span className="text-[11px] text-slate-400">
                      {zone.racks.length} Racks
                    </span>
                  </div>

                  {/* Racks inside Zone */}
                  <div className="space-y-3 pl-4 border-l-2 border-slate-800">
                    {zone.racks.map((rack: any) => (
                      <div key={rack.id} className="space-y-2">
                        <div className="flex items-center space-x-2 text-xs text-slate-300">
                          <strong className="text-white font-mono">{rack.code}</strong>
                          <span className="text-[11px] text-slate-400">
                            ({rack.aisleNumber || 'General Aisle'})
                          </span>
                        </div>

                        {/* Shelves & Bins */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 pl-3">
                          {rack.shelves.flatMap((shelf: any) =>
                            shelf.bins.map((bin: any) => (
                              <div
                                key={bin.id}
                                className="p-3 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between"
                              >
                                <div>
                                  <div className="font-mono text-xs font-bold text-white flex items-center gap-1.5">
                                    <MapPin className="h-3.5 w-3.5 text-emerald-400" />
                                    {shelf.code} - {bin.code}
                                  </div>
                                  <div className="flex items-center space-x-1 text-[10px] text-slate-400 font-mono mt-0.5">
                                    <Barcode className="h-3 w-3" />
                                    <span>{bin.barcode}</span>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <span className="text-xs font-mono font-bold text-sky-400">
                                    {bin.currentStockCount} units
                                  </span>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Create Warehouse Modal */}
      <Modal
        isOpen={showCreateWarehouseModal}
        onClose={() => setShowCreateWarehouseModal(false)}
        title="Add New Warehouse"
        subtitle="Establish a new physical distribution facility"
      >
        <form onSubmit={handleCreateWarehouse} className="space-y-4 text-xs">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300">
              {errorMsg}
            </div>
          )}

          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              Warehouse Code <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. WH-SOUTH"
              value={warehouseForm.code}
              onChange={(e) => setWarehouseForm({ ...warehouseForm, code: e.target.value.toUpperCase() })}
              className="w-full rounded-xl bg-slate-950 border border-slate-700/80 px-3 py-2 text-white font-mono focus:outline-none focus:border-sky-500"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              Warehouse Name <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Southern Regional Facility"
              value={warehouseForm.name}
              onChange={(e) => setWarehouseForm({ ...warehouseForm, name: e.target.value })}
              className="w-full rounded-xl bg-slate-950 border border-slate-700/80 px-3 py-2 text-white focus:outline-none focus:border-sky-500"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Physical Address</label>
            <input
              type="text"
              placeholder="e.g. 104 Logistics Parkway, Dallas, TX"
              value={warehouseForm.address}
              onChange={(e) => setWarehouseForm({ ...warehouseForm, address: e.target.value })}
              className="w-full rounded-xl bg-slate-950 border border-slate-700/80 px-3 py-2 text-white focus:outline-none focus:border-sky-500"
            />
          </div>

          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setShowCreateWarehouseModal(false)}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-semibold disabled:opacity-50"
            >
              {submitting ? 'Saving...' : 'Create Warehouse'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Create Zone Modal */}
      <Modal
        isOpen={showCreateZoneModal}
        onClose={() => setShowCreateZoneModal(false)}
        title="Add Storage Zone"
        subtitle={`Add a zone to warehouse: ${hierarchy?.code}`}
      >
        <form onSubmit={handleCreateZone} className="space-y-4 text-xs">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300">
              {errorMsg}
            </div>
          )}

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Zone Code</label>
            <input
              type="text"
              required
              placeholder="e.g. ZONE-C"
              value={zoneForm.code}
              onChange={(e) => setZoneForm({ ...zoneForm, code: e.target.value.toUpperCase() })}
              className="w-full rounded-xl bg-slate-950 border border-slate-700/80 px-3 py-2 text-white font-mono focus:outline-none focus:border-sky-500"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Zone Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Cold Storage / Pallet Stacking"
              value={zoneForm.name}
              onChange={(e) => setZoneForm({ ...zoneForm, name: e.target.value })}
              className="w-full rounded-xl bg-slate-950 border border-slate-700/80 px-3 py-2 text-white focus:outline-none focus:border-sky-500"
            />
          </div>

          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setShowCreateZoneModal(false)}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-semibold disabled:opacity-50"
            >
              {submitting ? 'Saving...' : 'Add Zone'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Create Bin Modal */}
      <Modal
        isOpen={showCreateBinModal}
        onClose={() => setShowCreateBinModal(false)}
        title="Add Location Bin"
        subtitle="Establish an addressable bin location with unique barcode"
      >
        <form onSubmit={handleCreateBin} className="space-y-4 text-xs">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300">
              {errorMsg}
            </div>
          )}

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Shelf Location</label>
            <select
              value={binForm.shelfId}
              onChange={(e) => setBinForm({ ...binForm, shelfId: e.target.value })}
              className="w-full rounded-xl bg-slate-950 border border-slate-700/80 px-3 py-2 text-white focus:outline-none focus:border-sky-500"
            >
              {shelvesList.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Bin Code</label>
              <input
                type="text"
                required
                placeholder="e.g. B03"
                value={binForm.code}
                onChange={(e) => setBinForm({ ...binForm, code: e.target.value.toUpperCase() })}
                className="w-full rounded-xl bg-slate-950 border border-slate-700/80 px-3 py-2 text-white font-mono focus:outline-none focus:border-sky-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Barcode</label>
              <input
                type="text"
                required
                placeholder="e.g. WH-MAIN-ZC-R01-S01-B03"
                value={binForm.barcode}
                onChange={(e) => setBinForm({ ...binForm, barcode: e.target.value.toUpperCase() })}
                className="w-full rounded-xl bg-slate-950 border border-slate-700/80 px-3 py-2 text-white font-mono focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>

          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setShowCreateBinModal(false)}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-semibold disabled:opacity-50"
            >
              {submitting ? 'Saving...' : 'Add Bin'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
