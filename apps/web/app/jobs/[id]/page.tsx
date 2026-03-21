'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { apiGet } from '../../../lib/api';

type Receipt = {
  artifactUrl?: string;
  summary?: string;
  logs?: string[];
  submittedAt?: string;
  hash?: string;
};

type Milestone = {
  id: number;
  title: string;
  amount: number;
  status: string;
  receipt?: Receipt | null;
  score?: number | null;
  verdict?: string | null;
};

type Job = {
  id: number;
  title: string;
  client: string;
  agent: string;
  amount: number;
  status: string;
  createdAt?: string;
  releasedAt?: string | null;
  onchain?: Record<string, unknown> | null;
  milestones: Milestone[];
};

function asText(v: unknown) {
  if (typeof v === 'string') return v;
  if (typeof v === 'number') return String(v);
  return null;
}

function extractTxCandidates(obj: unknown, acc: string[] = []) {
  if (!obj || typeof obj !== 'object') return acc;
  for (const [k, v] of Object.entries(obj)) {
    if (typeof v === 'string' && /hash|tx|transaction/i.test(k)) acc.push(v);
    if (v && typeof v === 'object') extractTxCandidates(v, acc);
  }
  return Array.from(new Set(acc));
}

export default function JobDetailsPage() {
  const params = useParams<{ id?: string }>();
  const jobId = Number(params?.id);

  const [job, setJob] = useState<Job | null>(null);
  const [rep, setRep] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const j = await apiGet(`/jobs/${jobId}`);
      setJob(j);
      if (j?.agent) {
        const r = await apiGet(`/reputation/${j.agent}`);
        setRep(typeof r?.score === 'number' ? r.score : null);
      }
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (Number.isNaN(jobId)) return;
    load();
  }, [jobId]);

  const timeline = useMemo(() => {
    if (!job) return [];
    const items: Array<{ at: string; label: string; detail: string }> = [];

    if (job.createdAt) {
      items.push({
        at: job.createdAt,
        label: 'Job Created',
        detail: `${job.title} funded for total ${job.amount}`,
      });
    }

    for (const m of job.milestones || []) {
      if (m.receipt?.submittedAt) {
        items.push({
          at: m.receipt.submittedAt,
          label: `Milestone ${m.id + 1} Receipt Submitted`,
          detail: m.receipt.hash ? `Receipt hash ${m.receipt.hash}` : m.title,
        });
      }

      if (m.verdict || typeof m.score === 'number') {
        items.push({
          at: m.receipt?.submittedAt || job.createdAt || new Date().toISOString(),
          label: `Milestone ${m.id + 1} Verified`,
          detail: `Verdict ${m.verdict || 'n/a'} | Score ${m.score ?? 'n/a'}`,
        });
      }

      if (m.status === 'RELEASED') {
        items.push({
          at: job.releasedAt || m.receipt?.submittedAt || job.createdAt || new Date().toISOString(),
          label: `Milestone ${m.id + 1} Released`,
          detail: `Payout ${m.amount} released`,
        });
      }
    }

    if (job.releasedAt) {
      items.push({
        at: job.releasedAt,
        label: 'Job Closed',
        detail: 'All milestones released',
      });
    }

    return items.sort((a, b) => a.at.localeCompare(b.at));
  }, [job]);

  if (Number.isNaN(jobId)) {
    return (
      <main className="grid">
        <section className="panel">
          <h2>Invalid Job Id</h2>
          <p className="small">The job id in the URL is not a number.</p>
        </section>
      </main>
    );
  }

  return (
    <main className="grid">
      <section className="panel dashboard-head">
        <div>
          <p className="kicker">Job Evidence View</p>
          <h2>Job #{jobId} Detail</h2>
          <p className="small">Timeline, verifier evidence, and onchain transaction context for this job.</p>
        </div>
        <div className="cta-row">
          <button type="button" className="btn" onClick={load} disabled={loading}>{loading ? 'Refreshing...' : 'Refresh'}</button>
          <Link href="/dashboard" className="btn btn-ghost">Back to Dashboard</Link>
        </div>
      </section>

      {error ? (
        <section className="panel"><p className="small">{error}</p></section>
      ) : null}

      {loading && !job ? (
        <section className="panel"><p className="small">Loading job details...</p></section>
      ) : null}

      {job ? (
        <>
          <section className="panel">
            <h3>Summary</h3>
            <div className="detail-grid">
              <div className="metric-card"><span>Status</span><b>{job.status}</b></div>
              <div className="metric-card"><span>Total Escrow</span><b>{job.amount}</b></div>
              <div className="metric-card"><span>Milestones</span><b>{job.milestones.length}</b></div>
              <div className="metric-card"><span>Agent Reputation</span><b>{rep ?? 'n/a'}</b></div>
            </div>
            <div className="meta">Client: {job.client}</div>
            <div className="meta">Agent: {job.agent}</div>
            <div className="meta">Created: {asText(job.createdAt) || 'n/a'}</div>
            <div className="meta">Released: {asText(job.releasedAt) || 'n/a'}</div>
          </section>

          <section className="panel">
            <h3>Execution Timeline</h3>
            {timeline.length === 0 ? (
              <p className="small">No timeline events available yet.</p>
            ) : (
              <ol className="timeline">
                {timeline.map((t, idx) => (
                  <li key={`${t.at}-${idx}`}>
                    <div className="timeline-dot" />
                    <div>
                      <div className="timeline-label">{t.label}</div>
                      <div className="small">{t.at}</div>
                      <div className="meta">{t.detail}</div>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </section>

          <section className="panel">
            <h3>Verifier Evidence</h3>
            <div className="jobs">
              {job.milestones.map((m) => (
                <article key={m.id} className="milestone">
                  <div className="milestone-title">M{m.id + 1} • {m.title}</div>
                  <div className="small">Status: {m.status} • Amount: {m.amount}</div>
                  <div className="meta">Verdict: {m.verdict || 'pending'} • Score: {m.score ?? 'n/a'}</div>
                  <div className="meta">Artifact: {m.receipt?.artifactUrl || 'n/a'}</div>
                  <div className="meta">Receipt Hash: {m.receipt?.hash || 'n/a'}</div>
                  <div className="meta">Summary: {m.receipt?.summary || 'n/a'}</div>
                  {Array.isArray(m.receipt?.logs) && m.receipt?.logs.length ? (
                    <ul className="logs-list">
                      {m.receipt.logs.map((line, idx) => <li key={idx}>{line}</li>)}
                    </ul>
                  ) : null}
                </article>
              ))}
            </div>
          </section>

          <section className="panel">
            <h3>Onchain Transactions</h3>
            {job.onchain ? (
              <>
                <div className="tx-tags">
                  {extractTxCandidates(job.onchain).length ? (
                    extractTxCandidates(job.onchain).map((tx, idx) => (
                      <span key={idx} className="badge">{tx}</span>
                    ))
                  ) : (
                    <span className="small">No tx hash-like fields found on this job record yet.</span>
                  )}
                </div>
                <pre className="json-panel">{JSON.stringify(job.onchain, null, 2)}</pre>
              </>
            ) : (
              <p className="small">No onchain payload found yet for this job.</p>
            )}
          </section>
        </>
      ) : null}
    </main>
  );
}
