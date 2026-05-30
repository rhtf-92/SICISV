// Página de Historial - Sistema de Control de Vehículos

import { useState, useMemo } from 'react';
import { Search, Filter, Download, ChevronDown, ChevronUp, Calendar, Car, User, Clock, X } from 'lucide-react';
import { useVehicleStore } from '../store';
import { VehicleStatusBadge } from '../components/StatusBadge';
import type { Entry } from '../types';

type FilterType = 'all' | 'entry' | 'exit';
type SortField = 'timestamp' | 'plate';
type SortDirection = 'asc' | 'desc';

export function HistoryPage() {
  const { entries } = useVehicleStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [sortField, setSortField] = useState<SortField>('timestamp');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedEntry, setSelectedEntry] = useState<Entry | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  // Filtrar y ordenar entradas
  const filteredEntries = useMemo(() => {
    let result = [...entries];

    // Filtro por búsqueda
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        entry =>
          entry.licensePlate.toLowerCase().includes(query) ||
          entry.guardName?.toLowerCase().includes(query)
      );
    }

    // Filtro por tipo
    if (filterType === 'entry') {
      result = result.filter(e => !e.hasExit);
    } else if (filterType === 'exit') {
      result = result.filter(e => e.hasExit);
    }

    // Filtro por fecha
    if (dateFrom) {
      const fromDate = new Date(dateFrom);
      result = result.filter(e => new Date(e.entryTimestamp) >= fromDate);
    }
    if (dateTo) {
      const toDate = new Date(dateTo);
      toDate.setHours(23, 59, 59, 999);
      result = result.filter(e => new Date(e.entryTimestamp) <= toDate);
    }

    // Ordenar
    result.sort((a, b) => {
      let comparison = 0;
      if (sortField === 'timestamp') {
        comparison = new Date(a.entryTimestamp).getTime() - new Date(b.entryTimestamp).getTime();
      } else if (sortField === 'plate') {
        comparison = a.licensePlate.localeCompare(b.licensePlate);
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [entries, searchQuery, filterType, sortField, sortDirection, dateFrom, dateTo]);

  // Toggle ordenamiento
  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(d => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  // Exportar a CSV
  const exportToCSV = () => {
    const headers = ['Placa', 'Fecha/Hora Ingreso', 'Fecha/Hora Salida', 'Vigilante', 'Estado'];
    const rows = filteredEntries.map(entry => [
      entry.licensePlate,
      new Date(entry.entryTimestamp).toLocaleString('es-ES'),
      entry.hasExit ? new Date(entry.entryTimestamp).toLocaleString('es-ES') : 'En curso',
      entry.guardName || 'N/A',
      entry.hasExit ? 'Salió' : 'En planta',
    ]);

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `historial_vehiculos_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Clock className="w-8 h-8 text-slate-400" />
            Historial de Registros
          </h1>
          <p className="text-slate-400 mt-1">
            {filteredEntries.length} registros encontrados
          </p>
        </div>
        <button
          onClick={exportToCSV}
          disabled={filteredEntries.length === 0}
          className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-slate-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Download className="w-5 h-5" />
          Exportar CSV
        </button>
      </div>

      {/* Filtros */}
      <div className="bg-slate-800 rounded-xl p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Búsqueda */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por placa o vigilante..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Filtro rápido */}
          <div className="flex gap-2">
            {(['all', 'entry', 'exit'] as FilterType[]).map(type => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`
                  px-4 py-2 rounded-lg font-medium transition-colors
                  ${filterType === type
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }
                `}
              >
                {type === 'all' ? 'Todos' : type === 'entry' ? 'Ingresos' : 'Salidas'}
              </button>
            ))}
          </div>

          {/* Toggle filtros avanzados */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-lg transition-colors
              ${showFilters ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}
            `}
          >
            <Filter className="w-5 h-5" />
            Filtros
            {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>

        {/* Filtros avanzados */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-slate-700 flex flex-wrap gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">Desde</label>
              <input
                type="date"
                value={dateFrom}
                onChange={e => setDateFrom(e.target.value)}
                className="px-3 py-2 bg-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Hasta</label>
              <input
                type="date"
                value={dateTo}
                onChange={e => setDateTo(e.target.value)}
                className="px-3 py-2 bg-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            {(dateFrom || dateTo) && (
              <button
                onClick={() => {
                  setDateFrom('');
                  setDateTo('');
                }}
                className="self-end px-3 py-2 text-red-400 hover:bg-slate-700 rounded-lg transition-colors"
              >
                Limpiar fechas
              </button>
            )}
          </div>
        )}
      </div>

      {/* Lista de registros */}
      <div className="space-y-3">
        {filteredEntries.length === 0 ? (
          <div className="bg-slate-800 rounded-xl p-12 text-center">
            <Car className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400">No se encontraron registros</p>
          </div>
        ) : (
          filteredEntries.map(entry => (
            <div
              key={entry.id}
              onClick={() => setSelectedEntry(entry)}
              className="bg-slate-800 hover:bg-slate-750 rounded-xl p-4 cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-4">
                {/* Thumbnail vehículo */}
                <div className="w-20 h-20 rounded-lg overflow-hidden bg-slate-700 flex-shrink-0">
                  <img
                    src={entry.vehiclePhoto}
                    alt={entry.licensePlate}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Info principal */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xl font-mono font-bold text-white">
                      {entry.licensePlate}
                    </span>
                    <VehicleStatusBadge hasExit={entry.hasExit} size="sm" />
                  </div>
                  <div className="flex items-center gap-4 text-sm text-slate-400">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {new Date(entry.entryTimestamp).toLocaleDateString('es-ES')}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {new Date(entry.entryTimestamp).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {entry.guardName && (
                      <span className="flex items-center gap-1">
                        <User className="w-4 h-4" />
                        {entry.guardName}
                      </span>
                    )}
                  </div>
                </div>

                {/* Acciones */}
                <div className="flex-shrink-0">
                  <ChevronRight className="w-5 h-5 text-slate-500" />
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal de detalle */}
      {selectedEntry && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-slate-800 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-auto">
            {/* Header */}
            <div className="sticky top-0 bg-slate-800 p-6 border-b border-slate-700 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white">{selectedEntry.licensePlate}</h2>
                <p className="text-slate-400">
                  Registro del {new Date(selectedEntry.entryTimestamp).toLocaleDateString('es-ES')}
                </p>
              </div>
              <button
                onClick={() => setSelectedEntry(null)}
                className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
              >
                <X className="w-6 h-6 text-slate-400" />
              </button>
            </div>

            {/* Contenido */}
            <div className="p-6 space-y-6">
              {/* Fotos */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-400 mb-2">Foto del Vehículo</p>
                  <div className="aspect-video bg-slate-700 rounded-xl overflow-hidden">
                    <img
                      src={selectedEntry.vehiclePhoto}
                      alt="Vehículo"
                      className="w-full h-full object-contain"
                    />
                  </div>
                </div>
                <div>
                  <p className="text-sm text-slate-400 mb-2">Foto del Conductor</p>
                  <div className="aspect-video bg-slate-700 rounded-xl overflow-hidden">
                    <img
                      src={selectedEntry.driverPhoto}
                      alt="Conductor"
                      className="w-full h-full object-contain"
                    />
                  </div>
                </div>
              </div>

              {/* Detalles */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-slate-700 rounded-xl p-4">
                  <p className="text-sm text-slate-400">Estado</p>
                  <VehicleStatusBadge hasExit={selectedEntry.hasExit} size="lg" />
                </div>
                <div className="bg-slate-700 rounded-xl p-4">
                  <p className="text-sm text-slate-400">Hora de Ingreso</p>
                  <p className="text-xl font-semibold text-white">
                    {new Date(selectedEntry.entryTimestamp).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <div className="bg-slate-700 rounded-xl p-4">
                  <p className="text-sm text-slate-400">Vigilante</p>
                  <p className="text-xl font-semibold text-white">
                    {selectedEntry.guardName || 'N/A'}
                  </p>
                </div>
                <div className="bg-slate-700 rounded-xl p-4">
                  <p className="text-sm text-slate-400">Tiempo en Planta</p>
                  <p className="text-xl font-semibold text-white">
                    {Math.round((Date.now() - new Date(selectedEntry.entryTimestamp).getTime()) / 60000)} min
                  </p>
                </div>
              </div>

              {/* Notas */}
              {selectedEntry.notes && (
                <div className="bg-slate-700 rounded-xl p-4">
                  <p className="text-sm text-slate-400 mb-1">Notas</p>
                  <p className="text-white">{selectedEntry.notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ChevronRight component
function ChevronRight({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M9 18l6-6-6-6" />
    </svg>
  );
}
