const https = require('https');
const http = require('http');
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

function handleRequest(req, res, cert = null) {
  let mtls = false;
  if (cert && cert.raw) {
    const clientFingerprint = sha256Raw(cert.raw);
    if (ALLOWED_CLIENT_CERT_SHA256 && clientFingerprint !== ALLOWED_CLIENT_CERT_SHA256) {
      return respond(res, 403, { ok: false, error: 'client_cert_pin_mismatch' });
    }
    mtls = true;
  } else if (process.env.NODE_ENV !== 'production') {
    return respond(res, 401, { ok: false, error: 'missing_client_cert' });
  }

  if (REQUIRED_ATTESTATION) {
    const token = req.headers['x-tee-attestation'];
    if (!token || token !== REQUIRED_ATTESTATION) {
      return respond(res, 403, { ok: false, error: 'attestation_token_mismatch' });
    }
  }

  if (req.url === '/health') {
    return respond(res, 200, { ok: true, service: 'agentcred', tls: process.env.NODE_ENV === 'production' ? 'railway' : 'verified', mtls });
  }

  if (req.url === '/evidence') {
    return respond(res, 200, {
      ok: true,
      runtime: {
        node: process.version,
        tlsMin: process.env.NODE_ENV === 'production' ? 'TLSv1.2' : 'TLSv1.3'
      },
      checks: {
        mtls,
        certPinning: Boolean(ALLOWED_CLIENT_CERT_SHA256),
        attestationBound: Boolean(REQUIRED_ATTESTATION)
      }
    });
  }

  return respond(res, 200, { ok: true, message: 'AgentCred secure gateway online' });
}

let server;
if (process.env.NODE_ENV === 'production') {
  // On Railway, use HTTP as Railway handles HTTPS
  server = http.createServer((req, res) => {
    handleRequest(req, res);
  });
} else {
  server = https.createServer(
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
      handleRequest(req, res, cert);
    }
  );
}

server.listen(PORT, HOST, () => {
  const protocol = process.env.NODE_ENV === 'production' ? 'http' : 'https';
  console.log(`agentcred runtime listening on ${protocol}://${HOST}:${PORT}`);
});
