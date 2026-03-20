# packages/shared

Shared data contracts for AgentCred apps.

## Includes
- `types.ts`: Job, Milestone, Receipt, VerifierResult
- `schemas.ts`: minimal required-field contracts used by API/worker/verifier

These contracts keep the core loop payloads consistent:
`Job -> Receipt -> VerifierResult -> Release -> Reputation`
