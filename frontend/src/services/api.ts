import axios from 'axios';
import {
  ProductSummary,
  ProductDetail,
  CategorySummary,
  WarehouseHierarchy,
  BinOption,
  ReceiptDetail,
  DeliveryOrderDetail,
  TransferDetail,
  StockAdjustmentDetail,
  StockLedgerEntry,
  DashboardKPIs,
  NotificationItem,
  MovementType,
  StockStatus,
  AdjustmentReasonCode,
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// Auto-attach Bearer token from localStorage
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('stocksense_access_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface HealthData {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptimeSeconds: number;
  environment: string;
  version: string;
  database: {
    connected: boolean;
    provider: string;
    responseTimeMs: number;
  };
  services: {
    auth: 'operational' | 'down';
    ledger: 'operational' | 'down';
    forecasting: 'operational' | 'down';
  };
}

export interface Pagination {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
}

// 1. Health API
export const healthApi = {
  getHealth: async (): Promise<HealthData> => {
    const res = await apiClient.get<HealthData>('/health');
    return res.data;
  },
};

// 2. Products & Categories API
export const productsApi = {
  listProducts: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    categoryId?: string;
    stockStatus?: StockStatus;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<{ items: ProductSummary[]; pagination: Pagination }> => {
    const res = await apiClient.get('/products', { params });
    return { items: res.data.data, pagination: res.data.pagination };
  },

  getProduct: async (id: string): Promise<ProductDetail> => {
    const res = await apiClient.get(`/products/${id}`);
    return res.data.data;
  },

  createProduct: async (data: {
    sku: string;
    name: string;
    description?: string;
    categoryId: string;
    uom?: string;
    costPrice?: number;
    salePrice?: number;
    minStock?: number;
    maxStock?: number;
    reorderQuantity?: number;
    initialStock?: number;
    initialBinId?: string;
  }): Promise<ProductSummary> => {
    const res = await apiClient.post('/products', data);
    return res.data.data;
  },

  updateProduct: async (id: string, data: Partial<ProductSummary>): Promise<ProductSummary> => {
    const res = await apiClient.put(`/products/${id}`, data);
    return res.data.data;
  },

  deleteProduct: async (id: string): Promise<void> => {
    await apiClient.delete(`/products/${id}`);
  },

  listCategories: async (): Promise<CategorySummary[]> => {
    const res = await apiClient.get('/categories');
    return res.data.data;
  },

  createCategory: async (data: { name: string; code: string; description?: string }): Promise<CategorySummary> => {
    const res = await apiClient.post('/categories', data);
    return res.data.data;
  },
};

// 3. Warehouses & Locations API
export const warehousesApi = {
  listWarehouses: async (): Promise<any[]> => {
    const res = await apiClient.get('/warehouses');
    return res.data.data;
  },

  getWarehouse: async (id: string): Promise<WarehouseHierarchy> => {
    const res = await apiClient.get(`/warehouses/${id}`);
    return res.data.data;
  },

  createWarehouse: async (data: { code: string; name: string; address?: string }): Promise<any> => {
    const res = await apiClient.post('/warehouses', data);
    return res.data.data;
  },

  updateWarehouse: async (id: string, data: { name?: string; address?: string; isActive?: boolean }): Promise<any> => {
    const res = await apiClient.put(`/warehouses/${id}`, data);
    return res.data.data;
  },

  getAllBins: async (warehouseId?: string): Promise<BinOption[]> => {
    const res = await apiClient.get('/warehouses/bins', { params: { warehouseId } });
    return res.data.data;
  },

  createZone: async (warehouseId: string, data: { code: string; name: string }): Promise<any> => {
    const res = await apiClient.post(`/warehouses/${warehouseId}/zones`, data);
    return res.data.data;
  },

  createRack: async (zoneId: string, data: { code: string; aisleNumber?: string }): Promise<any> => {
    const res = await apiClient.post(`/warehouses/zones/${zoneId}/racks`, data);
    return res.data.data;
  },

  createShelf: async (rackId: string, data: { code: string; levelNumber?: number }): Promise<any> => {
    const res = await apiClient.post(`/warehouses/racks/${rackId}/shelves`, data);
    return res.data.data;
  },

  createBin: async (shelfId: string, data: { code: string; barcode: string }): Promise<any> => {
    const res = await apiClient.post(`/warehouses/shelves/${shelfId}/bins`, data);
    return res.data.data;
  },
};

// 4. Operations API (Receipts, Deliveries, Transfers, Adjustments, Suppliers)
export const operationsApi = {
  // Receipts
  listReceipts: async (params?: {
    status?: string;
    warehouseId?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<{ items: any[]; pagination: Pagination }> => {
    const res = await apiClient.get('/operations/receipts', { params });
    return { items: res.data.data, pagination: res.data.pagination };
  },

  getReceipt: async (id: string): Promise<ReceiptDetail> => {
    const res = await apiClient.get(`/operations/receipts/${id}`);
    return res.data.data;
  },

  createReceipt: async (data: {
    supplierId?: string;
    warehouseId?: string;
    notes?: string;
    items: Array<{ productId: string; binId: string; quantityReceived: number }>;
  }): Promise<any> => {
    const res = await apiClient.post('/operations/receipts', data);
    return res.data.data;
  },

  updateReceiptStatus: async (id: string, status: 'READY' | 'CANCELLED'): Promise<any> => {
    const res = await apiClient.patch(`/operations/receipts/${id}/status`, { status });
    return res.data.data;
  },

  validateReceipt: async (id: string): Promise<any> => {
    const res = await apiClient.post(`/operations/receipts/${id}/validate`);
    return res.data.data;
  },

  // Deliveries
  listDeliveries: async (params?: {
    status?: string;
    warehouseId?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<{ items: any[]; pagination: Pagination }> => {
    const res = await apiClient.get('/operations/deliveries', { params });
    return { items: res.data.data, pagination: res.data.pagination };
  },

  getDelivery: async (id: string): Promise<DeliveryOrderDetail> => {
    const res = await apiClient.get(`/operations/deliveries/${id}`);
    return res.data.data;
  },

  createDelivery: async (data: {
    customerName: string;
    warehouseId?: string;
    notes?: string;
    items: Array<{ productId: string; binId: string; quantityDemanded: number }>;
  }): Promise<any> => {
    const res = await apiClient.post('/operations/deliveries', data);
    return res.data.data;
  },

  updateDeliveryStatus: async (id: string, status: 'READY' | 'PICKING' | 'PACKED' | 'CANCELLED'): Promise<any> => {
    const res = await apiClient.patch(`/operations/deliveries/${id}/status`, { status });
    return res.data.data;
  },

  validateDelivery: async (id: string): Promise<any> => {
    const res = await apiClient.post(`/operations/deliveries/${id}/validate`);
    return res.data.data;
  },

  // Transfers
  listTransfers: async (params?: {
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<{ items: any[]; pagination: Pagination }> => {
    const res = await apiClient.get('/operations/transfers', { params });
    return { items: res.data.data, pagination: res.data.pagination };
  },

  getTransfer: async (id: string): Promise<TransferDetail> => {
    const res = await apiClient.get(`/operations/transfers/${id}`);
    return res.data.data;
  },

  createTransfer: async (data: {
    sourceWarehouseId?: string;
    destWarehouseId?: string;
    notes?: string;
    items: Array<{ productId: string; sourceBinId: string; destBinId: string; quantity: number }>;
  }): Promise<any> => {
    const res = await apiClient.post('/operations/transfers', data);
    return res.data.data;
  },

  updateTransferStatus: async (id: string, status: 'READY' | 'IN_TRANSIT' | 'CANCELLED'): Promise<any> => {
    const res = await apiClient.patch(`/operations/transfers/${id}/status`, { status });
    return res.data.data;
  },

  completeTransfer: async (id: string): Promise<any> => {
    const res = await apiClient.post(`/operations/transfers/${id}/complete`);
    return res.data.data;
  },

  // Adjustments
  listAdjustments: async (params?: {
    productId?: string;
    warehouseId?: string;
    page?: number;
    limit?: number;
  }): Promise<{ items: StockAdjustmentDetail[]; pagination: Pagination }> => {
    const res = await apiClient.get('/operations/adjustments', { params });
    return { items: res.data.data, pagination: res.data.pagination };
  },

  createAdjustment: async (data: {
    productId: string;
    binId: string;
    countedQty: number;
    reasonCode: AdjustmentReasonCode;
    notes?: string;
  }): Promise<StockAdjustmentDetail> => {
    const res = await apiClient.post('/operations/adjustments', data);
    return res.data.data;
  },

  // Suppliers
  listSuppliers: async (): Promise<any[]> => {
    const res = await apiClient.get('/operations/suppliers');
    return res.data.data;
  },

  createSupplier: async (data: {
    code: string;
    name: string;
    contactEmail?: string;
    phone?: string;
    address?: string;
    leadTimeDays?: number;
  }): Promise<any> => {
    const res = await apiClient.post('/operations/suppliers', data);
    return res.data.data;
  },
};

// 5. Stock Ledger & Move History API
export const ledgerApi = {
  getStockLedger: async (params?: {
    productId?: string;
    warehouseId?: string;
    binId?: string;
    movementType?: MovementType;
    referenceDocType?: string;
    startDate?: string;
    endDate?: string;
    search?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<{ items: StockLedgerEntry[]; pagination: Pagination }> => {
    const res = await apiClient.get('/inventory/ledger', { params });
    return { items: res.data.data, pagination: res.data.pagination };
  },

  getMoveHistory: async (params?: {
    productId?: string;
    warehouseId?: string;
    movementType?: MovementType;
    limit?: number;
  }): Promise<any[]> => {
    const res = await apiClient.get('/inventory/move-history', { params });
    return res.data.data;
  },

  getInventoryOverview: async (params?: {
    warehouseId?: string;
    categoryId?: string;
    stockStatus?: StockStatus;
    search?: string;
  }): Promise<any[]> => {
    const res = await apiClient.get('/inventory/overview', { params });
    return res.data.data;
  },
};

// 6. Dashboard Telemetry API
export const dashboardApi = {
  getKPIs: async (filters?: {
    warehouseId?: string;
    locationId?: string;
    categoryId?: string;
    documentType?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<DashboardKPIs> => {
    const res = await apiClient.get('/dashboard/kpis', { params: filters });
    return res.data.data;
  },

  getRecentActivity: async (filters?: {
    limit?: number;
    warehouseId?: string;
    locationId?: string;
    categoryId?: string;
    documentType?: string;
    status?: string;
  } | number): Promise<any> => {
    const params = typeof filters === 'number' ? { limit: filters } : (filters || { limit: 6 });
    const res = await apiClient.get('/dashboard/recent-activity', { params });
    return res.data.data;
  },

  getAlerts: async (): Promise<{ lowStock: any[]; outOfStock: any[] }> => {
    const res = await apiClient.get('/dashboard/alerts');
    return res.data.data;
  },
};

// 7. Notifications API
export const notificationsApi = {
  listNotifications: async (): Promise<{ items: NotificationItem[]; unreadCount: number }> => {
    const res = await apiClient.get('/notifications');
    return { items: res.data.data, unreadCount: res.data.unreadCount };
  },

  markAsRead: async (id: string): Promise<void> => {
    await apiClient.patch(`/notifications/${id}/read`);
  },

  markAllAsRead: async (): Promise<void> => {
    await apiClient.post('/notifications/read-all');
  },
};
