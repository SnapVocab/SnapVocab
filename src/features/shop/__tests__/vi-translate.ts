import vi from '@/translations/vi.json';

/** `translate` over the real Vietnamese copy, so Shop tests assert what the learner reads. */
export function translate(key: string, options: Record<string, unknown> = {}): string {
  const copy = key.split('.').reduce<unknown>((node, part) => (node as Record<string, unknown> | undefined)?.[part], vi);
  if (typeof copy !== 'string')
    return key;
  return copy.replace(/\{\{(\w+)\}\}/g, (_, name: string) => String(options[name] ?? ''));
}
