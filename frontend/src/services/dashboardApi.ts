import { api } from './api';

interface StatsResponse {
  success: boolean;
  data: {
    totalEntries: number;
    totalExits: number;
    totalIncidents: number;
    unresolvedIncidents: number;
    entriesToday: number;
    exitsToday: number;
    pendingExits: number;
  };
}

interface RecentResponse {
  success: boolean;
  data: {
    recentEntries: any[];
    recentExits: any[];
    recentIncidents: any[];
  };
}

export const dashboardApi = {
  getStats: () => api.get<StatsResponse>('/dashboard/stats'),
  getRecent: (limit: number = 10) => api.get<RecentResponse>(`/dashboard/recent?limit=${limit}`),
};
