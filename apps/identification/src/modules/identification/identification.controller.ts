/**
 * Identification controller — HTTP boundary for the identification module.
 *
 * Responsibilities:
 *   - Validate request shape
 *   - Throw typed HttpExceptions for invalid input
 *   - Delegate to IdentificationService
 *   - Wrap successful results in IApiResponse<T>
 *   - Forward all errors to handleException()
 *
 * No business logic lives here.
 * Route registration lives in identification.module.ts.
 */

import type { Context } from 'hono';
import {
  BadRequestException,
  UnsupportedMediaException,
  handleException,
} from '../../common/exceptions';
import type { IApiResponse } from '../../common/interfaces';
import type { PresignResponseDto, VerificationResponseDto } from './identification.dto';
import type { IdentificationService } from './identification.service';
import { ALLOWED_MIME_TYPES } from './identification.types';

export class IdentificationController {
  constructor(private readonly service: IdentificationService) {}

  // ── POST /presign ─────────────────────────────────────────────────────────
  async presign(c: Context): Promise<Response> {
    try {
      const body = await c.req.json<{ mimeType?: string }>();

      if (!body.mimeType) {
        throw new BadRequestException('"mimeType" is required.', 'MISSING_MIME_TYPE');
      }

      if (!ALLOWED_MIME_TYPES.includes(body.mimeType as (typeof ALLOWED_MIME_TYPES)[number])) {
        throw new UnsupportedMediaException(
          `Unsupported mimeType "${body.mimeType}". Accepted: ${ALLOWED_MIME_TYPES.join(', ')}`,
          'UNSUPPORTED_MIME_TYPE',
        );
      }

      const result = await this.service.presign(body.mimeType as (typeof ALLOWED_MIME_TYPES)[number]);
      return c.json<IApiResponse<PresignResponseDto>>({ data: result }, 200);
    } catch (err) {
      return handleException(err, c);
    }
  }

  // ── POST /verify ──────────────────────────────────────────────────────────
  async verify(c: Context): Promise<Response> {
    try {
      const body = await c.req.json<{ sessionId?: string }>();

      if (!body.sessionId || typeof body.sessionId !== 'string' || !body.sessionId.trim()) {
        throw new BadRequestException('"sessionId" is required.', 'MISSING_SESSION_ID');
      }

      const result = await this.service.verify(body.sessionId.trim());

      // 200 = approved, 422 = rejected — both are valid, structured outcomes.
      const status = result.approved ? 200 : 422;
      return c.json<IApiResponse<VerificationResponseDto>>({ data: result }, status);
    } catch (err) {
      return handleException(err, c);
    }
  }
}
