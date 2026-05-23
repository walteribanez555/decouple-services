/**
 * Types for the age-verification module.
 *
 * Flow:
 *   1. Client calls POST /presign → receives { sessionId, uploadUrl }
 *   2. Client PUTs the image file directly to `uploadUrl` (S3 presigned URL)
 *   3. Client calls POST /verify   { sessionId } → VerificationResult
 */

// ── Upload constraints ────────────────────────────────────────────────────────

export const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;
export type AllowedMimeType = (typeof ALLOWED_MIME_TYPES)[number];

/** 5 MB upload limit — enforced in the route before presigning. */
export const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;

/** Presigned URL validity window (seconds). */
export const PRESIGN_EXPIRES_IN = 300; // 5 minutes

// ── Presign response ──────────────────────────────────────────────────────────

export interface PresignResponse {
  /** Opaque token — pass back in POST /verify. */
  sessionId: string;
  /**
   * Presigned S3 PUT URL.
   * The client must set `Content-Type` to the same MIME type that was used
   * when requesting the URL, otherwise S3 will reject the upload.
   */
  uploadUrl: string;
  /** Seconds until the presigned URL expires. */
  expiresIn: number;
}

// ── Bedrock response ──────────────────────────────────────────────────────────

export interface DocumentAnalysis {
  /** False when the image is not a government-issued identity document at all. */
  is_identity_document: boolean;
  /** True when calculated age ≥ 18 today. */
  is_adult: boolean;
  /** True when no obvious signs of tampering. */
  appears_authentic: boolean;
  image_quality: 'good' | 'acceptable' | 'poor';
  /** Model confidence 0.0 – 1.0. */
  confidence: number;
  /** YYYY-MM-DD */
  dob: string;
}

// ── Verification response ─────────────────────────────────────────────────────

export interface VerificationDetails {
  isAdult: boolean;
  appearsAuthentic: boolean;
  imageQuality: 'good' | 'acceptable' | 'poor';
  confidence: number;
  dob: string;
}

export type RejectedReason =
  | 'not_identity_document'
  | 'underage'
  | 'document_not_authentic'
  | 'low_confidence'
  | 'poor_image_quality';

export interface VerificationResult {
  sessionId: string;
  approved: boolean;
  details: VerificationDetails;
  /** Empty when approved; one or more codes when rejected. */
  rejectedReasons: RejectedReason[];
}
