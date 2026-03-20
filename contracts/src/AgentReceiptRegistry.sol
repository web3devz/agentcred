// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract AgentReceiptRegistry {
    event ReceiptStored(bytes32 indexed receiptHash, address indexed agent, uint256 jobId);
    function store(bytes32 receiptHash, address agent, uint256 jobId) external {
        emit ReceiptStored(receiptHash, agent, jobId);
    }
}
