#!/usr/bin/env bash
set -euo pipefail

echo "[1/6] generating dev certs"
bash tls/gen-dev-certs.sh >/dev/null

CLIENT_FP=$(openssl x509 -in tls/certs/client.crt -outform DER | openssl dgst -sha256 -binary | xxd -p -c 256)
ATTESTATION_TOKEN="dev-attestation-ok"

echo "[2/6] starting secure runtime"
ALLOWED_CLIENT_CERT_SHA256="$CLIENT_FP" REQUIRED_ATTESTATION="$ATTESTATION_TOKEN" node src/server.js > /tmp/agentcred.log 2>&1 &
PID=$!
trap 'kill $PID >/dev/null 2>&1 || true' EXIT
sleep 1

echo "[3/6] testing successful verified request"
RESP_OK=$(curl -s --cert tls/certs/client.crt --key tls/certs/client.key --cacert tls/certs/ca.crt -H "x-tee-attestation: $ATTESTATION_TOKEN" https://localhost:8443/health)

echo "[4/6] testing failed attestation request"
HTTP_BAD=$(curl -s -o /tmp/bad.json -w "%{http_code}" --cert tls/certs/client.crt --key tls/certs/client.key --cacert tls/certs/ca.crt -H "x-tee-attestation: wrong" https://localhost:8443/health || true)

echo "[5/6] collecting evidence"
RESP_EVIDENCE=$(curl -s --cert tls/certs/client.crt --key tls/certs/client.key --cacert tls/certs/ca.crt -H "x-tee-attestation: $ATTESTATION_TOKEN" https://localhost:8443/evidence)

echo "[6/6] final assertions"

echo "$RESP_OK" | grep -q '"ok":true'
echo "$RESP_OK" | grep -q '"mtls":true'
[[ "$HTTP_BAD" == "403" ]]
echo "$RESP_EVIDENCE" | grep -q '"attestationBound":true'

echo "E2E_VERIFY_OK"
