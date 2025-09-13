import { format as formatDate } from 'date-fns';
import type { Unit } from '../types';

export function formatNumber(value: number | null | undefined, unit: Unit): string {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return '—';
  }

  if (unit === 'index') {
    return value.toFixed(1);
  }

  // For percent and rate
  return `${value.toFixed(2)}%`;
}

export function formatPercentage(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return '—';
  }
  
  return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
}

export function formatCurrency(value: number | null | undefined, decimals: number = 4): string {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return '—';
  }
  
  return value.toFixed(decimals);
}

export function formatDateString(date: string | Date): string {
  try {
    const d = typeof date === 'string' ? new Date(date) : date;
    return formatDate(d, 'MMM dd, yyyy');
  } catch {
    return '—';
  }
}

export function formatTimeAgo(date: string | Date): string {
  try {
    const d = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  } catch {
    return '—';
  }
}

export function getTrendColor(trend: string): string {
  switch (trend) {
    case 'RISING':
      return '#10b981'; // green
    case 'FALLING':
      return '#ef4444'; // red
    case 'VOLATILE_UP':
      return '#f59e0b'; // amber
    case 'VOLATILE_DOWN':
      return '#f97316'; // orange
    case 'STABLE':
      return '#6b7280'; // gray
    default:
      return '#6b7280';
  }
}

export function getTrendIcon(trend: string): string {
  switch (trend) {
    case 'RISING':
      return '↑';
    case 'FALLING':
      return '↓';
    case 'VOLATILE_UP':
      return '⚡↑';
    case 'VOLATILE_DOWN':
      return '⚡↓';
    case 'STABLE':
      return '→';
    default:
      return '•';
  }
}