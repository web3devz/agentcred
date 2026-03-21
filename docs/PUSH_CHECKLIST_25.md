# AgentCred — 25 Push Build Checklist (Prize-Oriented)

Goal: ship a demo-ready, judge-friendly product that maps clearly to target bounties.

## Phase A — Foundation (Pushes 1-5)
1. **Build plan lock-in + API vertical slice** (jobs/receipts/scoring/release) ✅
2. Contract v1 interfaces + events + role guards
3. Foundry/JS deploy scripts for Base Sepolia ✅
4. Shared schemas (Job/Milestone/Receipt/VerifierResult) ✅
5. Frontend scaffold with core pages and API integration layer ✅

## Phase B — Core Product Loop (Pushes 6-12)
6. Create job + milestone flow in UI ✅
7. Escrow interaction wiring (fund/create/release) ✅
8. Worker queue skeleton with orchestration states
9. OpenServ adapter (task request + status polling interface)
10. Receipt ingest + hash pipeline
11. Verifier-TEE request/response signing format
12. Reputation update trigger after release

## Phase C — Bounty Wrappers (Pushes 13-19)
13. EigenCompute deployable verifier container hardening
14. OpenServ multi-agent route (planner/worker/verifier hooks)
15. Arkhai-compatible escrow extension points
16. Octant evaluation report format (public-goods metrics view)
17. MetaMask Delegations adapter for permissioned agent actions
18. Status gasless transaction path (adapter + docs)
19. ERC-8004 receipts mapping + Base Agent Services registration docs

## Phase D — Reliability + Demo (Pushes 20-25)
20. End-to-end local demo script + seed data
21. CI checks + formatting + lint baseline
22. Error handling + retry strategy + audit logs
23. Judge mode dashboard (proofs, tx hashes, receipts)
24. Final pitch artifacts (architecture, track mapping, demo runbook)
25. Submission freeze commit + release tag + verification checklist

## Build rule
- Every push must improve the **core loop**:
  `Job -> Escrow -> Agent Execution -> Receipt -> Verifier Score -> Release -> Reputation`
