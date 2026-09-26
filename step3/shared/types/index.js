"use strict";
/**
 * StockSense Shared Types & Domain Interfaces
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.RolePermissionsMap = void 0;
exports.RolePermissionsMap = {
    ADMIN: [
        'products:create_update',
        'products:delete',
        'purchase_orders:create',
        'purchase_orders:approve',
        'stock:receive',
        'stock:deliver',
        'stock:transfer',
        'stock:adjust',
        'inventory_counts:approve',
        'users:manage',
        'warehouses:manage',
        'ledger:view',
        'analytics:view',
    ],
    INVENTORY_MANAGER: [
        'products:create_update',
        'purchase_orders:create',
        'purchase_orders:approve',
        'stock:receive',
        'stock:deliver',
        'stock:transfer',
        'stock:adjust',
        'inventory_counts:approve',
        'warehouses:manage',
        'ledger:view',
        'analytics:view',
    ],
    WAREHOUSE_STAFF: [
        'stock:receive',
        'stock:deliver',
        'stock:transfer',
        'ledger:view',
    ],
    VIEWER_AUDITOR: [
        'ledger:view',
        'analytics:view',
    ],
};
