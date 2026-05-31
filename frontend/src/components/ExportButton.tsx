// Componente ExportButton - Botón de Exportación CSV con Loader

import { useState } from 'react';
import { Download, Loader2, Check } from 'lucide-react';
import { exportApi } from '../services/exportApi';

interface ExportButtonProps {
  type: 'entries' | 'exits';
  filters?: {
    startDate?: string;
    endDate?: string;
    licensePlate?: string;
  };
  className?: string;
}

export function ExportButton({ type, filters = {}, className = '' }: ExportButtonProps) {
  const [exporting, setExporting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleExport = async () => {
    if (exporting) return;
    
    setExporting(true);
    setSuccess(false);

    try {
      if (type === 'entries') {
        await exportApi.entries(filters);
      } else {
        await exportApi.exits(filters);
      }
      
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000); // Reset after 3 seconds
    } catch (error) {
      console.error('Error exporting CSV:', error);
      alert('Hubo un error al exportar los datos. Por favor, intente nuevamente.');
    } finally {
      setExporting(false);
    }
  };

  return (
    <button
      onClick={handleExport}
      disabled={exporting}
      className={`
        relative flex items-center justify-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm
        transition-all duration-300 border border-transparent shadow-md
        disabled:opacity-85 disabled:cursor-not-allowed
        ${success 
          ? 'bg-green-600 hover:bg-green-750 text-white' 
          : 'bg-emerald-600 hover:bg-emerald-500 text-white hover:shadow-emerald-900/10'
        }
        ${className}
      `}
      title={type === 'entries' ? 'Exportar ingresos a CSV' : 'Exportar salidas a CSV'}
    >
      {exporting ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Generando...</span>
        </>
      ) : success ? (
        <>
          <Check className="w-4 h-4 text-green-200" />
          <span>¡Descargado!</span>
        </>
      ) : (
        <>
          <Download className="w-4 h-4" />
          <span>Exportar CSV</span>
        </>
      )}
    </button>
  );
}
