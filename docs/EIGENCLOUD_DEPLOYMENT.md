# EigenCompute Deployment Playbook (Saved)

Source: user-provided canonical flow (saved on 2026-03-20 UTC).

## Deployment Methods
1. Deploy from registry (pre-built Docker image)
2. Build from verifiable source (build from GitHub in TEE)

## Prerequisites
- Node.js 20+
- ecloud CLI:
  ```bash
  curl -fsSL https://raw.githubusercontent.com/Layr-Labs/eigencloud-tools/master/install-all.sh | bash
  ```
- Docker with buildx (registry method)

## Step 1 — Authenticate
```bash
ecloud auth login
ecloud auth whoami
```

## Step 2 — Billing
```bash
ecloud billing subscribe
```
(Required before first deploy)

## Step 3 — .env
`.env` is injected into TEE at deploy time.

Example:
```env
PORT=3000
OPENROUTER_API_KEY=...
SUPABASE_URL=...
SUPABASE_SERVICE_KEY=...
```

---

## Method A — Deploy from Registry

### A1 Build app
```bash
npm run build
```

### A2 Build/push Docker image (must be linux/amd64)
```bash
docker buildx build --platform linux/amd64 --no-cache \
  -t yourdockerhub/yourapp:v1.0.0 --push .
```

### A3 Deploy
```bash
ecloud compute app deploy \
  --image-ref yourdockerhub/yourapp:v1.0.0 \
  --env-file .env \
  --instance-type g1-standard-4t \
  --log-visibility public \
  --resource-usage-monitoring enable
```

Prompt order (7):
1. Build from verifiable source? -> N
2. Enter Docker image reference
3. Enter app name
4. Choose env-file option
5. Choose instance
6. View logs? -> Yes/public
7. Resource usage monitoring? -> Yes

### A4 Upgrade
```bash
ecloud compute app upgrade <APP-ID> \
  --image-ref yourdockerhub/yourapp:v1.0.1 \
  --env-file .env
```

---

## Method B — Build from Verifiable Source

Requirements:
- Public GitHub repo
- Dockerfile in repo

### B1 Deploy
```bash
ecloud compute app deploy --verifiable \
  --repo https://github.com/yourusername/yourapp \
  --commit <40-char-sha> \
  --env-file .env \
  --instance-type g1-standard-4t \
  --log-visibility public \
  --resource-usage-monitoring enable
```

Prompt order (9):
1. Build from verifiable source? -> y
2. Choose verifiable source type -> Build from git source
3. Enter public git repo URL
4. Enter 40-char commit SHA (`git rev-parse HEAD`)
5. Build context path (default `.`)
6. Dockerfile path (default `Dockerfile`)
7. Caddyfile path (optional; Enter to skip)
8. Dependency digests (Enter to skip)
9. Choose env-file option

## B2 — Upgrade (Verifiable Source)
Push changes, then redeploy with a new commit SHA:

```bash
ecloud compute app upgrade <APP-ID> --verifiable \
  --repo https://github.com/yourusername/yourapp \
  --commit <new-40-char-sha> \
  --env-file .env
```

## Verify

```bash
# Check status
ecloud compute app info --watch

# Stream logs
ecloud compute app logs --watch

# Health check
curl http://<your-ip>:3000/health
```

On success you get App ID + Public IP.

## Useful Commands
- `ecloud auth whoami` — Show authenticated address
- `ecloud compute app list` — List apps
- `ecloud compute app info <APP-ID>` — Status & IP
- `ecloud compute app logs <APP-ID> -w` — Stream logs
- `ecloud compute app stop <APP-ID>` — Stop app
- `ecloud compute app start <APP-ID>` — Start app
- `ecloud compute app terminate <APP-ID>` — Delete app
- `ecloud billing status` — Billing status

## Instance Types
- `g1-micro-1v` — Shared 2 vCPUs, 1 GB, Shielded VM (default)
- `g1-medium-1v` — Shared 2 vCPUs, 4 GB, Shielded VM
- `g1-custom-2-4096s` — 2 vCPUs, 4 GB, AMD SEV-SNP
- `g1-standard-2s` — 2 vCPUs, 8 GB, AMD SEV-SNP
- `g1-standard-4t` — 4 vCPUs, 16 GB, Intel TDX
- `g1-standard-8t` — 8 vCPUs, 32 GB, Intel TDX

## Important Notes
- Docker images must be `linux/amd64`.
- App must listen on `0.0.0.0` (not `127.0.0.1`).
- App runs as root inside TEE (required).
- `.env` variables are encrypted and injected at runtime.
- TEE isolation via Intel TDX where applicable.
- `g1-micro-1v` does not support TDX attestation.
- KMS signing public key path: `/usr/local/bin/kms-signing-public-key.pem`.
- Verifiable builds record build hash on-chain for third-party verification.

Notes:
- No instance/log/monitoring prompts in verifiable path unless set via flags.
- Only one verifiable build can run at a time per account.
