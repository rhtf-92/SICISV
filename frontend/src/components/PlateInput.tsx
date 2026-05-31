// Componente PlateInput - Entrada de Placa de Vehículo

import { useState, useEffect, useCallback } from 'react';
import { Car, Check, AlertCircle, Search } from 'lucide-react';

interface PlateInputProps {
  value: string;
  onChange: (plate: string) => void;
  onSubmit?: () => void;
  disabled?: boolean;
  showSuggestions?: boolean;
  recentPlates?: string[];
}

export function PlateInput({
  value,
  onChange,
  onSubmit,
  disabled = false,
  showSuggestions = true,
  recentPlates = [],
}: PlateInputProps) {
  const [isValid, setIsValid] = useState<boolean | null>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [showRecent, setShowRecent] = useState(false);

  // Validar formato de placa (formato standard: XXX-0000 o XXX-000)
  const validatePlate = useCallback((plate: string): boolean => {
    if (!plate || plate.length < 5) return false;

    // Formatos comunes: 3 letras, guion, 3 o 4 números (ej: ABC-1234 o ABC-123)
    const pattern = /^[A-Z]{3}-\d{3,4}$/;
    return pattern.test(plate.toUpperCase());
  }, []);

  useEffect(() => {
    if (value.length >= 6) {
      const valid = validatePlate(value);
      setIsValid(valid);
    } else if (value.length === 0) {
      setIsValid(null);
    } else {
      setIsValid(false);
    }
  }, [value, validatePlate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let rawValue = e.target.value.toUpperCase();
    // Solo permitir letras y números (el guion lo agregamos nosotros)
    let digitsAndLetters = rawValue.replace(/[^A-Z0-9]/g, '');
    
    let formatted = digitsAndLetters;
    if (digitsAndLetters.length > 3) {
      formatted = digitsAndLetters.substring(0, 3) + '-' + digitsAndLetters.substring(3);
    }
    
    onChange(formatted);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && isValid && onSubmit) {
      onSubmit();
    }
  };

  const selectRecentPlate = (plate: string) => {
    onChange(plate);
    setShowRecent(false);
  };

  return (
    <div className="w-full">
      {/* Label */}
      <label className="block text-sm font-medium text-slate-300 mb-2">
        Número de Placa
      </label>

      {/* Input Container */}
      <div className="relative">
        {/* Icono */}
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
          <Car className="w-6 h-6" />
        </div>

        {/* Input */}
        <input
          type="text"
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            setIsFocused(true);
            if (showSuggestions && recentPlates.length > 0) {
              setShowRecent(true);
            }
          }}
          onBlur={() => setTimeout(() => setShowRecent(false), 200)}
          disabled={disabled}
          placeholder="Ej: ABC-1234"
          maxLength={10}
          className={`
            w-full pl-14 pr-12 py-4 text-2xl font-mono font-bold
            rounded-xl border-2 transition-all duration-200
            placeholder:text-slate-600 placeholder:font-normal
            focus:outline-none
            ${isValid === true ? 'border-green-500 bg-green-500/10' : ''}
            ${isValid === false ? 'border-red-500 bg-red-500/10' : ''}
            ${isValid === null ? 'border-slate-600 bg-slate-800' : ''}
            ${isFocused && isValid === null ? 'border-blue-500 ring-4 ring-blue-500/20' : ''}
            ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        />

        {/* Indicador de estado */}
        <div className="absolute right-4 top-1/2 -translate-y-1/2">
          {isValid === true && (
            <div className="flex items-center gap-1 text-green-400">
              <Check className="w-5 h-5" />
            </div>
          )}
          {isValid === false && (
            <div className="flex items-center gap-1 text-red-400">
              <AlertCircle className="w-5 h-5" />
            </div>
          )}
        </div>
      </div>

      {/* Sugerencias recientes */}
      {showRecent && showSuggestions && recentPlates.length > 0 && (
        <div className="absolute z-10 mt-2 w-full bg-slate-800 border border-slate-600 rounded-xl overflow-hidden shadow-xl">
          <div className="px-3 py-2 text-xs text-slate-400 border-b border-slate-700">
            Placas recientes
          </div>
          {recentPlates.slice(0, 5).map((plate, index) => (
            <button
              key={index}
              onClick={() => selectRecentPlate(plate)}
              className="w-full px-4 py-3 text-left font-mono hover:bg-slate-700 transition-colors flex items-center gap-2"
            >
              <Search className="w-4 h-4 text-slate-500" />
              <span className="text-slate-200">{plate}</span>
            </button>
          ))}
        </div>
      )}

      {/* Mensaje de validación */}
      <div className="mt-2 min-h-6">
        {isValid === false && value.length >= 5 && (
          <p className="text-sm text-red-400 flex items-center gap-1">
            <AlertCircle className="w-4 h-4" />
            Formato de placa inválido. Ejemplo: ABC-1234
          </p>
        )}
        {isValid === true && (
          <p className="text-sm text-green-400 flex items-center gap-1">
            <Check className="w-4 h-4" />
            Formato válido
          </p>
        )}
      </div>

      {/* Instrucciones */}
      <p className="mt-3 text-xs text-slate-500">
        Ingrese la placa tal como aparece en el vehículo. Use el formato: 3 letras, un guion, y 3-4 números (ej: ABC-1234)
      </p>
    </div>
  );
}
