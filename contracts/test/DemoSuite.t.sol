// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import {Test} from "forge-std/Test.sol";
import {Token} from "@tokenysolutions/t-rex/contracts/token/Token.sol";
import {IdentityRegistry} from "@tokenysolutions/t-rex/contracts/registry/implementation/IdentityRegistry.sol";
import {DemoSuite} from "../script/DemoSuite.sol";

contract DemoSuiteTest is Test, DemoSuite {
    uint256 issuerPk = 0xA11CE;
    uint256 signerPk = 0x5167;
    uint256 buyerPk = 0xB0B;
    Suite s;
    address constant STRANGER = address(0xdead);

    function _start(uint256 pk) internal override {
        vm.startPrank(vm.addr(pk));
    }

    function _stop() internal override {
        vm.stopPrank();
    }

    function _sign(uint256 pk, bytes32 digest) internal pure override returns (bytes memory) {
        (uint8 v, bytes32 r, bytes32 sg) = vm.sign(pk, digest);
        return abi.encodePacked(r, sg, v);
    }

    function _addr(uint256 pk) internal pure override returns (address) {
        return vm.addr(pk);
    }

    function setUp() public {
        vm.deal(vm.addr(issuerPk), 10 ether);
        s = _deploySuite(issuerPk, signerPk, buyerPk);
    }

    function test_buyerAndIssuerAreEligible_strangerIsNot() public view {
        IdentityRegistry ir = IdentityRegistry(s.identityRegistry);
        assertTrue(ir.isVerified(vm.addr(issuerPk)));
        assertTrue(ir.isVerified(vm.addr(buyerPk)));
        assertFalse(ir.isVerified(STRANGER));
    }

    function test_tokenIsWiredLikeBotChainsSuite() public view {
        Token t = Token(s.token);
        assertEq(address(t.identityRegistry()), s.identityRegistry);
        assertEq(address(t.compliance()), s.compliance);
        assertEq(t.decimals(), 6);
        assertFalse(t.paused());
        assertEq(t.balanceOf(vm.addr(issuerPk)), INVENTORY);
        assertTrue(t.isAgent(vm.addr(issuerPk)));
    }

    function test_deliveryToEligibleBuyerSucceeds() public {
        Token t = Token(s.token);
        vm.prank(vm.addr(issuerPk));
        t.transfer(vm.addr(buyerPk), 25e6);
        assertEq(t.balanceOf(vm.addr(buyerPk)), 25e6);
    }

    function test_deliveryToIneligibleWalletIsRejectedByTheSuite() public {
        Token t = Token(s.token);
        vm.prank(vm.addr(issuerPk));
        vm.expectRevert("Transfer not possible");
        t.transfer(STRANGER, 1e6);
    }

    function test_buyerGotGasForItsOwnTransactions() public view {
        assertGt(vm.addr(buyerPk).balance, 0);
    }
}
