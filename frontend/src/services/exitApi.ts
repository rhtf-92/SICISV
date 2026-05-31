import { api } from './api';

interface ExitCreateResponse {
  success: boolean;
  data: {
    id: string;
    entryId: string;
    exitTimestamp: string;
    driverMatch: boolean | null;
    entry: {
      id: string;
      licensePlate: string;
      entryTimestamp: string;
      vehiclePhoto: string;
      driverPhoto: string;
    };
    message: string;
  };
}

interface ExitsResponse {
  success: boolean;
  data: {
    exits: any[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

interface ExitDetailResponse {
  success: boolean;
  data: any;
}

interface ExitFilters {
  entryId?: string;
  licensePlate?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

function buildQuery(filters: ExitFilters): string {
  const params = new URLSearchParams();
  if (filters.entryId) params.set('entryId', filters.entryId);
  if (filters.licensePlate) params.set('licensePlate', filters.licensePlate);
  if (filters.startDate) params.set('startDate', filters.startDate);
  if (filters.endDate) params.set('endDate', filters.endDate);
  if (filters.page) params.set('page', String(filters.page));
  if (filters.limit) params.set('limit', String(filters.limit));
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

export const exitApi = {
  create: (data: {
    licensePlate: string;
    driverPhotoExit?: string;
    isDriverMatch?: boolean;
    latitude?: number;
    longitude?: number;
    notes?: string;
  }) => api.post<ExitCreateResponse>('/exits', data),

  getAll: (filters: ExitFilters = {}) =>
    api.get<ExitsResponse>(`/exits${buildQuery(filters)}`),

  getById: (id: string) => api.get<ExitDetailResponse>(`/exits/${id}`),
};
