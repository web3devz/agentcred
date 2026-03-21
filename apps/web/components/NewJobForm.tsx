'use client';

import { useState } from 'react';
import { apiPost } from '../lib/api';

export default function NewJobForm({ onCreated }: { onCreated: () => void }) {
  const [loading, setLoading] = useState(false);
  const [milestoneCount, setMilestoneCount] = useState(2);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setLoading(true);
    try {
      const milestones = Array.from({ length: milestoneCount }).map((_, i) => ({
        title: String(fd.get(`m_title_${i}`) || `Milestone ${i + 1}`),
        amount: Number(fd.get(`m_amount_${i}`) || 0),
      })).filter(m => m.amount > 0);

      await apiPost('/jobs', {
        title: String(fd.get('title') || ''),
        client: String(fd.get('client') || ''),
        agent: String(fd.get('agent') || ''),
        amount: milestones.reduce((s, m) => s + m.amount, 0),
        milestones,
      });
      (e.target as HTMLFormElement).reset();
      onCreated();
    } catch (err) {
      alert(String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="panel row">
      <h3>Create Job + Milestones</h3>
      <input className="input" name="title" placeholder="Task title" required />
      <div className="row2">
        <input className="input" name="client" placeholder="Client address" required />
        <input className="input" name="agent" placeholder="Agent address" required />
      </div>

      <label className="small">
        Milestone count
        <input className="input" type="number" min={1} max={5} value={milestoneCount} onChange={(e) => setMilestoneCount(Number(e.target.value || 1))} />
      </label>

      {Array.from({ length: milestoneCount }).map((_, i) => (
        <div key={i} className="row2">
          <input className="input" name={`m_title_${i}`} placeholder={`Milestone ${i + 1} title`} defaultValue={`Milestone ${i + 1}`} required />
          <input className="input" name={`m_amount_${i}`} placeholder="Amount" type="number" min="1" required />
        </div>
      ))}

      <button className="btn" disabled={loading} type="submit">{loading ? 'Creating...' : 'Create Job'}</button>
    </form>
  );
}
