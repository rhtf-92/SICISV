// Componente de Captura de Cámara - Sistema de Control de Vehículos

import { useRef, useState, useEffect, useCallback } from 'react';
import { Camera, CameraOff, RefreshCw, Check, AlertCircle } from 'lucide-react';
import type { CameraState } from '../types';
import { compressImage } from '../utils/imageCompressor';

interface CameraCaptureProps {
  mode: 'vehicle' | 'driver';
  onCapture: (photo: string) => void;
  state: CameraState;
  onStateChange: (state: CameraState) => void;
  autoCapture?: boolean;
}

export function CameraCapture({ mode, onCapture, state, onStateChange, autoCapture }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onStateChange({ status: 'capturing' });
      try {
        const compressedBase64 = await compressImage(file, 1280, 1280, 0.8);
        onStateChange({ status: 'success' });
        onCapture(compressedBase64);
      } catch (err) {
        console.error('Error compressing mobile camera image:', err);
        onStateChange({
          status: 'error',
          error: 'Error al procesar la fotografía de la cámara.'
        });
      }
    }
  }, [onCapture, onStateChange]);

  const triggerFileInput = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const [hasCamera, setHasCamera] = useState(true);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');

  const startCamera = useCallback(async () => {
    try {
      onStateChange({ status: 'active' });

      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: mode === 'driver' ? 'user' : facingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setHasCamera(true);
      onStateChange({ status: 'active' });
    } catch (error) {
      console.error('Error accessing camera:', error);
      setHasCamera(false);
      onStateChange({
        status: 'error',
        error: 'No se puede acceder a la cámara. Verifique los permisos.'
      });
    }
  }, [mode, facingMode, onStateChange]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  }, []);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (video.videoWidth === 0 || video.videoHeight === 0) {
      onStateChange({
        status: 'error',
        error: 'La cámara no está lista. Intente de nuevo.'
      });
      return;
    }

    // Configurar canvas con dimensiones de video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const context = canvas.getContext('2d');
    if (!context) return;

    // Capturar imagen
    context.drawImage(video, 0, 0);

    // Convertir a base64 (alta calidad)
    const imageData = canvas.toDataURL('image/jpeg', 0.92);

    // Simular detección de contenido
    onStateChange({ status: 'capturing' });

    setTimeout(() => {
      onStateChange({ status: 'success' });
      onCapture(imageData);
    }, 300);
  }, [onCapture, onStateChange]);

  const retakePhoto = useCallback(() => {
    onStateChange({ status: 'active' });
    onCapture('');
    if (videoRef.current && !streamRef.current) {
      startCamera();
    }
  }, [onCapture, onStateChange, startCamera]);

  const [countdown, setCountdown] = useState<number | null>(null);

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, [startCamera, stopCamera]);

  useEffect(() => {
    if (!autoCapture || state.status !== 'active') {
      setCountdown(null);
      return;
    }

    setCountdown(3);
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(timer);
          handleCapture();
          return null;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [autoCapture, state.status]);

  // Mostrar preview capturada si existe
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);

  const handleCapture = () => {
    capturePhoto();
    if (canvasRef.current) {
      const imageData = canvasRef.current.toDataURL('image/jpeg', 0.92);
      setCapturedPhoto(imageData);
    }
  };

  return (
    <div className="relative w-full">
      {/* Contenedor de cámara */}
      <div
        className={`
          relative w-full aspect-video rounded-xl overflow-hidden
          ${state.status === 'error' ? 'border-2 border-red-500' : 'border border-slate-200'}
          ${state.status === 'success' ? 'ring-2 ring-green-500' : ''}
          bg-slate-900
        `}
      >
        {/* Video en vivo */}
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover"
          playsInline
          muted
        />

        {/* Guía de encuadre */}
        {state.status === 'active' && (
          <div className="absolute inset-0 pointer-events-none">
            {mode === 'vehicle' ? (
              // Guía para vehículo
              <svg className="w-full h-full" viewBox="0 0 640 480">
                <rect
                  x="80"
                  y="120"
                  width="480"
                  height="240"
                  fill="none"
                  stroke="#10B981"
                  strokeWidth="3"
                  strokeDasharray="12,8"
                  rx="20"
                />
                <text
                  x="320"
                  y="400"
                  textAnchor="middle"
                  className="fill-white text-sm font-medium"
                >
                  Posicione el vehículo lateralmente
                </text>
              </svg>
            ) : (
              // Guía para conductor
              <svg className="w-full h-full" viewBox="0 0 640 480">
                <ellipse
                  cx="320"
                  cy="200"
                  rx="120"
                  ry="150"
                  fill="none"
                  stroke="#10B981"
                  strokeWidth="3"
                  strokeDasharray="12,8"
                />
                <circle cx="320" cy="120" r="60" fill="none" stroke="#10B981" strokeWidth="2" />
                <text
                  x="320"
                  y="420"
                  textAnchor="middle"
                  className="fill-white text-sm font-medium"
                >
                  Centre el rostro del conductor
                </text>
              </svg>
            )}
          </div>
        )}

        {/* Preview capturada */}
        {capturedPhoto && (
          <img
            src={capturedPhoto}
            alt="Capturada"
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}

        {/* Indicador de estado */}
        {state.status === 'capturing' && (
          <div className="absolute inset-0 bg-white flex items-center justify-center animate-pulse">
            <span className="text-slate-900 font-semibold">Capturando...</span>
          </div>
        )}

        {/* Estado de error */}
        {state.status === 'error' && (
          <div className="absolute inset-0 bg-slate-900/85 flex flex-col items-center justify-center gap-3 p-4">
            <CameraOff className="w-12 h-12 text-red-400" />
            <p className="text-red-300 text-center text-sm px-2 leading-relaxed">{state.error}</p>
            <div className="flex flex-col sm:flex-row gap-2.5 mt-2 w-full max-w-xs">
              <button
                onClick={startCamera}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-850 hover:bg-slate-800 text-slate-300 rounded-xl transition-colors text-sm font-semibold border border-slate-700/60"
              >
                <RefreshCw className="w-4 h-4" />
                Reintentar
              </button>
              <button
                onClick={triggerFileInput}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-650 hover:bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-500/20 transition-all text-sm"
              >
                <Camera className="w-4 h-4" />
                Cámara Móvil
              </button>
            </div>
          </div>
        )}

        {/* Marco de éxito */}
        {state.status === 'success' && (
          <div className="absolute top-4 right-4 bg-green-500 rounded-full p-2">
            <Check className="w-6 h-6 text-white" />
          </div>
        )}

        {/* Indicador de cámara activa */}
        {state.status === 'active' && hasCamera && (
          <div className="absolute top-4 left-4 flex items-center gap-2 bg-red-500/80 text-white px-3 py-1 rounded-full text-sm font-medium">
            <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
            EN VIVO
          </div>
        )}

        {/* Auto-capture countdown */}
        {countdown !== null && state.status === 'active' && (
          <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
            <div className="text-center">
              <div className="w-24 h-24 rounded-full border-4 border-white flex items-center justify-center mx-auto mb-3">
                <span className="text-5xl font-bold text-white">{countdown}</span>
              </div>
              <p className="text-white text-lg font-semibold">Capturando rostro...</p>
              <p className="text-white/70 text-sm mt-1">Mire directamente a la cámara</p>
            </div>
          </div>
        )}
      </div>

      {/* Canvas oculto para captura */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Input oculto para fallback de cámara nativa en móvil (Secure Contexts bypass) */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture={mode === 'driver' ? 'user' : 'environment'}
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Controles */}
      <div className="mt-4 flex justify-center gap-3 sm:gap-4 px-2">
        {state.status === 'success' ? (
          <button
            onClick={() => {
              setCapturedPhoto(null);
              retakePhoto();
            }}
            className="flex items-center gap-2 px-4 py-2.5 sm:px-6 sm:py-3 bg-slate-700 hover:bg-slate-600 rounded-xl transition-colors text-sm sm:text-base"
          >
            <RefreshCw className="w-4 h-4 sm:w-5 sm:w-5" />
            Tomar otra foto
          </button>
        ) : (
          <button
            onClick={handleCapture}
            disabled={state.status !== 'active'}
            className={`
              flex items-center gap-2.5 sm:gap-3 px-5 py-3 sm:px-8 sm:py-4 rounded-xl font-semibold text-base sm:text-lg
              transition-all transform active:scale-95
              ${state.status === 'active'
                ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/30'
                : 'bg-slate-700 text-slate-400 cursor-not-allowed'
              }
            `}
          >
            <Camera className="w-5 h-5 sm:w-6 sm:h-6" />
            Capturar {mode === 'vehicle' ? 'Vehículo' : 'Conductor'}
          </button>
        )}
      </div>

      {/* Instrucciones */}
      <div className="mt-4 text-center text-sm text-slate-400">
        {mode === 'vehicle' ? (
          <p>Asegúrese de que el vehículo esté visible lateralmente con buena iluminación</p>
        ) : (
          <p>El conductor debe mirar directamente a la cámara con el rostro visible</p>
        )}
      </div>
    </div>
  );
}
