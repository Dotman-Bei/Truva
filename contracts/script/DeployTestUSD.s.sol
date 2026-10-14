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
        // Accept the key with or without a 0x prefix; refuse to fall back silently to a default sender.
        string memory raw = vm.envOr("PRIVATE_KEY", string(""));
        if (bytes(raw).length != 0) {
            bool prefixed = bytes(raw).length > 1 && bytes(raw)[0] == "0" && bytes(raw)[1] == "x";
            vm.startBroadcast(vm.parseUint(prefixed ? raw : string.concat("0x", raw)));
        } else {
            vm.startBroadcast();
        }
        token = new TestUSD();
        vm.stopBroadcast();
        console.log("TestUSD deployed at", address(token));
    }
}
