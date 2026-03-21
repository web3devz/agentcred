const runs = new Map();

export function createRun(input) {
  const id = `run_${Date.now()}_${Math.floor(Math.random() * 1e6)}`;
  const run = {
    id,
    status: 'QUEUED',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    input,
    steps: [],
    output: null,
    error: null,
  };
  runs.set(id, run);
  return run;
}

export function updateRun(id, patch) {
  const run = runs.get(id);
  if (!run) return null;
  const next = { ...run, ...patch, updatedAt: new Date().toISOString() };
  runs.set(id, next);
  return next;
}

export function appendStep(id, step) {
  const run = runs.get(id);
  if (!run) return null;
  run.steps.push({ at: new Date().toISOString(), ...step });
  run.updatedAt = new Date().toISOString();
  runs.set(id, run);
  return run;
}

export function getRun(id) {
  return runs.get(id) || null;
}

export function listRuns() {
  return Array.from(runs.values());
}
