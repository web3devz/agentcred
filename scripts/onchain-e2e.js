/*
  One-off onchain E2E runner:
  - Detects local API (3001 or 3101)
  - Creates a job, submits receipt, scores via hosted verifier
  - Performs onchain submit (agent), approve+release (client)
  - Prints tx hashes; exits non-zero on failures
*/

import { ethers } from 'ethers';

async function findApiBase() {
  // Prefer 3101 (commonly started with full onchain env), fallback to 3001
  const bases = [process.env.API_URL || 'http://localhost:3101', 'http://localhost:3001'];
  for (const base of bases) {
    try {
      const r = await fetch(base + '/health');
      if (r.ok) return base;
    } catch {}
  }
  throw new Error('API not reachable on 3001 or 3101; start @agentcred/api first');
}

async function api(base, path, init) {
  const res = await fetch(base + path, init);
  const txt = await res.text();
  try {
    return { ok: res.ok, status: res.status, body: JSON.parse(txt) };
  } catch {
    return { ok: res.ok, status: res.status, body: txt };
  }
}

function requireEnv(name) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

async function main() {
  const API_BASE = await findApiBase();
  console.log('API', API_BASE);

  // Use actual env-derived addresses so onchain roles align
  const AGENT_PK = requireEnv('AGENT_PRIVATE_KEY');
  const CLIENT_PK = requireEnv('PRIVATE_KEY');
  const agentAddr = new ethers.Wallet(AGENT_PK).address;
  const clientAddr = new ethers.Wallet(CLIENT_PK).address;

  // 1) Create job (onchain funding happens in API if ONCHAIN_* envs are set for the API process)
  const create = await api(API_BASE, '/jobs', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      title: 'Onchain E2E Runner',
      client: clientAddr,
      agent: agentAddr,
      amount: 5,
      milestones: [{ title: 'M1', amount: 5 }],
    }),
  });
  if (!create.ok) throw new Error('create failed: ' + JSON.stringify(create));
  const jobId = create.body.id;
  const onchainJobId = create.body?.onchain?.onchainJobId ?? jobId;
  console.log('jobId', jobId, 'onchainJobId', onchainJobId, 'create_onchain', create.body?.onchain || { skipped: true });

  // 2) Submit receipt
  const rec = await api(API_BASE, `/jobs/${jobId}/milestones/0/receipt`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ artifactUrl: 'https://example.com/artifact', summary: 'ok', logs: ['l1'] }),
  });
  if (!rec.ok) throw new Error('receipt failed: ' + JSON.stringify(rec));
  const receiptHash = rec.body?.receipt?.hash || '';
  console.log('receiptHash', receiptHash);

  // 3) Score (uses hosted VERIFIER_URL configured on API)
  const sc = await api(API_BASE, `/jobs/${jobId}/milestones/0/score`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({}),
  });
  if (!sc.ok) throw new Error('score failed: ' + JSON.stringify(sc));
  console.log('verdict', sc.body?.verifier?.verdict);

  // 4) Manual onchain submit -> approve -> release
  const RPC = requireEnv('BASE_SEPOLIA_RPC_URL');
  const ESCROW = requireEnv('ESCROW_CONTRACT_ADDRESS');

  const provider = new ethers.JsonRpcProvider(RPC);
  const escrow = new ethers.Contract(
    ESCROW,
    [
      'function submitMilestone(uint256,uint256,bytes32)',
      'function approveMilestone(uint256,uint256)',
      'function releaseMilestone(uint256,uint256)',
    ],
    provider
  );

  const agent = new ethers.Wallet(AGENT_PK, provider);
  const client = new ethers.Wallet(CLIENT_PK, provider);

  const norm = (receiptHash || '').replace(/^0x/, '');
  const hash = norm.length === 64 ? '0x' + norm : '0x' + '0'.repeat(64);

  console.log('submit from', agent.address);
  const subTx = await escrow.connect(agent).submitMilestone(onchainJobId, 0, hash);
  const subRc = await subTx.wait();
  console.log('submitTxHash', subRc.hash);

  console.log('approve from', client.address);
  const appTx = await escrow.connect(client).approveMilestone(onchainJobId, 0);
  const appRc = await appTx.wait();
  console.log('approveTxHash', appRc.hash);

  console.log('release from', client.address);
  // Small delay to allow state propagation on some RPCs
  await new Promise((r) => setTimeout(r, 5000));
  const relTx = await escrow.connect(client).releaseMilestone(onchainJobId, 0);
  const relRc = await relTx.wait();
  console.log('releaseTxHash', relRc.hash);

  console.log('ONCHAIN_E2E_OK');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
