# Verification & Trust Completion Guide

This repository now includes two tracks to close your dashboard gaps:

1. **Source Code Verified** (commit/build/dependency provenance)
2. **Verifiable TLS (bridge implementation)**

---

## 1) Source Code Verified (implemented)

### What was added
- GitHub workflow: `.github/workflows/supply-chain-verification.yml`
  - Locks build to `npm ci`
  - Runs test + build
  - Generates SBOM (`sbom.cdx.json`)
  - Attests provenance for source archive + SBOM via `actions/attest-build-provenance@v2`

- Scripts:
  - `npm run sbom`
  - `npm run verify:provenance` (helper check)

### Why this fixes status
This creates a verifiable linkage between:
- Git commit (`github.sha`)
- Build recipe (workflow steps)
- Dependency chain (CycloneDX SBOM)

### Required repo settings (one-time)
- Keep branch protection on `main`
- Require PR reviews
- Require status checks for the supply-chain workflow
- Prefer signed commits/tags

---

## 2) Verifiable TLS (practical bridge implemented)

### Important limitation
True TEE-native verifiable TLS is platform-dependent and may still be marked *coming soon* by your provider.

### What was added now
- `tls/verifiable-tls-gateway.js`
  - TLS 1.3
  - mTLS client-auth
  - Certificate pin enforcement
  - Optional TEE attestation-token header check (`x-tee-attestation`)

- `tls/gen-dev-certs.sh`
  - Generates local CA, server cert, and client cert for testing

### Why this helps
Even before provider-native Verifiable TLS is generally available, this gives:
- stronger channel authenticity (mTLS)
- pinned client identity
- app-level attestation binding to requests

---

## Runbook

```bash
npm ci
bash tls/gen-dev-certs.sh
ALLOWED_CLIENT_CERT_SHA256=<sha256_of_client_cert_raw_hex> \
REQUIRED_ATTESTATION=<opaque_attestation_token> \
npm start
```

Test:
```bash
curl --cert tls/certs/client.crt --key tls/certs/client.key --cacert tls/certs/ca.crt \
  -H "x-tee-attestation: <opaque_attestation_token>" \
  https://localhost:8443/health
```

One-command verification:
```bash
npm run verify:e2e
```

## Deployment manifests

- Docker: `Dockerfile`
- Local compose: `docker-compose.yml`
- Kubernetes: `k8s/deployment.yaml`, `k8s/service.yaml`
- Container publish workflow: `.github/workflows/container-build.yml`

---

## Final notes
- **Source Code Verified:** fully actionable now and should move to complete once CI attestations are produced and consumed by your verifier.
- **Verifiable TLS:** bridge is implemented; full "Complete" depends on the verifier/platform supporting native TEE-bound TLS evidence.
