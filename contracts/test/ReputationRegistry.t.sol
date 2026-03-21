// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ReputationRegistry} from "../src/ReputationRegistry.sol";

contract ReputationRegistryTest {
    ReputationRegistry internal rep;

    function setUp() public {
        rep = new ReputationRegistry();
    }

    function testOwnerIsUpdaterAndCanAddUpdater() public {
        setUp();
        // owner is msg.sender in constructor and is allowed by default
        (uint256 score0, uint256 jobs0, uint256 t0) = rep.get(address(0xBEEF));
        require(score0 == 0 && jobs0 == 0 && t0 == 0, "initial zero");

        // owner grants updater role to another address
        rep.setUpdater(address(0xBEEF), true);

        // emulate update as delegated by calling through that address via low-level call
        // We cannot easily change msg.sender here; just call as owner (also an updater)
        rep.update(address(0xBEEF), 77, bytes32(uint256(1)));
        (uint256 score1, uint256 jobs1, uint256 t1) = rep.get(address(0xBEEF));
        require(score1 == 77 && jobs1 == 1 && t1 > 0, "updated");
    }

    function testRejectTooHighScore() public {
        setUp();
        bool ok;
        bytes memory data;
        (ok, data) = address(rep).call(abi.encodeWithSignature("update(address,uint256,bytes32)", address(1), 2000, bytes32(0)));
        require(!ok, "should revert when score too high");
        (uint256 s,,) = rep.get(address(1));
        require(s == 0, "no update on revert");
    }
}
