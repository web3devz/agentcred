# AgentCred Architecture (MVP)

## Product Loop
1. Client posts job + funds escrow
2. OpenServ agents execute
3. Worker submits artifacts + receipt hashes
4. Verifier computes score / checks completion
5. Client approves milestone
6. Payout released
7. Reputation updated onchain

## System Components

### 1) apps/web (Next.js UI)
- Wallet connect
- Job creation and status timeline
- Escrow milestone actions
- Receipt viewer
- Reputation profile

### 2) apps/api (Node/TS backend)
- REST API for jobs, agreements, receipts, reputation reads
- Webhook/event intake from agents and chain indexer
- Auth/session for non-wallet user actions if needed

### 3) apps/worker (queue + orchestrator)
- OpenServ orchestration hooks
- Artifact processing
- Receipt canonicalization/hash generation
- Score trigger jobs

### 4) contracts (Solidity on Base)
- EscrowAgreement.sol
- ReputationRegistry.sol
- optional: AgentIdentityAdapter.sol (ERC-8004 mapping)

### 5) packages/shared
- Shared types (Job, Milestone, Receipt, Score)
- Validation schemas
- Constants

### 6) packages/agents-sdk
- OpenServ task contracts
- Agent event DTOs
- Execution report helpers

### 7) packages/scoring-sdk
- Verifier adapter interfaces
- Local scorer + EigenCompute-compatible adapter contract

### 8) infra
- Docker compose/dev infra
- deployment templates

## Data & Evidence Flow
- Artifact bundle -> IPFS/object storage
- Hash committed in API DB and optionally onchain
- Verifier output signed + attached to milestone
- Release tx references receipt/score IDs

## Non-goals for MVP
- Full dispute court
- Complex tokenomics
- Multi-chain settlement

## Success Criteria (Hackathon)
- End-to-end demoable happy path
- At least one real contract deployment (testnet)
- One real agent execution producing receipts
- One payout release and reputation update
