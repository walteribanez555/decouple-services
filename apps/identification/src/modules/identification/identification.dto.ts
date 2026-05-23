/**
 * Data Transfer Objects for the identification module.
 *
 * DTOs define the exact shape of data crossing the HTTP boundary:
 *   - Request DTOs  — what the controller accepts from the client
 *   - Response DTOs — what the controller returns to the client
 *
 * Internal domain types (DocumentAnalysis, RejectedReason, …) live in
 * `identification.types.ts` and never leave the service layer.
 */

import type { RejectedReason } from './identification.types';

// ── Request DTOs ──────────────────────────────────────────────────────────────

export interface PresignRequestDto {
  /** MIME type of the image the client intends to upload (e.g. "image/jpeg"). */
  mimeType: string;
}

export interface VerifyRequestDto {
  /** Session token returned by POST /presign. */
  sessionId: string;
}

// ── Response DTOs ─────────────────────────────────────────────────────────────

export interface PresignResponseDto {
  /** Opaque token — must be passed back to POST /verify. */
  sessionId: string;
  /** Presigned S3 PUT URL valid for `expiresIn` seconds. */
  uploadUrl: string;
  /** Seconds until the presigned URL expires. */
  expiresIn: number;
}

export interface VerificationDetailsDto {
  isAdult: boolean;
  appearsAuthentic: boolean;
  imageQuality: 'good' | 'acceptable' | 'poor';
  /** Model confidence 0.0–1.0. */
  confidence: number;
  /** Date of birth extracted from the document (YYYY-MM-DD). */
  dob: string;
}

export interface InvocationCostDto {
  inputTokens: number;
  outputTokens: number;
  /** USD cost for this single Bedrock call. */
  costUsd: number;
}

export interface VerificationCostDto {
  /** Cost of gate #1 — pre-check (always present). */
  preCheck: InvocationCostDto;
  /**
   * Cost of gate #2 — full analysis.
   * `null` when the pre-check rejected the image and the full analysis was skipped.
   */
  analysis: InvocationCostDto | null;
  /** Total USD cost across all Bedrock calls made during this verification. */
  totalCostUsd: number;
}

export interface VerificationResponseDto {
  sessionId: string;
  /** True only when ALL checks pass. */
  approved: boolean;
  details: VerificationDetailsDto;
  /** Empty when approved; one or more rejection codes when not. */
  rejectedReasons: RejectedReason[];
  /** Token usage and USD cost for every Bedrock call made during this verification. */
  cost: VerificationCostDto;
}

// ── Error ─────────────────────────────────────────────────────────────────────
// Error responses use IApiErrorResponse from common/interfaces — not defined here.
