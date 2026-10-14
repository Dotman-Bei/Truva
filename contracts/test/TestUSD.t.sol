// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {Test} from "forge-std/Test.sol";
import {TestUSD} from "../src/TestUSD.sol";

contract TestUSDTest is Test {
    TestUSD token;
    address alice = makeAddr("alice");
    address bob = makeAddr("bob");

    event Transfer(address indexed from, address indexed to, uint256 value);

    function setUp() public {
        token = new TestUSD();
        vm.warp(1_700_000_000);
    }

    function test_metadataSaysItHasNoValue() public view {
        assertEq(token.name(), "Truva Test USD (no value)");
        assertEq(token.symbol(), "tUSD");
        assertEq(token.decimals(), 6);
    }

    function test_faucetMintsOnceThenCoolsDown() public {
        vm.prank(alice);
        token.faucet();
        assertEq(token.balanceOf(alice), 10_000e6);
        assertEq(token.totalSupply(), 10_000e6);

        vm.prank(alice);
        vm.expectRevert(abi.encodeWithSelector(TestUSD.FaucetCooldown.selector, block.timestamp + 1 days));
        token.faucet();

        vm.warp(block.timestamp + 1 days);
        vm.prank(alice);
        token.faucet();
        assertEq(token.balanceOf(alice), 20_000e6);
    }

    function test_transferEmitsTheEventTruvaVerifies() public {
        vm.prank(alice);
        token.faucet();
        vm.expectEmit(true, true, false, true, address(token));
        emit Transfer(alice, bob, 250e6);
        vm.prank(alice);
        assertTrue(token.transfer(bob, 250e6));
        assertEq(token.balanceOf(bob), 250e6);
        assertEq(token.balanceOf(alice), 9_750e6);
    }

    function test_cannotOverspend() public {
        vm.prank(alice);
        vm.expectRevert(TestUSD.InsufficientBalance.selector);
        token.transfer(bob, 1);
    }

    function test_cannotSendToZeroAddress() public {
        vm.prank(alice);
        token.faucet();
        vm.prank(alice);
        vm.expectRevert(TestUSD.ZeroAddress.selector);
        token.transfer(address(0), 1);
    }

    function test_transferFromRespectsAllowance() public {
        vm.prank(alice);
        token.faucet();
        vm.prank(alice);
        token.approve(bob, 100e6);
        vm.prank(bob);
        token.transferFrom(alice, bob, 60e6);
        assertEq(token.allowance(alice, bob), 40e6);
        vm.prank(bob);
        vm.expectRevert(TestUSD.InsufficientAllowance.selector);
        token.transferFrom(alice, bob, 41e6);
    }

    function testFuzz_transferConservesSupply(uint256 amount) public {
        vm.prank(alice);
        token.faucet();
        amount = bound(amount, 0, 10_000e6);
        vm.prank(alice);
        token.transfer(bob, amount);
        assertEq(token.balanceOf(alice) + token.balanceOf(bob), token.totalSupply());
    }
}
