// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import {Script, console} from "forge-std/Script.sol";
import {DemoSuite} from "./DemoSuite.sol";

/// Registers tester wallets as eligible buyers on Truva's demo suite (Bohr testnet only).
/// TESTERS: comma-separated wallet addresses. Keys come from contracts/.env (PRIVATE_KEY, CLAIM_SIGNER_KEY).
/// Suite addresses come from deployments/bohr-demo-suite.json.
contract OnboardTesters is Script, DemoSuite {
    function _start(uint256 pk) internal override {
        vm.startBroadcast(pk);
    }

    function _stop() internal override {
        vm.stopBroadcast();
    }

    function _sign(uint256 pk, bytes32 digest) internal pure override returns (bytes memory) {
        (uint8 v, bytes32 r, bytes32 sg) = vm.sign(pk, digest);
        return abi.encodePacked(r, sg, v);
    }

    function _addr(uint256 pk) internal pure override returns (address) {
        return vm.addr(pk);
    }

    function _key(string memory name) internal view returns (uint256) {
        string memory raw = vm.envString(name);
        bytes memory b = bytes(raw);
        bool prefixed = b.length > 1 && b[0] == "0" && b[1] == "x";
        return vm.parseUint(prefixed ? raw : string.concat("0x", raw));
    }

    function run() external {
        require(block.chainid == 968, "Truva demo suite is on Bohr testnet only");
        string memory json = vm.readFile("./deployments/bohr-demo-suite.json");
        address ir = vm.parseJsonAddress(json, ".identityRegistry");
        address claimIssuer = vm.parseJsonAddress(json, ".claimIssuer");
        address[] memory testers = vm.envAddress("TESTERS", ",");
        uint256 issuerPk = _key("PRIVATE_KEY");
        uint256 signerPk = _key("CLAIM_SIGNER_KEY");

        for (uint256 i = 0; i < testers.length; i++) {
            (address identity, bool skipped) = _onboardTester(ir, claimIssuer, issuerPk, signerPk, testers[i]);
            console.log(skipped ? "already eligible" : "now eligible    ", testers[i], identity);
        }
    }
}
