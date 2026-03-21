const https = require('https');
const fs = require('fs');
const crypto = require('crypto');

/**
 * Minimal verifiable TLS gateway baseline:
 * - mTLS (client cert required)
 * - certificate pinning hash check
 * - attestation token check (header-based)
 *
 * NOTE: This is a practical bridge until native TEE-bound Verifiable TLS is available.
 */

const ALLOWED_CLIENT_CERT_SHA256 = process.env.ALLOWED_CLIENT_CERT_SHA256 || '';
const REQUIRED_ATTESTATION = process.env.REQUIRED_ATTESTATION || '';

const server = https.createServer(
  {
    key: fs.readFileSync('./tls/certs/server.key'),
    cert: fs.readFileSync('./tls/certs/server.crt'),
    ca: fs.readFileSync('./tls/certs/ca.crt'),
    requestCert: true,
    rejectUnauthorized: true,
    minVersion: 'TLSv1.3'
  },
  (req, res) => {
    const cert = req.socket.getPeerCertificate(true);

    if (!cert || !cert.raw) {
      res.writeHead(401);
      return res.end('missing client cert');
    }

    const fingerprint = crypto.createHash('sha256').update(cert.raw).digest('hex');
    if (ALLOWED_CLIENT_CERT_SHA256 && fingerprint !== ALLOWED_CLIENT_CERT_SHA256) {
      res.writeHead(403);
      return res.end('client cert pin mismatch');
    }

    const attestation = req.headers['x-tee-attestation'] || '';
    if (REQUIRED_ATTESTATION && attestation !== REQUIRED_ATTESTATION) {
      res.writeHead(403);
      return res.end('attestation token mismatch');
    }

    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ ok: true, tls: 'verified', mtls: true }));
  }
);

const port = process.env.PORT || 8443;
server.listen(port, () => {
  console.log(`verifiable tls gateway listening on ${port}`);
});
