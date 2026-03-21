'use client';

import { useState } from 'react';
import { apiPost } from '../lib/api';

type Milestone = {
  id: number;
  title: string;
  amount: number;
  status: string;
  receipt?: unknown;
};

type Inputs = Record<number, { artifactUrl: string; summary: string; logs: string }>;

export default function JobActions({ id, milestones, onDone }: { id: number; milestones: Milestone[]; onDone: () => void }) {
  const [loadingKey, setLoadingKey] = useState<string | null>(null);
  const [inputs, setInputs] = useState<Inputs>({});

  function setField(mid: number, field: 'artifactUrl' | 'summary' | 'logs', value: string) {
    setInputs((prev) => ({
      ...prev,
      [mid]: { artifactUrl: prev[mid]?.artifactUrl || '', summary: prev[mid]?.summary || '', logs: prev[mid]?.logs || '', [field]: value }
    }));
  }

  async function run(path: string, body: any = {}, key: string) {
    try {
      setLoadingKey(key);
      await apiPost(path, body);
      onDone();
    } catch (e) {
      alert(String(e));
    } finally {
      setLoadingKey(null);
    }
  }

  return (
    <div className="row">
      {milestones.map((m) => {
        const input = inputs[m.id] || { artifactUrl: '', summary: '', logs: '' };
        const logs = input.logs.split('\n').map((x) => x.trim()).filter(Boolean);
        const isReleased = m.status === 'RELEASED';
        const canRelease = m.status === 'APPROVED';
        const hasReceipt = Boolean(m.receipt) || Boolean(input.artifactUrl && input.summary);
        return (
          <div key={m.id} className="milestone">
            <div className="milestone-title">M{m.id + 1} • {m.title}</div>
            <div className="small">Amount: {m.amount} • Status: <span className={m.status === 'RELEASED' ? 'ok' : ''}>{m.status}</span></div>

            {isReleased ? (
              <p className="small" style={{ marginTop: 8 }}>Payout released. This milestone is now closed.</p>
            ) : (
              <>
                <div className="row" style={{ marginTop: 8 }}>
                  <input className="input" placeholder="Artifact URL (ipfs://... or https://...)" value={input.artifactUrl} onChange={(e) => setField(m.id, 'artifactUrl', e.target.value)} />
                  <textarea className="textarea" placeholder="Receipt summary" value={input.summary} onChange={(e) => setField(m.id, 'summary', e.target.value)} />
                  <textarea className="textarea" placeholder="Logs (one line per entry)" value={input.logs} onChange={(e) => setField(m.id, 'logs', e.target.value)} />
                </div>

                <div className="actions">
                  <button
                    className="btn"
                    disabled={loadingKey !== null || !input.artifactUrl || !input.summary}
                    onClick={() => run(`/jobs/${id}/milestones/${m.id}/receipt`, { artifactUrl: input.artifactUrl, summary: input.summary, logs }, `receipt-${m.id}`)}
                  >
                    {loadingKey === `receipt-${m.id}` ? 'Submitting…' : 'Submit Receipt'}
                  </button>
                  <button className="btn" disabled={loadingKey !== null || !hasReceipt} onClick={() => run(`/jobs/${id}/milestones/${m.id}/score`, {}, `score-${m.id}`)}>
                    {loadingKey === `score-${m.id}` ? 'Verifying…' : 'Run Verify'}
                  </button>
                  <button className="btn" disabled={loadingKey !== null || !canRelease} onClick={() => run(`/jobs/${id}/milestones/${m.id}/release`, {}, `release-${m.id}`)}>
                    {loadingKey === `release-${m.id}` ? 'Releasing…' : 'Release Payout'}
                  </button>
                </div>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}
