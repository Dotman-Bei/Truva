// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import {Script, console} from "forge-std/Script.sol";
import {IdentityProxy} from "@onchain-id/solidity/contracts/proxy/IdentityProxy.sol";
import {IIdentityRegistry} from "@tokenysolutions/t-rex/contracts/registry/interface/IIdentityRegistry.sol";
import {IIdentity} from "@onchain-id/solidity/contracts/interface/IIdentity.sol";

/// Registers wallets as eligible on the low-gas mainnet demo suite (chain 677). Gas-minimal: one small
/// ONCHAINID proxy and one registerIdentity per wallet; sends no BOT. TESTERS: comma-separated addresses.
contract OnboardMainnetLite is Script {
    address constant ONCHAINID_IA = 0xA5aeF4767C10fE47d1097b65Da55357B29bbbfF6;
    uint16 constant COUNTRY = 702;

    function _key(string memory name) internal view returns (uint256) {
        string memory raw = vm.envString(name);
        bytes memory b = bytes(raw);
        bool prefixed = b.length > 1 && b[0] == "0" && b[1] == "x";
        return vm.parseUint(prefixed ? raw : string.concat("0x", raw));
    }

    function run() external {
        require(block.chainid == 677, "This script is for BOT Chain mainnet (677)");
        IIdentityRegistry ir = IIdentityRegistry(
            vm.parseJsonAddress(vm.readFile("./deployments/bot-mainnet-demo.json"), ".identityRegistry")
        );
        address[] memory testers = vm.envAddress("TESTERS", ",");
        uint256 issuerPk = _key("PRIVATE_KEY");

        vm.startBroadcast(issuerPk);
        for (uint256 i = 0; i < testers.length; i++) {
            if (ir.isVerified(testers[i])) {
                console.log("already eligible", testers[i]);
                continue;
            }
            IdentityProxy id = new IdentityProxy(ONCHAINID_IA, vm.addr(issuerPk));
            ir.registerIdentity(testers[i], IIdentity(address(id)), COUNTRY);
            console.log("now eligible    ", testers[i]);
        }
        vm.stopBroadcast();
    }
}
