import { ethers } from 'ethers';

const DOMAIN_NAME = process.env.DELEGATION_DOMAIN_NAME || 'AgentCredDelegation';
const DOMAIN_VERSION = process.env.DELEGATION_DOMAIN_VERSION || '1';
const CHAIN_ID = Number(process.env.DELEGATION_CHAIN_ID || 84532); // Base Sepolia

const types = {
  Delegation: [
    { name: 'delegator', type: 'address' },
    { name: 'delegate', type: 'address' },
    { name: 'action', type: 'string' },
    { name: 'resource', type: 'string' },
    { name: 'nonce', type: 'uint256' },
    { name: 'deadline', type: 'uint256' }
  ]
};

function domain() {
  return { name: DOMAIN_NAME, version: DOMAIN_VERSION, chainId: CHAIN_ID };
}

export function verifyDelegation({ delegation, signature, expectedAction, expectedResource }) {
  if (!delegation || !signature) return { ok: false, error: 'delegation_or_signature_missing' };

  const now = Math.floor(Date.now() / 1000);
  if (Number(delegation.deadline) < now) return { ok: false, error: 'delegation_expired' };

  if (expectedAction && delegation.action !== expectedAction) {
    return { ok: false, error: 'action_mismatch' };
  }
  if (expectedResource && delegation.resource !== expectedResource) {
    return { ok: false, error: 'resource_mismatch' };
  }

  let recovered;
  try {
    recovered = ethers.verifyTypedData(domain(), types, delegation, signature);
  } catch (e) {
    return { ok: false, error: `invalid_signature_format:${String(e.message || e)}` };
  }

  if (recovered.toLowerCase() !== String(delegation.delegator || '').toLowerCase()) {
    return { ok: false, error: 'signer_mismatch', recovered };
  }

  return { ok: true, recovered, domain: domain(), types };
}

export function delegationEnvelope(action, resource, delegator, delegate, nonce = 0, ttlSec = 3600) {
  const deadline = Math.floor(Date.now() / 1000) + ttlSec;
  return {
    domain: domain(),
    types,
    message: { delegator, delegate, action, resource, nonce, deadline }
  };
}
