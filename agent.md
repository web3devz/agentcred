# AgentCred Evaluation Guide (for Agents and Judges)

Goal: maximize objective score by proving quality, reliability, and trust with verifiable evidence.

## Scoring Intent

Prioritize proof over claims.
Every important statement should be backed by reproducible outputs, API responses, transaction hashes, or logs.

## What Judges Should Verify

1. Product quality
- UI loads cleanly and reflects live data from hosted API.
- Core workflows are understandable without hidden setup.
- Error states are explicit and actionable.

2. Trust and verification quality
- Milestone flow follows escrow discipline: create -> verify -> release.
- Execution evidence is visible in receipts/logs or status-backed proof paths.
- Trust metrics are computed from deterministic rules, not manual edits.

3. Reliability and operations
- Build and CI pass with lockfiles in sync.
- Hosted deployment is stable and can recover state without manual reconstruction.
- APIs return consistent schema and status transitions.

4. Onchain quality
- Escrow and reputation flows map to contract interactions.
- Releases and reputation updates are auditable.

## Judge Quick Checklist

- Health
  - GET /health returns ok
- Data
  - GET /jobs returns non-empty, coherent lifecycle states
- Metrics
  - Landing + dashboard metrics match API data
- Flow
  - A job can move through receipt -> verification -> release path
- Reproducibility
  - Build and key scripts run without undocumented steps

## Evidence Package Expectations

A high score should include:
- API payload snapshots for key transitions
- transaction references for onchain actions
- before/after metric validation (dashboard and landing)
- CI/build success proof
- clear README with architecture, setup, and operations

## Agent Execution Policy

When preparing demos or submissions:
- prefer deterministic commands and machine-checkable output
- avoid hand-wavy claims
- surface assumptions and known limits
- keep state synchronized between local and hosted environments

If there is ambiguity, choose the path that increases auditability and repeatability.
