/**
 * Generic S3 service — presigned uploads, object reads, and deletes.
 *
 * Domain-agnostic: the bucket is injected at construction time; keys are
 * always supplied by the caller.  Nothing is read from environment variables
 * here — that is the responsibility of the composition root (*.module.ts).
 *
 * Usage:
 *   const storage = new S3Service(process.env.S3_VERIFICATION_BUCKET!);
 *   const url     = await storage.getPresignedUploadUrl(key, 'image/jpeg');
 *   const data    = await storage.getObjectData(key);
 *   await storage.deleteObject(key);
 */

import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import type { Readable } from 'stream';
import { BaseService } from './base.service';

// ─── Public types ─────────────────────────────────────────────────────────────

export interface ObjectData {
  /** Base64-encoded bytes — ready for a Bedrock `image` content block. */
  base64: string;
  /** Content-Type stored by S3 when the object was uploaded (e.g. "image/jpeg"). */
  mimeType: string;
}

// ─── Service ──────────────────────────────────────────────────────────────────

export class S3Service extends BaseService {
  private readonly client: S3Client;

  constructor(private readonly bucket: string) {
    super('S3Service');
    this.client = new S3Client({});
  }

  /**
   * Generate a presigned PUT URL so clients can upload directly to S3.
   *
   * S3 enforces the `ContentType` set here — the client MUST send the same
   * `Content-Type` header during the PUT, otherwise S3 returns 403.
   *
   * @param key       - S3 object key.
   * @param mimeType  - MIME type the client intends to upload.
   * @param expiresIn - URL validity in seconds (default 300 s / 5 min).
   */
  async getPresignedUploadUrl(key: string, mimeType: string, expiresIn = 300): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: mimeType,
    });
    const url = await getSignedUrl(this.client, command, { expiresIn });
    this.logger.debug('Presigned upload URL generated', { key, mimeType, expiresIn });
    return url;
  }

  /**
   * Download an object and return its bytes as base64 together with the
   * content type stored at upload time.
   */
  async getObjectData(key: string): Promise<ObjectData> {
    const res = await this.client.send(new GetObjectCommand({ Bucket: this.bucket, Key: key }));
    const mimeType = res.ContentType ?? 'image/jpeg';
    const stream = res.Body as Readable;
    const chunks: Buffer[] = [];
    for await (const chunk of stream) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk as Uint8Array));
    }
    const base64 = Buffer.concat(chunks).toString('base64');
    this.logger.debug('Object fetched from S3', { key, mimeType, bytes: base64.length });
    return { base64, mimeType };
  }

  /**
   * Remove an object.  Throws on failure — the caller decides whether to swallow.
   */
  async deleteObject(key: string): Promise<void> {
    await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
    this.logger.debug('Object deleted from S3', { key });
  }
}
