import { ethers } from 'ethers';

const escrowAbi = [
  'function releaseMilestone(uint256 jobId, uint256 milestoneId)'
];

const DOMAIN_NAME = process.env.STATUS_GASLESS_DOMAIN_NAME || 'AgentCredStatusGasless';
const DOMAIN_VERSION = process.env.STATUS_GASLESS_DOMAIN_VERSION || '1';
const CHAIN_ID = Number(process.env.STATUS_GASLESS_CHAIN_ID || 11155420); // optimistic default for Status testnet-like env

const types = {
  GaslessRelease: [
    { name: 'user', type: 'address' },
    { name: 'jobId', type: 'uint256' },
    { name: 'milestoneId', type: 'uint256' },
    { name: 'nonce', type: 'uint256' },
    { name: 'deadline', type: 'uint256' }
  ]
};

export function statusGaslessConfigured() {
  return Boolean(
    process.env.STATUS_RPC_URL &&
    process.env.STATUS_RELAYER_PRIVATE_KEY &&
    process.env.ESCROW_CONTRACT_ADDRESS
  );
}

export function statusGaslessEnvelope({ user, jobId, milestoneId, nonce = 0, ttlSec = 900 }) {
  const deadline = Math.floor(Date.now() / 1000) + ttlSec;
  return {
    domain: {
      name: DOMAIN_NAME,
      version: DOMAIN_VERSION,
      chainId: CHAIN_ID,
    },
    types,
    message: {
      user,
      jobId: Number(jobId),
      milestoneId: Number(milestoneId),
      nonce: Number(nonce),
      deadline,
    }
  };
}

export function verifyGaslessRelease({ envelope, signature }) {
  if (!envelope || !signature) return { ok: false, error: 'envelope_or_signature_missing' };
  const now = Math.floor(Date.now() / 1000);
  if (Number(envelope?.message?.deadline || 0) < now) return { ok: false, error: 'gasless_intent_expired' };

  try {
    const recovered = ethers.verifyTypedData(envelope.domain, envelope.types, envelope.message, signature);
    if (recovered.toLowerCase() !== String(envelope.message.user || '').toLowerCase()) {
      return { ok: false, error: 'signer_mismatch', recovered };
    }
    return { ok: true, recovered };
  } catch (e) {
    return { ok: false, error: `invalid_signature:${String(e.message || e)}` };
  }
}

export async function relayGaslessRelease({ jobId, milestoneId }) {
  if (!statusGaslessConfigured()) return { skipped: true, reason: 'status_gasless_not_configured' };

  const provider = new ethers.JsonRpcProvider(process.env.STATUS_RPC_URL);
  const relayer = new ethers.Wallet(process.env.STATUS_RELAYER_PRIVATE_KEY, provider);
  const escrow = new ethers.Contract(process.env.ESCROW_CONTRACT_ADDRESS, escrowAbi, relayer);

  const tx = await escrow.releaseMilestone(Number(jobId), Number(milestoneId));
  const rc = await tx.wait();

  return {
    skipped: false,
    txHash: rc.hash,
    blockNumber: rc.blockNumber,
    relayer: relayer.address,
  };
}
