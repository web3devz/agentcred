// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {AgentReceiptRegistry} from "../src/AgentReceiptRegistry.sol";

contract AgentReceiptRegistryTest {
    AgentReceiptRegistry internal reg;

    function setUp() public {
        reg = new AgentReceiptRegistry();
    }

    function testStoreDoesNotRevert() public {
        setUp();
        reg.store(keccak256(abi.encodePacked("r1")), address(0xABCD), 123);
        // If it reverts, test will fail; event emission is not asserted here.
        require(true, "ok");
    }
}
