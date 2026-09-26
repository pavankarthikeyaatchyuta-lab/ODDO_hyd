/**
 * StockSense Shared Types & Domain Interfaces
 */

export type UserRole = 'ADMIN' | 'INVENTORY_MANAGER' | 'WAREHOUSE_STAFF' | 'VIEWER_AUDITOR';

export type PermissionKey =
  | 'products:create_update'
  | 'products:delete'
  | 'purchase_orders:create'
  | 'purchase_orders:approve'
  | 'stock:receive'
  | 'stock:deliver'
  | 'stock:transfer'
  | 'stock:adjust'
  | 'inventory_counts:approve'
  | 'users:manage'
  | 'warehouses:manage'
  | 'ledger:view'
  | 'analytics:view';

export const RolePermissionsMap: Record<UserRole, PermissionKey[]> = {
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

export type MovementType = 
  | 'RECEIPT' 
  | 'DELIVERY' 
  | 'TRANSFER' 
  | 'ADJUSTMENT' 
  | 'RESERVATION' 
  | 'RELEASE';

export type DocumentStatus = 
  | 'DRAFT' 
  | 'WAITING' 
  | 'READY' 
  | 'DONE' 
  | 'CANCELLED';

export type SeverityLevel = 'INFO' | 'WARNING' | 'CRITICAL' | 'COMPLETED';

export interface UserSummary {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  isActive: boolean;
  lastLoginAt?: string | null;
  permissions: PermissionKey[];
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse {
  user: UserSummary;
  tokens: AuthTokens;
}
