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
import { putFileToStorage, UploadFailedError } from '@/lib/storage/upload';
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

      await putScanImage(uploadUrl, uri, contentType);

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

/** Wraps the shared upload so a storage failure carries a scan error code. */
async function putScanImage(uploadUrl: string, uri: string, contentType: string) {
  try {
    await putFileToStorage(uploadUrl, uri, contentType);
  }
  catch (error) {
    if (error instanceof UploadFailedError)
      throw new ScanClientError('UPLOAD_FAILED', error.message);
    throw error;
  }
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
