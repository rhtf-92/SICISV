// Componente StatusBadge - Badge de Estado de Registros

import { Check, Clock, AlertTriangle, X, Info } from 'lucide-react';

type StatusVariant = 'success' | 'warning' | 'error' | 'info' | 'pending';

interface StatusBadgeProps {
  status: StatusVariant;
  label: string;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

const statusConfig = {
  success: {
    bg: 'bg-green-500/20',
    text: 'text-green-400',
    border: 'border-green-500/30',
    icon: Check,
  },
  warning: {
    bg: 'bg-amber-500/20',
    text: 'text-amber-400',
    border: 'border-amber-500/30',
    icon: Clock,
  },
  error: {
    bg: 'bg-red-500/20',
    text: 'text-red-400',
    border: 'border-red-500/30',
    icon: AlertTriangle,
  },
  info: {
    bg: 'bg-blue-500/20',
    text: 'text-blue-400',
    border: 'border-blue-500/30',
    icon: Info,
  },
  pending: {
    bg: 'bg-slate-500/20',
    text: 'text-slate-400',
    border: 'border-slate-500/30',
    icon: Clock,
  },
};

const sizeConfig = {
  sm: {
    padding: 'px-2 py-0.5',
    text: 'text-xs',
    icon: 'w-3 h-3',
  },
  md: {
    padding: 'px-3 py-1',
    text: 'text-sm',
    icon: 'w-4 h-4',
  },
  lg: {
    padding: 'px-4 py-1.5',
    text: 'text-base',
    icon: 'w-5 h-5',
  },
};

export function StatusBadge({
  status,
  label,
  size = 'md',
  showIcon = true,
}: StatusBadgeProps) {
  const config = statusConfig[status];
  const sizeStyles = sizeConfig[size];
  const Icon = config.icon;

  return (
    <span
      className={`
        inline-flex items-center gap-1.5 rounded-full font-medium border
        ${config.bg}
        ${config.text}
        ${config.border}
        ${sizeStyles.padding}
        ${sizeStyles.text}
      `}
    >
      {showIcon && <Icon className={sizeStyles.icon} />}
      {label}
    </span>
  );
}

// Componente para el estado de un registro de vehículo
interface VehicleStatusBadgeProps {
  hasExit?: boolean;
  status?: 'open' | 'investigating' | 'resolved';
  size?: 'sm' | 'md' | 'lg';
}

export function VehicleStatusBadge({ hasExit, status, size = 'md' }: VehicleStatusBadgeProps) {
  if (hasExit) {
    return <StatusBadge status="success" label="Salió" size={size} />;
  }

  if (status === 'open') {
    return <StatusBadge status="warning" label="Pendiente" size={size} />;
  }

  if (status === 'investigating') {
    return <StatusBadge status="error" label="En investigación" size={size} />;
  }

  if (status === 'resolved') {
    return <StatusBadge status="info" label="Resuelto" size={size} />;
  }

  return <StatusBadge status="pending" label="En planta" size={size} />;
}
