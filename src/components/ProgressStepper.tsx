// Componente ProgressStepper - Indicador de Progreso del Registro

import { Check } from 'lucide-react';
import type { RegistrationStep } from '../types';

interface Step {
  id: RegistrationStep;
  label: string;
  shortLabel: string;
}

const steps: Step[] = [
  { id: 'vehicle', label: 'Foto del Vehículo', shortLabel: 'Vehículo' },
  { id: 'driver', label: 'Foto del Conductor', shortLabel: 'Conductor' },
  { id: 'plate', label: 'Registro de Placa', shortLabel: 'Placa' },
  { id: 'confirm', label: 'Confirmar Ingreso', shortLabel: 'Confirmar' },
];

interface ProgressStepperProps {
  currentStep: RegistrationStep;
  stepStatus: {
    vehicle: 'pending' | 'captured' | 'error';
    driver: 'pending' | 'captured' | 'error';
    plate: 'pending' | 'captured' | 'error';
  };
}

export function ProgressStepper({ currentStep, stepStatus }: ProgressStepperProps) {
  const currentIndex = steps.findIndex(s => s.id === currentStep);

  const getStepStatus = (stepId: RegistrationStep): 'completed' | 'active' | 'pending' | 'error' => {
    const stepIndex = steps.findIndex(s => s.id === stepId);

    if (stepIndex < currentIndex) return 'completed';

    if (stepId === 'confirm') {
      // Confirmar está activo solo cuando todo lo anterior está completado
      const allPreviousCompleted =
        stepStatus.vehicle === 'captured' &&
        stepStatus.driver === 'captured' &&
        stepStatus.plate === 'captured';
      return allPreviousCompleted && currentStep === 'confirm' ? 'active' : 'pending';
    }

    const statusKey = stepId as 'vehicle' | 'driver' | 'plate';
    const status = stepStatus[statusKey];

    if (stepIndex === currentIndex) {
      return status === 'error' ? 'error' : 'active';
    }

    return status === 'captured' ? 'completed' : 'pending';
  };

  return (
    <div className="w-full py-4">
      {/* Versión Desktop */}
      <div className="hidden md:flex items-center justify-center gap-2">
        {steps.map((step, index) => {
          const status = getStepStatus(step.id);

          return (
            <div key={step.id} className="flex items-center">
              {/* Paso */}
              <div className="flex flex-col items-center">
                {/* Círculo de estado */}
                <div
                  className={`
                    w-12 h-12 rounded-full flex items-center justify-center
                    transition-all duration-300
                    ${status === 'completed' ? 'bg-green-500 text-white' : ''}
                    ${status === 'active' ? 'bg-blue-600 text-white ring-4 ring-blue-600/20' : ''}
                    ${status === 'pending' ? 'bg-slate-700 text-slate-400' : ''}
                    ${status === 'error' ? 'bg-red-500 text-white' : ''}
                  `}
                >
                  {status === 'completed' ? (
                    <Check className="w-6 h-6" />
                  ) : (
                    <span className="text-lg font-bold">{index + 1}</span>
                  )}
                </div>

                {/* Etiqueta */}
                <span
                  className={`
                    mt-2 text-sm font-medium whitespace-nowrap
                    ${status === 'active' ? 'text-blue-400' : ''}
                    ${status === 'completed' ? 'text-green-400' : ''}
                    ${status === 'pending' ? 'text-slate-500' : ''}
                    ${status === 'error' ? 'text-red-400' : ''}
                  `}
                >
                  {step.label}
                </span>
              </div>

              {/* Conector */}
              {index < steps.length - 1 && (
                <div
                  className={`
                    w-16 h-1 mx-4 rounded
                    transition-colors duration-300
                    ${status === 'completed' ? 'bg-green-500' : 'bg-slate-700'}
                  `}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Versión Mobile */}
      <div className="md:hidden">
        <div className="flex items-center justify-between px-4">
          <span className="text-blue-400 font-semibold">
            Paso {currentIndex + 1} de {steps.length}
          </span>
          <span className="text-slate-400">
            {steps[currentIndex].label}
          </span>
        </div>

        {/* Barra de progreso */}
        <div className="mt-3 h-2 bg-slate-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-600 to-blue-400 transition-all duration-500"
            style={{ width: `${((currentIndex + 1) / steps.length) * 100}%` }}
          />
        </div>

        {/* Mini indicadores */}
        <div className="flex justify-center gap-2 mt-4">
          {steps.map((step, index) => {
            const status = getStepStatus(step.id);

            return (
              <div
                key={step.id}
                className={`
                  w-3 h-3 rounded-full transition-all duration-300
                  ${status === 'completed' ? 'bg-green-500' : ''}
                  ${status === 'active' ? 'bg-blue-500 scale-125' : ''}
                  ${status === 'pending' ? 'bg-slate-600' : ''}
                  ${status === 'error' ? 'bg-red-500' : ''}
                `}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
