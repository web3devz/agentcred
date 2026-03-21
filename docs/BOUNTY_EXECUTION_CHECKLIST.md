# Bounty Execution Checklist (Core First)

## In Scope Now
1. Base
2. OpenServ
3. MetaMask Delegations
4. Protocol Labs (ERC-8004 Receipts)
5. Filecoin (Pinata / Agentic Storage)
6. Status Gasless

## Optional Later
7. Locus

---

## Track-by-track completion gates

### Base
- [ ] Onchain create/fund/release flow executed on Base Sepolia
- [ ] Tx hashes recorded in demo evidence

### OpenServ
- [x] OpenServ API key path wired and callable (`/integrations/openserv/health`, scoring hook)
- [x] Live key execution evidence captured (`docs/LIVE_PROOF_EVIDENCE.md`)

### MetaMask Delegations
- [x] Delegation verification endpoint implemented (`/delegations/verify`)
- [x] Delegation envelope endpoint implemented (`/delegations/envelope`)
- [x] Delegated action support added for protected release operation
- [ ] Collect signed delegation evidence in docs for final submission

### Protocol Labs (ERC-8004)
- [x] Receipt payload emitted in ERC-8004 structure
- [x] Evidence file with hashed receipt + ERC-8004 payload (`docs/LIVE_PROOF_EVIDENCE.json`)

### Filecoin / Pinata
- [x] Pinata JSON pinning client implemented
- [x] End-to-end run with real PINATA_JWT producing ipfs:// CID (`docs/LIVE_PROOF_EVIDENCE.*`)

### Status Gasless
- [x] Status gasless intent envelope endpoint (`/status/gasless/envelope`)
- [x] Status gasless signed execution endpoint (`/status/gasless/release`)
- [x] Status integration health endpoint (`/integrations/status/health`)
- [ ] One successful on-network gasless operation captured in evidence

---

## Evidence artifacts required
- [x] `docs/FULL_E2E_RESULT.json` updated
- [x] `docs/SUBMISSION_READY.md` updated with new track evidence
- [ ] Workflow links attached for latest commit (after final push run)
