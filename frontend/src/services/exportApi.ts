import { api } from './api';

export const exportApi = {
  entries: (filters: { startDate?: string; endDate?: string; licensePlate?: string } = {}) => {
    const params = new URLSearchParams();
    if (filters.startDate) params.set('startDate', filters.startDate);
    if (filters.endDate) params.set('endDate', filters.endDate);
    if (filters.licensePlate) params.set('licensePlate', filters.licensePlate);
    const qs = params.toString();
    return api.download(`/export/entries${qs ? `?${qs}` : ''}`);
  },

  exits: (filters: { startDate?: string; endDate?: string; licensePlate?: string } = {}) => {
    const params = new URLSearchParams();
    if (filters.startDate) params.set('startDate', filters.startDate);
    if (filters.endDate) params.set('endDate', filters.endDate);
    if (filters.licensePlate) params.set('licensePlate', filters.licensePlate);
    const qs = params.toString();
    return api.download(`/export/exits${qs ? `?${qs}` : ''}`);
  },
};
