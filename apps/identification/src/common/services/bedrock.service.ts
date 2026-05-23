/**
 * Model-agnostic AWS Bedrock service.
 *
 * This service knows nothing about Claude, Titan, or any other model.
 * All model-specific logic (payload format, response parsing) is delegated
 * to the injected `IBedrockAdapter`.
 *
 * Usage:
 *   const bedrock = new BedrockService(new ClaudeAdapter());
 *   const text    = await bedrock.invoke({ userPrompt: '...', images: [...] });
 *
 * Swapping models requires only changing the adapter at the composition root
 * (`*.module.ts`) — no changes to any service or business logic.
 */

import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';
import type { IBedrockAdapter, BedrockInvokeInput } from '../adapters/bedrock/bedrock-adapter.interface';
import { BaseService } from './base.service';

export class BedrockService extends BaseService {
  private readonly client: BedrockRuntimeClient;

  constructor(private readonly adapter: IBedrockAdapter) {
    super('BedrockService');
    this.client = new BedrockRuntimeClient({});
  }

  /**
   * Invoke the configured model with a generic input.
   *
   * @param input   - Model-agnostic prompt, optional images, and generation params.
   * @param modelId - Override the adapter's default model ID (e.g. to switch
   *                  between Sonnet and Haiku per call-site).
   * @returns The plain-text response from the model (markdown fences stripped).
   */
  async invoke(input: BedrockInvokeInput, modelId?: string): Promise<string> {
    const resolvedModelId = modelId ?? this.adapter.defaultModelId;

    this.logger.debug('Invoking Bedrock model', { modelId: resolvedModelId });

    const payload = this.adapter.buildPayload(input);

    const res = await this.client.send(
      new InvokeModelCommand({
        modelId: resolvedModelId,
        contentType: 'application/json',
        accept: 'application/json',
        body: JSON.stringify(payload),
      }),
    );

    const responseBody = JSON.parse(Buffer.from(res.body).toString());
    const text = this.adapter.parseResponse(responseBody);

    this.logger.debug('Bedrock response received', { modelId: resolvedModelId, length: text.length });
    return text;
  }
}
