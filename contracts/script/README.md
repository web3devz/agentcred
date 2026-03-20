# Deployment Scripts

## Base Sepolia Deploy

Prerequisites:
1. Compile contracts and ensure artifacts exist under `contracts/out/*.json`
2. Set env vars:
   - `BASE_SEPOLIA_RPC_URL`
   - `PRIVATE_KEY`

Run:
```bash
cd contracts
npm install
npm run deploy:base-sepolia
```

Output:
- `contracts/deployments/base-sepolia.json`
