# AgentCred Final Implementation Checklist

This checklist is execution-focused and excludes mock/sample flows.

## A) Product correctness (must pass)
- [ ] Job creation with valid milestone totals only
- [ ] Receipt submission requires real artifact URL + summary
- [ ] Verifier scoring updates milestone state correctly
- [ ] Release only allowed after APPROVED verdict
- [ ] Reputation increments from released milestone score
- [ ] API returns deterministic state on repeated reads

## B) Security & trust (must pass)
- [ ] Supply Chain Verification workflow green
- [ ] SBOM generated and uploaded
- [ ] Provenance attestation steps successful
- [ ] TLS 1.3 + mTLS runtime checks pass
- [ ] E2E secure check prints `E2E_VERIFY_OK`

## C) Full-stack run checks (must pass)
- [ ] Web builds successfully (`@agentcred/web`)
- [ ] API + verifier startup healthy
- [ ] Worker once mode runs successfully
- [ ] Full lifecycle script prints `FULL_E2E_OK`
- [ ] `docs/FULL_E2E_RESULT.json` regenerated after latest changes

## D) UI quality bar (must pass)
- [ ] No hardcoded demo receipt payloads in UI actions
- [ ] Inputs are explicit and validated for each milestone
- [ ] Error handling visible (request failures surfaced)
- [ ] Clean, consistent visual hierarchy in web app
- [ ] No dead components / unused UI code

## E) Bounty execution stack (priority)
1. Base
2. OpenServ
3. MetaMask Delegations
4. Protocol Labs (ERC-8004 Receipts)
5. Filecoin (Pinata / Agentic Storage)
6. Status Gasless
7. Locus

## F) Submission lock
- [ ] README and contracts README reflect final implementation
- [ ] No secrets tracked in git
- [ ] No unnecessary workspace files in repo
- [ ] Final CI run links included in submission package
