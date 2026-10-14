// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {Script, console} from "forge-std/Script.sol";
import {TestUSD} from "../src/TestUSD.sol";

/// Deploys TestUSD. Refuses to run anywhere except Bohr testnet (chain 968).
/// Signs with PRIVATE_KEY from contracts/.env when set; otherwise with the wallet given on the
/// command line (for example --interactive 1).
contract DeployTestUSD is Script {
    function run() external returns (TestUSD token) {
        require(block.chainid == 968, "TestUSD is for Bohr testnet only");
        uint256 key = vm.envOr("PRIVATE_KEY", uint256(0));
        if (key != 0) vm.startBroadcast(key);
        else vm.startBroadcast();
        token = new TestUSD();
        vm.stopBroadcast();
        console.log("TestUSD deployed at", address(token));
    }
}
