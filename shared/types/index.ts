/**
 * StockSense Shared Types & Domain Interfaces
 */

export type UserRole = 'ADMIN' | 'INVENTORY_MANAGER' | 'WAREHOUSE_STAFF' | 'VIEWER_AUDITOR';

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
}

export interface SystemHealthResponse {
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

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  meta?: {
    page?: number;
    limit?: number;
    totalRecords?: number;
  };
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
  timestamp: string;
}
