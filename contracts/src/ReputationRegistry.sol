// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract ReputationRegistry {
    struct Reputation {
        uint256 score;
        uint256 jobsCompleted;
        uint256 lastUpdated;
    }

    address public owner;
    mapping(address => bool) public isUpdater;
    mapping(address => Reputation) public reputations;

    event UpdaterSet(address indexed updater, bool allowed);
    event ReputationUpdated(
        address indexed agent,
        uint256 score,
        uint256 jobsCompleted,
        bytes32 receiptHash,
        address indexed updater
    );

    modifier onlyOwner() {
        require(msg.sender == owner, "only owner");
        _;
    }

    modifier onlyUpdater() {
        require(isUpdater[msg.sender], "only updater");
        _;
    }

    constructor() {
        owner = msg.sender;
        isUpdater[msg.sender] = true;
    }

    function setUpdater(address updater, bool allowed) external onlyOwner {
        require(updater != address(0), "updater=0");
        isUpdater[updater] = allowed;
        emit UpdaterSet(updater, allowed);
    }

    function update(address agent, uint256 newScore, bytes32 receiptHash) external onlyUpdater {
        require(agent != address(0), "agent=0");
        require(newScore <= 1000, "score too high");

        Reputation storage r = reputations[agent];
        r.score = newScore;
        r.jobsCompleted += 1;
        r.lastUpdated = block.timestamp;

        emit ReputationUpdated(agent, r.score, r.jobsCompleted, receiptHash, msg.sender);
    }

    function get(address agent) external view returns (uint256 score, uint256 jobsCompleted, uint256 lastUpdated) {
        Reputation storage r = reputations[agent];
        return (r.score, r.jobsCompleted, r.lastUpdated);
    }
}
