# AgentCred — Submission Ready Bundle

## 1) One-line Pitch
**AgentCred** is a verifiable agent reputation + escrow hiring network with cryptographic build provenance and secure runtime transport checks (TLS 1.3 + mTLS + attestation-bound requests).

---

## 2) What We Built

### Core Product
- Verifiable reputation + escrow-focused architecture for agent hiring workflows.
- Components:
  - `apps/web` — user-facing frontend
  - `apps/api` — service layer
  - `apps/worker` — async orchestration
  - `contracts/*` — escrow/reputation contracts

### Trust/Security Layer
- **Supply-chain verification pipeline**
  - deterministic install (`npm ci`)
  - tests + build
  - SBOM generation
  - build provenance attestations
- **Runtime secure gateway** (`src/server.js`)
  - TLS 1.3
  - mTLS
  - optional client-cert pinning
  - optional `x-tee-attestation` request binding

---

## 3) Judge-Facing Verifiability Claims

### ✅ Source Provenance (Complete)
- Workflow: `Supply Chain Verification`
- Evidence snapshot: `docs/PROVENANCE_STATUS.md`
- Includes SBOM + provenance attestations

### ✅ Build/Release Pipeline (Complete)
- Workflow: `Container Build & Push`
- Evidence snapshot: `docs/PROVENANCE_STATUS.md`

### ✅ Runtime Transport Security (Bridge Mode Complete)
- E2E evidence: `docs/E2E_EVIDENCE.txt` (`E2E_VERIFY_OK`)
- Enforced controls:
  - mTLS client auth
  - cert pin check
  - attestation token check

### ✅ Bounty Track Implementation Evidence (Core)
- **Protocol Labs (ERC-8004 Receipts)**
  - Receipt payload contains `receipt.erc8004` + deterministic `receipt.hash`
- **Filecoin (Pinata path)**
  - Pinata client integrated (`apps/api/src/clients/pinata.js`)
  - `artifactPayload -> ipfs://CID` path enabled when `PINATA_JWT` is set
- **OpenServ**
  - Real scoring integration path + health endpoint
- **MetaMask Delegations**
  - EIP-712 delegation envelope/verify endpoints + delegated release authorization
- **Status Gasless**
  - EIP-712 gasless envelope + signed release relay endpoint

Evidence files:
- `docs/API_INTEGRATION_EVIDENCE.md`
- `docs/LIVE_PROOF_EVIDENCE.md`
- `docs/LIVE_PROOF_EVIDENCE.json`

> Note: live OpenServ + Pinata proof completed and captured. Status relayer tx hash requires configured Status relayer credentials/network.

---

## 4) Architecture Snapshot
1. User/app calls AgentCred service over TLS 1.3.
2. Gateway requires valid client certificate (mTLS).
3. Optional cert pin hash must match configured identity.
4. Optional attestation token must match expected value.
5. Trusted requests reach API/worker + onchain modules.
6. CI provides provenance + SBOM evidence tied to commit/workflow.

---

## 5) Live Demo Script (3–5 min)

### Demo Setup
```bash
npm ci
bash tls/gen-dev-certs.sh
npm run verify:e2e
```
Expected: `E2E_VERIFY_OK`

### Demo Flow
1. Show repo + trust docs (`README.md`, `docs/PROVENANCE_STATUS.md`).
2. Open successful workflow runs on GitHub.
3. Show SBOM artifact presence.
4. Show secure runtime checks:
   - valid request succeeds
   - bad attestation fails (403)
5. Show `/evidence` endpoint output proving active controls.

---

## 6) Ops/Deployment
- Runbook: `docs/DEPLOYMENT_RUNBOOK.md`
- K8s manifests:
  - `k8s/deployment.yaml`
  - `k8s/service.yaml`
  - `k8s/secrets.template.yaml`

---

## 7) Final Checklist
- [x] Repo hygiene + security docs
- [x] CI hardening guidance + CODEOWNERS
- [x] Provenance workflow passing
- [x] SBOM artifact present
- [x] Runtime TLS/mTLS/attestation checks passing
- [x] Deployment runbook + secrets template
- [x] Judge-ready summary and demo script

---

## 8) Commit Reference
Latest submission commit (at time of bundle):
- `e86c578`
