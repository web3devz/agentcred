// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {EscrowAgreement} from "../src/EscrowAgreement.sol";

contract AgentProxy {
    function submit(address escrow, uint256 jobId, uint256 milestoneId, bytes32 receiptHash) external {
        EscrowAgreement(escrow).submitMilestone(jobId, milestoneId, receiptHash);
    }
}

contract EscrowTest {
    EscrowAgreement internal escrow;
    AgentProxy internal agent;

    receive() external payable {}

    function setUp() public {
        escrow = new EscrowAgreement();
        agent = new AgentProxy();
    }

    function testCreateJobAndMilestone() public {
        setUp();
        uint256[] memory amts = new uint256[](1);
        amts[0] = 1 ether;
        uint256 id = escrow.createJob{value: 1 ether}(address(agent), amts);

        // status 1 == Funded
        (address client, address agt, uint256 total, uint256 released, EscrowAgreement.Status st, uint64 created) = escrow.jobs(id);
        require(client == address(this), "client mismatch");
        require(agt == address(agent), "agent mismatch");
        require(total == 1 ether && released == 0, "amounts");
        require(uint256(st) == uint256(EscrowAgreement.Status.Funded), "status funded");
        require(created > 0, "createdAt");

        require(escrow.milestoneCount(id) == 1, "milestone count");
        (uint256 mAmt, bool completed, bool approved, bytes32 rh) = escrow.milestones(id, 0);
        require(mAmt == 1 ether && !completed && !approved && rh == bytes32(0), "milestone init");
    }

    function testSubmitApproveReleaseFlow() public {
        setUp();
        uint256[] memory amts = new uint256[](1);
        amts[0] = 1 ether;
        uint256 id = escrow.createJob{value: 1 ether}(address(agent), amts);

        // non-agent submit should fail (only agent)
        (bool ok1, ) = address(escrow).call(abi.encodeWithSignature("submitMilestone(uint256,uint256,bytes32)", id, 0, bytes32(uint256(1))));
        require(!ok1, "non-agent submit must revert");

        // agent submits
        bytes32 rh = keccak256(abi.encodePacked("receipt-1"));
        agent.submit(address(escrow), id, 0, rh);
        (uint256 mAmt,, bool approved, bytes32 got) = escrow.milestones(id, 0);
        require(mAmt == 1 ether && approved == false && got == rh, "submitted");

        // approve before submit would revert; but now approve should pass
        escrow.approveMilestone(id, 0);
        (,, bool apprAfter,) = escrow.milestones(id, 0);
        require(apprAfter, "approved");

        // release funds to agent
        uint256 before = address(agent).balance;
        escrow.releaseMilestone(id, 0);
        uint256 afterBal = address(agent).balance;

        // internal state reflects release
        (uint256 mAmtAfter,,,) = escrow.milestones(id, 0);
        require(mAmtAfter == 0, "milestone drained");
        (, , uint256 total, uint256 released, EscrowAgreement.Status st, ) = escrow.jobs(id);
        require(released == total, "all released");
        require(uint256(st) == uint256(EscrowAgreement.Status.Released), "job released");

        // transfer happened
        require(afterBal >= before + 1 ether, "agent paid");
    }
}
