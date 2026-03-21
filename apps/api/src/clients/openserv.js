const OPENSERV_API_BASE = process.env.OPENSERV_API_BASE || 'https://api.openserv.ai';

function getApiKey() {
  return process.env.OPENSERV_API_KEY || '';
}

export function isOpenServConfigured() {
  return Boolean(getApiKey());
}

export async function scoreReceiptWithOpenServ({ title, summary, logs = [] }) {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error('openserv_not_configured');

  const res = await fetch(`${OPENSERV_API_BASE}/v1/score`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ title, summary, logs }),
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`openserv_error:${res.status}:${txt}`);
  }

  const data = await res.json();

  const numeric = Number(
    data?.score ??
    data?.result?.score ??
    data?.signalScore ??
    data?.data?.score ??
    0
  );

  const score = Number.isFinite(numeric) && numeric > 0 ? Math.max(1, Math.min(100, Math.round(numeric))) : null;

  return {
    score,
    raw: data,
  };
}
