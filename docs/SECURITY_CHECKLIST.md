# Security & Release Checklist

## 1) Branch protection (GitHub Settings)
Repository: `web3devz/agentcred`

Configure **main** branch protection:
- Require pull request before merging
- Require approvals: `>= 1`
- Dismiss stale approvals on new commits
- Require conversation resolution
- Require status checks before merging
- Include administrators
- Restrict force pushes

### Required status checks
- `Supply Chain Verification / verify-build-and-attest`
- `Container Build & Push / build-and-push`

## 2) Commit integrity
Recommended:
- Require signed commits
- Protect tags used for releases

## 3) Secret hygiene
- Keep secrets only in:
  - GitHub Actions Secrets
  - Local secret manager
- Never store tokens in repo files
- Rotate credentials if accidentally exposed

Quick local scan:
```bash
grep -R --line-number --exclude-dir=.git --exclude-dir=node_modules -E "github_pat_|ghp_|BEGIN (RSA|OPENSSH|EC|PRIVATE KEY)" .
```

## 4) Provenance verification
After each merge to `main`:
- Confirm `Supply Chain Verification` workflow succeeded
- Confirm SBOM artifact uploaded
- Confirm build attestation generated

## 5) Runtime verification
Before demo/deploy:
```bash
npm run verify:e2e
```
Must output:
- `E2E_VERIFY_OK`

## 6) Deployment checklist
- Publish container image (GHCR workflow)
- Deploy manifests from `k8s/`
- Inject runtime secrets (`ALLOWED_CLIENT_CERT_SHA256`, `REQUIRED_ATTESTATION`)
- Verify `/health` and `/evidence` endpoints over mTLS
