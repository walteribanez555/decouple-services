/**
 * Router modular para handlers
 */

import type { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { createLogger } from './logger';

const logger = createLogger('Router');

export type HandlerFunc = (
  event: APIGatewayProxyEvent,
  context: Context
) => Promise<APIGatewayProxyResult>;

interface Route {
  method: string;
  path: string;
  handler: HandlerFunc;
}

export class Router {
  private routes: Route[] = [];

  register(method: string, path: string, handler: HandlerFunc): this {
    this.routes.push({ method: method.toUpperCase(), path, handler });
    logger.debug(`Route registered: ${method.toUpperCase()} ${path}`);
    return this;
  }

  get(path: string, handler: HandlerFunc): this {
    return this.register('GET', path, handler);
  }

  post(path: string, handler: HandlerFunc): this {
    return this.register('POST', path, handler);
  }

  put(path: string, handler: HandlerFunc): this {
    return this.register('PUT', path, handler);
  }

  delete(path: string, handler: HandlerFunc): this {
    return this.register('DELETE', path, handler);
  }

  async handle(event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> {
    const method = event.httpMethod?.toUpperCase();
    const path = event.path || '/';

    const route = this.routes.find(r => r.method === method && r.path === path);

    if (!route) {
      logger.warn(`No route found for ${method} ${path}`);
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'Not Found' }),
      };
    }

    try {
      return await route.handler(event, context);
    } catch (error) {
      logger.error(`Error handling ${method} ${path}`, error);
      return {
        statusCode: 500,
        body: JSON.stringify({
          error: 'Internal Server Error',
          message: error instanceof Error ? error.message : 'Unknown error',
        }),
      };
    }
  }
}

export const createRouter = (): Router => new Router();
