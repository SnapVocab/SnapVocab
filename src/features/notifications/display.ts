import type { NotificationItem } from './api';
import type { TxKeyPath } from '@/lib/i18n';
import { formatDate } from '@/features/profile/display';
import { translate } from '@/lib/i18n';

/** notification.md §2.3 as this app version knows it; anything else behaves as route = null (§5.3). */
const ROUTE_LABELS = new Map<string, TxKeyPath>([
  ['/study/select', 'notifications.open_study'],
  ['/missions', 'notifications.open_missions'],
  ['/shop', 'notifications.open_shop'],
  ['/stats', 'notifications.open_stats'],
  ['/settings', 'notifications.open_settings'],
]);

/** Null when the route is missing or not whitelisted: the row then never navigates. */
export function routeLabel(route: string | null): TxKeyPath | null {
  return route ? ROUTE_LABELS.get(route) ?? null : null;
}

/** §3.5: "Vừa xong", minutes, hours, days, then dd/MM/yyyy from 7 days on. */
export function relativeTime(iso: string, now: number = Date.now()): string {
  const time = new Date(iso).getTime();
  if (Number.isNaN(time))
    return '';
  const minutes = Math.floor((now - time) / 60_000);
  if (minutes < 1)
    return translate('notifications.time_just_now');
  if (minutes < 60)
    return translate('notifications.time_minutes', { count: minutes });
  const hours = Math.floor(minutes / 60);
  if (hours < 24)
    return translate('notifications.time_hours', { count: hours });
  const days = Math.floor(hours / 24);
  if (days < 7)
    return translate('notifications.time_days', { count: days });
  return formatDate(iso);
}

const DAY_KEYS = ['today', 'yesterday', 'earlier'] as const;
export type DaySection = { key: typeof DAY_KEYS[number]; data: NotificationItem[] };

/** Device-local calendar days (display only). Keeps the server's newest-first order inside each section. */
export function groupByDay(items: NotificationItem[], now: Date = new Date()): DaySection[] {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1).getTime();
  const byKey: Record<DaySection['key'], NotificationItem[]> = { today: [], yesterday: [], earlier: [] };
  for (const item of items) {
    const time = new Date(item.createdAt).getTime();
    byKey[time >= today ? 'today' : time >= yesterday ? 'yesterday' : 'earlier'].push(item);
  }
  return DAY_KEYS.filter(key => byKey[key].length > 0).map(key => ({ key, data: byKey[key] }));
}
