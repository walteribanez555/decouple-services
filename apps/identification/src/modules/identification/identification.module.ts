/**
 * Identification module — composition root.
 *
 * This file is the only place that:
 *   1. Wires concrete dependencies (S3Service, BedrockService + adapter, etc.)
 *   2. Registers routes on the Hono router
 *
 * Adapter selection is automatic — driven entirely by BEDROCK_MODEL_ID:
 *   amazon.nova-*          → NovaAdapter   (on-demand, no inference profile)
 *   us.amazon.nova-*       → NovaAdapter   (cross-region inference profile)
 *   anthropic.claude-*     → ClaudeAdapter (direct model ID)
 *   us.anthropic.claude-*  → ClaudeAdapter (cross-region inference profile)
 *
 * To switch models: update BEDROCK_MODEL_ID in infra/lib/base-stack.ts.
 * No code change required here.
 */

import { Hono } from 'hono';
import type { IBedrockAdapter } from '../../common/adapters/bedrock/bedrock-adapter.interface';
import { ClaudeAdapter } from '../../common/adapters/bedrock/claude.adapter';
import { NovaAdapter }   from '../../common/adapters/bedrock/nova.adapter';
import { BedrockService } from '../../common/services/bedrock.service';
import { S3Service } from '../../common/services/s3.service';
import { IdentificationController } from './identification.controller';
import { IdentificationService } from './identification.service';

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} environment variable is not set`);
  return value;
}

// ─── Adapter factory ──────────────────────────────────────────────────────────

function resolveAdapter(modelId?: string): IBedrockAdapter {
  if (modelId?.startsWith('amazon.nova') || modelId?.startsWith('us.amazon.nova')) {
    return new NovaAdapter(modelId);
  }
  // Default: Claude (Haiku 4.5) — handles all anthropic.* and us.anthropic.* IDs.
  return new ClaudeAdapter(modelId);
}

// ─── Wire dependencies ────────────────────────────────────────────────────────

const storage = new S3Service(requireEnv('S3_VERIFICATION_BUCKET'));

const bedrock = new BedrockService(
  resolveAdapter(process.env.BEDROCK_MODEL_ID),
);

const service = new IdentificationService(storage, bedrock, {
  confidenceThreshold: Number(process.env.CONFIDENCE_THRESHOLD ?? '0.85'),
  modelId: process.env.BEDROCK_MODEL_ID,
});

const controller = new IdentificationController(service);

// ─── Routes ───────────────────────────────────────────────────────────────────

const router = new Hono();

router.post('/presign', (c) => controller.presign(c));
router.post('/verify',  (c) => controller.verify(c));

// ─── Export ───────────────────────────────────────────────────────────────────

/**
 * The Hono router for this module — mount it in app.ts:
 *   v1.route('/identification', identificationRoute)
 */
export const identificationRoute = router;
