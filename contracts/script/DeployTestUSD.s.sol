// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {Script, console} from "forge-std/Script.sol";
import {TestUSD} from "../src/TestUSD.sol";

/// Deploys TestUSD. Refuses to run anywhere except Bohr testnet (chain 968).
contract DeployTestUSD is Script {
    function run() external returns (TestUSD token) {
        require(block.chainid == 968, "TestUSD is for Bohr testnet only");
        vm.startBroadcast();
        token = new TestUSD();
        vm.stopBroadcast();
        console.log("TestUSD deployed at", address(token));
    }
}
