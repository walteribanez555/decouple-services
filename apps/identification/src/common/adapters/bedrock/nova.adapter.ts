/**
 * Amazon Nova adapter — Converse-compatible payload format for AWS Bedrock.
 *
 * Amazon Nova models (Nova Lite, Nova Pro, Nova 2 Lite) use a different request
 * and response shape from the Anthropic Messages API. This adapter translates
 * the generic `BedrockInvokeInput` into the Nova-specific format and parses
 * the response back into plain text.
 *
 * Nova payload shape:
 * {
 *   messages: [{ role, content: [{ text } | { image }] }],
 *   system:   [{ text }],                          ← array, not a string
 *   inferenceConfig: { maxTokens, temperature },
 * }
 *
 * Supported models (on-demand — no inference profile required):
 *   amazon.nova-lite-v1:0   — ~98% cheaper than Claude Sonnet 4.5
 *   amazon.nova-pro-v1:0    — ~75% cheaper than Claude Sonnet 4.5
 *   us.amazon.nova-lite-v1:0 (cross-region inference profile variant)
 *   us.amazon.nova-2-lite-v1:0
 *
 * Pricing (per 1M tokens, us-east-1, May 2026):
 *   Nova Lite  $0.06 input / $0.24 output
 *   Nova Pro   $0.80 input / $3.20 output
 */

import type {
  BedrockImageInput,
  BedrockInvokeInput,
  IBedrockAdapter,
} from './bedrock-adapter.interface';

// ─── Nova-specific types ──────────────────────────────────────────────────────

type NovaContentBlock =
  | { text: string }
  | { image: { format: string; source: { bytes: string } } };

interface NovaPayload {
  messages: Array<{ role: string; content: NovaContentBlock[] }>;
  system:   Array<{ text: string }>;
  inferenceConfig: { maxTokens: number; temperature: number };
}

interface NovaResponse {
  output: {
    message: {
      content: Array<{ text: string }>;
    };
  };
}

// ─── Adapter ──────────────────────────────────────────────────────────────────

export class NovaAdapter implements IBedrockAdapter {
  readonly defaultModelId: string;

  /**
   * @param modelId Bedrock model ID.
   *   Defaults to Nova Lite (on-demand, no inference profile needed).
   *   Use 'amazon.nova-pro-v1:0' for higher accuracy on edge-case documents.
   */
  constructor(modelId = 'amazon.nova-lite-v1:0') {
    this.defaultModelId = modelId;
  }

  buildPayload(input: BedrockInvokeInput): unknown {
    const {
      systemPrompt,
      userPrompt,
      images,
      maxTokens = 512,
      temperature = 0,
    } = input;

    // Build Nova content blocks: images first, then the text prompt.
    const content: NovaContentBlock[] = [
      ...(images ?? []).map((img) => this.imageBlock(img)),
      { text: userPrompt },
    ];

    const payload: NovaPayload = {
      system: systemPrompt ? [{ text: systemPrompt }] : [],
      messages: [{ role: 'user', content }],
      inferenceConfig: { maxTokens, temperature },
    };

    return payload;
  }

  parseResponse(responseBody: unknown): string {
    const body = responseBody as NovaResponse;

    return body.output.message.content[0].text
      .trim()
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i,      '')
      .replace(/\s*```$/i,      '')
      .trim();
  }

  // ─── Private helpers ────────────────────────────────────────────────────────

  /**
   * Nova images are embedded as base64 bytes with a format string
   * (jpeg | png | webp | gif) — not a full MIME type string.
   */
  private imageBlock(img: BedrockImageInput): NovaContentBlock {
    const format = img.mimeType.split('/')[1] ?? 'jpeg'; // "image/jpeg" → "jpeg"
    return {
      image: {
        format,
        source: { bytes: img.base64 },
      },
    };
  }
}
