# Judge Package (Step 6)

## Project
**AgentCred** — Verifiable Agent Reputation + Escrow Hiring Network

## What is verifiable now
1. **Source Provenance**
   - Workflow: `Supply Chain Verification`
   - Run: https://github.com/web3devz/agentcred/actions/runs/23372859298
   - Status: ✅ success
   - Includes:
     - deterministic install (`npm ci`)
     - test + build
     - SBOM generation (`sbom.cdx.json`)
     - provenance attestations for source archive and SBOM

2. **Container Build/Publish**
   - Workflow: `Container Build & Push`
   - Run: https://github.com/web3devz/agentcred/actions/runs/23372859306
   - Status: ✅ success

3. **Runtime transport verification (bridge mode)**
   - TLS 1.3 + mTLS + cert pin + attestation-token check
   - Local E2E proof: `docs/e2e-latest.log` contains `E2E_VERIFY_OK`

## What is bridge-mode today
- Provider-native TEE-bound verifiable TLS may be platform-dependent.
- Current implementation enforces practical request binding + channel authenticity now.

## Commit & Build Recipe
- Commit: `b48eb06328c2121a8e62fc6617f1aff2b21ca9c8`
- Build recipe is encoded in:
  - `.github/workflows/supply-chain-verification.yml`
  - `.github/workflows/container-build.yml`

## Threat Model (short)
- Prevent unauthorized clients: mTLS + optional cert pinning
- Prevent spoofed execution claims: attestation token binding
- Prevent tampered dependency chain: SBOM + CI provenance attestations
- Prevent unsafe release merges: branch protection + required checks (see `docs/SECURITY_CHECKLIST.md`)
