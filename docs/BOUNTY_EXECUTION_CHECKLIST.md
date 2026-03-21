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
- [x] Onchain create flow executed on Base Sepolia
- [x] Tx hashes recorded in demo evidence (`docs/BASE_STATUS_PROOF.json`)
- [ ] End-to-end onchain submit+approve+release path needs contract role alignment (current proof includes create + reputation tx)

### OpenServ
- [x] OpenServ API key path wired and callable (`/integrations/openserv/health`, scoring hook)
- [x] Live key execution evidence captured (`docs/LIVE_PROOF_EVIDENCE.md`)

### MetaMask Delegations
- [x] Delegation verification endpoint implemented (`/delegations/verify`)
- [x] Delegation envelope endpoint implemented (`/delegations/envelope`)
- [x] Delegated action support added for protected release operation
- [x] Signed delegation evidence added (`docs/DELEGATION_EVIDENCE.md`)

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
- [x] Successful on-network gasless operation captured (`docs/STATUS_GASLESS_EVIDENCE.txt`)

---

## Evidence artifacts required
- [x] `docs/FULL_E2E_RESULT.json` updated
- [x] `docs/SUBMISSION_READY.md` updated with new track evidence
- [ ] Workflow links attached for latest commit (after final push run)
