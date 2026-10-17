// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import {Test} from "forge-std/Test.sol";
import {IToken} from "@tokenysolutions/t-rex/contracts/token/IToken.sol";
import {IIdentityRegistry} from "@tokenysolutions/t-rex/contracts/registry/interface/IIdentityRegistry.sol";
import {LiteSuite} from "../script/LiteSuite.sol";

/// Runs the low-gas suite against a fork of BOT Chain mainnet. Needs network access.
/// Run with: forge test --match-path "test/MainnetLite.fork.t.sol"
contract MainnetLiteForkTest is Test, LiteSuite {
    address constant TREX_IA = 0x658B369FFfE2474310224c6DAe2f320A27A76D2E;
    address constant ONCHAINID_IA = 0xA5aeF4767C10fE47d1097b65Da55357B29bbbfF6;
    address issuer = makeAddr("issuer");
    address buyer = makeAddr("buyer");
    address constant STRANGER = address(0xdead);
    Lite s;

    function setUp() public {
        vm.createSelectFork("https://rpc.botchain.ai");
        vm.deal(issuer, 1 ether);
        vm.startPrank(issuer, issuer);
        s = _deployLite(TREX_IA, ONCHAINID_IA, issuer, buyer);
        vm.stopPrank();
    }

    function test_suiteWorksOnBotMainnetImplementations() public {
        IToken t = IToken(s.token);
        assertEq(t.decimals(), 6);
        assertFalse(t.paused());
        assertEq(t.balanceOf(issuer), INVENTORY);
        assertTrue(IIdentityRegistry(s.identityRegistry).isVerified(buyer));
        assertFalse(IIdentityRegistry(s.identityRegistry).isVerified(STRANGER));
        assertEq(buyer.balance, BUYER_GAS);

        vm.prank(issuer);
        t.transfer(buyer, 25e6);
        assertEq(t.balanceOf(buyer), 25e6);

        vm.prank(issuer);
        vm.expectRevert("Transfer not possible");
        t.transfer(STRANGER, 1e6);
    }
}
