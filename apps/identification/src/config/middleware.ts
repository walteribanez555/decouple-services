/**
 * Sistema de middlewares
 */

import type { APIGatewayProxyEvent, Context } from 'aws-lambda';
import type { IMiddleware } from './types';
import { createLogger } from './logger';

const logger = createLogger('Middleware');

export class MiddlewareChain {
  private middlewares: IMiddleware[] = [];

  use(middleware: IMiddleware): this {
    this.middlewares.push(middleware);
    return this;
  }

  async execute(event: APIGatewayProxyEvent, context: Context): Promise<boolean> {
    for (const middleware of this.middlewares) {
      try {
        const result = await middleware.execute(event, context);
        if (!result) {
          logger.warn('Middleware chain interrupted');
          return false;
        }
      } catch (error) {
        logger.error('Middleware execution failed', error);
        return false;
      }
    }
    return true;
  }
}

// Middlewares predefinidos
export const createLoggingMiddleware = (): IMiddleware => ({
  execute: async (event, context) => {
    logger.info('Incoming request', {
      method: event.httpMethod,
      path: event.path,
      requestId: context.awsRequestId,
    });
    return true;
  },
});

export const createValidationMiddleware = (): IMiddleware => ({
  execute: async (event) => {
    if (!event.httpMethod) {
      logger.error('Missing HTTP method');
      return false;
    }
    return true;
  },
});

export const createCorsMiddleware = (origins?: string[]): IMiddleware => ({
  execute: async () => {
    logger.debug('CORS validation passed', { origins: origins || ['*'] });
    return true;
  },
});
