/**
 * Base class for all HTTP exceptions.
 *
 * Subclasses bind a fixed status code; the handler maps them to responses.
 * Any exception that is NOT an `HttpException` is treated as an unexpected
 * server error (500) by the exception handler.
 *
 * @param statusCode - HTTP status code (400, 404, 422, 500, …)
 * @param message    - Human-readable message, safe to surface to the client.
 * @param code       - Optional machine-readable code for client branching
 *                     (e.g. "UNSUPPORTED_MIME_TYPE", "SESSION_NOT_FOUND").
 */
export class HttpException extends Error {
  constructor(
    readonly statusCode: number,
    message: string,
    readonly code?: string,
  ) {
    super(message);
    this.name = this.constructor.name;
    // Maintain correct prototype chain when extending built-ins in TypeScript.
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
