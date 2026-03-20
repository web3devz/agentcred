# Runbook (Initial)

## 1) Deploy contracts on Base Sepolia

```bash
cd contracts
npm install
# Ensure BASE_SEPOLIA_RPC_URL + PRIVATE_KEY are set
npm run deploy:base-sepolia
```

Deployment outputs to:
- `contracts/deployments/base-sepolia.json`

## 2) Run API
- `cd apps/api && node src/main.js`

## 3) Run Verifier
- `cd apps/verifier-tee && node src/server.js`

## 4) Run Worker
- `cd apps/worker && node src/index.js`
