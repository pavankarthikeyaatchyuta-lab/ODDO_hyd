import React from 'react';
import { ShieldCheck, Check, X, ShieldAlert } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { PermissionKey } from '../../../../shared/types';

interface PermissionMeta {
  key: PermissionKey;
  label: string;
  category: 'Catalog' | 'Procurement' | 'Warehouse Floor' | 'Governance';
  description: string;
}

const ALL_PERMISSIONS: PermissionMeta[] = [
  { key: 'products:create_update', label: 'Create / Update Products', category: 'Catalog', description: 'Define SKUs, categories, and reordering rules' },
  { key: 'products:delete', label: 'Delete Products (Admin Only)', category: 'Catalog', description: 'Remove items permanently from the product catalog' },
  { key: 'purchase_orders:create', label: 'Create Purchase Orders', category: 'Procurement', description: 'Initiate vendor purchase orders' },
  { key: 'purchase_orders:approve', label: 'Approve Purchase Orders', category: 'Procurement', description: 'Authorize procurement orders for receiving' },
  { key: 'stock:receive', label: 'Receive Inbound Stock', category: 'Warehouse Floor', description: 'Process vendor receipts and increase bin quantities' },
  { key: 'stock:deliver', label: 'Deliver Outbound Stock', category: 'Warehouse Floor', description: 'Pick, pack, and validate customer dispatches' },
  { key: 'stock:transfer', label: 'Internal Stock Transfers', category: 'Warehouse Floor', description: 'Move stock between warehouses, racks, and bins' },
  { key: 'stock:adjust', label: 'Adjust Inventory Discrepancies', category: 'Warehouse Floor', description: 'Correct recorded stock mismatches and scrap items' },
  { key: 'inventory_counts:approve', label: 'Approve Cycle Counts', category: 'Warehouse Floor', description: 'Sign off physical inventory counts and adjustments' },
  { key: 'users:manage', label: 'Manage Users & Permissions', category: 'Governance', description: 'Provision, assign roles, and deactivate user accounts' },
  { key: 'warehouses:manage', label: 'Manage Warehouses & Hierarchy', category: 'Governance', description: 'Configure facilities, zones, racks, and storage bins' },
  { key: 'ledger:view', label: 'View Stock Ledger & Audit Log', category: 'Governance', description: 'Access immutable double-entry movement journals' },
];

export const PermissionMatrixCard: React.FC = () => {
  const { user, hasPermission } = useAuth();

  if (!user) return null;

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-sm shadow-xl">
      <div className="flex items-center justify-between pb-4 border-b border-slate-800/80">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-white">Active Role Permission Matrix</h3>
            <p className="text-xs text-slate-400">
              Evaluated backend capabilities for active role: <span className="font-semibold text-white font-mono">{user.role}</span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="flex items-center gap-1 text-emerald-400">
            <Check className="h-3.5 w-3.5" /> Granted ({user.permissions.length})
          </span>
          <span className="text-slate-600">|</span>
          <span className="flex items-center gap-1 text-rose-400">
            <X className="h-3.5 w-3.5" /> Denied ({ALL_PERMISSIONS.length - user.permissions.length})
          </span>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {ALL_PERMISSIONS.map((perm) => {
          const granted = hasPermission(perm.key);
          return (
            <div
              key={perm.key}
              className={`p-3.5 rounded-xl border transition ${
                granted
                  ? 'bg-slate-950/40 border-slate-800 hover:border-slate-700'
                  : 'bg-slate-950/20 border-slate-800/40 opacity-60'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <span className="text-xs font-semibold text-white tracking-tight">{perm.label}</span>
                {granted ? (
                  <span className="p-1 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
                    <Check className="h-3 w-3" />
                  </span>
                ) : (
                  <span className="p-1 rounded-md bg-rose-500/10 text-rose-400 border border-rose-500/20 shrink-0">
                    <X className="h-3 w-3" />
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 mt-1 leading-snug">{perm.description}</p>
              <div className="mt-2 flex items-center justify-between text-[10px] font-mono text-slate-500">
                <span>{perm.key}</span>
                <span className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800">{perm.category}</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 text-[11px] text-slate-400 flex items-center gap-2">
        <ShieldAlert className="h-4 w-4 text-sky-400 shrink-0" />
        <span>
          <strong>Backend Enforcement Guarantee:</strong> Even if UI controls are tampered with on client browsers, every sensitive backend route strictly checks permissions and rejects unauthorized actions with <code>403 Forbidden</code>.
        </span>
      </div>
    </div>
  );
};
