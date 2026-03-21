# AgentCred

Verifiable Agent Reputation + Escrow Hiring Network.

## Components
- `apps/web` — Next.js frontend
- `apps/api` — API service
- `apps/worker` — async orchestration worker
- `apps/verifier-tee` — verifier service
- `contracts/*` — escrow + reputation contracts
- `src/server.js` — secure runtime gateway (TLS1.3 + mTLS + attestation header check)

## Security / Trust Model
This repo includes two trust tracks:

1. **Source Code Verification**
   - CI workflow: `.github/workflows/supply-chain-verification.yml`
   - Produces build attestation + SBOM artifact (`sbom.cdx.json`)

2. **Verifiable TLS (bridge mode)**
   - Runtime: `src/server.js`
   - Enforces TLS 1.3, mTLS, optional cert pinning, optional attestation-token binding

> Note: Full provider-native verifiable TLS support depends on platform capabilities. Current bridge mode gives strong practical transport guarantees now.

## Quick Start
```bash
cp .env.example .env
npm ci
bash tls/gen-dev-certs.sh
npm run verify:e2e
```

Expected success output:
- `E2E_VERIFY_OK`

## Required Secrets / Env
Use `.env.example` as baseline.
Never commit real secrets.

## CI Hardening Checklist
See `docs/SECURITY_CHECKLIST.md` for:
- branch protection rules
- required status checks
- signed commits recommendation
- secret scanning + provenance verification steps
