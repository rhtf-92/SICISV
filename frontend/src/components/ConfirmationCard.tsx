// Componente ConfirmationCard - Tarjeta de Confirmación de Registro

import { Check, X, AlertTriangle, Loader2 } from 'lucide-react';

interface ConfirmationCardProps {
  vehiclePhoto: string | null;
  driverPhoto: string | null;
  licensePlate: string;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
  error?: string | null;
}

export function ConfirmationCard({
  vehiclePhoto,
  driverPhoto,
  licensePlate,
  onConfirm,
  onCancel,
  isLoading = false,
  error = null,
}: ConfirmationCardProps) {
  return (
    <div className="w-full">
      {/* Título */}
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">
          Confirmar Registro de Ingreso
        </h2>
        <p className="text-slate-400">
          Revise los datos antes de confirmar
        </p>
      </div>

      {/* Resumen visual */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {/* Foto Vehículo */}
        <div className="text-center">
          <div className="relative aspect-square rounded-xl overflow-hidden bg-slate-800 mb-2">
            {vehiclePhoto ? (
              <img
                src={vehiclePhoto}
                alt="Vehículo"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-500">
                <span className="text-4xl">🚗</span>
              </div>
            )}
          </div>
          <span className="text-sm text-slate-400">Vehículo</span>
          {vehiclePhoto && (
            <div className="absolute top-2 right-2 bg-green-500 rounded-full p-1">
              <Check className="w-3 h-3 text-white" />
            </div>
          )}
        </div>

        {/* Foto Conductor */}
        <div className="text-center">
          <div className="relative aspect-square rounded-xl overflow-hidden bg-slate-800 mb-2">
            {driverPhoto ? (
              <img
                src={driverPhoto}
                alt="Conductor"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-500">
                <span className="text-4xl">👤</span>
              </div>
            )}
          </div>
          <span className="text-sm text-slate-400">Conductor</span>
          {driverPhoto && (
            <div className="absolute top-2 right-2 bg-green-500 rounded-full p-1">
              <Check className="w-3 h-3 text-white" />
            </div>
          )}
        </div>

        {/* Placa */}
        <div className="text-center">
          <div className="aspect-square rounded-xl bg-gradient-to-br from-blue-600 to-blue-800 flex flex-col items-center justify-center mb-2">
            <span className="text-3xl font-mono font-bold text-white">
              {licensePlate || '---'}
            </span>
          </div>
          <span className="text-sm text-slate-400">Placa</span>
        </div>
      </div>

      {/* Estado de validación */}
      <div className="mb-6 p-4 bg-slate-800/50 rounded-xl">
        <div className="flex items-center gap-3">
          {vehiclePhoto && driverPhoto && licensePlate ? (
            <>
              <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                <Check className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <p className="text-green-400 font-medium">Todos los datos están completos</p>
                <p className="text-sm text-slate-400">El registro está listo para confirmarse</p>
              </div>
            </>
          ) : (
            <>
              <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <p className="text-amber-400 font-medium">Datos incompletos</p>
                <p className="text-sm text-slate-400">Complete todos los pasos antes de confirmar</p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
          <div className="flex items-center gap-3">
            <X className="w-5 h-5 text-red-400" />
            <p className="text-red-400">{error}</p>
          </div>
        </div>
      )}

      {/* Botones */}
      <div className="flex gap-4">
        <button
          onClick={onCancel}
          disabled={isLoading}
          className="flex-1 py-4 px-6 rounded-xl border-2 border-slate-600 text-slate-300 font-semibold hover:bg-slate-700 transition-all disabled:opacity-50"
        >
          Cancelar
        </button>
        <button
          onClick={onConfirm}
          disabled={isLoading || !vehiclePhoto || !driverPhoto || !licensePlate}
          className="flex-1 py-4 px-6 rounded-xl bg-green-600 text-white font-semibold hover:bg-green-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Guardando...
            </>
          ) : (
            <>
              <Check className="w-5 h-5" />
              Confirmar Ingreso
            </>
          )}
        </button>
      </div>
    </div>
  );
}
