import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
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

export const healthApi = {
  getHealth: async (): Promise<HealthData> => {
    const res = await apiClient.get<HealthData>('/health');
    return res.data;
  },
};
