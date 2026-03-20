import { ethers } from 'ethers';
import fs from 'node:fs';
import path from 'node:path';

const RPC = process.env.BASE_SEPOLIA_RPC_URL;
const PK = process.env.PRIVATE_KEY;

if (!RPC || !PK) {
  console.error('Missing env: BASE_SEPOLIA_RPC_URL and/or PRIVATE_KEY');
  process.exit(1);
}

// NOTE:
// For hackathon speed we keep this script simple and ABI/BYTECODE are loaded
// from JSON artifacts if present. Replace with your actual build artifact paths.
const artifactsDir = path.resolve(process.cwd(), 'out');

function loadArtifact(name) {
  const p = path.join(artifactsDir, `${name}.json`);
  if (!fs.existsSync(p)) {
    throw new Error(`Artifact not found: ${p}`);
  }
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

async function deployFromArtifact(name, signer, args = []) {
  const artifact = loadArtifact(name);
  const factory = new ethers.ContractFactory(artifact.abi, artifact.bytecode, signer);
  const contract = await factory.deploy(...args);
  await contract.waitForDeployment();
  const address = await contract.getAddress();
  return { address, txHash: contract.deploymentTransaction()?.hash };
}

async function main() {
  const provider = new ethers.JsonRpcProvider(RPC);
  const signer = new ethers.Wallet(PK, provider);

  console.log('Deployer:', signer.address);
  const network = await provider.getNetwork();
  console.log('Network:', network.name, 'chainId=', Number(network.chainId));

  if (Number(network.chainId) !== 84532) {
    throw new Error('Not Base Sepolia (expected chainId 84532)');
  }

  const escrow = await deployFromArtifact('EscrowAgreement', signer);
  console.log('EscrowAgreement:', escrow.address, 'tx=', escrow.txHash);

  const reputation = await deployFromArtifact('ReputationRegistry', signer);
  console.log('ReputationRegistry:', reputation.address, 'tx=', reputation.txHash);

  const receipts = await deployFromArtifact('AgentReceiptRegistry', signer);
  console.log('AgentReceiptRegistry:', receipts.address, 'tx=', receipts.txHash);

  const deployed = {
    network: 'base-sepolia',
    chainId: 84532,
    deployer: signer.address,
    timestamp: new Date().toISOString(),
    contracts: {
      EscrowAgreement: escrow.address,
      ReputationRegistry: reputation.address,
      AgentReceiptRegistry: receipts.address
    }
  };

  const out = path.resolve(process.cwd(), 'deployments/base-sepolia.json');
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, JSON.stringify(deployed, null, 2));
  console.log('Saved:', out);
}

main().catch((err) => {
  console.error('Deploy failed:', err.message || err);
  process.exit(1);
});
