import { HttpException } from './http.exception';

/** 404 Not Found — resource does not exist (e.g. session key missing from S3). */
export class NotFoundException extends HttpException {
  constructor(message = 'Not Found', code?: string) {
    super(404, message, code);
  }
}
