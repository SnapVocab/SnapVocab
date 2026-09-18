import type { LookupResult, Reliability } from './types';

/** Hex values (not classes) because box borders are drawn with dynamic styles. */
export const RELIABILITY_COLORS: Record<Reliability, string> = {
  HIGH: '#58CC02', // primary-500
  MEDIUM: '#FFC42E', // reward-500
  LOW: '#757793', // neutral-400
};

export const RELIABILITY_KEYS = {
  HIGH: 'scan.reliability.high',
  MEDIUM: 'scan.reliability.medium',
  LOW: 'scan.reliability.low',
} as const satisfies Record<Reliability, string>;

/** "HH:mm" in the device's local time, e.g. the quota reset at local midnight. */
export function formatLocalTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime()))
    return '00:00';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/** First IPA, e.g. "/ˈbɒtl/"; null when the entry has none. */
export function primaryIpa(word: LookupResult | null): string | null {
  const ipa = word?.pronunciations?.find(p => p.ipa)?.ipa;
  if (!ipa)
    return null;
  return ipa.startsWith('/') ? ipa : `/${ipa}/`;
}

/** Translation in `langCode` (Vietnamese by default); null when missing. */
export function translationFor(word: LookupResult | null, langCode = 'vi'): string | null {
  return word?.translations?.find(t => t.langCode === langCode)?.translation ?? null;
}
