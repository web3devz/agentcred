# MEMORY

Persistent working memory (user requested saving context as of now).

## Session Snapshot (2026-03-20 UTC)

### Recent timeline
1. User sent heartbeat prompt.
2. Heartbeat checks were executed in parts due to approval-gated exec.
3. Final heartbeat response returned: `HEARTBEAT_OK`.
4. User requested scoring of 3 ideas by different parameters.
5. Assistant requested the 3 ideas; user confirmed interest.
6. User asked why past context was not remembered.
7. Assistant explained session-context limits and offered persistent storage.
8. User requested: "as of now please save context everything".

### User goals currently active
- Preserve context reliably so future chats don’t lose continuity.
- Score and rank 3 ideas once they are provided.

### Known pending items
- Waiting for user to provide the 3 ideas for scoring.

## Decision Memory

- Memory persistence enabled manually via workspace files.
- Store future updates in:
  - `USER.md` (profile/preferences)
  - `MEMORY.md` (ongoing session/project memory)
  - `ideas_scorecard.md` (idea scoring and ranking history; create when ideas arrive)

## Execution Notes

- Runtime environment checks completed successfully during heartbeat.
- Tool executions may require explicit approval in this environment.

## Recovered Prior Chat Context (provided by user)

- Date reference: 2026-03-19 around 08:15 UTC.
- Prior async command had succeeded and returned workspace listing with entries including:
  - `hackathon_agent/`
  - `memory.json`
  - `node_modules/`
  - `package-lock.json`
  - `package.json`
  - `requirements.txt`
  - `skills/`
- Identity/motto reference in prior chat: **"Prompt in. Product out."**
- User and assistant aligned on a **blockchain hackathon specialist** direction.
- Proposed execution flow from prior chat:
  1. high-win idea selection
  2. architecture
  3. 24–48h MVP build plan
  4. pitch + demo script

## Update Rule Going Forward

When user says “save this”, append structured updates here and refresh USER.md if personal preferences changed.
