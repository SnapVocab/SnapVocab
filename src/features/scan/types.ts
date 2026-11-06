/** Mirrors the backend scan API (snap-vocab-backend: ScanController, BF-06). */

export type ScanStatus = 'PENDING' | 'PROCESSING' | 'DONE' | 'FAILED';

export type Reliability = 'HIGH' | 'MEDIUM' | 'LOW';

/** Codes sent as `RestResponse.error` on request failure, or as `errorCode` when a scan FAILED. */
export type ScanErrorCode
  = | 'INVALID_IMAGE'
    | 'QUOTA_EXCEEDED'
    | 'AI_QUEUE_FULL'
    | 'AI_UNAVAILABLE'
    | 'AI_TIMEOUT'
    | 'AI_ERROR'
    | 'INTERRUPTED';

export type BoundingBox = {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
};

export type Pronunciation = {
  ipa: string;
  region: string | null;
};

export type Meaning = {
  definition: string;
  definitionLang: string;
  example: string | null;
  pos: string | null;
  subPos: string | null;
  links: string[] | null;
};

export type Translation = {
  langCode: string;
  translation: string;
};

export type LookupResult = {
  wordId: number;
  inMyVocabulary: boolean;
  exists: boolean;
  word: string;
  langCode: string;
  langName: string;
  pronunciations: Pronunciation[] | null;
  meanings: Meaning[] | null;
  translations: Translation[] | null;
};

export type ScanItem = {
  label: string;
  /** Fixed per-source constant used for ranking; show `reliability` instead. */
  score: number;
  source: string;
  reliability: Reliability;
  /** Pixel coordinates in the imageWidth x imageHeight space (EXIF-upright). */
  box: BoundingBox;
  /** Null when the label has no dictionary entry. */
  word: LookupResult | null;
};

export type ScanResult = {
  imageWidth: number;
  imageHeight: number;
  items: ScanItem[];
};

export type ScanRequestStatus = {
  requestId: string;
  status: ScanStatus;
  errorCode: ScanErrorCode | null;
  createdAt: string;
  finishedAt: string | null;
  result: ScanResult | null;
};

export type ScanQuota = {
  limit: number;
  used: number;
  remaining: number;
  /** Next local midnight (ISO instant), when `used` resets. */
  resetAt: string;
};

export type PresignedUpload = {
  uploadUrl: string;
  objectName: string;
  contentType: string;
  expiredAt: number;
};

export type ScanSubmitResponse = {
  requestId: string;
  status: ScanStatus;
};
