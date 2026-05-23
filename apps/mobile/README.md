# Mobile — Age Verification

Flutter app that guides a user through photographing their identity document and submitting it to the [Identification Service](../identification/README.md) for AI-powered age verification.

**Version:** 1.0.0+1 · **SDK:** Dart ≥ 3.11.5 · **Flutter:** 3.41.x (stable)

---

## Stack

| Layer | Technology |
|-------|-----------|
| UI | Flutter / Material 3 |
| State management | `flutter_bloc` — Cubit |
| Routing | `go_router` |
| Dependency injection | `get_it` |
| Networking | `dio` |
| Functional errors | `fpdart` — `Either<Failure, T>` |
| Camera / gallery | `camera`, `image_picker` |
| Image compression | `flutter_image_compress` |
| Environment | `flutter_dotenv` |

---

## Architecture — Clean Architecture

```
lib/
├── main.dart                          # Entry point — DI setup + app launch
├── app.dart                           # MaterialApp + GoRouter
├── routes/routes.dart                 # Route constants + GoRouter config
│
├── core/
│   ├── config/app_config.dart         # API base URL
│   ├── constants/app_constants.dart
│   ├── dependency_injection/          # GetIt setup
│   ├── errors/                        # Exceptions, Failures, ErrorMapper
│   ├── network/                       # Dio client + config
│   └── theme/                         # AppColors, AppTheme
│
└── features/
    └── age_verification/
        ├── domain/                    # Pure Dart — no Flutter, no HTTP
        │   ├── entities/              # DocType, VerificationResult, RejectedReason…
        │   ├── repositories/          # Abstract AgeVerificationRepository
        │   └── usecases/              # PresignUseCase, UploadToS3UseCase, VerifyAgeUseCase
        │
        ├── data/                      # Implements domain contracts
        │   ├── datasources/           # AgeVerificationRemoteDatasource (Dio)
        │   ├── models/                # JSON ↔ entity mappers
        │   └── repositories/          # AgeVerificationRepositoryImpl
        │
        └── presentation/
            ├── cubit/                 # AgeVerificationCubit + AgeVerificationState
            ├── pages/                 # One file per screen
            ├── widgets/               # Shared UI components
            └── painters/              # Custom canvas painters (scanner overlay)
```

---

## User Flow

```
Intro
  └─► Doc Type selection (Passport / Driver's license / National ID)
        └─► Tips (photography guidance)
              └─► Capture (live camera with overlay)
                    └─► Review (confirm or retake)
                          └─► Uploading (presign → S3 upload — progress bar)
                                └─► Verifying (Bedrock analysis in progress)
                                      ├─► Approved ✅
                                      ├─► Rejected ❌  (with reason)
                                      └─► Error ⚠️   (with retry)
```

Every transition is driven by `AgeVerificationCubit` — the UI never navigates directly.

---

## Cubit States

| State | Description |
|-------|-------------|
| `AvInitialState` | Intro screen |
| `AvDocTypeState` | Document type selector; holds `selectedDoc` |
| `AvTipsState` | Photography tips for the chosen doc type |
| `AvCaptureState` | Live camera capture |
| `AvReviewState` | Image review before submitting; holds `imagePath`, `mimeType` |
| `AvUploadingState` | Async — stages: `presign` → `upload` → `done`; `progress` 0.0–1.0 |
| `AvVerifyingState` | Waiting for Bedrock analysis |
| `AvApprovedState` | Holds full `VerificationResult` |
| `AvRejectedState` | Holds full `VerificationResult` with `rejectedReasons` |
| `AvErrorState` | Holds `message`, optional `code`, and original `imagePath`/`mimeType` for retry |

---

## Submit Flow (Cubit)

```
cubit.submit(imagePath, mimeType)
  │
  ├── 1. POST /api/v1/identification/presign  → { sessionId, uploadUrl }
  ├── 2. PUT  <uploadUrl>  (direct S3, streams file with progress)
  └── 3. POST /api/v1/identification/verify   → VerificationResult
            ├── approved  → AvApprovedState
            └── rejected  → AvRejectedState
```

Failures at any step emit `AvErrorState`. The error screen retries from step 1 using the already-captured image (no re-capture needed).

---

## Supported Document Types

| Enum | Label | Expected side |
|------|-------|--------------|
| `DocType.passport` | Passport | Photo page |
| `DocType.license` | Driver's license | Front side |
| `DocType.nationalId` | National ID card | Front side |

---

## Rejection Reasons

| API code | Dart enum | Displayed when |
|----------|-----------|----------------|
| `not_identity_document` | *(unknown → null)* | Image is not a valid ID document |
| `underage` | `RejectedReason.underage` | Person is under 18 |
| `document_not_authentic` | `RejectedReason.documentNotAuthentic` | Signs of tampering |
| `low_confidence` | `RejectedReason.lowConfidence` | Model confidence < threshold |
| `poor_image_quality` | `RejectedReason.poorImageQuality` | Blurry or dark image |

---

## Configuration

API base URL is set in [lib/core/config/app_config.dart](lib/core/config/app_config.dart):

```dart
abstract final class AppConfig {
  static const String identificationApiBaseUrl =
      'https://cm981m6ag1.execute-api.us-east-1.amazonaws.com';
}
```

To use per-environment values, load from `.env` via `flutter_dotenv` before `setupDependencies()` in `main.dart`.

---

## Getting Started

### Prerequisites

- Flutter 3.41.x (`flutter --version`)
- Xcode 16+ with iOS SDK (for iOS)
- CocoaPods (`pod --version`)
- Apple Developer account (team `9QQSKB3NRB`) signed in to Xcode

### Install dependencies

```bash
flutter pub get
cd ios && pod install
```

### Run on device

```bash
# List connected devices
flutter devices

# Run debug on physical iPhone (wireless)
flutter run -d <device-id>

# Run release on physical iPhone (works offline, no Mac VM needed)
flutter run -d <device-id> --release

# Run on simulator
flutter run -d <simulator-id>
```

### Build

```bash
# iOS debug (no codesign — for CI checks)
flutter build ios --debug --no-codesign

# iOS release (requires valid signing)
flutter build ios --release
```

---

## iOS Signing

| Setting | Value |
|---------|-------|
| Bundle ID | `com.walteribanez555.mobile` |
| Team | `9QQSKB3NRB` (Walter Ibanez — Individual) |
| Min iOS | 13.0 |
| Signing | Automatic (managed by Xcode) |

> **First run on a new device:** Xcode will prompt to register the device. Accept and wait ~30 s for the provisioning profile to update.

---

## Known Issues

| Issue | Cause | Fix |
|-------|-------|-----|
| App doesn't reopen after install | Debug builds require the Mac Dart VM | Run with `--release` for standalone testing |
| Slow install over wireless | iOS wireless debugging limitation | Use a USB cable |
| `0xe8008014` invalid signature | Stale build cache after signing changes | `flutter clean` + `pod install` + rebuild |
