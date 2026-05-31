// Página de Registro de Salida - Sistema de Control de Vehículos

import { useState, useCallback } from 'react';
import { Search, Car, Clock, AlertTriangle, CheckCircle, X, Camera } from 'lucide-react';
import { useVehicleStore } from '../store';
import { PlateInput } from '../components/PlateInput';
import { CameraCapture } from '../components/CameraCapture';
import { VehicleStatusBadge } from '../components/StatusBadge';
import { entryApi } from '../services/entryApi';
import { exitApi } from '../services/exitApi';
import { incidentApi } from '../services/incidentApi';
import type { Entry, CameraState } from '../types';

type ExitVerificationState = 'idle' | 'searching' | 'found' | 'driver_mismatch' | 'not_found' | 'confirming' | 'success';

export function ExitPage() {
  const { setExitSearchResult } = useVehicleStore();

  const [searchPlate, setSearchPlate] = useState('');
  const [verificationState, setVerificationState] = useState<ExitVerificationState>('idle');
  const [foundEntry, setFoundEntry] = useState<Entry | null>(null);
  const [currentDriverPhoto, setCurrentDriverPhoto] = useState<string | null>(null);
  const [driverMatch, setDriverMatch] = useState<boolean | null>(null);
  const [cameraState, setCameraState] = useState<CameraState>({ status: 'idle' });
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [pendingEntries, setPendingEntries] = useState<Entry[]>([]);
  const [pendingLoaded, setPendingLoaded] = useState(false);

  // Load pending entries on first render
  const loadPending = useCallback(async () => {
    if (pendingLoaded) return;
    try {
      const response = await entryApi.getUnsettled();
      if (response.success && response.data) {
        setPendingEntries(response.data.map((e: any) => ({
          ...e,
          guardName: e.guard?.fullName || '',
          hasExit: false,
        })));
      }
      setPendingLoaded(true);
    } catch {
      // Silently fail
    }
  }, [pendingLoaded]);

  // Load on mount
  useState(() => { loadPending(); });

  // Buscar vehículo por placa usando API real
  const searchVehicle = useCallback(async () => {
    if (!searchPlate || searchPlate.length < 5) {
      setError('Ingrese una placa válida');
      return;
    }

    setIsLoading(true);
    setError(null);
    setVerificationState('searching');

    try {
      const response = await entryApi.getUnsettled(searchPlate);

      if (response.success && response.data && response.data.length > 0) {
        const entry = response.data[0] as any;
        setFoundEntry({
          ...entry,
          guardName: entry.guard?.fullName || '',
          hasExit: false,
        });
        setVerificationState('found');
      } else {
        setVerificationState('not_found');
        setError('No se encontró un registro de ingreso activo para esta placa');
      }
    } catch (err: any) {
      setVerificationState('not_found');
      setError(err.message || 'Error buscando el vehículo');
    } finally {
      setIsLoading(false);
    }
  }, [searchPlate]);

  // Capturar foto del conductor actual
  const handleDriverCapture = useCallback((photo: string) => {
    setCurrentDriverPhoto(photo || null);
  }, []);

  // Confirmar salida con API real
  const handleConfirmExit = useCallback(async (isMatch: boolean) => {
    if (!foundEntry) return;

    setIsLoading(true);
    setDriverMatch(isMatch);

    try {
      await exitApi.create({
        licensePlate: foundEntry.licensePlate,
        driverPhotoExit: currentDriverPhoto || undefined,
        isDriverMatch: isMatch,
      });

      setExitSearchResult({
        found: true,
        entry: { ...foundEntry, hasExit: true },
        currentDriverPhoto: currentDriverPhoto || undefined,
        driverMatch: isMatch,
      });

      setVerificationState('success');

      // Reset después de 3 segundos
      setTimeout(() => {
        resetForm();
      }, 3000);
    } catch (err: any) {
      setError(err.message || 'Error registrando la salida');
    } finally {
      setIsLoading(false);
    }
  }, [foundEntry, currentDriverPhoto, setExitSearchResult]);

  // Reportar incidente con API real
  const handleReportIncident = useCallback(async () => {
    if (!foundEntry) return;

    try {
      await incidentApi.create({
        entryId: foundEntry.id,
        incidentType: 'driver_mismatch',
        description: 'Conductor diferente al registrado en el ingreso',
      });
      alert('Incidente reportado exitosamente. El vehículo podrá salir con autorización del supervisor.');
    } catch (err: any) {
      alert('Error reportando el incidente: ' + (err.message || 'Error desconocido'));
    }
  }, [foundEntry]);

  // Resetear formulario
  const resetForm = useCallback(() => {
    setSearchPlate('');
    setVerificationState('idle');
    setFoundEntry(null);
    setCurrentDriverPhoto(null);
    setDriverMatch(null);
    setError(null);
    setCameraState({ status: 'idle' });
    setPendingLoaded(false);
    loadPending();
  }, [loadPending]);

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
            {pendingEntries.slice(0, 8).map(entry => (
              <button
                key={entry.id}
                onClick={() => {
                  setSearchPlate(entry.licensePlate);
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

          {/* Botones de acción - el vigilante decide si coincide */}
          {currentDriverPhoto && (
            <div className="bg-slate-800 rounded-xl p-6">
              <h3 className="text-lg font-bold text-white mb-4 text-center">
                ¿El conductor coincide con el registrado?
              </h3>
              <div className="flex gap-4">
                <button
                  onClick={resetForm}
                  className="py-4 px-6 rounded-xl border-2 border-slate-600 text-slate-300 font-semibold hover:bg-slate-700 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    setDriverMatch(false);
                    setVerificationState('driver_mismatch');
                  }}
                  className="flex-1 py-4 rounded-xl bg-red-600 text-white font-semibold hover:bg-red-500 transition-colors flex items-center justify-center gap-2"
                >
                  <AlertTriangle className="w-5 h-5" />
                  No Coincide
                </button>
                <button
                  onClick={() => handleConfirmExit(true)}
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
                      Sí, Confirmar Salida
                    </>
                  )}
                </button>
              </div>
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
              onClick={() => handleConfirmExit(false)}
              disabled={isLoading}
              className="flex-1 py-4 rounded-xl bg-red-600 text-white font-semibold hover:bg-red-500 transition-colors disabled:opacity-50"
            >
              {isLoading ? 'Procesando...' : 'Confirmar de Todos Modos'}
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
