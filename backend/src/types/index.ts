import { Request } from 'express';

// Extend Express Request to include auth fields
export interface AuthenticatedRequest extends Request {
  userId?: string;
  username?: string;
  role?: string;
}

// API Response wrapper
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Pagination
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// User types
export type UserRole = 'guard' | 'support' | 'admin';

// Entry types
export interface EntryResponse {
  id: string;
  licensePlate: string;
  vehiclePhoto: string;
  driverPhoto: string;
  entryTimestamp: Date;
  guardId: string;
  guard?: {
    id: string;
    username: string;
    fullName: string;
  };
  latitude?: number | null;
  longitude?: number | null;
  notes?: string | null;
}

// Exit types
export interface ExitResponse {
  id: string;
  entryId: string;
  exitTimestamp: Date;
  guardId: string;
  driverPhotoExit?: string | null;
  isDriverMatch?: boolean | null;
  latitude?: number | null;
  longitude?: number | null;
  notes?: string | null;
}

// Incident types
export type IncidentType =
  | 'driver_mismatch'
  | 'unregistered_exit'
  | 'plate_not_visible'
  | 'conductor_refused'
  | 'other';

export type IncidentStatus = 'open' | 'investigating' | 'resolved';

// JWT Payload
export interface JwtPayload {
  userId: string;
  username: string;
  role: string;
}

// Dashboard
export interface DashboardStats {
  totalEntries: number;
  totalExits: number;
  totalIncidents: number;
  unresolvedIncidents: number;
}
