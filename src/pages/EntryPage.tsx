// Página de Registro de Ingreso - Sistema de Control de Vehículos

import { useState, useCallback } from 'react';
import { ArrowRight, CheckCircle, Camera, User, Car, Save } from 'lucide-react';
import { useVehicleStore } from '../store';
import { CameraCapture } from '../components/CameraCapture';
import { ProgressStepper } from '../components/ProgressStepper';
import { PlateInput } from '../components/PlateInput';
import { ConfirmationCard } from '../components/ConfirmationCard';
import type { RegistrationStep, CameraState } from '../types';

export function EntryPage() {
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
    setError,
  } = useVehicleStore();

  const [cameraState, setCameraState] = useState<CameraState>({ status: 'idle' });
  const [showSuccess, setShowSuccess] = useState(false);
  const [entryError, setEntryError] = useState<string | null>(null);

  // Obtener recientes placas (simulado)
  const recentPlates = ['ABC-1234', 'XYZ-5678', 'DEF-9012'];

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
    const steps: RegistrationStep[] = ['vehicle', 'driver', 'plate', 'confirm'];
    const currentIndex = steps.indexOf(currentStep);

    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1]);
    }
  }, [currentStep, setCurrentStep]);

  // Ir al paso anterior
  const goToPrevStep = useCallback(() => {
    const steps: RegistrationStep[] = ['vehicle', 'driver', 'plate', 'confirm'];
    const currentIndex = steps.indexOf(currentStep);

    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1]);
    }
  }, [currentStep, setCurrentStep]);

  // Confirmar registro
  const handleConfirmEntry = useCallback(async () => {
    if (!vehiclePhoto || !driverPhoto || !licensePlate) {
      setEntryError('Todos los datos son requeridos');
      return;
    }

    setLoading(true);
    setEntryError(null);

    try {
      // Simular llamada a API
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Crear objeto de entrada
      const newEntry = {
        id: crypto.randomUUID(),
        licensePlate,
        vehiclePhoto,
        driverPhoto,
        entryTimestamp: new Date().toISOString(),
        guardId: 'current-user',
        guardName: 'Vigilante Demo',
        hasExit: false,
      };

      addEntry(newEntry);
      setShowSuccess(true);

      // Reset después de 3 segundos
      setTimeout(() => {
        setShowSuccess(false);
        resetRegistration();
      }, 3000);
    } catch (error) {
      setEntryError('Error al guardar el registro. Intente de nuevo.');
    } finally {
      setLoading(false);
    }
  }, [vehiclePhoto, driverPhoto, licensePlate, addEntry, resetRegistration, setLoading]);

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
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <Car className="w-8 h-8 text-blue-400" />
          Registro de Ingreso
        </h1>
        <p className="text-slate-400 mt-1">
          Complete los pasos para registrar el ingreso de un vehículo
        </p>
      </div>

      {/* Progress Stepper */}
      <ProgressStepper currentStep={currentStep} stepStatus={stepStatus} />

      {/* Contenido del paso */}
      <div className="mt-8">
        {currentStep === 'vehicle' && (
          <div className="space-y-6 animate-fade-in">
            <div className="text-center">
              <div className="inline-flex items-center gap-2 bg-blue-500/10 text-blue-400 px-4 py-2 rounded-full mb-4">
                <Camera className="w-5 h-5" />
                <span className="font-medium">Paso 1: Foto del Vehículo</span>
              </div>
              <p className="text-slate-400">
                Capture una fotografía lateral del vehículo para identificarlo claramente
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
                <p className="text-sm text-slate-400 mb-2">Vista previa:</p>
                <img
                  src={vehiclePhoto}
                  alt="Vehículo capturado"
                  className="w-full max-h-48 object-contain rounded-lg"
                />
              </div>
            )}
          </div>
        )}

        {currentStep === 'driver' && (
          <div className="space-y-6 animate-fade-in">
            <div className="text-center">
              <div className="inline-flex items-center gap-2 bg-blue-500/10 text-blue-400 px-4 py-2 rounded-full mb-4">
                <User className="w-5 h-5" />
                <span className="font-medium">Paso 2: Foto del Conductor</span>
              </div>
              <p className="text-slate-400">
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
                <p className="text-sm text-slate-400 mb-2">Vista previa:</p>
                <img
                  src={driverPhoto}
                  alt="Conductor capturado"
                  className="w-full max-h-48 object-contain rounded-lg"
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
              <p className="text-slate-400">
                Ingrese el número de placa del vehículo
              </p>
            </div>

            <div className="max-w-md mx-auto">
              <PlateInput
                value={licensePlate}
                onChange={setLicensePlate}
                recentPlates={recentPlates}
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
        <div className="mt-8 flex justify-between">
          <button
            onClick={goToPrevStep}
            disabled={currentStep === 'vehicle'}
            className={`
              px-6 py-3 rounded-xl font-medium transition-all
              ${currentStep === 'vehicle'
                ? 'text-slate-600 cursor-not-allowed'
                : 'text-slate-300 hover:bg-slate-700'
              }
            `}
          >
            Anterior
          </button>

          <button
            onClick={goToNextStep}
            disabled={!canProceed()}
            className={`
              flex items-center gap-2 px-6 py-3 rounded-xl font-medium
              transition-all disabled:opacity-50 disabled:cursor-not-allowed
              ${canProceed()
                ? 'bg-blue-600 hover:bg-blue-500 text-white'
                : 'bg-slate-700 text-slate-400'
              }
            `}
          >
            Siguiente
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
}
