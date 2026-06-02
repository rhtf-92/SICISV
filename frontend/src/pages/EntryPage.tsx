// Página de Registro de Ingreso - Sistema de Control de Vehículos

import { useState, useCallback, useEffect, useRef } from 'react';
import { ArrowRight, CheckCircle, Camera, User, Car, Scan, AlertTriangle, UserPlus } from 'lucide-react';
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

type RecognitionState = 'idle' | 'recognizing' | 'recognized' | 'not_found' | 'error';

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
  const [recognitionState, setRecognitionState] = useState<RecognitionState>('idle');
  const [recognizedProfile, setRecognizedProfile] = useState<any>(null);
  const [recognitionConfidence, setRecognitionConfidence] = useState<number>(0);

  const handleDriverCapture = useCallback(async (photo: string) => {
    if (!photo) return;
    setDriverPhoto(photo);
    setRecognitionState('recognizing');

    try {
      const res = await fetch('http://localhost:3002/api/facial/recognize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: photo }),
      });
      const data = await res.json();

      if (data.success && data.recognized && data.profile) {
        setRecognizedProfile(data.profile);
        setRecognitionConfidence(data.confidence || 0);
        setRecognitionState('recognized');
        setLicensePlate(data.profile.licensePlate || '');
        if (data.profile.vehiclePhoto) {
          setVehiclePhoto(data.profile.vehiclePhoto);
        }
      } else {
        setRecognitionState('not_found');
        setRecognizedProfile(null);
      }
    } catch {
      setRecognitionState('error');
      setRecognizedProfile(null);
    }
  }, [setDriverPhoto, setLicensePlate, setVehiclePhoto]);

  const handleVehicleCapture = useCallback((photo: string) => {
    setVehiclePhoto(photo || null);
  }, [setVehiclePhoto]);

  const goToNextStep = useCallback(() => {
    const steps: RegistrationStep[] = ['driver', 'vehicle', 'plate', 'confirm'];
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1]);
    }
  }, [currentStep, setCurrentStep]);

  const goToPrevStep = useCallback(() => {
    const steps: RegistrationStep[] = ['driver', 'vehicle', 'plate', 'confirm'];
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1]);
    }
  }, [currentStep, setCurrentStep]);

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
          <Scan className="w-8 h-8 text-blue-400" />
          Registro de Ingreso
        </h1>
        <p className="text-slate-400 mt-1">
          Reconocimiento facial automático del conductor
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
                    <span className="font-medium">Paso 1: Reconocimiento Facial</span>
                  </div>
                  <p className="text-slate-300 text-sm">
                    La cámara capturará el rostro automáticamente. El conductor debe mirar directamente.
                  </p>
                </div>

                {recognitionState === 'idle' && (
                  <CameraCapture
                    mode="driver"
                    onCapture={handleDriverCapture}
                    state={cameraState}
                    onStateChange={setCameraState}
                    autoCapture
                  />
                )}

                {recognitionState === 'recognizing' && (
                  <div className="text-center py-12">
                    <div className="w-20 h-20 rounded-full bg-blue-500/20 flex items-center justify-center mx-auto mb-4">
                      <Scan className="w-10 h-10 text-blue-400 animate-pulse" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">Reconociendo Rostro...</h3>
                    <div className="flex items-center justify-center gap-2 text-blue-400">
                      <div className="animate-spin w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full" />
                      <span>Buscando en base de datos facial</span>
                    </div>
                  </div>
                )}

                {recognitionState === 'recognized' && recognizedProfile && (
                  <div className="space-y-4">
                    <div className="p-6 bg-green-500/10 border border-green-500/30 rounded-xl text-center">
                      <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-3">
                        <CheckCircle className="w-8 h-8 text-green-400" />
                      </div>
                      <h3 className="text-xl font-bold text-green-400 mb-1">¡Conductor Reconocido!</h3>
                      <p className="text-green-300/70 text-sm">
                        Confianza: {(recognitionConfidence * 100).toFixed(1)}%
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 p-4 bg-slate-800 rounded-xl">
                      <div className="text-center">
                        <div className="w-24 h-24 rounded-xl overflow-hidden bg-slate-700 mx-auto mb-2">
                          <img src={recognizedProfile.driverPhoto} className="w-full h-full object-cover" />
                        </div>
                        <p className="text-xs text-slate-400">Registrado</p>
                      </div>
                      <div className="text-center">
                        <div className="w-24 h-24 rounded-xl overflow-hidden bg-slate-700 mx-auto mb-2 ring-2 ring-green-500/50">
                          <img src={driverPhoto || ''} className="w-full h-full object-cover" />
                        </div>
                        <p className="text-xs text-slate-400">Actual</p>
                      </div>
                    </div>

                    <div className="p-4 bg-slate-800/60 rounded-xl">
                      <p className="text-sm text-slate-400 mb-1">Placa asociada</p>
                      <p className="text-2xl font-mono font-bold text-blue-400">{recognizedProfile.licensePlate}</p>
                    </div>

                    <p className="text-xs text-slate-500 text-center">
                      Los datos del vehículo se han precargado. Puede editarlos en los siguientes pasos si es necesario.
                    </p>

                    <button onClick={goToNextStep} className="w-full py-4 rounded-xl bg-green-600 text-white font-bold hover:bg-green-500 transition-colors text-lg flex items-center justify-center gap-2">
                      Continuar <ArrowRight className="w-5 h-5" />
                    </button>

                    <button onClick={() => { setRecognitionState('idle'); setRecognizedProfile(null); setRecognitionConfidence(0); setCameraState({ status: 'idle' }); }}
                      className="w-full py-3 rounded-xl border-2 border-slate-600 text-slate-300 font-medium hover:bg-slate-700 transition-colors text-sm">
                      Tomar otra foto
                    </button>
                  </div>
                )}

                {(recognitionState === 'not_found' || recognitionState === 'error') && (
                  <div className="space-y-4">
                    <div className="p-6 bg-amber-500/10 border border-amber-500/30 rounded-xl text-center">
                      <div className="w-16 h-16 rounded-full bg-amber-500/20 flex items-center justify-center mx-auto mb-3">
                        <UserPlus className="w-8 h-8 text-amber-400" />
                      </div>
                      <h3 className="text-xl font-bold text-amber-400 mb-1">Usuario Nuevo</h3>
                      <p className="text-amber-300/70 text-sm">
                        {recognitionState === 'error'
                          ? 'No se pudo conectar con el servicio de reconocimiento facial'
                          : 'Este rostro no está registrado en el sistema'}
                      </p>
                    </div>

                    <div className="p-4 bg-slate-800/60 rounded-xl">
                      <div className="flex items-center gap-2 text-slate-300">
                        <AlertTriangle className="w-5 h-5 text-amber-400" />
                        <span>Complete los datos del vehículo y conductor manualmente</span>
                      </div>
                    </div>

                    <button onClick={goToNextStep} className="w-full py-4 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-500 transition-colors text-lg flex items-center justify-center gap-2">
                      Continuar Registro Manual <ArrowRight className="w-5 h-5" />
                    </button>

                    <button onClick={() => { setRecognitionState('idle'); setRecognizedProfile(null); setCameraState({ status: 'idle' }); }}
                      className="w-full py-3 rounded-xl border-2 border-slate-600 text-slate-300 font-medium hover:bg-slate-700 transition-colors text-sm">
                      Reintentar captura
                    </button>
                  </div>
                )}
              </div>
            )}

            {currentStep === 'vehicle' && (
              <div className="space-y-6 animate-fade-in">
                {recognizedProfile && (
                  <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-xl flex items-center gap-2 text-green-400 text-sm">
                    <CheckCircle className="w-4 h-4" />
                    Conductor reconocido - placa {recognizedProfile.licensePlate}
                  </div>
                )}
                <div className="text-center">
                  <div className="inline-flex items-center gap-2 bg-blue-500/10 text-blue-400 px-4 py-2 rounded-full mb-4">
                    <Camera className="w-5 h-5" />
                    <span className="font-medium">Paso 2: Foto Panorámica del Vehículo</span>
                  </div>
                  <p className="text-slate-300 text-sm">
                    {vehiclePhoto
                      ? 'Confirme o tome una nueva fotografía del vehículo'
                      : 'Capture una fotografía panorámica del vehículo con el conductor'
                    }
                  </p>
                </div>

                <CameraCapture
                  mode="vehicle"
                  onCapture={handleVehicleCapture}
                  state={cameraState}
                  onStateChange={setCameraState}
                />

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
                {recognizedProfile && (
                  <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-xl flex items-center gap-2 text-green-400 text-sm">
                    <CheckCircle className="w-4 h-4" />
                    Placa precargada del conductor reconocido
                  </div>
                )}
                <div className="text-center">
                  <div className="inline-flex items-center gap-2 bg-blue-500/10 text-blue-400 px-4 py-2 rounded-full mb-4">
                    <Car className="w-5 h-5" />
                    <span className="font-medium">Paso 3: Registro de Placa</span>
                  </div>
                  <p className="text-slate-300 text-sm">
                    {recognizedProfile
                      ? 'Verifique y confirme la placa vehicular'
                      : 'Ingrese la placa vehicular manualmente'
                    }
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
