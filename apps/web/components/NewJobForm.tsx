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
        title: fd.get('title'),
        client: fd.get('client'),
        agent: fd.get('agent'),
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
    <form onSubmit={submit} style={{ display: 'grid', gap: 8, padding: 12, border: '1px solid #1f2a44', borderRadius: 10 }}>
      <b>Create Job + Milestones</b>
      <input name="title" placeholder="Task title" required />
      <input name="client" placeholder="Client address" required />
      <input name="agent" placeholder="Agent address" required />

      <label>
        Milestone count:
        <input type="number" min={1} max={5} value={milestoneCount} onChange={(e) => setMilestoneCount(Number(e.target.value || 1))} style={{ marginLeft: 8, width: 72 }} />
      </label>

      {Array.from({ length: milestoneCount }).map((_, i) => (
        <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 120px', gap: 6 }}>
          <input name={`m_title_${i}`} placeholder={`Milestone ${i + 1} title`} defaultValue={`Milestone ${i + 1}`} required />
          <input name={`m_amount_${i}`} placeholder="Amount" type="number" min="1" required />
        </div>
      ))}

      <button disabled={loading} type="submit">{loading ? 'Creating...' : 'Create Job'}</button>
    </form>
  );
}
