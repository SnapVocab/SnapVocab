import type { User } from '../auth/api';

export function fullName(user?: Pick<User, 'firstName' | 'lastName'> | null): string {
  return [user?.firstName, user?.lastName].filter(Boolean).join(' ').trim();
}

/** Up to two letters for the avatar placeholder, e.g. "Hoàng Trọng" -> "HT". */
export function initials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0)
    return '?';
  const letters = words.length === 1
    ? words[0].slice(0, 1)
    : words[0][0] + words[words.length - 1][0];
  return letters.toUpperCase();
}

/** "dd/MM/yyyy" in local time; empty string when the date is missing or invalid. */
export function formatDate(iso?: string | null, locale?: string): string {
  if (!iso)
    return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime()))
    return '';
  if (locale)
    return new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short', year: 'numeric' }).format(date);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`;
}

/** Backend sends "HH:mm:ss"; the UI shows "HH:mm". Null means the reminder is off. */
export function formatTimeOfDay(value?: string | null): string | null {
  if (!value)
    return null;
  const [hours, minutes] = value.split(':');
  if (hours === undefined || minutes === undefined)
    return null;
  return `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}`;
}

/** Hourly and half-hourly options for the reminder picker: "06:00", "06:30", ... */
export function reminderOptions(): string[] {
  return Array.from({ length: 48 }, (_, i) => {
    const hours = String(Math.floor(i / 2)).padStart(2, '0');
    return `${hours}:${i % 2 === 0 ? '00' : '30'}`;
  });
}
