/**
 * Local Bedrock test — age verification without S3, multi-model support.
 *
 * Calls Bedrock directly (bypasses BedrockService) to capture raw token usage.
 * No S3 bucket needed.
 *
 * Usage:
 *   npx ts-node --project tsconfig.test.json scripts/test-local.ts <image> [model1] [model2] ...
 *
 * Examples:
 *   npx ts-node --project tsconfig.test.json scripts/test-local.ts ~/Downloads/id.jpg
 *
 *   npx ts-node --project tsconfig.test.json scripts/test-local.ts ~/Downloads/id.jpg \
 *     amazon.nova-lite-v1:0 \
 *     amazon.nova-pro-v1:0 \
 *     us.amazon.nova-2-lite-v1:0
 */

import * as fs   from 'fs';
import * as path from 'path';
import * as os   from 'os';
import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';

import { NovaAdapter }   from '../src/common/adapters/bedrock/nova.adapter';
import { ClaudeAdapter } from '../src/common/adapters/bedrock/claude.adapter';
import { SYSTEM_PROMPT, USER_PROMPT } from '../src/modules/identification/identification.service';
import type { DocumentAnalysis, RejectedReason } from '../src/modules/identification/identification.types';

// ─── ANSI ─────────────────────────────────────────────────────────────────────

const R  = '\x1b[0m';
const b  = (s: string) => `\x1b[1m${s}${R}`;
const d  = (s: string) => `\x1b[2m${s}${R}`;
const ok = (s: string) => `\x1b[32m\x1b[1m${s}${R}`;
const er = (s: string) => `\x1b[31m\x1b[1m${s}${R}`;
const yw = (s: string) => `\x1b[33m${s}${R}`;
const cy = (s: string) => `\x1b[36m${s}${R}`;
const mg = (s: string) => `\x1b[35m\x1b[1m${s}${R}`;

// ─── Pricing table (per 1M tokens, us-east-1) ─────────────────────────────────

const PRICING: Record<string, { input: number; output: number }> = {
  'amazon.nova-lite-v1:0':                          { input: 0.06,  output: 0.24  },
  'us.amazon.nova-lite-v1:0':                       { input: 0.06,  output: 0.24  },
  'amazon.nova-pro-v1:0':                           { input: 0.80,  output: 3.20  },
  'us.amazon.nova-pro-v1:0':                        { input: 0.80,  output: 3.20  },
  'us.amazon.nova-2-lite-v1:0':                     { input: 0.30,  output: 2.50  },
  'us.anthropic.claude-haiku-4-5-20251001-v1:0':    { input: 0.80,  output: 4.00  },
  'us.anthropic.claude-sonnet-4-5-20251001-v1:0':   { input: 3.00,  output: 15.00 },
  'us.anthropic.claude-sonnet-4-6-20251001-v1:0':   { input: 3.00,  output: 15.00 },
};

// ─── CLI args ─────────────────────────────────────────────────────────────────

const [, , rawPath, ...extraModels] = process.argv;

if (!rawPath) {
  console.error(
    [
      '',
      '  Usage: npx ts-node --project tsconfig.test.json scripts/test-local.ts <image> [model...]',
      '',
      '  Examples:',
      '    scripts/test-local.ts ~/Downloads/id.jpg',
      '    scripts/test-local.ts ~/Downloads/id.jpg amazon.nova-lite-v1:0 amazon.nova-pro-v1:0',
      '',
    ].join('\n'),
  );
  process.exit(1);
}

// ─── Resolve image ────────────────────────────────────────────────────────────

const imagePath = rawPath.startsWith('~')
  ? path.join(os.homedir(), rawPath.slice(1))
  : path.resolve(rawPath);

if (!fs.existsSync(imagePath)) {
  console.error(er(`File not found: ${imagePath}`));
  process.exit(1);
}

const ext      = path.extname(imagePath).toLowerCase().replace('.', '');
const mimeMap: Record<string, string> = {
  jpg: 'image/jpeg', jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
};
const mimeType = mimeMap[ext];
if (!mimeType) {
  console.error(er(`Unsupported extension: .${ext}  (supported: jpg, jpeg, png, webp)`));
  process.exit(1);
}

const imageBytes = fs.readFileSync(imagePath);
const base64     = imageBytes.toString('base64');
const sizeKb     = (imageBytes.byteLength / 1024).toFixed(1);

// ─── Models ───────────────────────────────────────────────────────────────────

const DEFAULT_MODEL = process.env.BEDROCK_MODEL_ID ?? 'amazon.nova-lite-v1:0';
const models        = extraModels.length > 0 ? extraModels : [DEFAULT_MODEL];

// ─── Approval logic (mirrors IdentificationService) ──────────────────────────

const CONFIDENCE_THRESHOLD = Number(process.env.CONFIDENCE_THRESHOLD ?? '0.85');

function isApproved(a: DocumentAnalysis): boolean {
  return (
    a.is_identity_document === true &&
    a.is_adult             === true &&
    a.appears_authentic    === true &&
    a.confidence           >= CONFIDENCE_THRESHOLD
  );
}

function buildRejectedReasons(a: DocumentAnalysis): RejectedReason[] {
  const reasons: RejectedReason[] = [];
  if (!a.is_identity_document) { reasons.push('not_identity_document'); return reasons; }
  if (!a.is_adult)              reasons.push('underage');
  if (!a.appears_authentic)     reasons.push('document_not_authentic');
  if (a.confidence < CONFIDENCE_THRESHOLD) reasons.push('low_confidence');
  if (a.image_quality === 'poor') reasons.push('poor_image_quality');
  return reasons;
}

// ─── Usage extraction (response shape differs between Nova and Claude) ────────

interface TokenUsage { inputTokens: number; outputTokens: number }

function extractUsage(body: unknown, modelId: string): TokenUsage {
  const b = body as Record<string, unknown>;
  const usage = b['usage'] as Record<string, number> | undefined;

  if (modelId.startsWith('amazon.nova') || modelId.startsWith('us.amazon.nova')) {
    return {
      inputTokens:  usage?.inputTokens  ?? 0,
      outputTokens: usage?.outputTokens ?? 0,
    };
  }
  // Claude (Anthropic Messages API on Bedrock)
  return {
    inputTokens:  usage?.input_tokens  ?? 0,
    outputTokens: usage?.output_tokens ?? 0,
  };
}

function calcCost(usage: TokenUsage, modelId: string): string {
  const price = PRICING[modelId];
  if (!price) return d('(price unknown)');
  const cost = (usage.inputTokens / 1e6) * price.input
             + (usage.outputTokens / 1e6) * price.output;
  return `$${cost.toFixed(7)}`;
}

// ─── Run ──────────────────────────────────────────────────────────────────────

const client = new BedrockRuntimeClient({});
const LINE   = '─'.repeat(60);

(async () => {
  console.log(`\n${cy(b('─── Local Bedrock verification ─────────────────────────'))}`);
  console.log(d(`Image  : ${imagePath}`));
  console.log(d(`MIME   : ${mimeType}   Size: ${sizeKb} KB`));
  console.log(d(`Threshold: ${CONFIDENCE_THRESHOLD}`));
  console.log(d(`Models : ${models.join(', ')}\n`));

  for (const modelId of models) {
    console.log(cy(LINE));
    console.log(`${b('Model:')} ${modelId}`);
    console.log();

    const isNova  = modelId.startsWith('amazon.nova') || modelId.startsWith('us.amazon.nova');
    const adapter = isNova ? new NovaAdapter(modelId) : new ClaudeAdapter(modelId);

    const payload = adapter.buildPayload({
      systemPrompt: SYSTEM_PROMPT,
      userPrompt:   USER_PROMPT,
      images:       [{ base64, mimeType }],
      maxTokens:    120,
      temperature:  0,
    });

    const start = Date.now();

    try {
      const res = await client.send(
        new InvokeModelCommand({
          modelId,
          contentType: 'application/json',
          accept:      'application/json',
          body:        JSON.stringify(payload),
        }),
      );

      const elapsed      = Date.now() - start;
      const responseBody = JSON.parse(Buffer.from(res.body).toString());
      const text         = adapter.parseResponse(responseBody);
      const usage        = extractUsage(responseBody, modelId);
      const totalTokens  = usage.inputTokens + usage.outputTokens;
      const cost         = calcCost(usage, modelId);

      // ── Token consumption (prominent) ──────────────────────────────────────
      console.log(mg('▶ Token usage'));
      console.log(`  ${'Input'.padEnd(12)} ${b(String(usage.inputTokens).padStart(6))} tokens`);
      console.log(`  ${'Output'.padEnd(12)} ${b(String(usage.outputTokens).padStart(6))} tokens`);
      console.log(`  ${'Total'.padEnd(12)} ${b(String(totalTokens).padStart(6))} tokens`);
      console.log(`  ${'Cost'.padEnd(12)} ${mg(cost.padStart(12))}  ${d('(this call)')}`);

      const price = PRICING[modelId];
      if (price) {
        const costPer1k = ((usage.inputTokens * price.input + usage.outputTokens * price.output) / 1e6) * 1000;
        console.log(`  ${'@ 1k calls/mo'.padEnd(12)} ${yw(`~$${costPer1k.toFixed(3)}`.padStart(12))}`);
      }

      console.log();

      // ── Parse analysis ────────────────────────────────────────────────────
      let analysis: DocumentAnalysis;
      try {
        analysis = JSON.parse(text) as DocumentAnalysis;
      } catch {
        console.log(er('JSON parse error — raw response:'));
        console.log(d(text));
        console.log(d(`(${elapsed} ms)`));
        continue;
      }

      const approved        = isApproved(analysis);
      const rejectedReasons = buildRejectedReasons(analysis);
      const badge           = approved ? ok('✅  APPROVED') : er('❌  REJECTED');

      console.log(`${mg('▶ Decision')}  ${badge}  ${d(`(${elapsed} ms)`)}`);
      console.log();

      const labelW = 18;
      const qColor = analysis.image_quality === 'poor'
        ? er : analysis.image_quality === 'acceptable' ? yw : ok;
      const cColor = analysis.confidence >= CONFIDENCE_THRESHOLD ? ok : yw;

      console.log(`  ${'is_identity_doc'.padEnd(labelW)} ${analysis.is_identity_document ? ok('true') : er('false')}`);
      console.log(`  ${'is_adult'.padEnd(labelW)} ${analysis.is_adult ? ok('true') : er('false')}`);
      console.log(`  ${'appears_authentic'.padEnd(labelW)} ${analysis.appears_authentic ? ok('true') : er('false')}`);
      console.log(`  ${'image_quality'.padEnd(labelW)} ${qColor(analysis.image_quality)}`);
      console.log(`  ${'confidence'.padEnd(labelW)} ${cColor(String(analysis.confidence))}`);
      console.log(`  ${'dob'.padEnd(labelW)} ${d(analysis.dob || '—')}`);

      if (rejectedReasons.length > 0) {
        console.log(`\n  ${b('Rejected reasons:')}`);
        for (const r of rejectedReasons) {
          console.log(`    ${er('•')} ${r}`);
        }
      }

    } catch (err: unknown) {
      const elapsed = Date.now() - start;
      console.log(`${er('Bedrock error')} ${d(`(${elapsed} ms)`)}`);
      console.error(err instanceof Error ? err.message : String(err));
    }

    console.log();
  }

  console.log(cy(LINE) + '\n');
})();
