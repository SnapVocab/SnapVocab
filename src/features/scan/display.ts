import type { LookupResult, Reliability } from './types';

/** Hex values (not classes) because box borders are drawn with dynamic styles. */
export const RELIABILITY_COLORS: Record<Reliability, string> = {
  HIGH: '#58CC02', // primary-500
  MEDIUM: '#FFC42E', // reward-500
  LOW: '#757793', // neutral-400
};

/**
 * One colour per detected object, so each box on the photo can be matched to
 * its card. High-contrast hues that stay readable with white label text and
 * against both light and dark photos; cycles after 10 objects.
 */
export const BOX_COLORS = [
  '#1CB0F6', // blue
  '#58CC02', // green
  '#A560F8', // purple
  '#FF9600', // orange
  '#FF4B8B', // pink
  '#00C2B8', // teal
  '#FF4B4B', // red
  '#4F6BFF', // indigo
  '#E5B800', // mustard
  '#8BC34A', // lime
] as const;

export function boxColor(index: number): string {
  return BOX_COLORS[index % BOX_COLORS.length];
}

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

/**
 * Meaning in `langCode` (Vietnamese by default): the translation if the entry
 * has one, else the first definition written in that language. The imported
 * dictionary mostly carries Vietnamese as definitions, with no translations.
 */
export function translationFor(word: LookupResult | null, langCode = 'vi'): string | null {
  const translation = word?.translations?.find(t => t.langCode === langCode)?.translation;
  if (translation)
    return translation;
  const definition = word?.meanings
    ?.find(m => m.definitionLang === langCode && m.definition)
    ?.definition;
  return definition?.trim().replace(/\.$/, '') || null;
}
