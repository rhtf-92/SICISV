import { api } from './api';
import type { Entry, ApiResponse } from '../types';

interface EntriesResponse {
  success: boolean;
  data: {
    entries: Entry[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

interface CreateEntryResponse {
  success: boolean;
  data: {
    id: string;
    licensePlate: string;
    entryTimestamp: string;
    guard: { id: string; username: string; fullName: string };
    message: string;
  };
}

interface EntryDetailResponse {
  success: boolean;
  data: Entry & {
    exits: any[];
    incidents: any[];
  };
}

interface UnsettledEntriesResponse {
  success: boolean;
  data: Entry[];
}

interface EntryFilters {
  licensePlate?: string;
  startDate?: string;
  endDate?: string;
  guardId?: string;
  page?: number;
  limit?: number;
}

function buildQuery(filters: EntryFilters): string {
  const params = new URLSearchParams();
  if (filters.licensePlate) params.set('licensePlate', filters.licensePlate);
  if (filters.startDate) params.set('startDate', filters.startDate);
  if (filters.endDate) params.set('endDate', filters.endDate);
  if (filters.guardId) params.set('guardId', filters.guardId);
  if (filters.page) params.set('page', String(filters.page));
  if (filters.limit) params.set('limit', String(filters.limit));
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

export const entryApi = {
  create: (data: {
    licensePlate: string;
    vehiclePhoto: string;
    driverPhoto: string;
    latitude?: number;
    longitude?: number;
    notes?: string;
  }) => api.post<CreateEntryResponse>('/entries', data),

  getAll: (filters: EntryFilters = {}) =>
    api.get<EntriesResponse>(`/entries${buildQuery(filters)}`),

  getById: (id: string) => api.get<EntryDetailResponse>(`/entries/${id}`),

  getUnsettled: (licensePlate?: string) => {
    const qs = licensePlate ? `?licensePlate=${encodeURIComponent(licensePlate)}` : '';
    return api.get<UnsettledEntriesResponse>(`/entries/unsettled${qs}`);
  },
};
