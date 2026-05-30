// Página de Registro de Salida - Sistema de Control de Vehículos

import { useState, useCallback } from 'react';
import { Search, Car, User, Clock, AlertTriangle, CheckCircle, X, Camera } from 'lucide-react';
import { useVehicleStore } from '../store';
import { PlateInput } from '../components/PlateInput';
import { CameraCapture } from '../components/CameraCapture';
import { VehicleStatusBadge } from '../components/StatusBadge';
import type { Entry, CameraState } from '../types';

type ExitVerificationState = 'idle' | 'searching' | 'found' | 'driver_mismatch' | 'not_found' | 'confirming' | 'success';

export function ExitPage() {
  const { entries, setExitSearchResult } = useVehicleStore();

  const [searchPlate, setSearchPlate] = useState('');
  const [verificationState, setVerificationState] = useState<ExitVerificationState>('idle');
  const [foundEntry, setFoundEntry] = useState<Entry | null>(null);
  const [currentDriverPhoto, setCurrentDriverPhoto] = useState<string | null>(null);
  const [cameraState, setCameraState] = useState<CameraState>({ status: 'idle' });
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Buscar vehículo por placa
  const searchVehicle = useCallback(() => {
    if (!searchPlate || searchPlate.length < 5) {
      setError('Ingrese una placa válida');
      return;
    }

    setIsLoading(true);
    setError(null);
    setVerificationState('searching');

    // Simular búsqueda
    setTimeout(() => {
      const entry = entries.find(
        e => e.licensePlate.toUpperCase() === searchPlate.toUpperCase() && !e.hasExit
      );

      if (entry) {
        setFoundEntry(entry);
        setVerificationState('found');
      } else {
        setVerificationState('not_found');
        setError('No se encontró un registro de ingreso activo para esta placa');
      }
      setIsLoading(false);
    }, 1000);
  }, [searchPlate, entries]);

  // Capturar foto del conductor actual
  const handleDriverCapture = useCallback((photo: string) => {
    setCurrentDriverPhoto(photo || null);
  }, []);

  // Simular comparación de rostros (en producción sería un servicio de IA)
  const compareDrivers = useCallback(() => {
    if (!foundEntry || !currentDriverPhoto) return false;

    // Simulación: en producción se usaría un servicio de comparación facial
    // Por ahora, simulamos que el 90% de las veces coincide
    return Math.random() > 0.1;
  }, [foundEntry, currentDriverPhoto]);

  // Capturar conductor para verificación
  const handleVerifyDriver = useCallback(() => {
    setVerificationState('confirming');

    // Simular captura
    setTimeout(() => {
      const match = compareDrivers();

      if (!match) {
        setVerificationState('driver_mismatch');
      } else {
        setVerificationState('found');
      }
    }, 1500);
  }, [compareDrivers]);

  // Confirmar salida
  const handleConfirmExit = useCallback(async () => {
    if (!foundEntry) return;

    setIsLoading(true);

    // Simular registro de salida
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Actualizar el registro
    setExitSearchResult({
      found: true,
      entry: { ...foundEntry, hasExit: true },
      currentDriverPhoto: currentDriverPhoto || undefined,
      driverMatch: verificationState === 'found',
    });

    setVerificationState('success');
    setIsLoading(false);

    // Reset después de 3 segundos
    setTimeout(() => {
      resetForm();
    }, 3000);
  }, [foundEntry, currentDriverPhoto, verificationState, setExitSearchResult]);

  // Reportar incidente
  const handleReportIncident = useCallback(() => {
    alert('Incidente reportado. El vehículo podrá salir con autorización del supervisor.');
    setVerificationState('confirming');
  }, []);

  // Resetear formulario
  const resetForm = useCallback(() => {
    setSearchPlate('');
    setVerificationState('idle');
    setFoundEntry(null);
    setCurrentDriverPhoto(null);
    setError(null);
    setCameraState({ status: 'idle' });
  }, []);

  // Vehículos pendientes de salida
  const pendingEntries = entries.filter(e => !e.hasExit);

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <Car className="w-8 h-8 text-amber-400" />
          Registro de Salida
        </h1>
        <p className="text-slate-400 mt-1">
          Verifique y registre la salida de vehículos
        </p>
      </div>

      {/* Vehículos pendientes */}
      {pendingEntries.length > 0 && verificationState === 'idle' && (
        <div className="mb-6 p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl">
          <div className="flex items-center gap-2 text-amber-400 mb-3">
            <Clock className="w-5 h-5" />
            <span className="font-medium">Vehículos pendientes de salida ({pendingEntries.length})</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {pendingEntries.slice(0, 5).map(entry => (
              <button
                key={entry.id}
                onClick={() => {
                  setSearchPlate(entry.licensePlate);
                  setTimeout(() => searchVehicle(), 100);
                }}
                className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded-lg font-mono text-sm transition-colors"
              >
                {entry.licensePlate}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Estado: Idle - Búsqueda */}
      {verificationState === 'idle' && (
        <div className="bg-slate-800 rounded-xl p-6 animate-fade-in">
          <div className="text-center mb-6">
            <div className="w-16 h-16 rounded-full bg-blue-500/20 flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-blue-400" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Buscar Vehículo</h2>
            <p className="text-slate-400">
              Ingrese la placa del vehículo para verificar su registro de ingreso
            </p>
          </div>

          <div className="max-w-md mx-auto">
            <PlateInput
              value={searchPlate}
              onChange={setSearchPlate}
              onSubmit={searchVehicle}
              disabled={isLoading}
              showSuggestions={false}
            />

            {error && (
              <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                {error}
              </div>
            )}

            <button
              onClick={searchVehicle}
              disabled={!searchPlate || searchPlate.length < 5 || isLoading}
              className={`
                w-full mt-6 flex items-center justify-center gap-2 py-4 rounded-xl
                font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed
                ${searchPlate.length >= 5
                  ? 'bg-blue-600 hover:bg-blue-500 text-white'
                  : 'bg-slate-700 text-slate-400'
                }
              `}
            >
              {isLoading ? (
                <>
                  <span className="animate-spin">⏳</span>
                  Buscando...
                </>
              ) : (
                <>
                  <Search className="w-5 h-5" />
                  Buscar Vehículo
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Estado: Buscando */}
      {verificationState === 'searching' && (
        <div className="bg-slate-800 rounded-xl p-12 text-center animate-fade-in">
          <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-slate-400">Buscando registro...</p>
        </div>
      )}

      {/* Estado: No encontrado */}
      {verificationState === 'not_found' && (
        <div className="bg-slate-800 rounded-xl p-8 animate-fade-in">
          <div className="text-center mb-6">
            <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
              <X className="w-8 h-8 text-red-400" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Vehículo No Encontrado</h2>
            <p className="text-slate-400">
              No existe un registro de ingreso activo para la placa {searchPlate}
            </p>
          </div>

          <div className="flex gap-4 max-w-md mx-auto">
            <button
              onClick={resetForm}
              className="flex-1 py-3 rounded-xl border-2 border-slate-600 text-slate-300 font-medium hover:bg-slate-700 transition-colors"
            >
              Nueva Búsqueda
            </button>
            <button
              onClick={handleReportIncident}
              className="flex-1 py-3 rounded-xl bg-amber-600 text-white font-medium hover:bg-amber-500 transition-colors"
            >
              Reportar Anomalía
            </button>
          </div>
        </div>
      )}

      {/* Estado: Encontrado - Verificación de conductor */}
      {(verificationState === 'found' || verificationState === 'confirming') && foundEntry && (
        <div className="space-y-6 animate-fade-in">
          {/* Info del vehículo */}
          <div className="bg-slate-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">Datos del Registro</h2>
              <VehicleStatusBadge hasExit={false} />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-slate-700 rounded-lg p-4 text-center">
                <p className="text-sm text-slate-400">Placa</p>
                <p className="text-2xl font-mono font-bold text-blue-400">{foundEntry.licensePlate}</p>
              </div>
              <div className="bg-slate-700 rounded-lg p-4 text-center">
                <p className="text-sm text-slate-400">Hora Ingreso</p>
                <p className="text-lg font-semibold text-white">
                  {new Date(foundEntry.entryTimestamp).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
              <div className="bg-slate-700 rounded-lg p-4 text-center">
                <p className="text-sm text-slate-400">Tiempo Est.</p>
                <p className="text-lg font-semibold text-white">
                  {Math.round((Date.now() - new Date(foundEntry.entryTimestamp).getTime()) / 60000)} min
                </p>
              </div>
              <div className="bg-slate-700 rounded-lg p-4 text-center">
                <p className="text-sm text-slate-400">Vigilante</p>
                <p className="text-lg font-semibold text-white">{foundEntry.guardName || 'N/A'}</p>
              </div>
            </div>

            {/* Fotos comparativas */}
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div>
                <p className="text-sm text-slate-400 mb-2">Foto del Conductor (Ingreso)</p>
                <div className="aspect-square bg-slate-700 rounded-xl overflow-hidden">
                  <img
                    src={foundEntry.driverPhoto}
                    alt="Conductor registrado"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
              {currentDriverPhoto ? (
                <div>
                  <p className="text-sm text-slate-400 mb-2">Foto del Conductor (Actual)</p>
                  <div className="aspect-square bg-slate-700 rounded-xl overflow-hidden">
                    <img
                      src={currentDriverPhoto}
                      alt="Conductor actual"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <p className="text-sm text-slate-400 mb-2">Foto del Conductor (Actual)</p>
                  <div className="aspect-square bg-slate-700 rounded-xl flex items-center justify-center text-slate-500">
                    <Camera className="w-8 h-8" />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Captura de conductor para verificar */}
          {!currentDriverPhoto && (
            <div className="bg-slate-800 rounded-xl p-6">
              <h3 className="text-lg font-bold text-white mb-4 text-center">
                Verificación de Conductor
              </h3>
              <CameraCapture
                mode="driver"
                onCapture={handleDriverCapture}
                state={cameraState}
                onStateChange={setCameraState}
              />
            </div>
          )}

          {/* Botones de acción */}
          {currentDriverPhoto && (
            <div className="flex gap-4">
              <button
                onClick={resetForm}
                className="flex-1 py-4 rounded-xl border-2 border-slate-600 text-slate-300 font-semibold hover:bg-slate-700 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmExit}
                disabled={isLoading}
                className="flex-1 py-4 rounded-xl bg-green-600 text-white font-semibold hover:bg-green-500 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <span className="animate-spin">⏳</span>
                    Procesando...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    Confirmar Salida
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Estado: Driver mismatch */}
      {verificationState === 'driver_mismatch' && foundEntry && (
        <div className="bg-slate-800 rounded-xl p-8 animate-fade-in">
          <div className="text-center mb-6">
            <div className="w-20 h-20 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4 animate-pulse">
              <AlertTriangle className="w-10 h-10 text-red-400" />
            </div>
            <h2 className="text-2xl font-bold text-red-400 mb-2">¡Alerta: Conductor Diferente!</h2>
            <p className="text-slate-400">
              El conductor actual no coincide con el registrado en el ingreso
            </p>
          </div>

          {/* Comparación visual */}
          <div className="grid grid-cols-2 gap-6 mb-6">
            <div className="text-center">
              <p className="text-sm text-slate-400 mb-2">Registrado</p>
              <div className="aspect-square bg-slate-700 rounded-xl overflow-hidden">
                <img
                  src={foundEntry.driverPhoto}
                  alt="Conductor registrado"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
            <div className="text-center">
              <p className="text-sm text-slate-400 mb-2">Actual</p>
              <div className="aspect-square bg-slate-700 rounded-xl overflow-hidden">
                {currentDriverPhoto && (
                  <img
                    src={currentDriverPhoto}
                    alt="Conductor actual"
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
            </div>
          </div>

          <div className="flex gap-4">
            <button
              onClick={resetForm}
              className="flex-1 py-4 rounded-xl border-2 border-slate-600 text-slate-300 font-semibold hover:bg-slate-700 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleReportIncident}
              className="flex-1 py-4 rounded-xl bg-amber-600 text-white font-semibold hover:bg-amber-500 transition-colors"
            >
              Reportar Incidente
            </button>
            <button
              onClick={handleConfirmExit}
              disabled={isLoading}
              className="flex-1 py-4 rounded-xl bg-red-600 text-white font-semibold hover:bg-red-500 transition-colors disabled:opacity-50"
            >
              Confirmar de Todos Modos
            </button>
          </div>
        </div>
      )}

      {/* Estado: Éxito */}
      {verificationState === 'success' && (
        <div className="bg-slate-800 rounded-xl p-12 text-center animate-fade-in">
          <div className="w-24 h-24 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-6 animate-bounce">
            <CheckCircle className="w-16 h-16 text-green-400" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-2">¡Salida Registrada!</h2>
          <p className="text-slate-400 mb-6">
            El vehículo {foundEntry?.licensePlate} ha salido exitosamente
          </p>
          <div className="inline-block bg-slate-700 rounded-xl px-6 py-3">
            <p className="text-sm text-slate-400">Hora de salida</p>
            <p className="text-2xl font-semibold text-green-400">
              {new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
