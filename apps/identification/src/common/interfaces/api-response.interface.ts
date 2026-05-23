/**
 * Standard HTTP response interfaces.
 *
 * All controllers use these shapes so clients always receive a predictable
 * envelope, regardless of which module produced the response.
 *
 *   Success  →  { data: T }
 *   Error    →  { error: string, code?: string }
 *
 * Usage in a controller:
 *   return c.json<IApiResponse<MyDto>>({ data: result }, 200);
 *   return c.json<IApiErrorResponse>({ error: 'Not found', code: 'NOT_FOUND' }, 404);
 *
 * Or via the exception handler:
 *   } catch (err) {
 *     return handleException(err, c);
 *   }
 */

// ── Success ───────────────────────────────────────────────────────────────────

/**
 * Generic success envelope.
 *
 * The `data` field holds the actual payload; no other top-level keys are added
 * so the shape stays flat and easy to destructure on the client.
 */
export interface IApiResponse<T = unknown> {
  data: T;
}

// ── Error ─────────────────────────────────────────────────────────────────────

/**
 * Standard error envelope.
 *
 * `error`  — human-readable message (safe to surface to the end user).
 * `code`   — optional machine-readable code for client-side branching
 *            (e.g. "UNSUPPORTED_MIME_TYPE", "SESSION_EXPIRED").
 */
export interface IApiErrorResponse {
  error: string;
  code?: string;
}
