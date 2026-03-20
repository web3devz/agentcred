// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract EscrowAgreement {
    enum Status {
        None,
        Funded,
        Submitted,
        Approved,
        Released,
        Disputed,
        Refunded
    }

    struct Milestone {
        uint256 amount;
        bool completed;
        bool approved;
        bytes32 receiptHash;
    }

    struct Job {
        address client;
        address agent;
        uint256 totalAmount;
        uint256 releasedAmount;
        Status status;
        uint64 createdAt;
    }

    uint256 public nextJobId;
    mapping(uint256 => Job) public jobs;
    mapping(uint256 => mapping(uint256 => Milestone)) public milestones;
    mapping(uint256 => uint256) public milestoneCount;

    event JobCreated(uint256 indexed jobId, address indexed client, address indexed agent, uint256 totalAmount);
    event MilestoneAdded(uint256 indexed jobId, uint256 indexed milestoneId, uint256 amount);
    event MilestoneSubmitted(uint256 indexed jobId, uint256 indexed milestoneId, bytes32 receiptHash);
    event MilestoneApproved(uint256 indexed jobId, uint256 indexed milestoneId);
    event MilestoneReleased(uint256 indexed jobId, uint256 indexed milestoneId, uint256 amount);
    event JobDisputed(uint256 indexed jobId, string reason);
    event JobRefunded(uint256 indexed jobId, uint256 amount);

    modifier onlyClient(uint256 jobId) {
        require(msg.sender == jobs[jobId].client, "only client");
        _;
    }

    modifier onlyAgent(uint256 jobId) {
        require(msg.sender == jobs[jobId].agent, "only agent");
        _;
    }

    modifier jobExists(uint256 jobId) {
        require(jobs[jobId].status != Status.None, "job not found");
        _;
    }

    function createJob(address agent, uint256[] calldata milestoneAmounts)
        external
        payable
        returns (uint256 jobId)
    {
        require(agent != address(0), "agent=0");
        require(milestoneAmounts.length > 0, "no milestones");

        uint256 sum;
        for (uint256 i = 0; i < milestoneAmounts.length; i++) {
            require(milestoneAmounts[i] > 0, "milestone=0");
            sum += milestoneAmounts[i];
        }
        require(msg.value == sum, "fund mismatch");

        jobId = nextJobId++;
        jobs[jobId] = Job({
            client: msg.sender,
            agent: agent,
            totalAmount: sum,
            releasedAmount: 0,
            status: Status.Funded,
            createdAt: uint64(block.timestamp)
        });

        for (uint256 i = 0; i < milestoneAmounts.length; i++) {
            milestones[jobId][i] = Milestone({amount: milestoneAmounts[i], completed: false, approved: false, receiptHash: bytes32(0)});
            emit MilestoneAdded(jobId, i, milestoneAmounts[i]);
        }
        milestoneCount[jobId] = milestoneAmounts.length;

        emit JobCreated(jobId, msg.sender, agent, sum);
    }

    function submitMilestone(uint256 jobId, uint256 milestoneId, bytes32 receiptHash)
        external
        jobExists(jobId)
        onlyAgent(jobId)
    {
        require(receiptHash != bytes32(0), "receipt=0");
        require(milestoneId < milestoneCount[jobId], "bad milestone");
        Job storage job = jobs[jobId];
        require(job.status == Status.Funded || job.status == Status.Submitted, "bad status");

        Milestone storage m = milestones[jobId][milestoneId];
        require(!m.completed, "already completed");
        m.completed = true;
        m.receiptHash = receiptHash;

        job.status = Status.Submitted;
        emit MilestoneSubmitted(jobId, milestoneId, receiptHash);
    }

    function approveMilestone(uint256 jobId, uint256 milestoneId)
        external
        jobExists(jobId)
        onlyClient(jobId)
    {
        require(milestoneId < milestoneCount[jobId], "bad milestone");
        Job storage job = jobs[jobId];
        require(job.status == Status.Submitted || job.status == Status.Funded, "bad status");

        Milestone storage m = milestones[jobId][milestoneId];
        require(m.completed, "not submitted");
        require(!m.approved, "already approved");
        m.approved = true;

        emit MilestoneApproved(jobId, milestoneId);
    }

    function releaseMilestone(uint256 jobId, uint256 milestoneId)
        external
        jobExists(jobId)
        onlyClient(jobId)
    {
        require(milestoneId < milestoneCount[jobId], "bad milestone");
        Job storage job = jobs[jobId];
        require(job.status != Status.Disputed && job.status != Status.Refunded, "closed");

        Milestone storage m = milestones[jobId][milestoneId];
        require(m.approved, "not approved");
        require(m.amount > 0, "already released");

        uint256 amount = m.amount;
        m.amount = 0;
        job.releasedAmount += amount;

        payable(job.agent).transfer(amount);
        emit MilestoneReleased(jobId, milestoneId, amount);

        if (job.releasedAmount == job.totalAmount) {
            job.status = Status.Released;
        } else {
            job.status = Status.Funded;
        }
    }

    function openDispute(uint256 jobId, string calldata reason) external jobExists(jobId) {
        Job storage job = jobs[jobId];
        require(msg.sender == job.client || msg.sender == job.agent, "not participant");
        require(job.status != Status.Released && job.status != Status.Refunded, "closed");
        job.status = Status.Disputed;
        emit JobDisputed(jobId, reason);
    }

    function refundAll(uint256 jobId)
        external
        jobExists(jobId)
        onlyClient(jobId)
    {
        Job storage job = jobs[jobId];
        require(job.status == Status.Disputed || job.status == Status.Funded || job.status == Status.Submitted, "bad status");

        uint256 remaining = job.totalAmount - job.releasedAmount;
        job.status = Status.Refunded;
        if (remaining > 0) {
            payable(job.client).transfer(remaining);
        }

        emit JobRefunded(jobId, remaining);
    }
}
