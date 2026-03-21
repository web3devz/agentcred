# Deployment Runbook (Step 4)

## Prereqs
- GHCR image published by workflow `Container Build & Push`
- Kubernetes cluster/context configured
- TLS cert + app secrets prepared

## 1) Use latest image tag
Recommended immutable image:
- `ghcr.io/web3devz/agentcred:sha-b48eb06`

Update `k8s/deployment.yaml` image field accordingly.

## 2) Create runtime secrets
```bash
kubectl apply -f k8s/secrets.template.yaml
```

Then replace placeholders with real values.

## 3) Deploy
```bash
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/service.yaml
kubectl rollout status deploy/agentcred
```

## 4) Validate
Port-forward and call with mTLS certs:
```bash
kubectl port-forward svc/agentcred 8443:443
curl --cert tls/certs/client.crt --key tls/certs/client.key --cacert tls/certs/ca.crt \
  -H "x-tee-attestation: <token>" \
  https://localhost:8443/health
```

Expect:
- HTTP 200
- `{ "ok": true, ... "mtls": true }`
