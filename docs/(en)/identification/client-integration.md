# Age Verification — Client Integration Guide

This guide explains how to integrate the age-verification flow into any client application (Flutter, React Native, web, etc.).

The API uses a **two-step upload pattern**: the client uploads the identity document **directly to S3** using a presigned URL, then calls the verification endpoint. The image never passes through the Lambda function, which removes file-size limits and reduces latency.

---

## Base URL

| Environment | URL |
|---|---|
| Dev | `https://<api-id>.execute-api.us-east-1.amazonaws.com` |
| Prod | `https://<api-id>.execute-api.us-east-1.amazonaws.com` |

> The exact URL is available in the CloudFormation stack output `ApiEndpoint` after deployment.

All identification endpoints are mounted at:

```
/api/v1/identification
```

---

## Authentication

The current implementation does not require request authentication.  
Add your authorization header (e.g. `Authorization: Bearer <token>`) when the backend requires it.

---

## Flow Overview

```
Client                         API (Lambda)                  S3
  │                                │                           │
  │  POST /identification/presign  │                           │
  │ ────────────────────────────► │                           │
  │  { sessionId, uploadUrl }      │                           │
  │ ◄──────────────────────────── │                           │
  │                                │                           │
  │  PUT uploadUrl  (image bytes)  │                           │
  │ ──────────────────────────────────────────────────────►   │
  │  204 No Content                │                           │
  │ ◄─────────────────────────────────────────────────────    │
  │                                │                           │
  │  POST /identification/verify   │                           │
  │  { sessionId }                 │                           │
  │ ────────────────────────────► │                           │
  │                   reads image ─────────────────────────►  │
  │                   calls Bedrock (Claude Sonnet)            │
  │  { data: VerificationResult }  │                           │
  │ ◄──────────────────────────── │                           │
```

---

## Step 1 — Request a presigned upload URL

**`POST /api/v1/identification/presign`**

### Request

```http
POST /api/v1/identification/presign
Content-Type: application/json

{
  "mimeType": "image/jpeg"
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `mimeType` | `string` | ✅ | MIME type of the image to upload. Accepted: `image/jpeg`, `image/png`, `image/webp` |

### Response — 200 OK

```json
{
  "data": {
    "sessionId": "550e8400-e29b-41d4-a716-446655440000",
    "uploadUrl": "https://s3.amazonaws.com/decouple-services-dev-verification/sessions/550e8400.../id_document?X-Amz-Algorithm=...",
    "expiresIn": 300
  }
}
```

| Field | Type | Description |
|---|---|---|
| `sessionId` | `string` | Opaque token — store it and pass it to `/verify` |
| `uploadUrl` | `string` | Presigned S3 PUT URL valid for `expiresIn` seconds |
| `expiresIn` | `number` | Seconds until the URL expires (default: 300 s / 5 min) |

### Error responses

| Status | Code | When |
|---|---|---|
| `400` | `MISSING_MIME_TYPE` | `mimeType` field is absent |
| `415` | `UNSUPPORTED_MIME_TYPE` | MIME type not in the accepted list |
| `500` | — | Unexpected server error |

---

## Step 2 — Upload the image directly to S3

Use the `uploadUrl` from Step 1 to PUT the image bytes.  
**You must set `Content-Type` to the same value you sent in Step 1.**  
S3 enforces this header — any mismatch returns `403 Forbidden`.

```http
PUT <uploadUrl>
Content-Type: image/jpeg

<raw image bytes>
```

### Success

S3 returns `200 OK` with an empty body.

### Expiry

The URL is valid for **5 minutes**. If the client takes longer, restart from Step 1.

---

## Step 3 — Request verification

**`POST /api/v1/identification/verify`**

### Request

```http
POST /api/v1/identification/verify
Content-Type: application/json

{
  "sessionId": "550e8400-e29b-41d4-a716-446655440000"
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `sessionId` | `string` | ✅ | Token received from `/presign` |

### Response — 200 Approved

```json
{
  "data": {
    "sessionId": "550e8400-e29b-41d4-a716-446655440000",
    "approved": true,
    "details": {
      "isAdult": true,
      "appearsAuthentic": true,
      "imageQuality": "good",
      "confidence": 0.96,
      "dob": "1995-04-10"
    },
    "rejectedReasons": []
  }
}
```

### Response — 422 Rejected

```json
{
  "data": {
    "sessionId": "550e8400-e29b-41d4-a716-446655440000",
    "approved": false,
    "details": {
      "isAdult": false,
      "appearsAuthentic": true,
      "imageQuality": "good",
      "confidence": 0.94,
      "dob": "2010-11-03"
    },
    "rejectedReasons": ["underage"]
  }
}
```

### `details` fields

| Field | Type | Description |
|---|---|---|
| `isAdult` | `boolean` | Age ≥ 18 calculated from document DOB |
| `appearsAuthentic` | `boolean` | Document shows no obvious tampering |
| `imageQuality` | `"good" \| "acceptable" \| "poor"` | Readability of the photo |
| `confidence` | `number` | Model confidence 0.0 – 1.0 |
| `dob` | `string` | Date of birth extracted from document (YYYY-MM-DD) |

### `rejectedReasons` codes

| Code | Meaning |
|---|---|
| `underage` | Person is under 18 |
| `document_not_authentic` | Document shows signs of tampering |
| `low_confidence` | AI confidence below threshold (0.85) |
| `poor_image_quality` | Image is too blurry or dark to read |

### Error responses

| Status | Code | When |
|---|---|---|
| `400` | `MISSING_SESSION_ID` | `sessionId` field is absent or empty |
| `500` | — | Bedrock or S3 error |

---

## Error envelope

All error responses follow the same structure:

```json
{
  "error": "Human-readable message",
  "code": "MACHINE_READABLE_CODE"
}
```

---

## Image guidelines

For best results and highest confidence scores:

| Requirement | Recommendation |
|---|---|
| Format | JPEG or PNG preferred |
| Size | Under 2 MB (max accepted: 5 MB) |
| Resolution | At least 640 × 480 px |
| Lighting | Even, no glare on the document surface |
| Angle | Document flat and fully within frame |
| Focus | Sharp — all text must be readable |

---

## Flutter implementation

```dart
import 'dart:io';
import 'dart:convert';
import 'package:http/http.dart' as http;

const _base = 'https://<api-id>.execute-api.us-east-1.amazonaws.com/api/v1/identification';

class IdentificationClient {
  // ── Step 1: get presigned URL ──────────────────────────────────────────────
  Future<Map<String, dynamic>> presign(String mimeType) async {
    final res = await http.post(
      Uri.parse('$_base/presign'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'mimeType': mimeType}),
    );

    if (res.statusCode != 200) {
      throw Exception('Presign failed: ${res.body}');
    }

    final json = jsonDecode(res.body) as Map<String, dynamic>;
    return json['data'] as Map<String, dynamic>;
  }

  // ── Step 2: upload directly to S3 ─────────────────────────────────────────
  Future<void> uploadToS3(String uploadUrl, File file, String mimeType) async {
    final bytes = await file.readAsBytes();
    final res = await http.put(
      Uri.parse(uploadUrl),
      headers: {'Content-Type': mimeType},
      body: bytes,
    );

    if (res.statusCode != 200) {
      throw Exception('S3 upload failed: ${res.statusCode}');
    }
  }

  // ── Step 3: verify ────────────────────────────────────────────────────────
  Future<Map<String, dynamic>> verify(String sessionId) async {
    final res = await http.post(
      Uri.parse('$_base/verify'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'sessionId': sessionId}),
    );

    // 200 = approved, 422 = rejected — both are valid structured responses.
    if (res.statusCode != 200 && res.statusCode != 422) {
      throw Exception('Verification error: ${res.body}');
    }

    final json = jsonDecode(res.body) as Map<String, dynamic>;
    return json['data'] as Map<String, dynamic>;
  }

  // ── Full flow ─────────────────────────────────────────────────────────────
  Future<Map<String, dynamic>> verifyDocument(File imageFile) async {
    final mimeType = _mimeType(imageFile.path);

    // 1. Get presigned URL
    final presignData = await presign(mimeType);
    final sessionId  = presignData['sessionId'] as String;
    final uploadUrl  = presignData['uploadUrl']  as String;

    // 2. Upload directly to S3
    await uploadToS3(uploadUrl, imageFile, mimeType);

    // 3. Run verification
    return verify(sessionId);
  }

  String _mimeType(String path) {
    if (path.endsWith('.png'))  return 'image/png';
    if (path.endsWith('.webp')) return 'image/webp';
    return 'image/jpeg'; // default
  }
}
```

**Usage:**

```dart
final client = IdentificationClient();
final result = await client.verifyDocument(pickedFile);

if (result['approved'] == true) {
  // proceed
} else {
  final reasons = result['rejectedReasons'] as List;
  // show reasons to user
}
```

---

## JavaScript / TypeScript (fetch)

```typescript
const BASE = 'https://<api-id>.execute-api.us-east-1.amazonaws.com/api/v1/identification';

interface PresignData {
  sessionId: string;
  uploadUrl: string;
  expiresIn: number;
}

interface VerificationResult {
  sessionId: string;
  approved: boolean;
  details: {
    isAdult: boolean;
    appearsAuthentic: boolean;
    imageQuality: 'good' | 'acceptable' | 'poor';
    confidence: number;
    dob: string;
  };
  rejectedReasons: string[];
}

async function presign(mimeType: string): Promise<PresignData> {
  const res = await fetch(`${BASE}/presign`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mimeType }),
  });
  if (!res.ok) throw new Error(`Presign failed: ${await res.text()}`);
  const { data } = await res.json();
  return data;
}

async function uploadToS3(uploadUrl: string, file: File): Promise<void> {
  const res = await fetch(uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': file.type },
    body: file,
  });
  if (!res.ok) throw new Error(`S3 upload failed: ${res.status}`);
}

async function verify(sessionId: string): Promise<VerificationResult> {
  const res = await fetch(`${BASE}/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId }),
  });
  // 200 = approved, 422 = rejected — both carry the full result
  if (res.status !== 200 && res.status !== 422) {
    throw new Error(`Verification error: ${await res.text()}`);
  }
  const { data } = await res.json();
  return data;
}

// ── Full flow ─────────────────────────────────────────────────────────────────
async function verifyDocument(file: File): Promise<VerificationResult> {
  const { sessionId, uploadUrl } = await presign(file.type);
  await uploadToS3(uploadUrl, file);
  return verify(sessionId);
}
```

---

## React Native (Expo)

```typescript
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';

async function pickAndVerify(): Promise<void> {
  const picked = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    quality: 0.9,
  });

  if (picked.canceled) return;

  const asset    = picked.assets[0];
  const mimeType = asset.mimeType ?? 'image/jpeg';

  // 1. Presign
  const presignRes = await fetch(`${BASE}/presign`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mimeType }),
  });
  const { data: presignData } = await presignRes.json();

  // 2. Upload to S3 using expo-file-system (no Lambda hop)
  await FileSystem.uploadAsync(presignData.uploadUrl, asset.uri, {
    httpMethod: 'PUT',
    headers: { 'Content-Type': mimeType },
    uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
  });

  // 3. Verify
  const verifyRes = await fetch(`${BASE}/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId: presignData.sessionId }),
  });
  const { data: result } = await verifyRes.json();

  if (result.approved) {
    console.log('Approved ✅', result.details);
  } else {
    console.log('Rejected ❌', result.rejectedReasons);
  }
}
```

---

## cURL (manual testing)

```bash
BASE="https://<api-id>.execute-api.us-east-1.amazonaws.com/api/v1/identification"

# 1. Get presigned URL
PRESIGN=$(curl -s -X POST "$BASE/presign" \
  -H "Content-Type: application/json" \
  -d '{"mimeType":"image/jpeg"}')

SESSION_ID=$(echo $PRESIGN | jq -r '.data.sessionId')
UPLOAD_URL=$(echo $PRESIGN | jq -r '.data.uploadUrl')

echo "Session: $SESSION_ID"

# 2. Upload image directly to S3
curl -s -X PUT "$UPLOAD_URL" \
  -H "Content-Type: image/jpeg" \
  --data-binary @/path/to/id-card.jpg

# 3. Verify
curl -s -X POST "$BASE/verify" \
  -H "Content-Type: application/json" \
  -d "{\"sessionId\":\"$SESSION_ID\"}" | jq .
```

---

## Common mistakes

| Mistake | Fix |
|---|---|
| Sending wrong `Content-Type` to S3 | Match it exactly to the `mimeType` sent in `/presign` |
| Reusing a `sessionId` after verification | Each session is single-use — S3 object is deleted after `/verify` |
| Waiting more than 5 min to upload | Call `/presign` again if the URL has expired |
| Passing `sessionId` from a different environment | Dev and Prod use separate S3 buckets — session IDs are not portable |
| Image larger than 5 MB | Compress or resize before uploading |
