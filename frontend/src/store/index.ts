// Store Zustand para el Sistema de Control de Vehículos

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  User,
  Entry,
  RegistrationStep,
  CreateEntryRequest,
  CreateExitRequest,
  DashboardStats
} from '../types';

interface VehicleStore {
  // Autenticación
  user: User | null;
  token: string | null;
  setAuth: (user: User, token: string) => void;
  logout: () => void;

  // Flujo de Registro de Ingreso
  currentStep: RegistrationStep;
  vehiclePhoto: string | null;
  driverPhoto: string | null;
  licensePlate: string;
  stepStatus: {
    vehicle: 'pending' | 'captured' | 'error';
    driver: 'pending' | 'captured' | 'error';
    plate: 'pending' | 'captured' | 'error';
  };

  setCurrentStep: (step: RegistrationStep) => void;
  setVehiclePhoto: (photo: string | null) => void;
  setDriverPhoto: (photo: string | null) => void;
  setLicensePlate: (plate: string) => void;
  updateStepStatus: (step: 'vehicle' | 'driver' | 'plate', status: 'pending' | 'captured' | 'error') => void;
  resetRegistration: () => void;

  // Flujo de Salida
  exitSearchResult: {
    found: boolean;
    entry?: Entry;
    currentDriverPhoto?: string;
    driverMatch?: boolean;
  } | null;
  setExitSearchResult: (result: VehicleStore['exitSearchResult']) => void;

  // Datos de la aplicación
  entries: Entry[];
  recentEntries: Entry[];
  dashboardStats: DashboardStats | null;
  setEntries: (entries: Entry[]) => void;
  setRecentEntries: (entries: Entry[]) => void;
  setDashboardStats: (stats: DashboardStats) => void;
  addEntry: (entry: Entry) => void;

  // Estado de UI
  isLoading: boolean;
  error: string | null;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

}

const initialStepStatus = {
  vehicle: 'pending' as const,
  driver: 'pending' as const,
  plate: 'pending' as const,
};

export const useVehicleStore = create<VehicleStore>()(
  persist(
    (set, get) => ({
      // Estado inicial
      user: null,
      token: null,
      currentStep: 'vehicle',
      vehiclePhoto: null,
      driverPhoto: null,
      licensePlate: '',
      stepStatus: initialStepStatus,
      exitSearchResult: null,
      entries: [],
      recentEntries: [],
      dashboardStats: null,
      isLoading: false,
      error: null,

      // Acciones de autenticación
      setAuth: (user, token) => set({ user, token }),
      logout: () => set({
        user: null,
        token: null,
        currentStep: 'vehicle',
        vehiclePhoto: null,
        driverPhoto: null,
        licensePlate: '',
        stepStatus: initialStepStatus,
        exitSearchResult: null,
      }),

      // Acciones de registro
      setCurrentStep: (step) => set({ currentStep: step }),
      setVehiclePhoto: (photo) => {
        set({ vehiclePhoto: photo });
        if (photo) {
          get().updateStepStatus('vehicle', 'captured');
        }
      },
      setDriverPhoto: (photo) => {
        set({ driverPhoto: photo });
        if (photo) {
          get().updateStepStatus('driver', 'captured');
        }
      },
      setLicensePlate: (plate) => {
        set({ licensePlate: plate });
        if (plate.length >= 5) {
          get().updateStepStatus('plate', 'captured');
        }
      },
      updateStepStatus: (step, status) => set((state) => ({
        stepStatus: { ...state.stepStatus, [step]: status }
      })),
      resetRegistration: () => set({
        currentStep: 'vehicle',
        vehiclePhoto: null,
        driverPhoto: null,
        licensePlate: '',
        stepStatus: initialStepStatus,
        error: null,
      }),

      // Acciones de salida
      setExitSearchResult: (result) => set({ exitSearchResult: result }),

      // Acciones de datos
      setEntries: (entries) => set({ entries }),
      setRecentEntries: (entries) => set({ recentEntries: entries }),
      setDashboardStats: (stats) => set({ dashboardStats: stats }),
      addEntry: (entry) => set((state) => ({
        entries: [entry, ...state.entries],
        recentEntries: [entry, ...state.recentEntries].slice(0, 10),
      })),

      // Acciones de UI
      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),
    }),
    {
      name: 'vehicle-control-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
      }),
    }
  )
);
