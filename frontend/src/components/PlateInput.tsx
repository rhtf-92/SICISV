// Componente PlateInput - Entrada de Placa de Vehículo con Escáner OCR / ALPR Integrado
// Diseñado con altos estándares ergonómicos, transiciones de alta fidelidad y fallback nativo.

import { useState, useEffect, useCallback, useRef } from 'react';
import { Car, Check, AlertCircle, Search, Camera, X, RefreshCw } from 'lucide-react';
import { entryApi } from '../services/entryApi';
import { compressImage } from '../utils/imageCompressor';

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

  // Estados del Escáner OCR / ALPR
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [hasCameraError, setHasCameraError] = useState(false);
  const [isScanning, setIsScanning] = useState(false);

  // Referencias para la cámara WebRTC
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

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

  // ----- Lógica del Visor de Escaneo en Vivo -----

  const startScanner = useCallback(async () => {
    setHasCameraError(false);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'environment',
          width: { ideal: 640 },
          height: { ideal: 480 } 
        },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch (err) {
      console.error('Error starting license plate scanner:', err);
      setHasCameraError(true);
    }
  }, []);

  const stopScanner = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  }, []);

  const openScanner = () => {
    setIsScannerOpen(true);
    // Esperar a que el modal se monte
    setTimeout(() => {
      startScanner();
    }, 120);
  };

  const closeScanner = () => {
    stopScanner();
    setIsScannerOpen(false);
    setHasCameraError(false);
  };

  // Capturar frame, recortar zona central y enviar a backend OCR
  const handleCaptureOCR = async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    setIsScanning(true);
    try {
      canvas.width = 640;
      canvas.height = 480;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, 640, 480);
        
        // Recortar caja central
        const cropWidth = 420;
        const cropHeight = 130;
        const cropX = (640 - cropWidth) / 2;
        const cropY = (480 - cropHeight) / 2;

        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = cropWidth;
        tempCanvas.height = cropHeight;
        const tempCtx = tempCanvas.getContext('2d');
        
        if (tempCtx) {
          // Dibujar solo el área del visor en el canvas temporal
          tempCtx.drawImage(canvas, cropX, cropY, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight);
          
          // Convertir a base64
          const base64 = tempCanvas.toDataURL('image/jpeg', 0.92);
          
          // Consumir API OCR del Backend
          const res = await entryApi.ocr(base64);
          
          if (res.success && res.data?.licensePlate) {
            onChange(res.data.licensePlate);
            closeScanner();
          } else {
            alert('No se detectó una placa de forma clara. Intente alinearla mejor dentro del recuadro verde.');
          }
        }
      }
    } catch (err) {
      console.error('Error in OCR capture processing:', err);
      alert('Error en el reconocimiento de la placa.');
    } finally {
      setIsScanning(false);
    }
  };

  // ----- Fallback de Cámara Física del Smartphone (HTTP) -----

  const triggerFileCapture = () => {
    fileInputRef.current?.click();
  };

  const handleFileCaptureChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsScanning(true);
      try {
        // Reducir y comprimir la imagen de la placa para un envío rápido y evitar problemas de límite
        const compressedBase64 = await compressImage(file, 1024, 1024, 0.85);
        
        // Enviar la captura optimizada a nuestro motor ALPR en el backend
        const res = await entryApi.ocr(compressedBase64);
        
        if (res.success && res.data?.licensePlate) {
          onChange(res.data.licensePlate);
          closeScanner();
        } else {
          alert('No se pudo reconocer la placa a partir de la foto capturada. Intente encuadrarla más de cerca con buena luz.');
        }
      } catch (err) {
        console.error('Error reading and compressing native image for OCR:', err);
        alert('Error al procesar la fotografía de la placa.');
      } finally {
        setIsScanning(false);
      }
    }
  };

  return (
    <div className="w-full">
      
      {/* Estilos del Barrido Láser Localizados */}
      <style>{`
        @keyframes scan-laser {
          0% { top: 0%; opacity: 0.6; }
          50% { top: 100%; opacity: 1; }
          100% { top: 0%; opacity: 0.6; }
        }
        .animate-scan-laser {
          position: absolute;
          animation: scan-laser 2.5s infinite linear;
        }
      `}</style>

      {/* Label */}
      <label className="block text-sm font-semibold text-slate-350 mb-2">
        Número de Placa Vehicular
      </label>

      {/* Contenedor Adaptativo de Entrada y Botón Escáner */}
      <div className="flex flex-col sm:flex-row gap-3">
        
        {/* Input Principal */}
        <div className="relative flex-1">
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
              ${isValid === null ? 'border-slate-655 bg-slate-800' : ''}
              ${isFocused && isValid === null ? 'border-blue-500 ring-4 ring-blue-500/15' : ''}
              ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          />

          {/* Indicadores visuales */}
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

        {/* Botón Escáner Premium */}
        <button
          onClick={openScanner}
          type="button"
          disabled={disabled}
          className={`
            px-5 py-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2 border shadow-lg cursor-pointer
            ${disabled
              ? 'bg-slate-800 text-slate-500 border-slate-700 cursor-not-allowed opacity-50'
              : 'bg-slate-800 hover:bg-slate-750 text-blue-400 hover:text-blue-300 border-slate-700 hover:border-slate-600 active:scale-95'
            }
          `}
          title="Escanear placa vehicular con cámara"
        >
          <Camera className="w-5.5 h-5.5" />
          <span className="text-sm">Escanear Placa</span>
        </button>

      </div>

      {/* Sugerencias recientes */}
      {showRecent && showSuggestions && recentPlates.length > 0 && (
        <div className="absolute z-15 mt-2 w-full max-w-md bg-slate-850 border border-slate-700 rounded-xl overflow-hidden shadow-2xl">
          <div className="px-3 py-2 text-xs text-slate-500 border-b border-slate-700/60 font-semibold uppercase tracking-wider">
            Placas recientes
          </div>
          {recentPlates.slice(0, 5).map((plate, index) => (
            <button
              key={index}
              onClick={() => selectRecentPlate(plate)}
              className="w-full px-4 py-3 text-left font-mono hover:bg-slate-750 transition-colors flex items-center gap-2 text-slate-200 border-b border-slate-800 last:border-0"
            >
              <Search className="w-4 h-4 text-slate-500" />
              <span>{plate}</span>
            </button>
          ))}
        </div>
      )}

      {/* Mensajes de validación */}
      <div className="mt-2 min-h-6">
        {isValid === false && value.length >= 5 && (
          <p className="text-sm text-red-400 flex items-center gap-1.5 font-medium">
            <AlertCircle className="w-4 h-4 text-red-400" />
            Formato de placa inválido. Ejemplo: ABC-1234
          </p>
        )}
        {isValid === true && (
          <p className="text-sm text-green-400 flex items-center gap-1.5 font-medium">
            <Check className="w-4 h-4 text-green-400" />
            Formato válido
          </p>
        )}
      </div>

      {/* Instrucciones de ayuda */}
      <p className="mt-2.5 text-xs text-slate-500 leading-normal">
        Ingrese los caracteres alfanuméricos tal como aparecen en la placa física. Ejemplo: 3 letras, guion y 4 números (ej: ABC-1234).
      </p>

      {/* ==================================================== */}
      {/* VISOR MODAL DE ESCANEO OCR / ALPR (COMPATIBILIDAD 100%) */}
      {/* ==================================================== */}
      {isScannerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-fade-in">
          
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col">
            
            {/* Header del Modal */}
            <div className="px-5 py-4 border-b border-slate-850 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Camera className="w-5 h-5 text-blue-400" />
                <h3 className="text-white font-bold text-base">Escáner de Placa ALPR</h3>
              </div>
              <button 
                onClick={closeScanner}
                className="p-1 hover:bg-slate-850 hover:text-white rounded-lg transition-colors border border-transparent"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            {/* Pantalla del Reproductor / Visor del Escáner */}
            <div className="relative w-full aspect-video bg-slate-950 flex items-center justify-center overflow-hidden border-b border-slate-850">
              
              {/* Stream de Video en vivo */}
              <video 
                ref={videoRef}
                playsInline
                muted
                className="absolute inset-0 w-full h-full object-cover"
              />

              {/* GUÍA DE ENCUADRE OCR (Bordes verdes y Láser de Barrido) */}
              {!hasCameraError && (
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center p-6">
                  
                  {/* Rectángulo alineador */}
                  <div className="relative w-72 h-20 border-2 border-green-500/80 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(34,197,94,0.2)]">
                    {/* Esquinas en L */}
                    <div className="absolute -top-1.5 -left-1.5 w-4 h-4 border-t-4 border-l-4 border-green-400 rounded-tl" />
                    <div className="absolute -top-1.5 -right-1.5 w-4 h-4 border-t-4 border-r-4 border-green-400 rounded-tr" />
                    <div className="absolute -bottom-1.5 -left-1.5 w-4 h-4 border-b-4 border-l-4 border-green-400 rounded-bl" />
                    <div className="absolute -bottom-1.5 -right-1.5 w-4 h-4 border-b-4 border-r-4 border-green-400 rounded-br" />

                    {/* Barrido Láser animado */}
                    <div className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-green-400 to-transparent shadow-[0_0_10px_#22c55e] animate-scan-laser" />

                    <span className="text-[10px] text-green-400 font-bold uppercase tracking-widest absolute -bottom-7 bg-slate-950/80 px-2 py-0.5 rounded-full border border-green-500/20">
                      Encuadre la placa
                    </span>
                  </div>

                </div>
              )}

              {/* Indicador de Análisis OCR en curso */}
              {isScanning && (
                <div className="absolute inset-0 bg-slate-950/85 flex flex-col items-center justify-center gap-3">
                  <div className="animate-spin w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full" />
                  <p className="text-blue-400 text-sm font-semibold animate-pulse tracking-wide">
                    Extrayendo caracteres alfanuméricos...
                  </p>
                </div>
              )}

              {/* Fallback de Cámara Física por falta de HTTPS (Inseguro) */}
              {hasCameraError && (
                <div className="absolute inset-0 bg-slate-950 flex flex-col items-center justify-center gap-4 p-5 text-center">
                  <AlertCircle className="w-12 h-12 text-amber-500/80 animate-pulse" />
                  <div>
                    <h4 className="text-white font-bold text-sm">Escáner no disponible en vivo</h4>
                    <p className="text-slate-400 text-xs mt-1.5 px-4 leading-relaxed">
                      El navegador móvil restringe WebRTC en redes HTTP. Utilice su cámara nativa para escanear.
                    </p>
                  </div>
                  <button
                    onClick={triggerFileCapture}
                    className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-sm shadow-lg shadow-blue-600/30 transition-all cursor-pointer active:scale-95"
                  >
                    <Camera className="w-4 h-4" />
                    Tomar Foto de Placa
                  </button>
                </div>
              )}

            </div>

            {/* Footer / Controles del Modal */}
            <div className="px-5 py-4 bg-slate-950/40 flex justify-between gap-3">
              <button
                type="button"
                onClick={closeScanner}
                className="px-5 py-2.5 rounded-xl border border-slate-700 text-slate-300 font-semibold hover:bg-slate-800 transition-colors text-sm"
              >
                Cancelar
              </button>

              {!hasCameraError && (
                <button
                  type="button"
                  onClick={handleCaptureOCR}
                  disabled={isScanning}
                  className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-sm shadow-md transition-all active:scale-95 disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${isScanning ? 'animate-spin' : ''}`} />
                  Escanear Placa
                </button>
              )}
            </div>

          </div>

          {/* Canvas oculto para crop/captura */}
          <canvas ref={canvasRef} className="hidden" />

          {/* Input file de fallback con captura de ambiente (cámara trasera) */}
          <input 
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileCaptureChange}
            className="hidden"
          />

        </div>
      )}

    </div>
  );
}
