import http from 'node:http';
import { createHash } from 'node:crypto';
import { JobCreateSchema, ReceiptSchema, VerifierRequestSchema, VerifierResultSchema, requireFields } from './contracts.js';

const PORT = Number(process.env.PORT || 3001);
const VERIFIER_URL = process.env.VERIFIER_URL || 'http://localhost:8080/verify';

const db = {
  jobs: new Map(),
  reputation: new Map(),
  nextJobId: 1,
};

function json(res, code, data) {
  res.writeHead(code, { 'content-type': 'application/json' });
  res.end(JSON.stringify(data));
}

function notFound(res) {
  return json(res, 404, { error: 'not_found' });
}

async function readBody(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', (chunk) => (raw += chunk));
    req.on('end', () => {
      if (!raw) return resolve({});
      try {
        resolve(JSON.parse(raw));
      } catch (e) {
        reject(new Error('invalid_json'));
      }
    });
    req.on('error', reject);
  });
}

function receiptHash(obj) {
  return createHash('sha256').update(JSON.stringify(obj)).digest('hex');
}

function parseId(pathname) {
  const parts = pathname.split('/').filter(Boolean);
  return Number(parts[1]);
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const { pathname } = url;

  try {
    if (req.method === 'GET' && pathname === '/health') {
      return json(res, 200, { ok: true, service: 'agentcred-api' });
    }

    if (req.method === 'POST' && pathname === '/jobs') {
      const body = await readBody(req);
      const { title, client, agent, amount, milestones = [] } = body;
      const check = requireFields(JobCreateSchema, body);
      if (!check.ok) {
        return json(res, 400, { error: 'missing_fields', required: JobCreateSchema.required, missing: check.missing });
      }

      const id = db.nextJobId++;
      const job = {
        id,
        title,
        client,
        agent,
        amount: Number(amount),
        status: 'FUNDED',
        milestones,
        receipt: null,
        score: null,
        verdict: null,
        releasedAt: null,
        createdAt: new Date().toISOString(),
      };
      db.jobs.set(id, job);
      return json(res, 201, job);
    }

    if (req.method === 'GET' && pathname === '/jobs') {
      return json(res, 200, { items: Array.from(db.jobs.values()) });
    }

    if (req.method === 'GET' && pathname.startsWith('/jobs/')) {
      const id = parseId(pathname);
      const job = db.jobs.get(id);
      if (!job) return notFound(res);
      return json(res, 200, job);
    }

    if (req.method === 'POST' && /^\/jobs\/\d+\/receipt$/.test(pathname)) {
      const id = parseId(pathname);
      const job = db.jobs.get(id);
      if (!job) return notFound(res);

      const body = await readBody(req);
      const receiptCheck = requireFields(ReceiptSchema, body);
      if (!receiptCheck.ok) {
        return json(res, 400, { error: 'missing_fields', required: ReceiptSchema.required, missing: receiptCheck.missing });
      }

      const receipt = {
        artifactUrl: body.artifactUrl,
        summary: body.summary,
        logs: body.logs || [],
        submittedAt: new Date().toISOString(),
      };
      receipt.hash = receiptHash(receipt);
      job.receipt = receipt;
      job.status = 'COMPLETED';
      return json(res, 200, { id, receipt });
    }

    if (req.method === 'POST' && /^\/jobs\/\d+\/score$/.test(pathname)) {
      const id = parseId(pathname);
      const job = db.jobs.get(id);
      if (!job) return notFound(res);
      if (!job.receipt) return json(res, 400, { error: 'receipt_required' });

      const payload = {
        jobId: job.id,
        receiptHash: job.receipt.hash,
        signalScore: 78,
      };

      const payloadCheck = requireFields(VerifierRequestSchema, payload);
      if (!payloadCheck.ok) {
        return json(res, 500, { error: 'invalid_verifier_payload', missing: payloadCheck.missing });
      }

      const verifierRes = await fetch(VERIFIER_URL, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!verifierRes.ok) {
        return json(res, 502, { error: 'verifier_error', status: verifierRes.status });
      }

      const verdict = await verifierRes.json();
      const verdictCheck = requireFields(VerifierResultSchema, verdict);
      if (!verdictCheck.ok) {
        return json(res, 502, { error: 'invalid_verifier_response', missing: verdictCheck.missing });
      }

      job.score = verdict.score;
      job.verdict = verdict.verdict;
      job.status = verdict.verdict === 'pass' ? 'APPROVED' : 'REVIEW';
      return json(res, 200, { id, verifier: verdict });
    }

    if (req.method === 'POST' && /^\/jobs\/\d+\/release$/.test(pathname)) {
      const id = parseId(pathname);
      const job = db.jobs.get(id);
      if (!job) return notFound(res);
      if (job.status !== 'APPROVED') {
        return json(res, 400, { error: 'job_not_approved', status: job.status });
      }
      job.status = 'RELEASED';
      job.releasedAt = new Date().toISOString();
      const prev = db.reputation.get(job.agent) || 0;
      const next = Math.min(1000, prev + Math.max(1, Math.floor((job.score || 70) / 10)));
      db.reputation.set(job.agent, next);
      return json(res, 200, { id, payout: 'released', reputation: { agent: job.agent, score: next } });
    }

    if (req.method === 'GET' && pathname.startsWith('/reputation/')) {
      const agent = pathname.split('/')[2];
      return json(res, 200, { agent, score: db.reputation.get(agent) || 0 });
    }

    return notFound(res);
  } catch (err) {
    return json(res, 500, { error: 'internal_error', message: String(err.message || err) });
  }
});

server.listen(PORT, () => {
  console.log(`API listening on :${PORT}`);
});
