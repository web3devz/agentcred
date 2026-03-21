import http from 'node:http';
import { createHash } from 'node:crypto';
import { JobCreateSchema, ReceiptSchema, VerifierRequestSchema, VerifierResultSchema, requireFields } from './contracts.js';
import { createEscrowJobOnchain, releaseMilestoneOnchain, updateReputationOnchain } from './clients/chain.js';

const PORT = Number(process.env.PORT || process.env.API_PORT || 3001);
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
      } catch {
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

function parseMilestoneId(pathname) {
  const parts = pathname.split('/').filter(Boolean);
  return Number(parts[3]);
}

function allMilestonesReleased(job) {
  return job.milestones.every((m) => m.status === 'RELEASED');
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
      const check = requireFields(JobCreateSchema, body);
      if (!check.ok) {
        return json(res, 400, { error: 'missing_fields', required: JobCreateSchema.required, missing: check.missing });
      }

      const milestonesIn = Array.isArray(body.milestones) && body.milestones.length
        ? body.milestones
        : [{ title: 'Default Milestone', amount: Number(body.amount) }];

      const milestones = milestonesIn.map((m, idx) => ({
        id: idx,
        title: m.title || `Milestone ${idx + 1}`,
        amount: Number(m.amount || 0),
        status: 'PENDING',
        receipt: null,
        score: null,
        verdict: null,
      }));

      const totalAmount = milestones.reduce((s, m) => s + m.amount, 0);
      if (totalAmount <= 0) return json(res, 400, { error: 'invalid_milestones_total' });

      const id = db.nextJobId++;
      const job = {
        id,
        title: body.title,
        client: body.client,
        agent: body.agent,
        amount: totalAmount,
        status: 'FUNDED',
        milestones,
        receipt: null,
        score: null,
        verdict: null,
        releasedAt: null,
        createdAt: new Date().toISOString(),
        onchain: null,
      };

      try {
        const onchain = await createEscrowJobOnchain({
          agent: body.agent,
          milestoneAmounts: milestones.map((m) => m.amount),
        });
        job.onchain = onchain;
      } catch (e) {
        job.onchain = { skipped: false, error: String(e.message || e) };
      }

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

    if (req.method === 'POST' && /^\/jobs\/\d+\/milestones\/\d+\/receipt$/.test(pathname)) {
      const jobId = parseId(pathname);
      const milestoneId = parseMilestoneId(pathname);
      const job = db.jobs.get(jobId);
      if (!job) return notFound(res);
      const m = job.milestones[milestoneId];
      if (!m) return json(res, 404, { error: 'milestone_not_found' });

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
      receipt.hash = receiptHash({ jobId, milestoneId, ...receipt });

      m.receipt = receipt;
      m.status = 'SUBMITTED';
      job.status = 'COMPLETED';

      return json(res, 200, { jobId, milestoneId, receipt });
    }

    if (req.method === 'POST' && /^\/jobs\/\d+\/milestones\/\d+\/score$/.test(pathname)) {
      const jobId = parseId(pathname);
      const milestoneId = parseMilestoneId(pathname);
      const job = db.jobs.get(jobId);
      if (!job) return notFound(res);
      const m = job.milestones[milestoneId];
      if (!m) return json(res, 404, { error: 'milestone_not_found' });
      if (!m.receipt) return json(res, 400, { error: 'receipt_required' });

      const payload = { jobId, milestoneId, receiptHash: m.receipt.hash, signalScore: 78 };
      const payloadCheck = requireFields(VerifierRequestSchema, payload);
      if (!payloadCheck.ok) {
        return json(res, 500, { error: 'invalid_verifier_payload', missing: payloadCheck.missing });
      }

      const verifierRes = await fetch(VERIFIER_URL, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!verifierRes.ok) return json(res, 502, { error: 'verifier_error', status: verifierRes.status });

      const verdict = await verifierRes.json();
      const verdictCheck = requireFields(VerifierResultSchema, verdict);
      if (!verdictCheck.ok) return json(res, 502, { error: 'invalid_verifier_response', missing: verdictCheck.missing });

      m.score = verdict.score;
      m.verdict = verdict.verdict;
      m.status = verdict.verdict === 'pass' ? 'APPROVED' : 'SUBMITTED';

      return json(res, 200, { jobId, milestoneId, verifier: verdict });
    }

    if (req.method === 'POST' && /^\/jobs\/\d+\/milestones\/\d+\/release$/.test(pathname)) {
      const jobId = parseId(pathname);
      const milestoneId = parseMilestoneId(pathname);
      const job = db.jobs.get(jobId);
      if (!job) return notFound(res);
      const m = job.milestones[milestoneId];
      if (!m) return json(res, 404, { error: 'milestone_not_found' });
      if (m.status !== 'APPROVED') return json(res, 400, { error: 'milestone_not_approved', status: m.status });

      m.status = 'RELEASED';

      const prev = db.reputation.get(job.agent) || 0;
      const next = Math.min(1000, prev + Math.max(1, Math.floor((m.score || 70) / 10)));
      db.reputation.set(job.agent, next);

      let onchainRelease = null;
      let onchainReputation = null;
      try {
        onchainRelease = await releaseMilestoneOnchain({ jobId, milestoneId });
      } catch (e) {
        onchainRelease = { skipped: false, error: String(e.message || e) };
      }

      try {
        onchainReputation = await updateReputationOnchain({
          agent: job.agent,
          score: next,
          receiptHash: m.receipt?.hash || '0x0',
        });
      } catch (e) {
        onchainReputation = { skipped: false, error: String(e.message || e) };
      }

      if (allMilestonesReleased(job)) {
        job.status = 'RELEASED';
        job.releasedAt = new Date().toISOString();
      } else {
        job.status = 'FUNDED';
      }

      return json(res, 200, {
        jobId,
        milestoneId,
        payout: 'released',
        milestoneAmount: m.amount,
        reputation: { agent: job.agent, score: next },
        onchain: {
          release: onchainRelease,
          reputation: onchainReputation,
        },
      });
    }

    // Backward-compatible single-step routes
    if (req.method === 'POST' && /^\/jobs\/\d+\/receipt$/.test(pathname)) {
      const id = parseId(pathname);
      req.url = `/jobs/${id}/milestones/0/receipt`;
      return server.emit('request', req, res);
    }
    if (req.method === 'POST' && /^\/jobs\/\d+\/score$/.test(pathname)) {
      const id = parseId(pathname);
      req.url = `/jobs/${id}/milestones/0/score`;
      return server.emit('request', req, res);
    }
    if (req.method === 'POST' && /^\/jobs\/\d+\/release$/.test(pathname)) {
      const id = parseId(pathname);
      req.url = `/jobs/${id}/milestones/0/release`;
      return server.emit('request', req, res);
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
