/*
  Debug version of onchain E2E with contract state inspection
*/

import { ethers } from 'ethers';

async function findApiBase() {
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

  const AGENT_PK = requireEnv('AGENT_PRIVATE_KEY');
  const CLIENT_PK = requireEnv('PRIVATE_KEY');
  const agentAddr = new ethers.Wallet(AGENT_PK).address;
  const clientAddr = new ethers.Wallet(CLIENT_PK).address;

  console.log('Agent:', agentAddr);
  console.log('Client:', clientAddr);

  // 1) Create job
  const create = await api(API_BASE, '/jobs', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      title: 'Debug Onchain E2E',
      client: clientAddr,
      agent: agentAddr,
      amount: 5,
      milestones: [{ title: 'M1', amount: 5 }],
    }),
  });
  if (!create.ok) throw new Error('create failed: ' + JSON.stringify(create));
  const jobId = create.body.id;
  const onchainJobId = create.body?.onchain?.onchainJobId ?? jobId;
  console.log('jobId', jobId, 'onchainJobId', onchainJobId);
  console.log('create_onchain', create.body?.onchain || { skipped: true });

  // 2) Submit receipt
  const rec = await api(API_BASE, `/jobs/${jobId}/milestones/0/receipt`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ artifactUrl: 'https://example.com/artifact', summary: 'test', logs: ['l1'] }),
  });
  if (!rec.ok) throw new Error('receipt failed: ' + JSON.stringify(rec));
  const receiptHash = rec.body?.receipt?.hash || '';
  console.log('receiptHash', receiptHash);

  // 3) Score
  const sc = await api(API_BASE, `/jobs/${jobId}/milestones/0/score`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({}),
  });
  if (!sc.ok) throw new Error('score failed: ' + JSON.stringify(sc));
  console.log('verdict', sc.body?.verifier?.verdict);

  // Contract setup
  const RPC = requireEnv('BASE_SEPOLIA_RPC_URL');
  const ESCROW = requireEnv('ESCROW_CONTRACT_ADDRESS');
  const provider = new ethers.JsonRpcProvider(RPC);
  const escrowAbi = [
    'function jobs(uint256) returns (address,address,uint256,uint256,uint8,uint64)',
    'function milestones(uint256,uint256) returns (uint256,bool,bool,bytes32)',
    'function milestoneCount(uint256) returns (uint256)',
    'function submitMilestone(uint256,uint256,bytes32)',
    'function approveMilestone(uint256,uint256)',
    'function releaseMilestone(uint256,uint256)',
  ];
  const escrow = new ethers.Contract(ESCROW, escrowAbi, provider);
  
  // Inspect contract state before submit
  console.log('\n=== Before Submit ===');
  try {
    const count = await escrow.milestoneCount(onchainJobId);
    console.log('Milestone count:', count.toString());
    
    const m0 = await escrow.milestones(onchainJobId, 0);
    console.log('Milestone 0:', {
      amount: m0[0].toString(),
      completed: m0[1],
      approved: m0[2],
      receiptHashSet: m0[3] !== '0x' + '0'.repeat(64),
    });
  } catch (e) {
    console.error('Failed to read milestone:', e.message);
  }

  // Manual onchain submit
  const agent = new ethers.Wallet(AGENT_PK, provider);
  const client = new ethers.Wallet(CLIENT_PK, provider);

  const norm = (receiptHash || '').replace(/^0x/, '');
  const hash = norm.length === 64 ? '0x' + norm : '0x' + '0'.repeat(64);

  console.log('\n=== Submitting Milestone ===');
  console.log('Submitting from', agent.address);
  console.log('Receipt hash:', hash);

  const agentEscrow = new ethers.Contract(ESCROW, escrowAbi, agent);
  const subTx = await agentEscrow.submitMilestone(onchainJobId, 0, hash);
  const subRc = await subTx.wait();
  console.log('submitTxHash', subRc.hash);
  console.log('Block number', subRc.blockNumber);
  console.log('Gas used', subRc.gasUsed.toString());
  console.log('Status', subRc.status === 1 ? 'SUCCESS' : 'FAILED');

  // Inspect contract state after submit
  console.log('\n=== After Submit ===');
  await new Promise((r) => setTimeout(r, 2000));
  
  try {
    const m0after = await escrow.milestones(onchainJobId, 0);
    console.log('Milestone 0:', {
      amount: m0after[0].toString(),
      completed: m0after[1],
      approved: m0after[2],
      receiptHashSet: m0after[3] !== '0x' + '0'.repeat(64),
    });
  } catch (e) {
    console.error('Failed to read milestone:', e.message);
  }

  // Try to approve
  console.log('\n=== Approving Milestone ===');
  console.log('Approving from', client.address);

  const clientEscrow = new ethers.Contract(ESCROW, escrowAbi, client);
  try {
    const appTx = await clientEscrow.approveMilestone(onchainJobId, 0);
    const appRc = await appTx.wait();
    console.log('approveTxHash', appRc.hash);
    console.log('Status', appRc.status === 1 ? 'SUCCESS' : 'FAILED');
  } catch (e) {
    console.error('Approve failed:', e.message);
    if (e.reason) console.error('Reason:', e.reason);
    return;
  }

  // Release milestone
  console.log('\n=== Releasing Milestone ===');
  console.log('Releasing from', client.address);
  
  await new Promise((r) => setTimeout(r, 2000));
  
  try {
    const relTx = await clientEscrow.releaseMilestone(onchainJobId, 0);
    const relRc = await relTx.wait();
    console.log('releaseTxHash', relRc.hash);
    console.log('Status', relRc.status === 1 ? 'SUCCESS' : 'FAILED');
    console.log('\n✅ ONCHAIN_E2E_OK');
  } catch (e) {
    console.error('Release failed:', e.message);
    if (e.reason) console.error('Reason:', e.reason);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
