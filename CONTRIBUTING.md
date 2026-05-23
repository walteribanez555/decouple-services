# Contributing

Thank you for taking the time to contribute. This document covers the development workflow, conventions, and standards for this repository.

---

## Table of contents

- [Development setup](#development-setup)
- [Branch strategy](#branch-strategy)
- [Commit messages](#commit-messages)
- [Pull requests](#pull-requests)
- [Code style](#code-style)
- [Testing](#testing)
- [Infrastructure changes](#infrastructure-changes)
- [Mobile changes](#mobile-changes)

---

## Development setup

### Prerequisites

| Tool | Version |
|------|---------|
| Node.js | ≥ 22 |
| npm | ≥ 11 |
| Flutter | 3.41.x (stable) |
| Dart | ≥ 3.11.5 |
| AWS CLI | v2 |
| AWS CDK | v2 (`npm i -g aws-cdk`) |
| CocoaPods | ≥ 1.16 (macOS, iOS only) |

### Clone and install

```bash
git clone https://github.com/<org>/decouple-services.git
cd decouple-services
npm install                          # installs all workspace deps via Turborepo
cd apps/mobile && flutter pub get    # Flutter deps
cd ../mobile/ios && pod install      # CocoaPods (iOS only)
```

### Environment variables

Copy and fill in the identification service env:

```bash
cp apps/identification/.env.example apps/identification/.env
```

---

## Branch strategy

| Branch | Purpose |
|--------|---------|
| `main` | Always deployable — protected, requires PR + review |
| `feat/<name>` | New features |
| `fix/<name>` | Bug fixes |
| `chore/<name>` | Maintenance, deps, refactors |
| `infra/<name>` | CDK / infrastructure changes |

**Never push directly to `main`.** All changes go through a pull request.

---

## Commit messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <short description>

[optional body]

[optional footer]
```

### Types

| Type | When to use |
|------|-------------|
| `feat` | New feature |
| `fix` | Bug fix |
| `refactor` | Code change with no behaviour change |
| `chore` | Build, tooling, dependency updates |
| `infra` | CDK / AWS infrastructure |
| `docs` | Documentation only |
| `test` | Adding or updating tests |
| `ci` | CI/CD workflow changes |

### Scopes

`mobile`, `identification`, `infra`, `ci`, `deps`

### Examples

```
feat(mobile): add document type selector screen
fix(identification): handle not_identity_document fallback correctly
infra(cdk): add marketplace IAM permissions to Lambda role
chore(deps): bump flutter_bloc to 9.1.0
```

---

## Pull requests

1. Branch off `main`: `git checkout -b feat/your-feature`
2. Make your changes, commit with Conventional Commits.
3. Open a PR against `main` — the PR template will guide you.
4. Ensure all CI checks pass (lint, type-check).
5. Request a review from a CODEOWNER.
6. Add a `CHANGELOG.md` entry under `[Unreleased]`.
7. Squash and merge once approved.

### PR size guideline

Keep PRs focused. A PR that changes more than ~400 lines of non-generated code is likely doing too much — consider splitting it.

---

## Code style

### TypeScript (identification + infra)

- **Formatter:** Prettier — run `npm run format` from the root.
- **Linter:** ESLint — run `npm run lint`.
- Strict TypeScript (`"strict": true`). No `any` without a comment explaining why.
- Prefer `const` over `let`; avoid `var`.
- Use named exports; avoid default exports except for framework entry points.

### Dart / Flutter (mobile)

- Follow the [Dart style guide](https://dart.dev/effective-dart/style).
- Run `flutter analyze` before committing.
- Use `flutter format .` to format.
- All business logic goes in the domain or cubit layer — keep widgets dumb.
- Use `Either<Failure, T>` (`fpdart`) for all repository/use-case return types.

---

## Testing

```bash
# TypeScript unit tests
cd apps/identification && npm test

# Flutter tests
cd apps/mobile && flutter test

# Infra unit tests
cd infra && npm test
```

All new features should include tests. Bug fixes should include a regression test.

---

## Infrastructure changes

1. Run `npx cdk diff` before opening a PR to review what will change in AWS.
2. Include the `cdk diff` output in the PR description for any infra changes.
3. Destructive changes (S3 bucket deletion, IAM role removal) require explicit sign-off.
4. Never hardcode account IDs, secrets, or access keys in CDK code — use Secrets Manager or context variables.

---

## Mobile changes

- Test on a physical device before opening a PR (simulators miss camera, permissions, and signing behaviour).
- Run in `--release` mode to verify the app works standalone (without the Mac Dart VM).
- If you add a new iOS permission (camera, photos, etc.), update `ios/Runner/Info.plist` with a usage description.
- Keep `pubspec.lock` committed — it ensures reproducible builds.
