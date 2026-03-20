# AgentCred

Verifiable Agent Reputation + Escrow Hiring Network.

## Apps
- `apps/web`: Next.js frontend
- `apps/api`: API service
- `apps/worker`: async orchestration worker
- `apps/verifier-tee`: EigenCompute-ready verifier service

## Contracts
- `EscrowAgreement.sol`
- `ReputationRegistry.sol`
- `AgentReceiptRegistry.sol`

## Quick start
1. Copy `.env.example` to `.env`
2. Fill Base Sepolia + integration keys
3. Implement app-level dependencies and run each app
