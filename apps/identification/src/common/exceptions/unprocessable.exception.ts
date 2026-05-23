import { HttpException } from './http.exception';

/** 422 Unprocessable Entity — request was valid but business rules rejected it. */
export class UnprocessableException extends HttpException {
  constructor(message = 'Unprocessable Entity', code?: string) {
    super(422, message, code);
  }
}
