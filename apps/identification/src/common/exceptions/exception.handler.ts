/**
 * Centralised exception handler for Hono controllers.
 *
 * Usage inside any controller catch block:
 *
 *   } catch (err) {
 *     return handleException(err, c);
 *   }
 *
 * Behaviour:
 *   - `HttpException` subclasses → status from the exception, body from its message + code.
 *   - Anything else              → 500, generic message, original error logged.
 *
 * This is the ONLY place in the codebase that maps raw errors to HTTP responses,
 * keeping that concern out of every individual controller.
 */

import type { Context } from 'hono';
import type { IApiErrorResponse } from '../interfaces/api-response.interface';
import { HttpException } from './http.exception';

export function handleException(err: unknown, c: Context): Response {
  if (err instanceof HttpException) {
    const body: IApiErrorResponse = {
      error: err.message,
      ...(err.code ? { code: err.code } : {}),
    };
    // StatusCode is a number literal union in Hono; cast is safe here because
    // HttpException subclasses always use valid HTTP status codes.
    return c.json(body, err.statusCode as Parameters<typeof c.json>[1]);
  }

  // Unexpected error — log full details server-side, return a safe message.
  console.error('[UnhandledError]', err instanceof Error ? err.stack : err);

  const body: IApiErrorResponse = { error: 'An unexpected error occurred.' };
  return c.json(body, 500);
}
