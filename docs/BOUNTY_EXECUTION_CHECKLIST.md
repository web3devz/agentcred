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
- [ ] OpenServ API key path wired and callable
- [ ] At least one real orchestration action captured in logs

### MetaMask Delegations
- [x] Delegation verification endpoint implemented (`/delegations/verify`)
- [x] Delegation envelope endpoint implemented (`/delegations/envelope`)
- [x] Delegated action support added for protected release operation
- [ ] Collect signed delegation evidence in docs for final submission

### Protocol Labs (ERC-8004)
- [x] Receipt payload emitted in ERC-8004 structure
- [ ] Evidence file with sample signed/hashed receipt and validation

### Filecoin / Pinata
- [x] Pinata JSON pinning client implemented
- [ ] End-to-end run with real PINATA_JWT producing ipfs:// CID

### Status Gasless
- [ ] Status gasless transaction path integrated
- [ ] One successful gasless operation captured in evidence

---

## Evidence artifacts required
- [ ] `docs/FULL_E2E_RESULT.json` updated
- [ ] `docs/SUBMISSION_READY.md` updated with new track evidence
- [ ] Workflow links attached for latest commit
