import type { TxKeyPath } from '@/lib/i18n';
import { translate } from '@/lib/i18n';

/**
 * User copy for a failed request. Never the server's own text: it is English, internal, or both
 * ("Only administrators can add topics to system collections"). `byStatus` gives a screen its own wording,
 * e.g. 409 = "that name is taken".
 */
export function apiErrorMessage(error: unknown, fallback: TxKeyPath, byStatus: Partial<Record<number, TxKeyPath>> = {}): string {
  const status = (error as { response?: { status?: number } } | undefined)?.response?.status;
  if (!status)
    return translate('errors.network');
  const tx = byStatus[status]
    ?? (status === 403 ? 'errors.forbidden' : status === 404 ? 'errors.not_found' : fallback);
  return translate(tx);
}
