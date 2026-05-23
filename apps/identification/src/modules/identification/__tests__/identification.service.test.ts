/**
 * Unit tests for IdentificationService.
 *
 * All AWS dependencies (BedrockService, S3Service) are replaced with
 * lightweight jest mocks so no network calls are made.
 *
 * Coverage goals
 * ──────────────
 * computeCost()   – correct USD math for every model family; unknown model = $0
 * verify()        – gate #1 rejects (short-circuit, no gate #2 call)
 *                 – gate #1 passes, gate #2 approves (full happy path)
 *                 – gate #1 passes, gate #2 rejects for each RejectedReason
 *                 – S3 cleanup (deleteObject) always runs, even on early exit
 *                 – cost is attached to every return shape
 */

import type { BedrockService } from '../../../common/services/bedrock.service';
import type { S3Service } from '../../../common/services/s3.service';
import type { BedrockInvokeOutput } from '../../../common/adapters/bedrock/bedrock-adapter.interface';
import { IdentificationService } from '../identification.service';
import { computeCost } from '../pricing';
import type { DocumentAnalysis, PreCheckResult } from '../identification.types';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Model IDs used in fake Bedrock outputs. */
const MODEL_HAIKU = 'us.anthropic.claude-haiku-4-5-20251001-v1:0';
const MODEL_NOVA  = 'amazon.nova-lite-v1:0';

/** Tiny usage fixture (pre-check call — 30-token budget). */
const USAGE_PRECHECK = { inputTokens: 180, outputTokens: 12 };
/** Larger usage fixture (full-analysis call — 120-token budget). */
const USAGE_ANALYSIS = { inputTokens: 950, outputTokens: 65 };

function bedrockOutput(text: string, modelId = MODEL_HAIKU, usage = USAGE_PRECHECK): BedrockInvokeOutput {
  return { text, usage, modelId };
}

function preCheckJson(isDoc: boolean, confidence = 0.97): string {
  return JSON.stringify({ is_identity_document: isDoc, confidence } satisfies PreCheckResult);
}

function analysisJson(overrides: Partial<DocumentAnalysis> = {}): string {
  const defaults: DocumentAnalysis = {
    is_identity_document: true,
    is_adult:             true,
    appears_authentic:    true,
    image_quality:        'good',
    confidence:           0.95,
    dob:                  '1990-06-15',
    ...overrides,
  };
  return JSON.stringify(defaults);
}

// ─── Mock factories ───────────────────────────────────────────────────────────

function makeS3(deleteResolves = true): jest.Mocked<Pick<S3Service, 'getObjectData' | 'getPresignedUploadUrl' | 'deleteObject'>> {
  return {
    getObjectData: jest.fn().mockResolvedValue({ base64: 'abc==', mimeType: 'image/jpeg' }),
    getPresignedUploadUrl: jest.fn().mockResolvedValue('https://s3.example.com/upload'),
    deleteObject: jest.fn().mockImplementation(() =>
      deleteResolves ? Promise.resolve() : Promise.reject(new Error('S3 delete failed')),
    ),
  };
}

function makeBedrock(...outputs: BedrockInvokeOutput[]): jest.Mocked<Pick<BedrockService, 'invoke'>> {
  const invoke = jest.fn();
  outputs.forEach((o) => invoke.mockResolvedValueOnce(o));
  return { invoke };
}

function makeService(
  bedrock: jest.Mocked<Pick<BedrockService, 'invoke'>>,
  s3: jest.Mocked<Pick<S3Service, 'getObjectData' | 'getPresignedUploadUrl' | 'deleteObject'>>,
  config: { confidenceThreshold?: number; modelId?: string } = {},
): IdentificationService {
  return new IdentificationService(
    s3 as unknown as S3Service,
    bedrock as unknown as BedrockService,
    config,
  );
}

// ─── computeCost() ────────────────────────────────────────────────────────────

describe('computeCost()', () => {
  it('returns $0 for an unknown model and still reports token counts', () => {
    const cost = computeCost({ inputTokens: 500, outputTokens: 50 }, 'unknown.model-x');
    expect(cost.costUsd).toBe(0);
    expect(cost.inputTokens).toBe(500);
    expect(cost.outputTokens).toBe(50);
  });

  it('calculates Claude Haiku 4.5 cost correctly (cross-region prefix)', () => {
    // $0.80/1M in + $4.00/1M out
    // 1M input + 1M output = $4.80
    const cost = computeCost({ inputTokens: 1_000_000, outputTokens: 1_000_000 }, MODEL_HAIKU);
    expect(cost.costUsd).toBeCloseTo(4.80, 6);
  });

  it('calculates Nova Lite cost correctly', () => {
    // $0.06/1M in + $0.24/1M out
    // 1M + 1M = $0.30
    const cost = computeCost({ inputTokens: 1_000_000, outputTokens: 1_000_000 }, MODEL_NOVA);
    expect(cost.costUsd).toBeCloseTo(0.30, 6);
  });

  it('calculates Claude Sonnet 4.x cost correctly', () => {
    // $3.00/1M in + $15.00/1M out — 500k each = $9.00
    const cost = computeCost(
      { inputTokens: 500_000, outputTokens: 500_000 },
      'us.anthropic.claude-sonnet-4-6-20250101-v1:0',
    );
    expect(cost.costUsd).toBeCloseTo(9.00, 6);
  });

  it('calculates Nova Pro cost correctly', () => {
    // $0.80/1M in + $3.20/1M out — 1M each = $4.00
    const cost = computeCost(
      { inputTokens: 1_000_000, outputTokens: 1_000_000 },
      'amazon.nova-pro-v1:0',
    );
    expect(cost.costUsd).toBeCloseTo(4.00, 6);
  });

  it('matches on "anthropic.claude-haiku-4-5" (on-demand prefix, no region)', () => {
    const cost = computeCost(
      { inputTokens: 1_000_000, outputTokens: 1_000_000 },
      'anthropic.claude-haiku-4-5-20251001-v1:0',
    );
    expect(cost.costUsd).toBeCloseTo(4.80, 6);
  });

  it('produces a finite, non-negative number for realistic token counts', () => {
    const cost = computeCost(USAGE_PRECHECK, MODEL_HAIKU);
    expect(cost.costUsd).toBeGreaterThan(0);
    expect(Number.isFinite(cost.costUsd)).toBe(true);
  });
});

// ─── verify() — gate #1 rejects ───────────────────────────────────────────────

describe('verify() — gate #1 rejects (not an identity document)', () => {
  let s3: ReturnType<typeof makeS3>;
  let bedrock: ReturnType<typeof makeBedrock>;
  let service: IdentificationService;

  beforeEach(() => {
    s3      = makeS3();
    bedrock = makeBedrock(
      bedrockOutput(preCheckJson(false, 0.05), MODEL_HAIKU, USAGE_PRECHECK),
    );
    service = makeService(bedrock, s3);
  });

  it('returns approved: false', async () => {
    const result = await service.verify('session-abc');
    expect(result.approved).toBe(false);
  });

  it('includes not_identity_document in rejectedReasons', async () => {
    const result = await service.verify('session-abc');
    expect(result.rejectedReasons).toEqual(['not_identity_document']);
  });

  it('does NOT call Bedrock a second time (gate #2 is skipped)', async () => {
    await service.verify('session-abc');
    expect(bedrock.invoke).toHaveBeenCalledTimes(1);
  });

  it('always deletes the S3 object', async () => {
    await service.verify('session-abc');
    expect(s3.deleteObject).toHaveBeenCalledTimes(1);
  });

  it('cost.analysis is null', async () => {
    const result = await service.verify('session-abc');
    expect(result.cost.analysis).toBeNull();
  });

  it('cost.totalCostUsd equals preCheck cost', async () => {
    const result = await service.verify('session-abc');
    expect(result.cost.totalCostUsd).toBe(result.cost.preCheck.costUsd);
  });

  it('cost.preCheck carries the correct token counts', async () => {
    const result = await service.verify('session-abc');
    expect(result.cost.preCheck.inputTokens).toBe(USAGE_PRECHECK.inputTokens);
    expect(result.cost.preCheck.outputTokens).toBe(USAGE_PRECHECK.outputTokens);
  });
});

// ─── verify() — gate #1 passes, gate #2 approves ─────────────────────────────

describe('verify() — full happy path (approved)', () => {
  let s3: ReturnType<typeof makeS3>;
  let bedrock: ReturnType<typeof makeBedrock>;
  let service: IdentificationService;

  beforeEach(() => {
    s3 = makeS3();
    bedrock = makeBedrock(
      bedrockOutput(preCheckJson(true),  MODEL_HAIKU, USAGE_PRECHECK),
      bedrockOutput(analysisJson(),       MODEL_HAIKU, USAGE_ANALYSIS),
    );
    service = makeService(bedrock, s3);
  });

  it('returns approved: true', async () => {
    const result = await service.verify('session-xyz');
    expect(result.approved).toBe(true);
  });

  it('rejectedReasons is empty', async () => {
    const result = await service.verify('session-xyz');
    expect(result.rejectedReasons).toEqual([]);
  });

  it('calls Bedrock exactly twice (gate #1 + gate #2)', async () => {
    await service.verify('session-xyz');
    expect(bedrock.invoke).toHaveBeenCalledTimes(2);
  });

  it('always deletes the S3 object', async () => {
    await service.verify('session-xyz');
    expect(s3.deleteObject).toHaveBeenCalledTimes(1);
  });

  it('details.dob is the value from the model', async () => {
    const result = await service.verify('session-xyz');
    expect(result.details.dob).toBe('1990-06-15');
  });

  it('cost.analysis is populated', async () => {
    const result = await service.verify('session-xyz');
    expect(result.cost.analysis).not.toBeNull();
    expect(result.cost.analysis!.inputTokens).toBe(USAGE_ANALYSIS.inputTokens);
  });

  it('cost.totalCostUsd is the sum of both calls', async () => {
    const result = await service.verify('session-xyz');
    const expectedTotal =
      result.cost.preCheck.costUsd + result.cost.analysis!.costUsd;
    expect(result.cost.totalCostUsd).toBeCloseTo(expectedTotal, 8);
  });

  it('S3 cleanup still runs even when deleteObject throws', async () => {
    s3.deleteObject.mockRejectedValueOnce(new Error('network error'));
    // Should NOT throw — the service swallows the cleanup error
    await expect(service.verify('session-xyz')).resolves.toBeDefined();
  });
});

// ─── verify() — gate #2 rejection scenarios ───────────────────────────────────

describe('verify() — gate #2 rejection: underage', () => {
  it('returns underage reason when is_adult is false', async () => {
    const bedrock = makeBedrock(
      bedrockOutput(preCheckJson(true), MODEL_HAIKU, USAGE_PRECHECK),
      bedrockOutput(analysisJson({ is_adult: false, dob: '2008-01-01' }), MODEL_HAIKU, USAGE_ANALYSIS),
    );
    const result = await makeService(bedrock, makeS3()).verify('s1');
    expect(result.approved).toBe(false);
    expect(result.rejectedReasons).toContain('underage');
    expect(result.rejectedReasons).not.toContain('missing_dob');
  });
});

describe('verify() — gate #2 rejection: missing / partial DOB', () => {
  it('reports missing_dob when dob is empty string', async () => {
    const bedrock = makeBedrock(
      bedrockOutput(preCheckJson(true), MODEL_HAIKU, USAGE_PRECHECK),
      bedrockOutput(analysisJson({ dob: '', is_adult: false }), MODEL_HAIKU, USAGE_ANALYSIS),
    );
    const result = await makeService(bedrock, makeS3()).verify('s2');
    expect(result.rejectedReasons).toContain('missing_dob');
    expect(result.rejectedReasons).not.toContain('underage');
  });

  it('reports missing_dob when dob has invalid format (partial year)', async () => {
    const bedrock = makeBedrock(
      bedrockOutput(preCheckJson(true), MODEL_HAIKU, USAGE_PRECHECK),
      bedrockOutput(analysisJson({ dob: '10/31/1990', is_adult: false }), MODEL_HAIKU, USAGE_ANALYSIS),
    );
    const result = await makeService(bedrock, makeS3()).verify('s3');
    expect(result.rejectedReasons).toContain('missing_dob');
  });

  it('reports missing_dob when year is before 1900 (fabricated / nonsensical)', async () => {
    const bedrock = makeBedrock(
      bedrockOutput(preCheckJson(true), MODEL_HAIKU, USAGE_PRECHECK),
      bedrockOutput(analysisJson({ dob: '1800-01-01', is_adult: false }), MODEL_HAIKU, USAGE_ANALYSIS),
    );
    const result = await makeService(bedrock, makeS3()).verify('s4');
    expect(result.rejectedReasons).toContain('missing_dob');
  });
});

describe('verify() — gate #2 rejection: document_not_authentic', () => {
  it('flags the document when appears_authentic is false', async () => {
    const bedrock = makeBedrock(
      bedrockOutput(preCheckJson(true), MODEL_HAIKU, USAGE_PRECHECK),
      bedrockOutput(analysisJson({ appears_authentic: false }), MODEL_HAIKU, USAGE_ANALYSIS),
    );
    const result = await makeService(bedrock, makeS3()).verify('s5');
    expect(result.approved).toBe(false);
    expect(result.rejectedReasons).toContain('document_not_authentic');
  });
});

describe('verify() — gate #2 rejection: low_confidence', () => {
  it('flags low confidence when below the default threshold (0.85)', async () => {
    const bedrock = makeBedrock(
      bedrockOutput(preCheckJson(true), MODEL_HAIKU, USAGE_PRECHECK),
      bedrockOutput(analysisJson({ confidence: 0.50 }), MODEL_HAIKU, USAGE_ANALYSIS),
    );
    const result = await makeService(bedrock, makeS3()).verify('s6');
    expect(result.approved).toBe(false);
    expect(result.rejectedReasons).toContain('low_confidence');
  });

  it('uses the custom confidenceThreshold from config', async () => {
    const bedrock = makeBedrock(
      bedrockOutput(preCheckJson(true), MODEL_HAIKU, USAGE_PRECHECK),
      bedrockOutput(analysisJson({ confidence: 0.70 }), MODEL_HAIKU, USAGE_ANALYSIS),
    );
    // Lower threshold — 0.70 should now pass
    const result = await makeService(bedrock, makeS3(), { confidenceThreshold: 0.65 }).verify('s7');
    expect(result.approved).toBe(true);
    expect(result.rejectedReasons).not.toContain('low_confidence');
  });
});

describe('verify() — gate #2 rejection: poor_image_quality', () => {
  it('includes poor_image_quality in reasons when quality is "poor"', async () => {
    const bedrock = makeBedrock(
      bedrockOutput(preCheckJson(true), MODEL_HAIKU, USAGE_PRECHECK),
      bedrockOutput(analysisJson({ image_quality: 'poor', confidence: 0.50 }), MODEL_HAIKU, USAGE_ANALYSIS),
    );
    const result = await makeService(bedrock, makeS3()).verify('s8');
    expect(result.rejectedReasons).toContain('poor_image_quality');
  });

  it('does NOT include poor_image_quality when quality is "acceptable"', async () => {
    const bedrock = makeBedrock(
      bedrockOutput(preCheckJson(true), MODEL_HAIKU, USAGE_PRECHECK),
      bedrockOutput(analysisJson({ image_quality: 'acceptable' }), MODEL_HAIKU, USAGE_ANALYSIS),
    );
    const result = await makeService(bedrock, makeS3()).verify('s9');
    expect(result.rejectedReasons).not.toContain('poor_image_quality');
  });
});

// ─── verify() — multiple simultaneous rejection reasons ───────────────────────

describe('verify() — multiple rejection reasons accumulate', () => {
  it('reports all applicable reasons in one call', async () => {
    const bedrock = makeBedrock(
      bedrockOutput(preCheckJson(true), MODEL_HAIKU, USAGE_PRECHECK),
      bedrockOutput(
        analysisJson({
          appears_authentic: false,
          confidence:        0.40,
          image_quality:     'poor',
          dob:               '1990-06-15', // valid DOB but still other failures
          is_adult:          true,
        }),
        MODEL_HAIKU,
        USAGE_ANALYSIS,
      ),
    );
    const result = await makeService(bedrock, makeS3()).verify('s10');
    expect(result.approved).toBe(false);
    expect(result.rejectedReasons).toContain('document_not_authentic');
    expect(result.rejectedReasons).toContain('low_confidence');
    expect(result.rejectedReasons).toContain('poor_image_quality');
  });
});

// ─── verify() — cost with Nova model ─────────────────────────────────────────

describe('verify() — cost calculation with Nova Lite model', () => {
  it('computes a lower total cost than Haiku for the same token counts', async () => {
    const bedrockHaiku = makeBedrock(
      bedrockOutput(preCheckJson(true), MODEL_HAIKU, USAGE_PRECHECK),
      bedrockOutput(analysisJson(),     MODEL_HAIKU, USAGE_ANALYSIS),
    );
    const bedrockNova = makeBedrock(
      bedrockOutput(preCheckJson(true), MODEL_NOVA, USAGE_PRECHECK),
      bedrockOutput(analysisJson(),     MODEL_NOVA, USAGE_ANALYSIS),
    );

    const [haikuResult, novaResult] = await Promise.all([
      makeService(bedrockHaiku, makeS3()).verify('h'),
      makeService(bedrockNova,  makeS3()).verify('n'),
    ]);

    expect(novaResult.cost.totalCostUsd).toBeLessThan(haikuResult.cost.totalCostUsd);
  });
});
