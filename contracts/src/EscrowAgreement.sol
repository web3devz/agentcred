// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract EscrowAgreement {
    enum Status { Open, Funded, Completed, Released }
    struct Job { address client; address agent; uint256 amount; Status status; }
    uint256 public nextId;
    mapping(uint256 => Job) public jobs;

    function createJob(address agent) external payable returns (uint256 id) {
        require(msg.value > 0, "amount=0");
        id = nextId++;
        jobs[id] = Job(msg.sender, agent, msg.value, Status.Funded);
    }

    function release(uint256 id) external {
        Job storage j = jobs[id];
        require(msg.sender == j.client, "only client");
        require(j.status == Status.Funded || j.status == Status.Completed, "bad status");
        j.status = Status.Released;
        payable(j.agent).transfer(j.amount);
    }
}
