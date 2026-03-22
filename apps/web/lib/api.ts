const API = (process.env.NEXT_PUBLIC_API_URL || 'https://agentcredapi-production.up.railway.app').replace(/\/$/, '');

function buildUrl(path: string) {
  if (/^https?:\/\//i.test(path)) return path;
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${API}${normalized}`;
}

function asErrorMessage(err: unknown) {
  if (err instanceof Error) return err.message;
  return String(err);
}

export async function apiGet(path: string) {
  const url = buildUrl(path);
  let res: Response;
  try {
    res = await fetch(url, { cache: 'no-store' });
  } catch (err) {
    throw new Error(
      `Network error while calling ${url}. Check that the API is running and NEXT_PUBLIC_API_URL is reachable. ${asErrorMessage(err)}`
    );
  }

  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    throw new Error(`GET ${path} failed (${res.status} ${res.statusText})${txt ? `: ${txt}` : ''}`);
  }

  return res.json();
}

export async function apiPost(path: string, body: any) {
  const url = buildUrl(path);
  let res: Response;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body)
    });
  } catch (err) {
    throw new Error(
      `Network error while calling ${url}. Check that the API is running and NEXT_PUBLIC_API_URL is reachable. ${asErrorMessage(err)}`
    );
  }

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`POST ${path} failed (${res.status} ${res.statusText})${txt ? `: ${txt}` : ''}`);
  }
  return res.json();
}
