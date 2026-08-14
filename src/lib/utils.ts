import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateString: string): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatTime(timeString: string): string {
  if (!timeString) return '';
  // If timeString is HH:MM or HH:MM:SS
  const [hoursStr, minutesStr] = timeString.split(':');
  const hours = parseInt(hoursStr, 10);
  const minutes = parseInt(minutesStr, 10);
  if (isNaN(hours) || isNaN(minutes)) return timeString;

  const date = new Date();
  date.setHours(hours, minutes);
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

export function formatCurrency(amount: number): string {
  if (amount === 0) return 'Free';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
  }).format(amount);
}

export function generateTransactionReference(): string {
  const timestamp = Date.now().toString().slice(-6);
  const randomStr = Math.random().toString(36).substring(2, 7).toUpperCase();
  return `TXN-${timestamp}-${randomStr}`;
}
