'use client';

import { useState } from 'react';
import { apiPost } from '../lib/api';

export default function NewJobForm({ onCreated }: { onCreated: () => void }) {
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setLoading(true);
    try {
      await apiPost('/jobs', {
        title: fd.get('title'),
        client: fd.get('client'),
        agent: fd.get('agent'),
        amount: Number(fd.get('amount')),
        milestones: []
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
      <b>Create Job</b>
      <input name="title" placeholder="Task title" required />
      <input name="client" placeholder="Client address" required />
      <input name="agent" placeholder="Agent address" required />
      <input name="amount" placeholder="Amount" type="number" min="1" required />
      <button disabled={loading} type="submit">{loading ? 'Creating...' : 'Create'}</button>
    </form>
  );
}
