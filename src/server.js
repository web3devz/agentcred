const https = require('https');
const fs = require('fs');
const crypto = require('crypto');

const PORT = process.env.PORT || 8443;
const HOST = process.env.HOST || '0.0.0.0';
const ALLOWED_CLIENT_CERT_SHA256 = process.env.ALLOWED_CLIENT_CERT_SHA256 || '';
const REQUIRED_ATTESTATION = process.env.REQUIRED_ATTESTATION || '';

function sha256Raw(certRawBuffer) {
  return crypto.createHash('sha256').update(certRawBuffer).digest('hex');
}

function respond(res, code, payload) {
  res.writeHead(code, { 'content-type': 'application/json' });
  res.end(JSON.stringify(payload));
}

const server = https.createServer(
  {
    key: fs.readFileSync(process.env.TLS_KEY_PATH || './tls/certs/server.key'),
    cert: fs.readFileSync(process.env.TLS_CERT_PATH || './tls/certs/server.crt'),
    ca: fs.readFileSync(process.env.TLS_CA_PATH || './tls/certs/ca.crt'),
    requestCert: true,
    rejectUnauthorized: true,
    minVersion: 'TLSv1.3'
  },
  (req, res) => {
    const cert = req.socket.getPeerCertificate(true);
    if (!cert || !cert.raw) {
      return respond(res, 401, { ok: false, error: 'missing_client_cert' });
    }

    const clientFingerprint = sha256Raw(cert.raw);
    if (ALLOWED_CLIENT_CERT_SHA256 && clientFingerprint !== ALLOWED_CLIENT_CERT_SHA256) {
      return respond(res, 403, { ok: false, error: 'client_cert_pin_mismatch' });
    }

    if (REQUIRED_ATTESTATION) {
      const token = req.headers['x-tee-attestation'];
      if (!token || token !== REQUIRED_ATTESTATION) {
        return respond(res, 403, { ok: false, error: 'attestation_token_mismatch' });
      }
    }

    if (req.url === '/health') {
      return respond(res, 200, { ok: true, service: 'agentcred', tls: 'verified', mtls: true });
    }

    if (req.url === '/evidence') {
      return respond(res, 200, {
        ok: true,
        runtime: {
          node: process.version,
          tlsMin: 'TLSv1.3'
        },
        checks: {
          mtls: true,
          certPinning: Boolean(ALLOWED_CLIENT_CERT_SHA256),
          attestationBound: Boolean(REQUIRED_ATTESTATION)
        }
      });
    }

    return respond(res, 200, { ok: true, message: 'AgentCred secure gateway online' });
  }
);

server.listen(PORT, HOST, () => {
  console.log(`agentcred runtime listening on https://${HOST}:${PORT}`);
});
