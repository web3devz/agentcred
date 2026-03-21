import { ethers } from 'ethers';

const escrowAbi = [
  'event JobCreated(uint256 indexed jobId, address indexed client, address indexed agent, uint256 totalAmount)',
  'function createJob(address agent, uint256[] milestoneAmounts) payable returns (uint256 jobId)',
  'function submitMilestone(uint256 jobId, uint256 milestoneId, bytes32 receiptHash)',
  'function approveMilestone(uint256 jobId, uint256 milestoneId)',
  'function releaseMilestone(uint256 jobId, uint256 milestoneId)'
];

const reputationAbi = [
  'function update(address agent, uint256 newScore, bytes32 receiptHash)'
];

function isConfigured() {
  return Boolean(
    process.env.ONCHAIN_ENABLED === 'true' &&
    process.env.BASE_SEPOLIA_RPC_URL &&
    process.env.PRIVATE_KEY &&
    process.env.ESCROW_CONTRACT_ADDRESS &&
    process.env.REPUTATION_CONTRACT_ADDRESS
  );
}

function getClients() {
  const provider = new ethers.JsonRpcProvider(process.env.BASE_SEPOLIA_RPC_URL);
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  const escrow = new ethers.Contract(process.env.ESCROW_CONTRACT_ADDRESS, escrowAbi, wallet);
  const reputation = new ethers.Contract(process.env.REPUTATION_CONTRACT_ADDRESS, reputationAbi, wallet);
  return { provider, wallet, escrow, reputation };
}

async function sendWithNonceRetry(sendFn, provider, wallet) {
  try {
    return await sendFn();
  } catch (e) {
    const msg = String(e?.message || e);
    if (msg.includes('nonce has already been used') || msg.includes('nonce too low') || msg.includes('replacement transaction underpriced')) {
      const nonce = await provider.getTransactionCount(wallet.address, 'pending');
      return await sendFn({ nonce });
    }
    throw e;
  }
}

export async function createEscrowJobOnchain({ agent, milestoneAmounts }) {
  if (!isConfigured()) return { skipped: true, reason: 'onchain_not_configured' };

  const { provider, wallet, escrow } = getClients();
  const amounts = milestoneAmounts.map((n) => BigInt(Math.trunc(Number(n))));
  const total = amounts.reduce((s, x) => s + x, 0n);

  const tx = await sendWithNonceRetry(
    (overrides = {}) => escrow.createJob(agent, amounts, { value: total, ...overrides }),
    provider,
    wallet
  );
  const receipt = await tx.wait();

  let onchainJobId = null;
  const iface = new ethers.Interface(escrowAbi);
  for (const log of receipt.logs || []) {
    try {
      const parsed = iface.parseLog(log);
      if (parsed?.name === 'JobCreated') {
        onchainJobId = Number(parsed.args.jobId);
        break;
      }
    } catch {
      // ignore non-matching logs
    }
  }

  return {
    skipped: false,
    txHash: receipt.hash,
    blockNumber: receipt.blockNumber,
    onchainJobId,
  };
}

export async function releaseMilestoneOnchain({ jobId, milestoneId, receiptHash }) {
  if (!isConfigured()) return { skipped: true, reason: 'onchain_not_configured' };
  if (!process.env.AGENT_PRIVATE_KEY) {
    return { skipped: true, reason: 'agent_private_key_required_for_submit' };
  }

  const { provider, wallet, escrow } = getClients();
  const normalized = (receiptHash || '').replace(/^0x/, '');
  const hash = normalized.length === 64 ? `0x${normalized}` : `0x${'0'.repeat(64)}`;

  // 1) agent submits milestone proof
  const agentWallet = new ethers.Wallet(process.env.AGENT_PRIVATE_KEY, provider);
  const agentEscrow = new ethers.Contract(process.env.ESCROW_CONTRACT_ADDRESS, escrowAbi, agentWallet);
  const submitTx = await sendWithNonceRetry(
    (overrides = {}) => agentEscrow.submitMilestone(jobId, milestoneId, hash, overrides),
    provider,
    agentWallet
  );
  const submitRc = await submitTx.wait();

  // 2) client approves + releases
  const approveTx = await sendWithNonceRetry(
    (overrides = {}) => escrow.approveMilestone(jobId, milestoneId, overrides),
    provider,
    wallet
  );
  const approveRc = await approveTx.wait();

  const releaseTx = await sendWithNonceRetry(
    (overrides = {}) => escrow.releaseMilestone(jobId, milestoneId, overrides),
    provider,
    wallet
  );
  const releaseRc = await releaseTx.wait();

  return {
    skipped: false,
    submitTxHash: submitRc.hash,
    approveTxHash: approveRc.hash,
    releaseTxHash: releaseRc.hash,
    blockNumber: releaseRc.blockNumber,
  };
}

export async function updateReputationOnchain({ agent, score, receiptHash }) {
  if (!isConfigured()) return { skipped: true, reason: 'onchain_not_configured' };

  const { provider, wallet, reputation } = getClients();
  const normalized = (receiptHash || '').replace(/^0x/, '');
  const hash = normalized.length === 64 ? `0x${normalized}` : `0x${'0'.repeat(64)}`;

  const tx = await sendWithNonceRetry(
    (overrides = {}) => reputation.update(agent, Math.trunc(Number(score)), hash, overrides),
    provider,
    wallet
  );
  const receipt = await tx.wait();
  return { skipped: false, txHash: receipt.hash, blockNumber: receipt.blockNumber };
}
