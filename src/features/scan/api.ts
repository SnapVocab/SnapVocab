import type { AxiosError } from 'axios';
import type { ApiResponse } from '../auth/api';
import type {
  PresignedUpload,
  ScanQuota,
  ScanRequestStatus,
  ScanSubmitResponse,
} from './types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { client } from '@/lib/api';
import { resolveContentType } from './content-type';
import { ScanClientError } from './scan-errors';

/** How often to poll while a scan is queued or running (BF-06: every 2-3s). */
export const SCAN_POLL_INTERVAL_MS = 2500;

export const scanQuotaKey = ['scan-quota'] as const;
export const scanStatusKey = (requestId: string) => ['scan-status', requestId] as const;

export function useScanQuota() {
  return useQuery<ScanQuota, AxiosError>({
    queryKey: scanQuotaKey,
    queryFn: async () => {
      const response = await client<ApiResponse<ScanQuota>>({ url: '/api/scan/quota', method: 'GET' });
      return response.data.data;
    },
  });
}

export type StartScanRequest = {
  uri: string;
  mimeType?: string | null;
};

/**
 * Upload the photo straight to storage, then queue the scan. Returns as soon as
 * the backend accepts the job (202); poll `useScanStatus` for the result.
 */
export function useStartScan() {
  const queryClient = useQueryClient();

  return useMutation<ScanSubmitResponse, Error, StartScanRequest>({
    mutationFn: async ({ uri, mimeType }) => {
      const contentType = resolveContentType(uri, mimeType);
      if (!contentType)
        throw new ScanClientError('UNSUPPORTED_FORMAT', `Unsupported image type: ${mimeType ?? uri}`);

      const upload = await client<ApiResponse<PresignedUpload>>({
        url: '/api/scan/upload-url',
        method: 'POST',
        data: { contentType },
      });
      const { uploadUrl, objectName } = upload.data.data;

      await putFile(uploadUrl, uri, contentType);

      const submitted = await client<ApiResponse<ScanSubmitResponse>>({
        url: '/api/scan',
        method: 'POST',
        data: { objectKey: objectName },
      });
      return submitted.data.data;
    },
    // Accepted or refused, the remaining count may have changed.
    onSettled: () => queryClient.invalidateQueries({ queryKey: scanQuotaKey }),
  });
}

/**
 * PUT the local file to the presigned URL. Uses fetch, not the axios client:
 * the URL targets storage directly and must not carry our Bearer token, and
 * the signature covers Content-Type, which has to match exactly.
 */
async function putFile(uploadUrl: string, uri: string, contentType: string) {
  let response: Response;
  try {
    const file = await (await fetch(uri)).blob();
    response = await fetch(uploadUrl, {
      method: 'PUT',
      headers: { 'Content-Type': contentType },
      body: file,
    });
  }
  catch (error) {
    throw new ScanClientError('UPLOAD_FAILED', String(error));
  }
  if (!response.ok)
    throw new ScanClientError('UPLOAD_FAILED', `Storage responded ${response.status}`);
}

/** Polls until the scan is DONE or FAILED, then stops. */
export function useScanStatus(requestId?: string) {
  return useQuery<ScanRequestStatus, AxiosError>({
    queryKey: scanStatusKey(requestId ?? ''),
    queryFn: async () => {
      const response = await client<ApiResponse<ScanRequestStatus>>({
        url: `/api/scan/${requestId}`,
        method: 'GET',
      });
      return response.data.data;
    },
    enabled: !!requestId,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status === 'DONE' || status === 'FAILED' ? false : SCAN_POLL_INTERVAL_MS;
    },
    // Keep polling while the user glances at another app; the job keeps running.
    refetchIntervalInBackground: true,
  });
}
