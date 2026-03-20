'use client';

import { apiPost } from '../lib/api';

type Milestone = {
  id: number;
  title: string;
  amount: number;
  status: string;
};

export default function JobActions({ id, milestones, onDone }: { id: number; milestones: Milestone[]; onDone: () => void }) {
  async function run(path: string, body: any = {}) {
    try {
      await apiPost(path, body);
      onDone();
    } catch (e) {
      alert(String(e));
    }
  }

  return (
    <div style={{ display: 'grid', gap: 8 }}>
      {milestones.map((m) => (
        <div key={m.id} style={{ border: '1px solid #2b3b66', borderRadius: 8, padding: 8 }}>
          <div><b>M{m.id + 1}</b> {m.title} • amount: {m.amount} • status: {m.status}</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 6 }}>
            <button onClick={() => run(`/jobs/${id}/milestones/${m.id}/receipt`, { artifactUrl: 'ipfs://demo', summary: `${m.title} completed`, logs: ['ok'] })}>Submit Receipt</button>
            <button onClick={() => run(`/jobs/${id}/milestones/${m.id}/score`)}>Run Verify</button>
            <button onClick={() => run(`/jobs/${id}/milestones/${m.id}/release`)}>Release Payout</button>
          </div>
        </div>
      ))}
    </div>
  );
}
