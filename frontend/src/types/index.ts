// Tipos para el Sistema de Control de Ingresos y Salidas de Vehículos

export interface User {
  id: string;
  username: string;
  fullName: string;
  role: 'guard' | 'support' | 'admin';
  isActive: boolean;
}

export interface Entry {
  id: string;
  licensePlate: string;
  vehiclePhoto: string;
  driverPhoto: string;
  entryTimestamp: string;
  guardId: string;
  guardName?: string;
  latitude?: number;
  longitude?: number;
  notes?: string;
  hasExit?: boolean;
}

export interface Exit {
  id: string;
  entryId: string;
  exitTimestamp: string;
  guardId: string;
  guardName?: string;
  driverPhotoExit?: string;
  isDriverMatch?: boolean;
  latitude?: number;
  longitude?: number;
  notes?: string;
}

export interface Incident {
  id: string;
  entryId: string;
  incidentType: 'driver_mismatch' | 'unregistered_exit' | 'vehicle_mismatch' | 'other';
  description: string;
  reportedBy: string;
  reportedByName?: string;
  status: 'open' | 'investigating' | 'resolved';
  resolutionNotes?: string;
  createdAt: string;
  resolvedAt?: string;
}

export interface CreateEntryRequest {
  licensePlate: string;
  vehiclePhoto: string;
  driverPhoto: string;
  latitude?: number;
  longitude?: number;
  notes?: string;
}

export interface CreateExitRequest {
  licensePlate: string;
  driverPhotoExit?: string;
  latitude?: number;
  longitude?: number;
  notes?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface DashboardStats {
  totalEntriesToday: number;
  totalExitsToday: number;
  pendingExits: number;
  openIncidents: number;
  recentEntries: Entry[];
  recentExits: Exit[];
}

export type RegistrationStep = 'vehicle' | 'driver' | 'plate' | 'confirm';

export type EntryStatus = 'pending' | 'captured' | 'confirmed';

export interface CameraState {
  status: 'idle' | 'active' | 'capturing' | 'success' | 'error';
  error?: string;
}
