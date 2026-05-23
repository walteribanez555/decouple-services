/**
 * Model-agnostic Bedrock adapter contract.
 *
 * Each adapter is responsible for:
 *   1. Translating a generic `BedrockInvokeInput` into the model-specific
 *      request payload (different for Claude, Titan, Llama, etc.)
 *   2. Parsing the raw Bedrock response body back into plain text.
 *
 * The `BedrockService` depends only on this interface — it never imports any
 * model-specific code directly.
 *
 * To add a new model: implement `IBedrockAdapter` and inject it.
 *
 *   new BedrockService(new TitanAdapter())
 *   new BedrockService(new LlamaAdapter())
 */

// ─── Generic input ────────────────────────────────────────────────────────────

export interface BedrockImageInput {
  /** Raw bytes encoded as base64 (no data-URI prefix). */
  base64: string;
  /** MIME type, e.g. "image/jpeg". */
  mimeType: string;
}

export interface BedrockInvokeInput {
  /** High-level instruction for the model (system role / preamble). */
  systemPrompt?: string;
  /** The user-facing prompt text. */
  userPrompt: string;
  /** Optional images to attach alongside the user prompt. */
  images?: BedrockImageInput[];
  /** Maximum tokens the model may generate. */
  maxTokens?: number;
  /** Sampling temperature (0 = deterministic). */
  temperature?: number;
}

// ─── Token usage ──────────────────────────────────────────────────────────────

/** Raw token counts as reported by the model. */
export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
}

// ─── Invoke output ────────────────────────────────────────────────────────────

/** What `BedrockService.invoke()` returns to callers. */
export interface BedrockInvokeOutput {
  /** Plain-text model response (markdown fences already stripped). */
  text: string;
  /** Token counts for this call — use for cost attribution. */
  usage: TokenUsage;
  /** The resolved model ID that was actually used (adapter default or override). */
  modelId: string;
}

// ─── Adapter contract ─────────────────────────────────────────────────────────

export interface IBedrockAdapter {
  /** Model ID used when no explicit override is provided at call time. */
  readonly defaultModelId: string;

  /**
   * Convert a generic `BedrockInvokeInput` into the payload object that the
   * specific model's API expects (serialised to JSON by `BedrockService`).
   */
  buildPayload(input: BedrockInvokeInput): unknown;

  /**
   * Extract the plain-text response from the model's raw response body.
   * The body has already been JSON-parsed before this is called.
   */
  parseResponse(responseBody: unknown): string;

  /**
   * Extract token usage from the model's raw response body.
   * The body has already been JSON-parsed before this is called.
   */
  parseUsage(responseBody: unknown): TokenUsage;
}
