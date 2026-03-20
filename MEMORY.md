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

## Update Rule Going Forward

When user says “save this”, append structured updates here and refresh USER.md if personal preferences changed.
