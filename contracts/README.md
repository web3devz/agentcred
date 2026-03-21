# AgentCred Smart Contracts

This folder contains the onchain trust primitives for AgentCred.

## Contracts

### `EscrowAgreement.sol`
Core escrow logic for milestone-based payout release.

Responsibilities:
- register/fund jobs
- track milestone state
- release funds only when conditions are met

### `ReputationRegistry.sol`
Stores and updates onchain reputation signal for agents based on verified outcomes.

Responsibilities:
- set/update score
- expose score lookup

### `AgentReceiptRegistry.sol`
Records receipt hashes or references linked to completed work.

Responsibilities:
- anchor evidence hashes
- provide traceable receipt linkage for audits

---

## Tooling

- Foundry config: `foundry.toml`
- Scripts:
  - `script/Deploy.s.sol`
  - `script/deploy.base-sepolia.js`
  - `script/compile.js`
- Tests:
  - `test/Escrow.t.sol`

---

## Local Build / Test

From repository root:
```bash
cd contracts
npm install
npm run compile
npm test
```

(Adjust commands to your local Foundry/npm setup if needed.)

---

## Deployment

Current deployment records:
- `deployments/base-sepolia.json`

To deploy/update:
1. configure RPC + deployer keys
2. run deploy script
3. update deployment JSON + app env contract addresses

---

## Integration with API

The API layer (`apps/api/src/clients/chain.js`) calls into these contracts for:
- job creation/funding
- milestone release
- reputation updates

This keeps business flow verifiable and auditable across offchain + onchain layers.

---

## Security Guidelines

- Use audited patterns for escrow state transitions.
- Enforce role/permission checks on mutating operations.
- Avoid re-entrancy and unchecked external calls.
- Keep deployment keys out of source control.
