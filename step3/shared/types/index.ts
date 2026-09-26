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

export type StockStatus = 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';

export type MovementType = 
  | 'RECEIPT' 
  | 'DELIVERY' 
  | 'INTERNAL_TRANSFER' 
  | 'ADJUSTMENT' 
  | 'RESERVATION' 
  | 'RELEASE';

export type DocumentStatus = 
  | 'DRAFT' 
  | 'WAITING' 
  | 'READY' 
  | 'PICKING'
  | 'PACKED'
  | 'IN_TRANSIT'
  | 'VALIDATED' 
  | 'DONE' 
  | 'CANCELLED';

export type SeverityLevel = 'INFO' | 'WARNING' | 'CRITICAL' | 'COMPLETED';

export type AdjustmentReasonCode = 
  | 'DAMAGED' 
  | 'LOST' 
  | 'FOUND' 
  | 'COUNTING_ERROR' 
  | 'DATA_CORRECTION' 
  | 'OTHER';

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

export interface CategorySummary {
  id: string;
  name: string;
  code: string;
  description?: string | null;
  createdAt: string;
  productCount?: number;
}

export interface ProductSummary {
  id: string;
  sku: string;
  name: string;
  description?: string | null;
  categoryId: string;
  categoryName?: string;
  uom: string;
  costPrice: number;
  salePrice: number;
  minStock: number;
  maxStock: number;
  reorderQuantity: number;
  isActive: boolean;
  totalStock: number;
  stockStatus: StockStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ProductDetail extends ProductSummary {
  category: CategorySummary;
  stockByWarehouse: Array<{
    warehouseId: string;
    warehouseCode: string;
    warehouseName: string;
    quantity: number;
  }>;
  stockByLocation: Array<{
    binId: string;
    binCode: string;
    barcode: string;
    locationPath: string;
    warehouseId: string;
    warehouseName: string;
    quantity: number;
  }>;
  recentMovements: Array<{
    id: string;
    timestamp: string;
    movementType: MovementType;
    quantity: number;
    qtyBefore: number;
    qtyAfter: number;
    referenceDocNumber?: string | null;
    referenceDocType?: string | null;
    performedByName?: string | null;
    reason?: string | null;
  }>;
}

export interface WarehouseHierarchy {
  id: string;
  code: string;
  name: string;
  address?: string | null;
  isActive: boolean;
  totalBins: number;
  totalStock: number;
  zones: Array<{
    id: string;
    code: string;
    name: string;
    racks: Array<{
      id: string;
      code: string;
      aisleNumber?: string | null;
      shelves: Array<{
        id: string;
        code: string;
        levelNumber?: number | null;
        bins: Array<{
          id: string;
          code: string;
          barcode: string;
          isLocked: boolean;
          locationPath: string;
          currentStockCount: number;
        }>;
      }>;
    }>;
  }>;
}

export interface BinOption {
  id: string;
  code: string;
  barcode: string;
  locationPath: string;
  warehouseId: string;
  warehouseName: string;
}

export interface ReceiptItemPayload {
  productId: string;
  binId: string;
  quantityReceived: number;
}

export interface ReceiptDetail {
  id: string;
  receiptNumber: string;
  supplierId?: string | null;
  supplierName?: string | null;
  warehouseId?: string | null;
  warehouseName?: string | null;
  status: DocumentStatus;
  receivedAt?: string | null;
  validatedAt?: string | null;
  notes?: string | null;
  createdAt: string;
  items: Array<{
    id: string;
    productId: string;
    productName: string;
    productSku: string;
    uom: string;
    binId: string;
    binPath: string;
    quantityReceived: number;
  }>;
}

export interface DeliveryOrderItemPayload {
  productId: string;
  binId: string;
  quantityDemanded: number;
  quantityPicked?: number;
}

export interface DeliveryOrderDetail {
  id: string;
  doNumber: string;
  customerName: string;
  warehouseId?: string | null;
  warehouseName?: string | null;
  status: DocumentStatus;
  dispatchedAt?: string | null;
  notes?: string | null;
  createdAt: string;
  items: Array<{
    id: string;
    productId: string;
    productName: string;
    productSku: string;
    uom: string;
    binId: string;
    binPath: string;
    quantityDemanded: number;
    quantityPicked: number;
    availableStock?: number;
  }>;
}

export interface TransferItemPayload {
  productId: string;
  sourceBinId: string;
  destBinId: string;
  quantity: number;
}

export interface TransferDetail {
  id: string;
  transferNumber: string;
  sourceWarehouseId?: string | null;
  sourceWarehouseName?: string | null;
  destWarehouseId?: string | null;
  destWarehouseName?: string | null;
  status: DocumentStatus;
  initiatedAt: string;
  completedAt?: string | null;
  notes?: string | null;
  items: Array<{
    id: string;
    productId: string;
    productName: string;
    productSku: string;
    uom: string;
    sourceBinId: string;
    sourceBinPath: string;
    destBinId: string;
    destBinPath: string;
    quantity: number;
  }>;
}

export interface StockAdjustmentPayload {
  productId: string;
  binId: string;
  countedQty: number;
  reasonCode: AdjustmentReasonCode;
  notes?: string;
}

export interface StockAdjustmentDetail {
  id: string;
  adjustmentNumber: string;
  productId: string;
  productName: string;
  productSku: string;
  uom: string;
  binId: string;
  binPath: string;
  warehouseName?: string;
  recordedQty: number;
  countedQty: number;
  differenceQty: number;
  reasonCode: string;
  notes?: string | null;
  adjustedById?: string | null;
  adjustedByName?: string | null;
  createdAt: string;
}

export interface StockLedgerEntry {
  id: string;
  timestamp: string;
  productId: string;
  productName: string;
  sku: string;
  warehouseId?: string | null;
  warehouseName?: string | null;
  binId: string;
  locationPath: string;
  movementType: MovementType;
  quantity: number;
  qtyBefore: number;
  qtyAfter: number;
  referenceDocType?: string | null;
  referenceDocId?: string | null;
  referenceDocNumber?: string | null;
  sourceLocation?: string | null;
  destLocation?: string | null;
  performedById?: string | null;
  performedByName?: string | null;
  reason?: string | null;
  createdAt: string;
}

export interface DashboardKPIs {
  totalProductsInStock: number;
  lowStockItemsCount: number;
  outOfStockItemsCount: number;
  pendingReceiptsCount: number;
  pendingDeliveriesCount: number;
  scheduledTransfersCount: number;
  totalStockUnits: number;
}

export interface NotificationItem {
  id: string;
  userId?: string | null;
  title: string;
  message: string;
  severity: SeverityLevel;
  linkUrl?: string | null;
  isRead: boolean;
  createdAt: string;
}
