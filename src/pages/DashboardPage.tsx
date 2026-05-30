// Página de Dashboard - Sistema de Control de Vehículos

import { useMemo } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Car,
  LogIn,
  LogOut,
  AlertTriangle,
  Clock,
  Users,
  Calendar,
} from 'lucide-react';
import { useVehicleStore } from '../store';
import { VehicleStatusBadge } from '../components/StatusBadge';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: typeof Car;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  color: 'blue' | 'green' | 'amber' | 'red';
}

function StatCard({ title, value, subtitle, icon: Icon, trend, trendValue, color }: StatCardProps) {
  const colorClasses = {
    blue: 'bg-blue-500/20 text-blue-400',
    green: 'bg-green-500/20 text-green-400',
    amber: 'bg-amber-500/20 text-amber-400',
    red: 'bg-red-500/20 text-red-400',
  };

  return (
    <div className="bg-slate-800 rounded-xl p-6">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${colorClasses[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-sm ${
            trend === 'up' ? 'text-green-400' : trend === 'down' ? 'text-red-400' : 'text-slate-400'
          }`}>
            {trend === 'up' && <TrendingUp className="w-4 h-4" />}
            {trend === 'down' && <TrendingDown className="w-4 h-4" />}
            {trendValue && <span>{trendValue}</span>}
          </div>
        )}
      </div>
      <p className="text-3xl font-bold text-white mb-1">{value}</p>
      <p className="text-slate-400">{title}</p>
      {subtitle && <p className="text-sm text-slate-500 mt-1">{subtitle}</p>}
    </div>
  );
}

export function DashboardPage() {
  const { entries, currentTime } = useVehicleStore();

  // Calcular estadísticas
  const stats = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayEntries = entries.filter(e => new Date(e.entryTimestamp) >= today);
    const todayExits = todayEntries.filter(e => e.hasExit);
    const pendingExits = entries.filter(e => !e.hasExit);
    const openIncidents = 0; // Simulado

    const avgDuration = todayEntries.length > 0
      ? Math.round(
          todayEntries.reduce((acc, e) => {
            const exit = e.hasExit ? Date.now() : Date.now();
            return acc + (exit - new Date(e.entryTimestamp).getTime());
          }, 0) / todayEntries.length / 60000
        )
      : 0;

    return {
      totalEntriesToday: todayEntries.length,
      totalExitsToday: todayExits.length,
      pendingExits: pendingExits.length,
      openIncidents,
      avgDuration,
    };
  }, [entries]);

  // Últimos registros
  const recentEntries = entries.slice(0, 5);

  // Ingresos por hora (últimas 8 horas)
  const hourlyData = useMemo(() => {
    const hours = [];
    const now = new Date();

    for (let i = 7; i >= 0; i--) {
      const hour = new Date(now);
      hour.setHours(hour.getHours() - i, 0, 0, 0);
      const nextHour = new Date(hour);
      nextHour.setHours(nextHour.getHours() + 1);

      const count = entries.filter(e => {
        const entryTime = new Date(e.entryTimestamp);
        return entryTime >= hour && entryTime < nextHour;
      }).length;

      hours.push({
        hour: hour.getHours(),
        label: `${hour.getHours()}:00`,
        count,
      });
    }

    return hours;
  }, [entries]);

  const maxHourlyCount = Math.max(...hourlyData.map(h => h.count), 1);

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-slate-400 mt-1">
          Resumen del sistema - {currentTime.toLocaleDateString('es-ES', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard
          title="Ingresos Hoy"
          value={stats.totalEntriesToday}
          icon={LogIn}
          trend="up"
          trendValue="+12%"
          color="blue"
        />
        <StatCard
          title="Salidas Hoy"
          value={stats.totalExitsToday}
          icon={LogOut}
          trend="up"
          trendValue="+8%"
          color="green"
        />
        <StatCard
          title="En Planta"
          value={stats.pendingExits}
          icon={Car}
          subtitle={`Promedio: ${stats.avgDuration} min`}
          color="amber"
        />
        <StatCard
          title="Incidentes"
          value={stats.openIncidents}
          icon={AlertTriangle}
          trend="neutral"
          color="red"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Gráfico de ingresos por hora */}
        <div className="bg-slate-800 rounded-xl p-6">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-400" />
            Ingresos por Hora
          </h2>
          <div className="h-48 flex items-end gap-2">
            {hourlyData.map((h, i) => (
              <div key={i} className="flex-1 flex flex-col items-center">
                <div className="w-full bg-slate-700 rounded-t-lg relative" style={{ height: '160px' }}>
                  <div
                    className="absolute bottom-0 w-full bg-gradient-to-t from-blue-600 to-blue-400 rounded-t-lg transition-all duration-500"
                    style={{ height: `${(h.count / maxHourlyCount) * 100}%` }}
                  />
                  {h.count > 0 && (
                    <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-sm font-bold text-white">
                      {h.count}
                    </span>
                  )}
                </div>
                <span className="text-xs text-slate-500 mt-2">{h.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Distribución de estados */}
        <div className="bg-slate-800 rounded-xl p-6">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Car className="w-5 h-5 text-amber-400" />
            Estado de Vehículos
          </h2>
          <div className="space-y-4">
            {[
              { label: 'En Planta', value: stats.pendingExits, color: 'bg-amber-500', total: entries.length },
              { label: 'Salidos Hoy', value: stats.totalExitsToday, color: 'bg-green-500', total: entries.length },
              { label: 'Total Registros', value: entries.length, color: 'bg-blue-500', total: entries.length },
            ].map((item, i) => (
              <div key={i}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-400">{item.label}</span>
                  <span className="text-white font-medium">{item.value}</span>
                </div>
                <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${item.color} rounded-full transition-all duration-500`}
                    style={{ width: `${entries.length > 0 ? (item.value / entries.length) * 100 : 0}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Últimos Registros */}
      <div className="bg-slate-800 rounded-xl p-6">
        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-green-400" />
          Últimos Registros
        </h2>

        {recentEntries.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            <Car className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No hay registros aún</p>
          </div>
        ) : (
          <div className="space-y-3">
            {recentEntries.map(entry => (
              <div
                key={entry.id}
                className="flex items-center gap-4 p-3 bg-slate-700/50 rounded-xl hover:bg-slate-700 transition-colors"
              >
                <div className="w-12 h-12 rounded-lg overflow-hidden bg-slate-600">
                  <img
                    src={entry.vehiclePhoto}
                    alt={entry.licensePlate}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-white">{entry.licensePlate}</span>
                    <VehicleStatusBadge hasExit={entry.hasExit} size="sm" />
                  </div>
                  <div className="flex items-center gap-3 text-sm text-slate-400">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(entry.entryTimestamp).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {entry.guardName && (
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {entry.guardName}
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-slate-400">
                    {Math.round((Date.now() - new Date(entry.entryTimestamp).getTime()) / 60000)} min
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
