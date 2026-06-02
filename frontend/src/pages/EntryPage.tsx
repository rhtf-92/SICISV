// Página de Registro de Ingreso - Sistema de Control de Vehículos

import { useState, useCallback } from 'react';
import { ArrowRight, CheckCircle, Camera, User, Car } from 'lucide-react';
import { useVehicleStore } from '../store';
import { CameraCapture } from '../components/CameraCapture';
import { ProgressStepper } from '../components/ProgressStepper';
import { PlateInput } from '../components/PlateInput';
import { ConfirmationCard } from '../components/ConfirmationCard';
import { entryApi } from '../services/entryApi';
import type { RegistrationStep, CameraState } from '../types';

interface EntryPageProps {
  onComplete?: () => void;
}

export function EntryPage({ onComplete }: EntryPageProps) {
  const {
    currentStep,
    vehiclePhoto,
    driverPhoto,
    licensePlate,
    stepStatus,
    setCurrentStep,
    setVehiclePhoto,
    setDriverPhoto,
    setLicensePlate,
    resetRegistration,
    addEntry,
    isLoading,
    setLoading,
    user,
  } = useVehicleStore();

  const [cameraState, setCameraState] = useState<CameraState>({ status: 'idle' });
  const [showSuccess, setShowSuccess] = useState(false);
  const [entryError, setEntryError] = useState<string | null>(null);

  // Manejar captura de foto
  const handleCapture = useCallback((type: 'vehicle' | 'driver') => (photo: string) => {
    if (type === 'vehicle') {
      setVehiclePhoto(photo || null);
    } else {
      setDriverPhoto(photo || null);
    }
  }, [setVehiclePhoto, setDriverPhoto]);

  // Ir al siguiente paso
  const goToNextStep = useCallback(() => {
    const steps: RegistrationStep[] = ['driver', 'vehicle', 'plate', 'confirm'];
    const currentIndex = steps.indexOf(currentStep);

    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1]);
    }
  }, [currentStep, setCurrentStep]);

  // Ir al paso anterior
  const goToPrevStep = useCallback(() => {
    const steps: RegistrationStep[] = ['driver', 'vehicle', 'plate', 'confirm'];
    const currentIndex = steps.indexOf(currentStep);

    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1]);
    }
  }, [currentStep, setCurrentStep]);

  // Confirmar registro - llamada a API real
  const handleConfirmEntry = useCallback(async () => {
    if (!vehiclePhoto || !driverPhoto || !licensePlate) {
      setEntryError('Todos los datos son requeridos');
      return;
    }

    setLoading(true);
    setEntryError(null);

    try {
      const response = await entryApi.create({
        licensePlate,
        vehiclePhoto,
        driverPhoto,
      });

      if (response.success && response.data) {
        // Add to local store
        addEntry({
          id: response.data.id,
          licensePlate: response.data.licensePlate,
          vehiclePhoto,
          driverPhoto,
          entryTimestamp: response.data.entryTimestamp,
          guardId: user?.id || '',
          guardName: response.data.guard?.fullName || user?.fullName || '',
          hasExit: false,
        });

        setShowSuccess(true);

        // Reset después de 3 segundos
        setTimeout(() => {
          setShowSuccess(false);
          resetRegistration();
          if (onComplete) onComplete();
        }, 3000);
      }
    } catch (error: any) {
      setEntryError(error.message || 'Error al guardar el registro. Intente de nuevo.');
    } finally {
      setLoading(false);
    }
  }, [vehiclePhoto, driverPhoto, licensePlate, addEntry, resetRegistration, setLoading, user]);

  // Verificar si se puede avanzar
  const canProceed = () => {
    switch (currentStep) {
      case 'vehicle':
        return stepStatus.vehicle === 'captured';
      case 'driver':
        return stepStatus.driver === 'captured';
      case 'plate':
        return stepStatus.plate === 'captured' && licensePlate.length >= 5;
      case 'confirm':
        return vehiclePhoto && driverPhoto && licensePlate;
      default:
        return false;
    }
  };

  // Pantalla de éxito
  if (showSuccess) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] animate-fade-in">
        <div className="w-24 h-24 rounded-full bg-green-500/20 flex items-center justify-center mb-6 animate-bounce">
          <CheckCircle className="w-16 h-16 text-green-400" />
        </div>
        <h2 className="text-3xl font-bold text-white mb-2">¡Ingreso Registrado!</h2>
        <p className="text-slate-400 mb-6">El vehículo ha sido registrado exitosamente</p>
        <div className="bg-slate-800 rounded-xl p-6 text-center">
          <p className="text-4xl font-mono font-bold text-blue-400">{licensePlate}</p>
          <p className="text-slate-400 mt-2">
            {new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <Car className="w-8 h-8 text-blue-400" />
          Registro de Ingreso
        </h1>
        <p className="text-slate-400 mt-1">
          Complete los pasos de seguridad e identificación del vehículo y conductor
        </p>
      </div>

      {/* Contenedor Grid Principal */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Columna Izquierda: Formulario y Captura (Cámara) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Stepper horizontal para pantallas móviles/tabletas */}
          <div className="lg:hidden bg-slate-800/40 border border-slate-700/50 rounded-2xl p-4">
            <ProgressStepper currentStep={currentStep} stepStatus={stepStatus} orientation="horizontal" />
          </div>

          <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-6 md:p-8">
            {currentStep === 'driver' && (
              <div className="space-y-6 animate-fade-in">
                <div className="text-center">
                  <div className="inline-flex items-center gap-2 bg-blue-500/10 text-blue-400 px-4 py-2 rounded-full mb-4">
                    <User className="w-5 h-5" />
                    <span className="font-medium">Paso 1: Fotografía Facial del Conductor</span>
                  </div>
                  <p className="text-slate-300 text-sm">
                    Capture el rostro del conductor mirando directamente a la cámara
                  </p>
                </div>

                <CameraCapture
                  mode="driver"
                  onCapture={handleCapture('driver')}
                  state={cameraState}
                  onStateChange={setCameraState}
                />

                {/* Preview capturada */}
                {driverPhoto && (
                  <div className="mt-6 p-4 bg-slate-800 rounded-xl">
                    <p className="text-sm text-slate-400 mb-2 font-medium">Vista previa conductor:</p>
                    <img
                      src={driverPhoto}
                      alt="Conductor capturado"
                      className="w-full max-h-48 object-contain rounded-lg border border-slate-700"
                    />
                  </div>
                )}
              </div>
            )}

            {currentStep === 'vehicle' && (
              <div className="space-y-6 animate-fade-in">
                <div className="text-center">
                  <div className="inline-flex items-center gap-2 bg-blue-500/10 text-blue-400 px-4 py-2 rounded-full mb-4">
                    <Camera className="w-5 h-5" />
                    <span className="font-medium">Paso 2: Foto Panorámica del Vehículo</span>
                  </div>
                  <p className="text-slate-300 text-sm">
                    Capture una fotografía panorámica de alta resolución del vehículo con el conductor
                  </p>
                </div>

                <CameraCapture
                  mode="vehicle"
                  onCapture={handleCapture('vehicle')}
                  state={cameraState}
                  onStateChange={setCameraState}
                />

                {/* Preview capturada */}
                {vehiclePhoto && (
                  <div className="mt-6 p-4 bg-slate-800 rounded-xl">
                    <p className="text-sm text-slate-400 mb-2 font-medium">Vista previa vehículo:</p>
                    <img
                      src={vehiclePhoto}
                      alt="Vehículo capturado"
                      className="w-full max-h-48 object-contain rounded-lg border border-slate-700"
                    />
                  </div>
                )}
              </div>
            )}

            {currentStep === 'plate' && (
              <div className="space-y-6 animate-fade-in">
                <div className="text-center">
                  <div className="inline-flex items-center gap-2 bg-blue-500/10 text-blue-400 px-4 py-2 rounded-full mb-4">
                    <Car className="w-5 h-5" />
                    <span className="font-medium">Paso 3: Registro de Placa</span>
                  </div>
                  <p className="text-slate-300 text-sm">
                    Registre la placa vehicular leyéndola de la cámara o ingresándola manualmente
                  </p>
                </div>

                <div className="max-w-md mx-auto">
                  <PlateInput
                    value={licensePlate}
                    onChange={setLicensePlate}
                    recentPlates={[]}
                  />
                </div>
              </div>
            )}

            {currentStep === 'confirm' && (
              <div className="animate-fade-in">
                <ConfirmationCard
                  vehiclePhoto={vehiclePhoto}
                  driverPhoto={driverPhoto}
                  licensePlate={licensePlate}
                  onConfirm={handleConfirmEntry}
                  onCancel={goToPrevStep}
                  isLoading={isLoading}
                  error={entryError}
                />
              </div>
            )}
          </div>

          {/* Navegación entre pasos */}
          {currentStep !== 'confirm' && (
            <div className="flex justify-between items-center pt-2">
              <button
                onClick={goToPrevStep}
                disabled={currentStep === 'driver'}
                className={`
                  px-4 py-2.5 sm:px-6 sm:py-3 rounded-xl font-semibold transition-all text-sm sm:text-base
                  ${currentStep === 'driver'
                    ? 'text-slate-600 cursor-not-allowed'
                    : 'text-slate-300 hover:bg-slate-850 hover:text-white border border-slate-700/50'
                  }
                `}
              >
                Anterior
              </button>

              <button
                onClick={goToNextStep}
                disabled={!canProceed()}
                className={`
                  flex items-center gap-2 px-4 py-2.5 sm:px-6 sm:py-3 rounded-xl font-bold text-sm sm:text-base
                  transition-all disabled:opacity-50 disabled:cursor-not-allowed
                  ${canProceed()
                    ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/15'
                    : 'bg-slate-800 text-slate-500 border border-slate-700/50'
                  }
                `}
              >
                Siguiente
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>

        {/* Columna Derecha: Stepper Vertical Fijo en Escritorio (oculto en móviles/tabletas) */}
        <div className="hidden lg:block lg:col-span-4 bg-slate-800/30 border border-slate-700/50 rounded-2xl p-6 lg:sticky lg:top-6">
          <h3 className="font-bold text-white text-base mb-5 border-b border-slate-700/50 pb-2">
            Pasos de Registro
          </h3>
          <ProgressStepper currentStep={currentStep} stepStatus={stepStatus} orientation="vertical" />
        </div>

      </div>
    </div>
  );
}
