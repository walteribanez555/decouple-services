/**
 * Token-based cost attribution for AWS Bedrock model calls.
 *
 * Pricing is expressed in USD per 1,000,000 tokens (per-million rate).
 * Model IDs are matched by prefix (longest match wins), so cross-region
 * inference profile variants (e.g. "us.anthropic.claude-haiku-4-5-…")
 * and on-demand IDs (e.g. "anthropic.claude-haiku-4-5-…") both resolve
 * to the same rate.
 *
 * ─── Rates (AWS Bedrock, us-east-1, May 2026) ────────────────────────────────
 *
 *   Model                Input / 1M     Output / 1M    Notes
 *   ──────────────────── ─────────────  ─────────────  ────────────────────────
 *   Claude Haiku 4.5     $0.80          $4.00          Default model (cheapest)
 *   Claude Sonnet 4.x    $3.00          $15.00
 *   Claude Opus 4.x      $15.00         $75.00
 *   Nova Lite            $0.06          $0.24          Cheapest overall
 *   Nova Pro             $0.80          $3.20
 *
 * ─── Implementation in verify() — cost inside the try block ──────────────────
 *
 * `computeCost` is called exactly once per successful Bedrock invocation.
 * There are two call sites inside the `try` block of `verify()`:
 *
 *   try {
 *     // ── Gate #1: pre-check (maxTokens: 30) ───────────────────────────
 *     const output1  = await bedrock.invoke({ ..., maxTokens: 30 });
 *     const preCheck = computeCost(output1.usage, output1.modelId);
 *     //    └─ InvocationCost { inputTokens, outputTokens, costUsd }
 *
 *     if (!isIdentityDocument) {
 *       // Early exit — gate #2 never runs.
 *       return {
 *         cost: {
 *           preCheck,          // computed above
 *           analysis: null,    // gate #2 was skipped
 *           totalCostUsd: preCheck.costUsd,
 *         },
 *       };
 *     }
 *
 *     // ── Gate #2: full analysis (maxTokens: 120) ───────────────────────
 *     const output2   = await bedrock.invoke({ ..., maxTokens: 120 });
 *     const analysis  = computeCost(output2.usage, output2.modelId);
 *     //    └─ InvocationCost { inputTokens, outputTokens, costUsd }
 *
 *     return {
 *       cost: {
 *         preCheck,
 *         analysis,
 *         totalCostUsd: preCheck.costUsd + analysis.costUsd,
 *       },
 *     };
 *
 *   } finally {
 *     // S3 cleanup — always runs, cost is already captured above.
 *     storage.deleteObject(key);
 *   }
 *
 * Key invariants:
 *   • `cost` is always present on the returned `VerificationResult` — both
 *     the early-exit path and the full-analysis path set it before returning.
 *   • `cost.analysis` is `null` when gate #1 rejects (pre-check cost only).
 *   • `cost.totalCostUsd` is the arithmetic sum of all calls, rounded to 8
 *     decimal places to avoid floating-point drift across currencies.
 *   • S3 cleanup in the `finally` block never affects cost — costs are fully
 *     resolved before `finally` executes.
 *   • `computeCost` itself is a pure function with no side effects; it is safe
 *     to call multiple times with the same arguments.
 */

import type { TokenUsage } from '../../common/adapters/bedrock/bedrock-adapter.interface';
import type { InvocationCost } from './identification.types';

// ─── Pricing table ────────────────────────────────────────────────────────────

interface PricingEntry {
  /** Model ID prefix used for matching (longer prefixes take precedence). */
  prefix: string;
  /** USD per 1,000,000 input tokens. */
  inputPerMToken: number;
  /** USD per 1,000,000 output tokens. */
  outputPerMToken: number;
}

// Sorted longest-prefix-first so the first match is always the most specific.
const PRICING_TABLE: PricingEntry[] = [
  // ── Claude Haiku 4.5 ─────────────────────────────────────────────────────
  { prefix: 'us.anthropic.claude-haiku-4-5',  inputPerMToken: 0.80,  outputPerMToken: 4.00  },
  { prefix: 'anthropic.claude-haiku-4-5',     inputPerMToken: 0.80,  outputPerMToken: 4.00  },
  // ── Claude Sonnet 4.x ────────────────────────────────────────────────────
  { prefix: 'us.anthropic.claude-sonnet-4',   inputPerMToken: 3.00,  outputPerMToken: 15.00 },
  { prefix: 'anthropic.claude-sonnet-4',      inputPerMToken: 3.00,  outputPerMToken: 15.00 },
  // ── Claude Opus 4.x ──────────────────────────────────────────────────────
  { prefix: 'us.anthropic.claude-opus-4',     inputPerMToken: 15.00, outputPerMToken: 75.00 },
  { prefix: 'anthropic.claude-opus-4',        inputPerMToken: 15.00, outputPerMToken: 75.00 },
  // ── Amazon Nova Lite ─────────────────────────────────────────────────────
  { prefix: 'us.amazon.nova-lite',            inputPerMToken: 0.06,  outputPerMToken: 0.24  },
  { prefix: 'amazon.nova-lite',               inputPerMToken: 0.06,  outputPerMToken: 0.24  },
  // ── Amazon Nova Pro ──────────────────────────────────────────────────────
  { prefix: 'us.amazon.nova-pro',             inputPerMToken: 0.80,  outputPerMToken: 3.20  },
  { prefix: 'amazon.nova-pro',                inputPerMToken: 0.80,  outputPerMToken: 3.20  },
];

// ─── Cost computation ─────────────────────────────────────────────────────────

/**
 * Calculate the USD cost for a single Bedrock invocation.
 *
 * Called twice per `verify()` call when both gates run (once for the
 * pre-check, once for the full analysis). Called once when gate #1 rejects
 * early. The returned `InvocationCost` is composed into `VerificationCost`
 * by the caller — this function never accumulates state.
 *
 * @param usage   - Raw token counts from `BedrockInvokeOutput.usage`.
 * @param modelId - The resolved model ID from `BedrockInvokeOutput.modelId`.
 * @returns       - Token counts plus a USD cost rounded to 8 decimal places.
 *                  If the model ID is unknown, `costUsd` is 0 — never throws.
 */
export function computeCost(usage: TokenUsage, modelId: string): InvocationCost {
  const entry = PRICING_TABLE.find(({ prefix }) => modelId.startsWith(prefix));

  if (!entry) {
    return { inputTokens: usage.inputTokens, outputTokens: usage.outputTokens, costUsd: 0 };
  }

  const raw =
    (usage.inputTokens  / 1_000_000) * entry.inputPerMToken +
    (usage.outputTokens / 1_000_000) * entry.outputPerMToken;

  return {
    inputTokens:  usage.inputTokens,
    outputTokens: usage.outputTokens,
    costUsd:      parseFloat(raw.toFixed(8)),
  };
}
