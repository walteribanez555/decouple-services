/**
 * Claude adapter — Anthropic Messages API format for AWS Bedrock.
 *
 * Translates the generic `BedrockInvokeInput` into the claude-specific
 * `anthropic_version / messages` payload, and extracts the text from the
 * `content[0].text` response field.
 *
 * Supports: claude-haiku-4-5, claude-sonnet-4-5, claude-sonnet-4-6, claude-opus-4-x
 * and any future model that follows the same Messages API contract.
 */

import type {
  BedrockInvokeInput,
  IBedrockAdapter,
} from './bedrock-adapter.interface';

export class ClaudeAdapter implements IBedrockAdapter {
  readonly defaultModelId: string;

  constructor(modelId = 'us.anthropic.claude-sonnet-4-5-20250929-v1:0') {
    this.defaultModelId = modelId;
  }

  buildPayload(input: BedrockInvokeInput): unknown {
    const { systemPrompt, userPrompt, images, maxTokens = 512, temperature = 0 } = input;

    // Build the content array: images first, then the text prompt.
    const content: unknown[] = [
      ...(images ?? []).map((img) => ({
        type: 'image',
        source: { type: 'base64', media_type: img.mimeType, data: img.base64 },
      })),
      { type: 'text', text: userPrompt },
    ];

    return {
      anthropic_version: 'bedrock-2023-05-31',
      max_tokens: maxTokens,
      temperature,
      ...(systemPrompt ? { system: systemPrompt } : {}),
      messages: [{ role: 'user', content }],
    };
  }

  parseResponse(responseBody: unknown): string {
    const body = responseBody as {
      content: Array<{ type: string; text: string }>;
    };

    // Strip any accidental markdown fences so callers can safely JSON.parse.
    return body.content[0].text
      .trim()
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim();
  }
}
