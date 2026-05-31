import { api } from './api';

interface IncidentResponse {
  success: boolean;
  data: any;
}

interface IncidentsResponse {
  success: boolean;
  data: {
    incidents: any[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export const incidentApi = {
  create: (data: {
    entryId: string;
    incidentType: string;
    description?: string;
  }) => api.post<IncidentResponse>('/incidents', data),

  getAll: (filters: { status?: string; incidentType?: string; page?: number; limit?: number } = {}) => {
    const params = new URLSearchParams();
    if (filters.status) params.set('status', filters.status);
    if (filters.incidentType) params.set('incidentType', filters.incidentType);
    if (filters.page) params.set('page', String(filters.page));
    if (filters.limit) params.set('limit', String(filters.limit));
    const qs = params.toString();
    return api.get<IncidentsResponse>(`/incidents${qs ? `?${qs}` : ''}`);
  },

  updateStatus: (id: string, status: string, resolutionNotes?: string) =>
    api.patch<IncidentResponse>(`/incidents/${id}`, { status, resolutionNotes }),
};
