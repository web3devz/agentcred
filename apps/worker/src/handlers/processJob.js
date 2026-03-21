import { appendStep, updateRun } from '../state/store.js';
import { planTask, executeTask, finalizeReport } from '../orchestrators/openserv.js';

const STATES = {
  QUEUED: 'QUEUED',
  PLANNING: 'PLANNING',
  EXECUTING: 'EXECUTING',
  VERIFYING: 'VERIFYING',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED'
};

export async function processJob(run) {
  try {
    updateRun(run.id, { status: STATES.PLANNING });
    appendStep(run.id, { state: STATES.PLANNING, message: 'Creating execution plan' });

    const plan = await planTask(run.input);
    appendStep(run.id, { state: STATES.PLANNING, message: 'Plan ready', planId: plan.planId });

    updateRun(run.id, { status: STATES.EXECUTING });
    const results = [];

    for (const task of plan.tasks) {
      appendStep(run.id, { state: STATES.EXECUTING, task: task.id, message: 'Task started' });
      const out = await executeTask(task, { runId: run.id });
      results.push(out);
      appendStep(run.id, { state: STATES.EXECUTING, task: task.id, message: 'Task finished', out });
    }

    updateRun(run.id, { status: STATES.VERIFYING });
    appendStep(run.id, { state: STATES.VERIFYING, message: 'Finalizing report' });

    const report = await finalizeReport(results);
    updateRun(run.id, { status: STATES.COMPLETED, output: report });
    appendStep(run.id, { state: STATES.COMPLETED, message: 'Run completed', report });
  } catch (error) {
    updateRun(run.id, { status: STATES.FAILED, error: String(error?.message || error) });
    appendStep(run.id, { state: STATES.FAILED, message: 'Run failed', error: String(error?.message || error) });
  }
}
