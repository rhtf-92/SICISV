import { useState, useCallback, useRef, useEffect } from 'react';
import { Search, Car, Clock, AlertTriangle, CheckCircle, X, Camera, Scan } from 'lucide-react';
import { useVehicleStore } from '../store';
import { PlateInput } from '../components/PlateInput';
import { CameraCapture } from '../components/CameraCapture';
import { VehicleStatusBadge } from '../components/StatusBadge';
import { entryApi } from '../services/entryApi';
import { exitApi } from '../services/exitApi';
import { incidentApi } from '../services/incidentApi';
import type { Entry, CameraState } from '../types';

type ExitVerificationState = 'idle' | 'searching' | 'found' | 'analyzing' | 'driver_mismatch' | 'not_found' | 'success';

interface ExitPageProps {
  onComplete?: () => void;
}

export function ExitPage({ onComplete }: ExitPageProps) {
  const { setExitSearchResult } = useVehicleStore();

  const [searchPlate, setSearchPlate] = useState('');
  const [verificationState, setVerificationState] = useState<ExitVerificationState>('idle');
  const [foundEntry, setFoundEntry] = useState<Entry | null>(null);
  const [currentDriverPhoto, setCurrentDriverPhoto] = useState<string | null>(null);
  const [driverMatch, setDriverMatch] = useState<boolean | null>(null);
  const [matchConfidence, setMatchConfidence] = useState<number | null>(null);
  const [cameraState, setCameraState] = useState<CameraState>({ status: 'idle' });
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [pendingEntries, setPendingEntries] = useState<Entry[]>([]);
  const [pendingLoaded, setPendingLoaded] = useState(false);
  const autoExitRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  useState(() => { loadPending(); });

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
        setCameraState({ status: 'idle' });
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

  const handleDriverCapture = useCallback((photo: string) => {
    setCurrentDriverPhoto(photo || null);
  }, []);

  const processExit = useCallback(async (photo: string) => {
    if (!foundEntry || !photo) return;

    setVerificationState('analyzing');
    setCurrentDriverPhoto(photo);

    try {
      const response = await exitApi.create({
        licensePlate: foundEntry.licensePlate,
        driverPhotoExit: photo,
      });

      const rawMatch = response?.data?.driverMatch;
      setDriverMatch(rawMatch);

      setExitSearchResult({
        found: true,
        entry: { ...foundEntry, hasExit: true },
        currentDriverPhoto: photo,
        driverMatch: rawMatch ?? false,
      });

      setVerificationState('success');

      autoExitRef.current = setTimeout(() => {
        resetForm();
        if (onComplete) onComplete();
      }, 4000);
    } catch (err: any) {
      setDriverMatch(false);
      setVerificationState('driver_mismatch');
      setError(err.message || 'Error en reconocimiento facial');
    }
  }, [foundEntry, setExitSearchResult]);

  useEffect(() => {
    return () => {
      if (autoExitRef.current) clearTimeout(autoExitRef.current);
    };
  }, []);

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

  const overrideExit = useCallback(async () => {
    if (!foundEntry || !currentDriverPhoto) return;
    setIsLoading(true);

    try {
      await exitApi.create({
        licensePlate: foundEntry.licensePlate,
        driverPhotoExit: currentDriverPhoto,
        isDriverMatch: false,
      });

      setExitSearchResult({
        found: true,
        entry: { ...foundEntry, hasExit: true },
        currentDriverPhoto: currentDriverPhoto,
        driverMatch: false,
      });

      setDriverMatch(false);
      setVerificationState('success');

      autoExitRef.current = setTimeout(() => {
        resetForm();
        if (onComplete) onComplete();
      }, 4000);
    } catch (err: any) {
      setError(err.message || 'Error registrando la salida');
    } finally {
      setIsLoading(false);
    }
  }, [foundEntry, currentDriverPhoto, setExitSearchResult]);

  const resetForm = useCallback(() => {
    setSearchPlate('');
    setVerificationState('idle');
    setFoundEntry(null);
    setCurrentDriverPhoto(null);
    setDriverMatch(null);
    setMatchConfidence(null);
    setError(null);
    setCameraState({ status: 'idle' });
    setPendingLoaded(false);
    loadPending();
  }, [loadPending]);

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <Scan className="w-8 h-8 text-cyan-400" />
          Registro de Salida
        </h1>
        <p className="text-slate-400 mt-1">
          Reconocimiento facial automático para verificación de conductor
        </p>
      </div>

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
                onClick={() => setSearchPlate(entry.licensePlate)}
                className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded-lg font-mono text-sm transition-colors"
              >
                {entry.licensePlate}
              </button>
            ))}
          </div>
        </div>
      )}

      {verificationState === 'idle' && (
        <div className="bg-slate-800 rounded-xl p-6 animate-fade-in">
          <div className="text-center mb-6">
            <div className="w-16 h-16 rounded-full bg-blue-500/20 flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-blue-400" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Buscar Vehículo</h2>
            <p className="text-slate-400">
              Ingrese la placa del vehículo para iniciar la verificación automática
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
                <><span className="animate-spin">⏳</span> Buscando...</>
              ) : (
                <><Search className="w-5 h-5" /> Buscar Vehículo</>
              )}
            </button>
          </div>
        </div>
      )}

      {verificationState === 'searching' && (
        <div className="bg-slate-800 rounded-xl p-12 text-center animate-fade-in">
          <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-slate-400">Buscando registro...</p>
        </div>
      )}

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
            <button onClick={resetForm} className="flex-1 py-3 rounded-xl border-2 border-slate-600 text-slate-300 font-medium hover:bg-slate-700 transition-colors">
              Nueva Búsqueda
            </button>
          </div>
        </div>
      )}

      {verificationState === 'found' && foundEntry && (
        <div className="space-y-6 animate-fade-in">
          <div className="bg-slate-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">Vehículo Encontrado</h2>
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

            <div className="mt-4 p-4 bg-cyan-500/10 border border-cyan-500/30 rounded-xl">
              <div className="flex items-center gap-2 text-cyan-400">
                <Scan className="w-5 h-5" />
                <span className="font-medium">Reconocimiento facial automático</span>
              </div>
              <p className="text-cyan-300/70 text-sm mt-1">
                La cámara se activará automáticamente. El conductor debe mirar directamente a la cámara.
              </p>
            </div>
          </div>

          <div className="bg-slate-800 rounded-xl p-6">
            <CameraCapture
              mode="driver"
              onCapture={(photo) => {
                handleDriverCapture(photo);
                processExit(photo);
              }}
              state={cameraState}
              onStateChange={setCameraState}
              autoCapture
            />
          </div>
        </div>
      )}

      {verificationState === 'analyzing' && (
        <div className="bg-slate-800 rounded-xl p-12 text-center animate-fade-in">
          <div className="w-20 h-20 rounded-full bg-cyan-500/20 flex items-center justify-center mx-auto mb-6">
            <Scan className="w-10 h-10 text-cyan-400 animate-pulse" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-3">Analizando Rostro...</h2>
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="animate-spin w-6 h-6 border-2 border-cyan-500 border-t-transparent rounded-full" />
            <p className="text-cyan-400">Reconocimiento facial en progreso</p>
          </div>
          <div className="flex justify-center gap-6 mt-6">
            <div className="text-center">
              <div className="w-24 h-24 rounded-xl overflow-hidden bg-slate-700 mx-auto mb-2 ring-2 ring-cyan-500/50">
                <img src={foundEntry?.driverPhoto} alt="Registrado" className="w-full h-full object-cover" />
              </div>
              <p className="text-xs text-slate-400">Registrado</p>
            </div>
            {currentDriverPhoto && (
              <div className="text-center">
                <div className="w-24 h-24 rounded-xl overflow-hidden bg-slate-700 mx-auto mb-2 ring-2 ring-cyan-500/50">
                  <img src={currentDriverPhoto} alt="Actual" className="w-full h-full object-cover" />
                </div>
                <p className="text-xs text-slate-400">Actual</p>
              </div>
            )}
          </div>
        </div>
      )}

      {verificationState === 'driver_mismatch' && foundEntry && (
        <div className="bg-slate-800 rounded-xl p-8 animate-fade-in">
          <div className="text-center mb-6">
            <div className="w-20 h-20 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4 animate-pulse">
              <AlertTriangle className="w-10 h-10 text-red-400" />
            </div>
            <h2 className="text-2xl font-bold text-red-400 mb-2">¡Conductor No Verificado!</h2>
            <p className="text-slate-400">
              El reconocimiento facial no pudo verificar al conductor
            </p>
          </div>

          <div className="grid grid-cols-2 gap-6 mb-6">
            <div className="text-center">
              <p className="text-sm text-slate-400 mb-2">Registrado</p>
              <div className="aspect-square bg-slate-700 rounded-xl overflow-hidden ring-2 ring-slate-600">
                <img src={foundEntry.driverPhoto} alt="Conductor registrado" className="w-full h-full object-cover" />
              </div>
            </div>
            <div className="text-center">
              <p className="text-sm text-slate-400 mb-2">Actual</p>
              <div className="aspect-square bg-slate-700 rounded-xl overflow-hidden ring-2 ring-red-500/50">
                {currentDriverPhoto && (
                  <img src={currentDriverPhoto} alt="Conductor actual" className="w-full h-full object-cover" />
                )}
              </div>
            </div>
          </div>

          <div className="flex gap-4">
            <button onClick={resetForm} className="flex-1 py-4 rounded-xl border-2 border-slate-600 text-slate-300 font-semibold hover:bg-slate-700 transition-colors">
              Cancelar
            </button>
            <button onClick={handleReportIncident} className="flex-1 py-4 rounded-xl bg-amber-600 text-white font-semibold hover:bg-amber-500 transition-colors">
              Reportar Incidente
            </button>
            <button onClick={overrideExit} disabled={isLoading} className="flex-1 py-4 rounded-xl bg-red-600 text-white font-semibold hover:bg-red-500 transition-colors disabled:opacity-50">
              {isLoading ? 'Procesando...' : 'Confirmar de Todos Modos'}
            </button>
          </div>
        </div>
      )}

      {verificationState === 'success' && (
        <div className="bg-slate-800 rounded-xl p-12 text-center animate-fade-in">
          <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce ${
            driverMatch === false ? 'bg-red-500/20' : 'bg-green-500/20'
          }`}>
            {driverMatch === false ? (
              <AlertTriangle className="w-16 h-16 text-red-400" />
            ) : (
              <CheckCircle className="w-16 h-16 text-green-400" />
            )}
          </div>
          <h2 className="text-3xl font-bold text-white mb-2">¡Salida Registrada!</h2>
          <div className={`inline-block rounded-xl px-4 py-2 mb-4 text-sm font-semibold ${
            driverMatch === null
              ? 'bg-yellow-500/20 text-yellow-400'
              : driverMatch
                ? 'bg-green-500/20 text-green-400'
                : 'bg-red-500/20 text-red-400'
          }`}>
            {driverMatch === null
              ? 'Reconocimiento facial: No se pudo verificar el rostro'
              : driverMatch
                ? 'Reconocimiento facial: Conductor verificado exitosamente'
                : 'Reconocimiento facial: Conductor diferente al registrado'
            }
          </div>
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
