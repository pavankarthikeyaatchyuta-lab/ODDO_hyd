import React, { useState } from 'react';
import { Terminal, ShieldAlert, CheckCircle2, XCircle, Play } from 'lucide-react';
import { apiClient } from '../../services/api';
import { PermissionKey } from '../../types';

interface ActionDefinition {
  id: string;
  name: string;
  endpoint: string;
  method: 'POST' | 'DELETE' | 'GET';
  requiredPermission: PermissionKey;
  description: string;
}

const SENSITIVE_ACTIONS: ActionDefinition[] = [
  {
    id: 'prod_update',
    name: 'Create / Update Product',
    endpoint: '/sensitive/products',
    method: 'POST',
    requiredPermission: 'products:create_update',
    description: 'Creates new SKU definition in catalog',
  },
  {
    id: 'prod_del',
    name: 'Delete Product (Admin Only)',
    endpoint: '/sensitive/products/PRD-101',
    method: 'DELETE',
    requiredPermission: 'products:delete',
    description: 'Permanently removes an active SKU',
  },
  {
    id: 'po_create',
    name: 'Create Purchase Order',
    endpoint: '/sensitive/purchase-orders',
    method: 'POST',
    requiredPermission: 'purchase_orders:create',
    description: 'Drafts procurement order with vendor',
  },
  {
    id: 'po_approve',
    name: 'Approve Purchase Order',
    endpoint: '/sensitive/purchase-orders/PO-1024/approve',
    method: 'POST',
    requiredPermission: 'purchase_orders:approve',
    description: 'Authorizes PO for receiving',
  },
  {
    id: 'stock_rec',
    name: 'Receive Inbound Stock',
    endpoint: '/sensitive/stock/receive',
    method: 'POST',
    requiredPermission: 'stock:receive',
    description: 'Increases warehouse bin physical stock',
  },
  {
    id: 'stock_del',
    name: 'Deliver Outbound Stock',
    endpoint: '/sensitive/stock/deliver',
    method: 'POST',
    requiredPermission: 'stock:deliver',
    description: 'Dispatches goods and decrements physical stock',
  },
  {
    id: 'stock_trf',
    name: 'Transfer Stock Internal',
    endpoint: '/sensitive/stock/transfer',
    method: 'POST',
    requiredPermission: 'stock:transfer',
    description: 'Moves stock between bins, preserving total count',
  },
  {
    id: 'stock_adj',
    name: 'Adjust Stock Discrepancy',
    endpoint: '/sensitive/stock/adjust',
    method: 'POST',
    requiredPermission: 'stock:adjust',
    description: 'Overwrites bin balance with reason log',
  },
  {
    id: 'count_app',
    name: 'Approve Inventory Count',
    endpoint: '/sensitive/inventory-counts/CNT-2026/approve',
    method: 'POST',
    requiredPermission: 'inventory_counts:approve',
    description: 'Manager sign-off on physical cycle count',
  },
  {
    id: 'usr_man',
    name: 'Manage User Accounts',
    endpoint: '/sensitive/users',
    method: 'POST',
    requiredPermission: 'users:manage',
    description: 'Provisions and updates team access',
  },
  {
    id: 'wh_man',
    name: 'Manage Warehouses',
    endpoint: '/sensitive/warehouses',
    method: 'POST',
    requiredPermission: 'warehouses:manage',
    description: 'Configures zones, aisles, and storage bins',
  },
  {
    id: 'led_view',
    name: 'Inspect Stock Ledger',
    endpoint: '/sensitive/ledger',
    method: 'GET',
    requiredPermission: 'ledger:view',
    description: 'Queries append-only ledger transaction journal',
  },
];

interface LogEntry {
  id: string;
  timestamp: string;
  actionName: string;
  status: number;
  message: string;
  permission: string;
  isSuccess: boolean;
}

export const SensitiveOperationsTester: React.FC = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [activeActionId, setActiveActionId] = useState<string | null>(null);

  const executeAction = async (action: ActionDefinition) => {
    setActiveActionId(action.id);
    const timestamp = new Date().toLocaleTimeString();

    try {
      let res;
      if (action.method === 'GET') {
        res = await apiClient.get(action.endpoint);
      } else if (action.method === 'DELETE') {
        res = await apiClient.delete(action.endpoint);
      } else {
        res = await apiClient.post(action.endpoint, { testPayload: true });
      }

      const newLog: LogEntry = {
        id: Math.random().toString(),
        timestamp,
        actionName: action.name,
        status: res.status,
        message: res.data.message || 'Operation executed successfully',
        permission: action.requiredPermission,
        isSuccess: true,
      };

      setLogs((prev) => [newLog, ...prev.slice(0, 19)]);
    } catch (err: unknown) {
      const e = err as { response?: { status?: number; data?: { error?: { message?: string } } } };
      const status = e.response?.status || 500;
      const message = e.response?.data?.error?.message || 'Request rejected';

      const newLog: LogEntry = {
        id: Math.random().toString(),
        timestamp,
        actionName: action.name,
        status,
        message,
        permission: action.requiredPermission,
        isSuccess: false,
      };

      setLogs((prev) => [newLog, ...prev.slice(0, 19)]);
    } finally {
      setActiveActionId(null);
    }
  };

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-sm shadow-xl">
      <div className="flex items-center justify-between pb-4 border-b border-slate-800/80">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <Terminal className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-white">Sensitive Operations Authorization Workbench</h3>
            <p className="text-xs text-slate-400">
              Click any operation below to trigger real backend API calls and verify server-enforced RBAC responses
            </p>
          </div>
        </div>
        {logs.length > 0 && (
          <button
            onClick={() => setLogs([])}
            className="text-xs text-slate-400 hover:text-slate-200 transition"
          >
            Clear Activity Log
          </button>
        )}
      </div>

      <div className="mt-4 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Actions Button Grid */}
        <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {SENSITIVE_ACTIONS.map((action) => {
            const isLoading = activeActionId === action.id;
            return (
              <button
                key={action.id}
                onClick={() => executeAction(action)}
                disabled={isLoading}
                className="text-left p-3 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-slate-700/80 hover:bg-slate-950 transition flex items-start justify-between group disabled:opacity-50"
              >
                <div>
                  <div className="text-xs font-semibold text-white group-hover:text-sky-300 transition">
                    {action.name}
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                    {action.method} {action.endpoint}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">
                    Req: <span className="font-mono text-purple-300">{action.requiredPermission}</span>
                  </div>
                </div>
                <div className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 group-hover:bg-sky-500/10 group-hover:text-sky-400 text-slate-400 transition shrink-0 ml-2">
                  <Play className={`h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} />
                </div>
              </button>
            );
          })}
        </div>

        {/* Live Server Response Terminal */}
        <div className="lg:col-span-5 bg-slate-950 rounded-2xl border border-slate-800 p-4 flex flex-col h-[400px]">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800/80 text-xs font-mono text-slate-400">
            <span>LIVE SERVER RESPONSE STREAM</span>
            <span>{logs.length} events</span>
          </div>

          <div className="flex-1 overflow-y-auto mt-2 space-y-2 pr-1 font-mono text-[11px]">
            {logs.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-600 text-center px-4">
                <ShieldAlert className="h-8 w-8 mb-2 stroke-[1.5]" />
                <p>Click any sensitive action on the left to test backend permission checks.</p>
                <p className="text-[10px] mt-1 text-slate-700">Admins succeed on all; Managers succeed on non-deletion; Staff succeed on floor moves only.</p>
              </div>
            ) : (
              logs.map((log) => (
                <div
                  key={log.id}
                  className={`p-2.5 rounded-lg border leading-tight ${
                    log.isSuccess
                      ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300'
                      : 'bg-rose-950/20 border-rose-500/30 text-rose-300'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] mb-1">
                    <span className="flex items-center gap-1 font-bold">
                      {log.isSuccess ? (
                        <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                      ) : (
                        <XCircle className="h-3 w-3 text-rose-400" />
                      )}
                      HTTP {log.status} &bull; {log.actionName}
                    </span>
                    <span className="text-slate-500">{log.timestamp}</span>
                  </div>
                  <p className="text-[10px] opacity-90 break-words">{log.message}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
