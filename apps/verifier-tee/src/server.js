import http from 'node:http';
import { VerifierRequestSchema, requireFields } from './contracts.js';

const server = http.createServer(async (req, res) => {
  if (req.method === 'POST' && req.url === '/verify') {
    let body = '';
    req.on('data', c => (body += c));
    req.on('end', () => {
      const input = body ? JSON.parse(body) : {};
      const check = requireFields(VerifierRequestSchema, input);
      if (!check.ok) {
        res.writeHead(400, { 'content-type': 'application/json' });
        return res.end(JSON.stringify({ error: 'missing_fields', required: VerifierRequestSchema.required, missing: check.missing }));
      }
      const score = Math.min(100, Math.max(0, Number(input?.signalScore ?? 75)));
      const result = { verdict: score >= 70 ? 'pass' : 'review', score, signedBy: 'tee-placeholder', receiptHash: input.receiptHash };
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(JSON.stringify(result));
    });
    return;
  }
  if (req.url === '/health') {
    res.writeHead(200, { 'content-type': 'application/json' });
    return res.end(JSON.stringify({ ok: true, service: 'verifier-tee' }));
  }
  res.writeHead(404).end();
});

server.listen(8080, '0.0.0.0', () => console.log('Verifier listening on :8080'));
