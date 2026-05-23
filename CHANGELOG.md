# Changelog

All notable changes to this project are documented here.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
Versioning follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

---

## [1.0.0] — 2026-05-23

### Added

#### Infrastructure
- AWS CDK stack (`DecoupleServicesStack`) with API Gateway v2, Lambda (Node 22), S3, Secrets Manager, CloudWatch.
- Shared resources stack (`DecoupleServicesSharedStack`) for region-wide resources.
- S3 verification bucket with 2-day lifecycle rule on `sessions/` prefix.
- IAM role with least-privilege permissions: Bedrock inference profile, S3, Secrets Manager, AWS Marketplace.
- `SecurityValidationAspect` and `CostOptimizationAspect` CDK validation aspects.

#### Identification API (`apps/identification`)
- `POST /api/v1/identification/presign` — returns a presigned S3 upload URL and session ID.
- `POST /api/v1/identification/verify` — invokes Claude Sonnet 4.5 via AWS Bedrock to analyse an identity document photo.
- Two-step flow: presign → client uploads directly to S3 → verify → image deleted.
- `not_identity_document` fallback — rejects non-ID images (selfies, receipts, etc.) before running full analysis.
- Prompt injection and jailbreak prevention via system prompt guardrails.
- Rejection reason codes: `not_identity_document`, `underage`, `document_not_authentic`, `low_confidence`, `poor_image_quality`.
- Switched Bedrock model to cross-region inference profile `us.anthropic.claude-sonnet-4-5-20250929-v1:0`.

#### Mobile (`apps/mobile`)
- End-to-end age-verification flow: Intro → Doc Type → Tips → Capture → Review → Upload → Verify → Result.
- `AgeVerificationCubit` orchestrates the full presign → S3 upload → verify sequence.
- Live camera capture with scanner overlay painter.
- Support for Passport, Driver's license, and National ID card.
- Approved and Rejected result screens with full rejection reason display.
- Error screen with retry (re-uses captured image, no re-capture needed).
- `not_identity_document` rejection reason mapped in `RejectedReason` enum.

#### CI/CD (`.github/workflows`)
- `cicd.yml` — main pipeline: change detection, CDK drift check, infra deploy, Lambda deploy, health check, GitHub Release.
- `production-release.yml` — one-click production deploy from the GitHub Actions UI.
- `rollback.yml` — emergency rollback to any previous release tag with audit trail.

#### Repository
- `README.md`, `LICENSE` (MIT), `CONTRIBUTING.md`, `SECURITY.md`, `CHANGELOG.md`.
- `CODEOWNERS`, PR template, bug report and feature request issue templates.
- `dependabot.yml` for automated npm and GitHub Actions updates.
- `.editorconfig` for consistent editor settings.

### Fixed
- Bedrock `ValidationException` — replaced direct model ID with cross-region inference profile.
- Bedrock `AccessDeniedException` — triggered first-time marketplace subscription; added marketplace IAM permissions to Lambda role.
- iOS code signature error `0xe8008014` — resolved via `flutter clean` + `pod install` after signing config change.
- iOS app not reopening after install — documented `--release` flag requirement for standalone on-device testing.
- CocoaPods platform warning — uncommented `platform :ios, '13.0'` in Podfile.

---

[Unreleased]: https://github.com/walteribanez555/decouple-services/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/walteribanez555/decouple-services/releases/tag/v1.0.0
