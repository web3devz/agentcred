'use client';

import { useEffect, useState } from 'react';
import NewJobForm from '../components/NewJobForm';
import JobActions from '../components/JobActions';
import { apiGet } from '../lib/api';

type Job = {
  id: number;
  title: string;
  client: string;
  agent: string;
  amount: number;
  status: string;
  score: number | null;
  verdict: string | null;
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

  return (
    <main style={{ display: 'grid', gap: 14 }}>
      <NewJobForm onCreated={load} />
      <section style={{ border: '1px solid #1f2a44', borderRadius: 10, padding: 12 }}>
        <h3 style={{ marginTop: 0 }}>Jobs</h3>
        {loading ? <p>Loading...</p> : jobs.length === 0 ? <p>No jobs yet.</p> : (
          <div style={{ display: 'grid', gap: 10 }}>
            {jobs.map((j) => (
              <div key={j.id} style={{ border: '1px solid #223056', borderRadius: 8, padding: 10 }}>
                <div><b>#{j.id}</b> {j.title}</div>
                <div>Status: {j.status} | Score: {j.score ?? '-'} | Verdict: {j.verdict ?? '-'}</div>
                <div>Client: {j.client}</div>
                <div>Agent: {j.agent}</div>
                <JobActions id={j.id} onDone={load} />
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
