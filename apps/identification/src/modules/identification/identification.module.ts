/**
 * Identification module — composition root.
 *
 * This file is the only place that:
 *   1. Wires concrete dependencies (S3Service, BedrockService + adapter, etc.)
 *   2. Registers routes on the Hono router
 *
 * To swap the AI model: change the adapter passed to BedrockService.
 * To swap the S3 bucket: change the value passed to S3Service.
 * Nothing else in the module needs to change.
 *
 *   new BedrockService(new ClaudeAdapter())   ← today
 *   new BedrockService(new TitanAdapter())    ← tomorrow, one line change
 */

import { Hono } from 'hono';
import { ClaudeAdapter } from '../../common/adapters/bedrock/claude.adapter';
import { BedrockService } from '../../common/services/bedrock.service';
import { S3Service } from '../../common/services/s3.service';
import { IdentificationController } from './identification.controller';
import { IdentificationService } from './identification.service';

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} environment variable is not set`);
  return value;
}

// ─── Wire dependencies ────────────────────────────────────────────────────────

const storage = new S3Service(requireEnv('S3_VERIFICATION_BUCKET'));

const bedrock = new BedrockService(
  new ClaudeAdapter(process.env.BEDROCK_MODEL_ID),
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
