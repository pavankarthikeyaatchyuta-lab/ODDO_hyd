import React from 'react';
import { StockStatus, DocumentStatus, MovementType, UserRole } from '../../types';

export const StockStatusBadge: React.FC<{ status: StockStatus }> = ({ status }) => {
  switch (status) {
    case 'IN_STOCK':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
          In Stock
        </span>
      );
    case 'LOW_STOCK':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-400"></span>
          Low Stock
        </span>
      );
    case 'OUT_OF_STOCK':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
          <span className="h-1.5 w-1.5 rounded-full bg-rose-400"></span>
          Out of Stock
        </span>
      );
    default:
      return null;
  }
};

export const DocumentStatusBadge: React.FC<{ status: DocumentStatus | string }> = ({ status }) => {
  switch (status) {
    case 'DRAFT':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700">
          Draft
        </span>
      );
    case 'READY':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-sky-500/15 text-sky-400 border border-sky-500/30">
          Ready
        </span>
      );
    case 'PICKING':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-500/15 text-indigo-400 border border-indigo-500/30">
          Picking
        </span>
      );
    case 'PACKED':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-500/15 text-purple-400 border border-purple-500/30">
          Packed
        </span>
      );
    case 'IN_TRANSIT':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-500/15 text-blue-400 border border-blue-500/30">
          In Transit
        </span>
      );
    case 'VALIDATED':
    case 'DONE':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
          Done
        </span>
      );
    case 'CANCELLED':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-rose-500/15 text-rose-400 border border-rose-500/30">
          Cancelled
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-800 text-slate-400">
          {status}
        </span>
      );
  }
};

export const MovementTypeBadge: React.FC<{ type: MovementType | string; quantity?: number }> = ({ type, quantity }) => {
  switch (type) {
    case 'RECEIPT':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-emerald-950/60 text-emerald-300 border border-emerald-800/60">
          📥 Receipt {quantity !== undefined && `(+${Math.abs(quantity)})`}
        </span>
      );
    case 'DELIVERY':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-amber-950/60 text-amber-300 border border-amber-800/60">
          📤 Delivery {quantity !== undefined && `(-${Math.abs(quantity)})`}
        </span>
      );
    case 'INTERNAL_TRANSFER':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-sky-950/60 text-sky-300 border border-sky-800/60">
          🔄 Transfer
        </span>
      );
    case 'ADJUSTMENT':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-purple-950/60 text-purple-300 border border-purple-800/60">
          ⚖️ Adjustment {quantity !== undefined && (quantity > 0 ? `(+${quantity})` : `(${quantity})`)}
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-800 text-slate-300">
          {type}
        </span>
      );
  }
};

export const RoleBadge: React.FC<{ role: UserRole }> = ({ role }) => {
  switch (role) {
    case 'ADMIN':
      return (
        <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
          Admin
        </span>
      );
    case 'INVENTORY_MANAGER':
      return (
        <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
          Inventory Manager
        </span>
      );
    case 'WAREHOUSE_STAFF':
      return (
        <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30">
          Warehouse Staff
        </span>
      );
    case 'VIEWER_AUDITOR':
      return (
        <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
          Auditor
        </span>
      );
    default:
      return null;
  }
};
