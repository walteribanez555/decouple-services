# Security Policy

## Supported versions

| Version | Supported |
|---------|:---------:|
| Latest (`main`) | ✅ |
| Previous minor | ✅ security fixes only |
| Older | ❌ |

---

## Reporting a vulnerability

**Do not open a public GitHub issue for security vulnerabilities.**

Please report security issues privately:

- **Email:** walteribanez555@gmail.com
- **Subject:** `[SECURITY] decouple-services — <brief description>`

### What to include

- Description of the vulnerability and its potential impact.
- Steps to reproduce or a proof-of-concept (if applicable).
- Affected component(s): mobile app, identification API, infrastructure, CI/CD.
- Any suggested remediation.

### Response timeline

| Step | Target |
|------|--------|
| Acknowledgement | Within 48 hours |
| Initial assessment | Within 5 business days |
| Fix or workaround | Within 30 days (critical: 7 days) |
| Public disclosure | After fix is deployed and verified |

We follow **coordinated disclosure** — we ask that you give us reasonable time to address the issue before making it public.

---

## Scope

### In scope

- Authentication or authorisation bypass in the API.
- Exposure of PII (identity document data, dates of birth, document numbers).
- Privilege escalation in AWS IAM roles.
- Prompt injection attacks that bypass the age-verification AI analysis.
- Insecure S3 bucket configuration leading to data exposure.
- Secrets or credentials exposed in logs, responses, or the repository.
- Supply-chain attacks via compromised dependencies.

### Out of scope

- Vulnerabilities in AWS-managed services (report directly to [AWS Security](https://aws.amazon.com/security/vulnerability-reporting/)).
- Rate limiting / DoS on public endpoints without demonstrated impact.
- Social engineering of project maintainers.
- Issues in dependencies that have no available fix upstream.

---

## Security design notes

- **Identity document images** are stored in a private S3 bucket, deleted immediately after the Bedrock analysis completes. A 2-day lifecycle rule acts as a safety net.
- **AI prompt injection** is mitigated in the system prompt — embedded instructions in document images cannot override the model's role or output format.
- **Secrets** are stored in AWS Secrets Manager and injected at Lambda cold-start. No secrets are committed to the repository or logged.
- **IAM roles** follow least-privilege — the Lambda role has only the permissions required to read/write the verification bucket, invoke the Bedrock model, and read the app secret.
- **HTTPS** is enforced end-to-end: S3 presigned URLs enforce SSL, and API Gateway serves HTTPS only.
