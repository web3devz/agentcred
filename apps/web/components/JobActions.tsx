'use client';

import { apiPost } from '../lib/api';

export default function JobActions({ id, onDone }: { id: number; onDone: () => void }) {
  async function run(path: string, body: any = {}) {
    try {
      await apiPost(`/jobs/${id}/${path}`, body);
      onDone();
    } catch (e) {
      alert(String(e));
    }
  }

  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      <button onClick={() => run('receipt', { artifactUrl: 'ipfs://demo', summary: 'agent finished task', logs: ['ok'] })}>Submit Receipt</button>
      <button onClick={() => run('score')}>Run Verify</button>
      <button onClick={() => run('release')}>Release Payout</button>
    </div>
  );
}
