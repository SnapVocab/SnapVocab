const SUPPORTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;
export type SupportedType = (typeof SUPPORTED_TYPES)[number];

const TYPE_BY_EXTENSION: Record<string, SupportedType> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
};

/**
 * The upload URL is signed for one Content-Type, so it must be known up front.
 * Pickers may omit the MIME type or report `image/jpg`; fall back to the file
 * extension. Returns null for anything the backend rejects (e.g. HEIC).
 */
export function resolveContentType(uri: string, mimeType?: string | null): SupportedType | null {
  const normalized = mimeType?.toLowerCase().replace('image/jpg', 'image/jpeg');
  if (normalized && (SUPPORTED_TYPES as readonly string[]).includes(normalized))
    return normalized as SupportedType;
  if (normalized)
    return null;
  const extension = uri.split('?')[0].split('.').pop()?.toLowerCase() ?? '';
  return TYPE_BY_EXTENSION[extension] ?? null;
}
