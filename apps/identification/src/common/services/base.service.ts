/**
 * Abstract base class for all services.
 *
 * Provides a pre-configured logger bound to the concrete class name.
 * All services extend this and receive their dependencies through the
 * constructor (constructor injection — no IoC container needed).
 *
 * Example:
 *   class IdentificationService extends BaseService {
 *     constructor(private readonly s3: S3Service, private readonly bedrock: BedrockService) {
 *       super('IdentificationService');
 *     }
 *   }
 */

import { createLogger } from '../../config/logger';
import type { ILogger } from '../../config/types';

export abstract class BaseService {
  protected readonly logger: ILogger;

  constructor(context: string) {
    this.logger = createLogger(context);
  }
}
