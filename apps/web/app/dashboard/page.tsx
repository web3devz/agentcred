'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import NewJobForm from '../../components/NewJobForm';
import JobActions from '../../components/JobActions';
import { apiGet } from '../../lib/api';

type Milestone = {
  id: number;
  title: string;
  amount: number;
  status: string;
  score?: number | null;
  receipt?: unknown;
};

type Job = {
  id: number;
  title: string;
  client: string;
  agent: string;
  amount: number;
  status: string;
  createdAt?: string;
  milestones: Milestone[];
};

function normalizeSeries(values: number[], points = 7) {
  const source = values.length ? values.slice(-points) : [0];
  const max = Math.max(...source, 1);
  const filled = Array.from({ length: points }).map((_, i) => source[source.length - points + i] ?? 0);
  return filled.map((v) => Math.max(6, Math.round((v / max) * 100)));
}

export default function DashboardPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('ALL');
  const [error, setError] = useState<string | null>(null);

  async function load(silent = false) {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const data = await apiGet(`/jobs?t=${Date.now()}`);
      setJobs(Array.isArray(data.items) ? data.items : []);
    } catch (err) {
      setError(String(err));
    } finally {
      if (!silent) setLoading(false);
    }
  }

  useEffect(() => {
    load();

    const timer = window.setInterval(() => {
      load(true);
    }, 5000);

    const onVisible = () => {
      if (document.visibilityState === 'visible') load(true);
    };

    document.addEventListener('visibilitychange', onVisible);

    return () => {
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);

  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      const matchStatus = status === 'ALL' || job.status === status;
      const q = query.trim().toLowerCase();
      const matchQuery =
        !q ||
        String(job.id).includes(q) ||
        job.title.toLowerCase().includes(q) ||
        job.client.toLowerCase().includes(q) ||
        job.agent.toLowerCase().includes(q);
      return matchStatus && matchQuery;
    });
  }, [jobs, query, status]);

  const stats = useMemo(() => {
    const totalEscrow = jobs.reduce((s, j) => s + Number(j.amount || 0), 0);
    const milestones = jobs.flatMap((j) => j.milestones || []);
    const submitted = milestones.filter((m) => !!m.receipt).length;
    const released = milestones.filter((m) => m.status === 'RELEASED').length;
    const activeJobs = jobs.filter((j) => j.status !== 'RELEASED').length;

    const byDay = new Map<string, { count: number; escrow: number }>();
    for (const job of jobs) {
      const day = (job.createdAt || new Date().toISOString()).slice(0, 10);
      const item = byDay.get(day) || { count: 0, escrow: 0 };
      item.count += 1;
      item.escrow += Number(job.amount || 0);
      byDay.set(day, item);
    }

    const sortedDays = Array.from(byDay.entries()).sort((a, b) => a[0].localeCompare(b[0]));
    const jobSeries = normalizeSeries(sortedDays.map((x) => x[1].count));
    const escrowSeries = normalizeSeries(sortedDays.map((x) => x[1].escrow));
    const submittedSeries = normalizeSeries(
      jobs.slice(-7).map((j) => (j.milestones || []).filter((m) => !!m.receipt).length),
      7
    );
    const releasedSeries = normalizeSeries(
      jobs.slice(-7).map((j) => (j.milestones || []).filter((m) => m.status === 'RELEASED').length),
      7
    );
    const activeSeries = normalizeSeries(
      jobs.slice(-7).map((j) => (j.status === 'RELEASED' ? 0 : 1)),
      7
    );

    return {
      totalJobs: jobs.length,
      activeJobs,
      totalEscrow,
      submitted,
      released,
      jobSeries,
      activeSeries,
      submittedSeries,
      releasedSeries,
      escrowSeries,
    };
  }, [jobs]);

  return (
    <main className="grid dashboard-shell">
      <section className="panel dashboard-head ops-hero reveal-on-scroll in-view">
        <div>
          <p className="kicker">AgentCred Protocol Console</p>
          <h2>AgentCred Dashboard</h2>
          <p className="small">Operate autonomous hiring with escrow controls, evidence receipts, verifier checks, and release workflows.</p>
        </div>
        <div className="cta-row">
          <button className="btn" type="button" onClick={() => load()} disabled={loading}>
            {loading ? 'Refreshing...' : 'Refresh Data'}
          </button>
          <Link href="/" className="btn btn-ghost">Back to Landing</Link>
        </div>
      </section>

      <section className="panel reveal-on-scroll in-view" style={{ ['--delay' as string]: '80ms' }}>
        <h3>Network Snapshot</h3>
        {error ? <p className="small">{error}</p> : null}
        <div className="pulse-grid">
          <div className="metric-card">
            <span>Total Jobs</span>
            <b>{stats.totalJobs}</b>
            <div className="sparkline">{stats.jobSeries.map((h, i) => <i key={i} style={{ height: `${h}%` }} />)}</div>
          </div>
          <div className="metric-card">
            <span>Active Jobs</span>
            <b>{stats.activeJobs}</b>
            <div className="sparkline">{stats.activeSeries.map((h, i) => <i key={i} style={{ height: `${h}%` }} />)}</div>
          </div>
          <div className="metric-card">
            <span>Receipts Submitted</span>
            <b>{stats.submitted}</b>
            <div className="sparkline">{stats.submittedSeries.map((h, i) => <i key={i} style={{ height: `${h}%` }} />)}</div>
          </div>
          <div className="metric-card">
            <span>Milestones Released</span>
            <b>{stats.released}</b>
            <div className="sparkline">{stats.releasedSeries.map((h, i) => <i key={i} style={{ height: `${h}%` }} />)}</div>
          </div>
          <div className="metric-card">
            <span>Total Escrow</span>
            <b>{stats.totalEscrow}</b>
            <div className="sparkline">{stats.escrowSeries.map((h, i) => <i key={i} style={{ height: `${h}%` }} />)}</div>
          </div>
        </div>
      </section>

      <NewJobForm onCreated={load} />

      <section className="panel row reveal-on-scroll in-view" style={{ ['--delay' as string]: '140ms' }}>
        <h3>Jobs Board</h3>
        <div className="filters">
          <input
            className="input"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by id, title, client, or agent"
          />
          <select className="select" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="ALL">All statuses</option>
            <option value="FUNDED">FUNDED</option>
            <option value="COMPLETED">COMPLETED</option>
            <option value="RELEASED">RELEASED</option>
          </select>
        </div>

        {loading ? (
          <p className="small">Loading jobs...</p>
        ) : filteredJobs.length === 0 ? (
          <div className="dashboard-empty">
            <h4>No Jobs Yet</h4>
            <p className="small">Initialize your first escrow-backed workflow to activate live protocol stats and verifier pipelines.</p>
            <button className="btn" type="button" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>Create First Job</button>
          </div>
        ) : (
          <div className="jobs">
            {filteredJobs.map((j) => (
              <article key={j.id} className="job">
                <div className="job-top">
                  <div>
                    <b>#{j.id}</b> {j.title}
                  </div>
                  <div className="small">{j.status}</div>
                </div>
                <div className="meta">Escrow Amount: {j.amount}</div>
                <div className="meta">Client: {j.client}</div>
                <div className="meta">Agent: {j.agent}</div>
                <p className="small"><Link href={`/jobs/${j.id}`}>Open details page</Link></p>
                <JobActions id={j.id} milestones={j.milestones || []} onDone={load} />
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}