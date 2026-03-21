import { ethers } from 'ethers';

async function main() {
  const RPC = process.env.BASE_SEPOLIA_RPC_URL;
  const ESCROW = process.env.ESCROW_CONTRACT_ADDRESS;

  const provider = new ethers.JsonRpcProvider(RPC);
  const escrow = new ethers.Contract(
    ESCROW,
    [
      'function jobs(uint256) returns (address,address,uint256,uint256,uint8,uint64)',
      'function milestones(uint256,uint256) returns (uint256,bool,bool,bytes32)',
      'function milestoneCount(uint256) returns (uint256)',
    ],
    provider
  );

  const jobId = 11;

  try {
    const job = await escrow.jobs(jobId);
    console.log('Job 11:', {
      client: job[0],
      agent: job[1],
      totalAmount: job[2].toString(),
      releasedAmount: job[3].toString(),
      status: job[4],
      createdAt: job[5].toString(),
    });

    const count = await escrow.milestoneCount(jobId);
    console.log('Milestone count:', count.toString());

    const m0 = await escrow.milestones(jobId, 0);
    console.log('Milestone 0:', {
      amount: m0[0].toString(),
      completed: m0[1],
      approved: m0[2],
      receiptHash: m0[3],
    });
  } catch (e) {
    console.error(e.message);
  }
}

main();
