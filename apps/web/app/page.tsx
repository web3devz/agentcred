'use client';

import { useEffect, useMemo, useState } from 'react';
import NewJobForm from '../components/NewJobForm';
import JobActions from '../components/JobActions';
import { apiGet } from '../lib/api';

type Milestone = { id: number; title: string; amount: number; status: string };

type Job = {
  id: number;
  title: string;
  client: string;
  agent: string;
  amount: number;
  status: string;
  milestones: Milestone[];
};

export default function HomePage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const data = await apiGet('/jobs');
      setJobs(data.items || []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const stats = useMemo(() => {
    const total = jobs.reduce((s, j) => s + j.amount, 0);
    const released = jobs.filter((j) => j.status === 'RELEASED').length;
    return { totalJobs: jobs.length, totalAmount: total, released };
  }, [jobs]);

  return (
    <main className="grid">
      <section className="panel">
        <h3>Network Snapshot</h3>
        <div className="row2">
          <div className="small">Jobs: <b>{stats.totalJobs}</b></div>
          <div className="small">Released: <b>{stats.released}</b></div>
          <div className="small">Escrow Volume: <b>{stats.totalAmount}</b></div>
          <div className="small">Mode: <b>Live API (no mocks)</b></div>
        </div>
      </section>

      <NewJobForm onCreated={load} />

      <section className="panel">
        <h3>Jobs</h3>
        {loading ? <p className="small">Loading...</p> : jobs.length === 0 ? <p className="small">No jobs yet.</p> : (
          <div className="jobs">
            {jobs.map((j) => (
              <div key={j.id} className="job">
                <div className="job-top">
                  <div><b>#{j.id}</b> {j.title}</div>
                  <div className="small">{j.status}</div>
                </div>
                <div className="meta">Total: {j.amount}</div>
                <div className="meta">Client: {j.client}</div>
                <div className="meta">Agent: {j.agent}</div>
                <JobActions id={j.id} milestones={j.milestones || []} onDone={load} />
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
