/** Keep large dashboard values readable; accessibility labels retain the full value. */
export function formatCount(value: number, locale?: string) {
  return new Intl.NumberFormat(locale, {
    notation: Math.abs(value) >= 10000 ? 'compact' : 'standard',
    maximumFractionDigits: 1,
  }).format(value);
}
