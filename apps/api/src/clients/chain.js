import { ethers } from 'ethers';

const escrowAbi = [
  'function createJob(address agent, uint256[] milestoneAmounts) payable returns (uint256 jobId)',
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
  return { escrow, reputation };
}

export async function createEscrowJobOnchain({ agent, milestoneAmounts }) {
  if (!isConfigured()) return { skipped: true, reason: 'onchain_not_configured' };

  const { escrow } = getClients();
  const amounts = milestoneAmounts.map((n) => BigInt(Math.trunc(Number(n))));
  const total = amounts.reduce((s, x) => s + x, 0n);

  const tx = await escrow.createJob(agent, amounts, { value: total });
  const receipt = await tx.wait();
  return { skipped: false, txHash: receipt.hash, blockNumber: receipt.blockNumber };
}

export async function releaseMilestoneOnchain({ jobId, milestoneId }) {
  if (!isConfigured()) return { skipped: true, reason: 'onchain_not_configured' };

  const { escrow } = getClients();
  const tx = await escrow.releaseMilestone(jobId, milestoneId);
  const receipt = await tx.wait();
  return { skipped: false, txHash: receipt.hash, blockNumber: receipt.blockNumber };
}

export async function updateReputationOnchain({ agent, score, receiptHash }) {
  if (!isConfigured()) return { skipped: true, reason: 'onchain_not_configured' };

  const { reputation } = getClients();
  const normalized = (receiptHash || '').replace(/^0x/, '');
  const hash = normalized.length === 64 ? `0x${normalized}` : `0x${'0'.repeat(64)}`;

  const tx = await reputation.update(agent, Math.trunc(Number(score)), hash);
  const receipt = await tx.wait();
  return { skipped: false, txHash: receipt.hash, blockNumber: receipt.blockNumber };
}
