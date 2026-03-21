#!/usr/bin/env bash
set -euo pipefail
mkdir -p tls/certs

# CA
openssl genrsa -out tls/certs/ca.key 2048
openssl req -x509 -new -nodes -key tls/certs/ca.key -sha256 -days 365 \
  -subj "/CN=agentcred-dev-ca" -out tls/certs/ca.crt

# Server cert
openssl genrsa -out tls/certs/server.key 2048
openssl req -new -key tls/certs/server.key -subj "/CN=localhost" -out tls/certs/server.csr
openssl x509 -req -in tls/certs/server.csr -CA tls/certs/ca.crt -CAkey tls/certs/ca.key \
  -CAcreateserial -out tls/certs/server.crt -days 365 -sha256

# Client cert
openssl genrsa -out tls/certs/client.key 2048
openssl req -new -key tls/certs/client.key -subj "/CN=agent-client" -out tls/certs/client.csr
openssl x509 -req -in tls/certs/client.csr -CA tls/certs/ca.crt -CAkey tls/certs/ca.key \
  -CAcreateserial -out tls/certs/client.crt -days 365 -sha256

echo "Certificates generated under tls/certs"
