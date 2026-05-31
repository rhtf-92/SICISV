// Componente RecordDetailModal - Detalle Premium de Registro de Vehículo

import { X, Clock, User, AlertTriangle, Shield, CheckCircle, MapPin, HardDrive } from 'lucide-react';
import { VehicleStatusBadge } from './StatusBadge';

interface Guard {
  id: string;
  username: string;
  fullName: string;
}

interface ExitRecord {
  id: string;
  entryId: string;
  exitTimestamp: string;
  guardId: string;
  guard?: Guard;
  driverPhotoExit?: string;
  isDriverMatch?: boolean;
  latitude?: number;
  longitude?: number;
  notes?: string;
}

interface IncidentRecord {
  id: string;
  entryId: string;
  incidentType: string;
  description: string;
  status: string;
  createdAt: string;
  resolutionNotes?: string;
}

interface DetailedEntry {
  id: string;
  licensePlate: string;
  vehiclePhoto: string;
  driverPhoto: string;
  entryTimestamp: string;
  guardId: string;
  guard?: Guard;
  latitude?: number;
  longitude?: number;
  notes?: string;
  exits?: ExitRecord[];
  incidents?: IncidentRecord[];
}

interface RecordDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  entry: DetailedEntry | null;
}

export function RecordDetailModal({ isOpen, onClose, entry }: RecordDetailModalProps) {
  if (!isOpen || !entry) return null;

  const hasExit = entry.exits && entry.exits.length > 0;
  const exit = hasExit ? entry.exits![0] : null;
  const incidents = entry.incidents || [];

  const formatIncidentType = (type: string) => {
    switch (type) {
      case 'driver_mismatch': return 'Conductor no coincide';
      case 'unregistered_exit': return 'Salida no autorizada';
      case 'plate_not_visible': return 'Placa no visible';
      case 'conductor_refused': return 'Conductor se negó a identificación';
      default: return 'Otro incidente';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-md flex items-center justify-center z-50 p-4 transition-all duration-300">
      <div 
        className="bg-slate-900 border border-slate-800 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-in fade-in zoom-in duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-slate-900/50 sticky top-0 z-10 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center border border-slate-700/50 text-blue-400">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                Reporte de Control Vehicular
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">ID Registro: {entry.id}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors border border-transparent hover:border-slate-700"
            title="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-8">
          {/* Top Banner (Plate and overall status) */}
          <div className="bg-slate-800/40 border border-slate-800 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <span className="text-sm text-slate-400 font-medium">Placa del Vehículo</span>
              <div className="text-4xl font-mono font-bold text-white tracking-widest mt-1">
                {entry.licensePlate}
              </div>
            </div>
            <div className="flex flex-col items-start sm:items-end gap-1.5">
              <span className="text-xs text-slate-400 font-medium">Estado del Vehículo</span>
              <VehicleStatusBadge hasExit={hasExit} />
            </div>
          </div>

          {/* Core Info (Grid Side-by-Side: Entry and Exit) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Entry Column */}
            <div className="bg-slate-850 border border-slate-800/80 rounded-2xl p-6 space-y-6">
              <div className="border-b border-slate-800 pb-3 flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-blue-500"></div>
                <h3 className="font-bold text-white text-lg">Detalles de Ingreso</h3>
              </div>

              {/* Photos */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-xs text-slate-400 block mb-2 font-medium">Foto del Vehículo</span>
                  <div className="aspect-video bg-slate-800 rounded-xl overflow-hidden border border-slate-700/50 hover:border-slate-600 transition-colors">
                    <img src={entry.vehiclePhoto} alt="Vehículo Ingreso" className="w-full h-full object-cover hover:scale-105 transition-transform duration-350" />
                  </div>
                </div>
                <div>
                  <span className="text-xs text-slate-400 block mb-2 font-medium">Foto del Conductor</span>
                  <div className="aspect-video bg-slate-800 rounded-xl overflow-hidden border border-slate-700/50 hover:border-slate-600 transition-colors">
                    <img src={entry.driverPhoto} alt="Conductor Ingreso" className="w-full h-full object-cover hover:scale-105 transition-transform duration-350" />
                  </div>
                </div>
              </div>

              {/* Entry metadata */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="bg-slate-800/35 rounded-xl p-3 border border-slate-800">
                  <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block mb-1">Fecha y Hora</span>
                  <p className="text-sm text-slate-200 font-semibold flex items-center gap-1.5 font-mono">
                    <Clock className="w-4 h-4 text-blue-400" />
                    {new Date(entry.entryTimestamp).toLocaleString('es-ES')}
                  </p>
                </div>
                <div className="bg-slate-800/35 rounded-xl p-3 border border-slate-800">
                  <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block mb-1">Vigilante Responsable</span>
                  <p className="text-sm text-slate-200 font-semibold flex items-center gap-1.5">
                    <User className="w-4 h-4 text-blue-400" />
                    {entry.guard?.fullName || 'No especificado'}
                  </p>
                </div>
              </div>

              {/* Geolocalización / Dispositivo si existen */}
              {(entry.latitude || entry.notes) && (
                <div className="space-y-3 pt-2">
                  {entry.latitude && (
                    <p className="text-xs text-slate-400 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-500" />
                      Coordenadas: {entry.latitude}, {entry.longitude}
                    </p>
                  )}
                  {entry.notes && (
                    <div className="bg-slate-800/30 rounded-xl p-4 border border-slate-800">
                      <span className="text-xs text-slate-400 block mb-1 font-medium">Observaciones de Ingreso</span>
                      <p className="text-sm text-slate-300 italic">"{entry.notes}"</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Exit Column */}
            <div className="bg-slate-850 border border-slate-800/80 rounded-2xl p-6 space-y-6">
              <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500"></div>
                  <h3 className="font-bold text-white text-lg">Detalles de Salida</h3>
                </div>
                {exit && exit.isDriverMatch !== undefined && (
                  <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold flex items-center gap-1 ${
                    exit.isDriverMatch 
                      ? 'bg-green-500/10 text-green-400 border border-green-500/20' 
                      : 'bg-red-500/10 text-red-400 border border-red-500/20'
                  }`}>
                    {exit.isDriverMatch ? (
                      <>
                        <CheckCircle className="w-3 h-3" />
                        Mismo Conductor
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="w-3 h-3" />
                        Conductor Diferente
                      </>
                    )}
                  </span>
                )}
              </div>

              {exit ? (
                <>
                  {/* Exit photos and comparison */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-xs text-slate-400 block mb-2 font-medium">Foto de Ingreso (Ref)</span>
                      <div className="aspect-video bg-slate-800 rounded-xl overflow-hidden border border-slate-700/50">
                        <img src={entry.driverPhoto} alt="Conductor Ingreso (Ref)" className="w-full h-full object-cover" />
                      </div>
                    </div>
                    <div>
                      <span className="text-xs text-slate-400 block mb-2 font-medium">Foto de Salida</span>
                      <div className="aspect-video bg-slate-800 rounded-xl overflow-hidden border border-slate-700/50 hover:border-slate-600 transition-colors">
                        {exit.driverPhotoExit ? (
                          <img src={exit.driverPhotoExit} alt="Conductor Salida" className="w-full h-full object-cover hover:scale-105 transition-transform duration-350" />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 text-xs">
                            <User className="w-8 h-8 opacity-30 mb-1" />
                            Sin captura de salida
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Exit metadata */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    <div className="bg-slate-800/35 rounded-xl p-3 border border-slate-800">
                      <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block mb-1">Fecha y Hora Salida</span>
                      <p className="text-sm text-slate-200 font-semibold flex items-center gap-1.5 font-mono">
                        <Clock className="w-4 h-4 text-green-400" />
                        {new Date(exit.exitTimestamp).toLocaleString('es-ES')}
                      </p>
                    </div>
                    <div className="bg-slate-800/35 rounded-xl p-3 border border-slate-800">
                      <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block mb-1">Vigilante Salida</span>
                      <p className="text-sm text-slate-200 font-semibold flex items-center gap-1.5">
                        <User className="w-4 h-4 text-green-400" />
                        {exit.guard?.fullName || 'No especificado'}
                      </p>
                    </div>
                  </div>

                  {/* Exit notes */}
                  {exit.notes && (
                    <div className="bg-slate-800/30 rounded-xl p-4 border border-slate-800 mt-2">
                      <span className="text-xs text-slate-400 block mb-1 font-medium">Observaciones de Salida</span>
                      <p className="text-sm text-slate-300 italic">"{exit.notes}"</p>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-slate-500 bg-slate-800/10 rounded-2xl border border-dashed border-slate-850">
                  <HardDrive className="w-12 h-12 opacity-25 mb-3" />
                  <p className="text-sm font-semibold">Vehículo actualmente en planta</p>
                  <p className="text-xs text-slate-600 mt-1">La salida aún no ha sido registrada.</p>
                </div>
              )}
            </div>
          </div>

          {/* Incidents Section */}
          {incidents.length > 0 && (
            <div className="bg-red-500/5 border border-red-500/15 rounded-2xl p-6">
              <div className="border-b border-red-500/20 pb-3 flex items-center gap-2 mb-4">
                <AlertTriangle className="w-5 h-5 text-red-400" />
                <h3 className="font-bold text-white text-lg">Alertas e Incidentes Reportados ({incidents.length})</h3>
              </div>
              <div className="space-y-4">
                {incidents.map((incident) => (
                  <div key={incident.id} className="bg-slate-850 border border-red-500/20 rounded-xl p-4 flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div className="space-y-1">
                      <span className="text-xs bg-red-500/20 text-red-400 border border-red-500/30 px-2 py-0.5 rounded-md font-bold uppercase tracking-wider">
                        {formatIncidentType(incident.incidentType)}
                      </span>
                      <p className="text-sm text-slate-200 mt-2">{incident.description || 'Sin descripción detallada.'}</p>
                      <p className="text-[10px] text-slate-500 font-mono mt-1">Reportado el: {new Date(incident.createdAt).toLocaleString('es-ES')}</p>
                    </div>
                    <div className="flex flex-col items-start md:items-end justify-between h-full gap-2">
                      <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                        incident.status === 'resolved' 
                          ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                          : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      }`}>
                        {incident.status === 'resolved' ? 'Resuelto' : 'Abierto'}
                      </span>
                      {incident.resolutionNotes && (
                        <p className="text-xs text-slate-400 mt-1 max-w-xs text-left md:text-right italic">
                          <strong>Resolución:</strong> "{incident.resolutionNotes}"
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-6 border-t border-slate-800 bg-slate-900/30 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-sm font-semibold transition-all border border-slate-700"
          >
            Cerrar Reporte
          </button>
        </div>
      </div>
    </div>
  );
}
