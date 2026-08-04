import type { AxiosError } from 'axios';
import { createMutation } from 'react-query-kit';
import Env from '@/../env';
import { store as authStore } from '@/features/auth/use-auth-store';

export type BoundingBox = {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
};

export type Pronunciation = {
  ipa: string;
  region: string;
};

export type Meaning = {
  definition: string;
  definitionLang: string;
  example: string;
  pos: string;
  subPos: string;
  links: string[];
};

export type Translation = {
  langCode: string;
  translation: string;
};

export type Relation = {
  relatedWord: string;
  relationType: string;
};

export type LookupResult = {
  exists: boolean;
  word: string;
  langCode: string;
  langName: string;
  pronunciations: Pronunciation[];
  meanings: Meaning[];
  translations: Translation[];
  relations: Relation[];
};

export type ScanItem = {
  label: string;
  score: number;
  source: string;
  box: BoundingBox;
  word: LookupResult | null;
};

export type ScanResult = {
  /** Base64 image (no `data:` prefix) with every detection box already drawn on it. */
  annotatedImageBase64: string;
  annotatedImageMime: string;
  /** Coordinate space shared by the annotated image and every `box`. */
  imageWidth: number;
  imageHeight: number;
  items: ScanItem[];
};

type ScanImageRequest = {
  uri: string;
  fileName?: string;
  mimeType?: string;
};

// CPU-only inference on the backend legitimately takes 30-90s per image.
const SCAN_TIMEOUT_MS = 180000;

export const useScanImage = createMutation<ScanResult, ScanImageRequest, AxiosError>({
  mutationFn: async ({ uri, fileName, mimeType }) => {
    const formData = new FormData();
    // React Native's FormData takes { uri, name, type } for file parts.
    formData.append('file', {
      uri,
      name: fileName ?? 'photo.jpg',
      type: mimeType ?? 'image/jpeg',
    } as unknown as Blob);

    // Uses fetch rather than the shared axios client: axios fails this
    // multipart upload with a transport-level "Network Error" on Android
    // (request never reaches the server). Plain fetch is the path already
    // proven to work for uploads in this app (see features/storage/api.ts).
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), SCAN_TIMEOUT_MS);

    try {
      const token = authStore.getState().accessToken;
      const response = await fetch(`${Env.EXPO_PUBLIC_API_URL}/api/scan`, {
        method: 'POST',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          // Content-Type is deliberately omitted so React Native sets
          // multipart/form-data together with the boundary.
          Accept: 'application/json',
        },
        body: formData,
        signal: controller.signal,
      });

      const body = await response.json();
      if (!response.ok)
        throw new Error(body?.error ?? `Scan failed with status ${response.status}`);

      return body.data as ScanResult;
    }
    finally {
      clearTimeout(timeout);
    }
  },
});
