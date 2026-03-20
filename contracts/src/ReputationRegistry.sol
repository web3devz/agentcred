// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract ReputationRegistry {
    mapping(address => uint256) public score;
    event ReputationUpdated(address indexed agent, uint256 newScore, bytes32 receiptHash);

    function update(address agent, uint256 newScore, bytes32 receiptHash) external {
        score[agent] = newScore;
        emit ReputationUpdated(agent, newScore, receiptHash);
    }
}
