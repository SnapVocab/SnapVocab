import type { AxiosError } from 'axios';
import { Platform } from 'react-native';
import { createMutation } from 'react-query-kit';
import Env from '@/../env';
import { client } from '@/lib/api';
import { normalizeUrl } from '@/lib/storage/url';

type PresignedUrlRequest = {
  fileName: string;
};

export type PresignedUrlResponse = {
  uploadUrl: string;
  objectName: string;
  contentType: string;
  expiredAt: string;
};

export enum UploadPurpose {
  AVATAR = 'AVATAR',
}

type UploadCompleteRequest = {
  objectName: string;
  purpose: UploadPurpose;
};

type UploadCompleteResponse = {
  status: string;
  url: string;
};

export const useGetUploadUrl = createMutation<
  PresignedUrlResponse,
  PresignedUrlRequest,
  AxiosError
>({
  mutationFn: async (variables) => {
    const response = await client<{ statusCode: number; data: PresignedUrlResponse }>({
      url: '/api/storage/upload-url',
      method: 'POST',
      data: variables,
    });
    return response.data.data;
  },
});

export const useCompleteUpload = createMutation<
  UploadCompleteResponse,
  UploadCompleteRequest,
  AxiosError
>({
  mutationFn: async (variables) => {
    const response = await client<{ statusCode: number; data: UploadCompleteResponse }>({
      url: '/api/storage/upload-complete',
      method: 'POST',
      data: variables,
    });
    return response.data.data;
  },
});

export async function uploadToPresignedUrl(
  uploadUrl: string,
  fileUri: string,
  contentType: string,
): Promise<void> {
  const isDevAndroid = Env.EXPO_PUBLIC_APP_ENV === 'development' && Platform.OS === 'android';
  const url = normalizeUrl(uploadUrl);

  const blob = await fetch(fileUri).then(r => r.blob());

  // Presigned URL signature is bound to host. When remapped to 10.0.2.2,
  // override Host header back so MinIO signature check passes.
  const headers: Record<string, string> = { 'Content-Type': contentType };
  if (isDevAndroid) {
    headers.Host = 'localhost:19000';
  }

  const response = await fetch(url, {
    method: 'PUT',
    body: blob,
    headers,
  });

  if (!response.ok) {
    throw new Error(`Upload failed: ${response.status}`);
  }
}
