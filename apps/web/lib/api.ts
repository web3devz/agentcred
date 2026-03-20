const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export async function apiGet(path: string) {
  const res = await fetch(`${API}${path}`, { cache: 'no-store' });
  if (!res.ok) throw new Error(`GET ${path} failed`);
  return res.json();
}

export async function apiPost(path: string, body: any) {
  const res = await fetch(`${API}${path}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body)
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`POST ${path} failed: ${txt}`);
  }
  return res.json();
}
