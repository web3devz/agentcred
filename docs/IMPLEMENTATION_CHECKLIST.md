# AgentCred Final Implementation Checklist

This checklist is execution-focused and excludes mock/sample flows.

## A) Product correctness (must pass)
- [x] Job creation with valid milestone totals only
- [x] Receipt submission requires real artifact URL + summary (or artifactPayload -> IPFS)
- [x] Verifier scoring updates milestone state correctly
- [x] Release only allowed after APPROVED verdict
- [x] Reputation increments from released milestone score
- [x] API returns deterministic state on repeated reads

## B) Security & trust (must pass)
- [x] Supply Chain Verification workflow green (see docs/PROVENANCE_STATUS.md)
- [x] SBOM generated and uploaded (CI evidence; local gen may vary after upgrades)
- [x] Provenance attestation steps successful (see docs/PROVENANCE_STATUS.md)
- [x] TLS 1.3 + mTLS runtime checks pass
- [x] E2E secure check prints `E2E_VERIFY_OK`

## C) Full-stack run checks (must pass)
- [x] Web builds successfully (`@agentcred/web`)
- [x] API + verifier startup healthy
- [x] Worker once mode runs successfully
- [x] Full lifecycle script prints `FULL_E2E_OK`
- [x] `docs/FULL_E2E_RESULT.json` regenerated after latest changes

## D) UI quality bar (must pass)
- [x] No hardcoded demo receipt payloads in UI actions
- [x] Inputs are explicit and validated for each milestone
- [x] Error handling visible (request failures surfaced)
- [x] Clean, consistent visual hierarchy in web app
- [x] No dead components / unused UI code

## E) Bounty execution stack (priority)
1. Base
2. OpenServ
3. MetaMask Delegations
4. Protocol Labs (ERC-8004 Receipts)
5. Filecoin (Pinata / Agentic Storage)
6. Status Gasless
7. Locus

## F) Submission lock
- [x] README and contracts README reflect final implementation
- [ ] No secrets tracked in git (ensure `.env` not committed; secrets belong in `.env.local`)
- [ ] No unnecessary workspace files in repo (build artifacts excluded by `.gitignore`)
- [x] Final CI run links included in submission package
