import { enqueue, dequeue, size } from './queue/memoryQueue.js';
import { createRun, listRuns } from './state/store.js';
import { processJob } from './handlers/processJob.js';
import { makeDemoJob } from './jobs/demoJob.js';

const ONCE = process.argv.includes('--once');
const POLL_MS = Number(process.env.WORKER_POLL_MS || 700);

async function tick() {
  const item = dequeue();
  if (!item) return;

  const run = createRun(item);
  await processJob(run);
}

async function main() {
  console.log('[worker] starting');

  // bootstrap a demo job if queue is empty
  if (size() === 0) enqueue(makeDemoJob());

  if (ONCE) {
    await tick();
    console.log('[worker] once mode done');
    console.log(JSON.stringify({ runs: listRuns() }, null, 2));
    process.exit(0);
  }

  setInterval(async () => {
    await tick();
  }, POLL_MS);
}

main().catch((e) => {
  console.error('[worker] fatal', e);
  process.exit(1);
});
