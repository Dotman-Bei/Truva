// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import {Script, console} from "forge-std/Script.sol";
import {LiteSuite} from "./LiteSuite.sol";

/// Deploys the low-gas Truva demo (proxies + TestUSD) on BOT Chain mainnet (chain 677) as a labelled
/// capability demo. PRIVATE_KEY is the issuer; BUYER_KEY's address becomes the registered test buyer.
contract DeployMainnetLite is Script, LiteSuite {
    // BOT Chain mainnet, from https://dev-docs.botchain.ai/docs/RWA/deployment-addresses/ (checked on-chain).
    address constant TREX_IA = 0x658B369FFfE2474310224c6DAe2f320A27A76D2E;
    address constant ONCHAINID_IA = 0xA5aeF4767C10fE47d1097b65Da55357B29bbbfF6;

    function _key(string memory name) internal view returns (uint256) {
        string memory raw = vm.envString(name);
        bytes memory b = bytes(raw);
        bool prefixed = b.length > 1 && b[0] == "0" && b[1] == "x";
        return vm.parseUint(prefixed ? raw : string.concat("0x", raw));
    }

    function run() external returns (Lite memory s, address tusd) {
        require(block.chainid == 677, "This script is for BOT Chain mainnet (677)");
        uint256 issuerPk = _key("PRIVATE_KEY");
        address issuer = vm.addr(issuerPk);
        address buyer = vm.addr(_key("BUYER_KEY"));

        vm.startBroadcast(issuerPk);
        tusd = vm.deployCode("TestUSD.sol:TestUSD");
        s = _deployLite(TREX_IA, ONCHAINID_IA, issuer, buyer);
        vm.stopBroadcast();

        string memory o = "lite";
        vm.serializeUint(o, "chainId", block.chainid);
        vm.serializeString(
            o,
            "note",
            "Capability demo: valueless tokens, no real-world asset. Proxies use BOT Chain T-REX and ONCHAINID implementation authorities."
        );
        vm.serializeAddress(o, "trexImplementationAuthority", TREX_IA);
        vm.serializeAddress(o, "onchainIdImplementationAuthority", ONCHAINID_IA);
        vm.serializeAddress(o, "issuer", issuer);
        vm.serializeAddress(o, "buyer", buyer);
        vm.serializeAddress(o, "paymentToken", tusd);
        vm.serializeAddress(o, "token", s.token);
        vm.serializeAddress(o, "identityRegistry", s.identityRegistry);
        vm.serializeAddress(o, "identityRegistryStorage", s.identityRegistryStorage);
        vm.serializeAddress(o, "claimTopicsRegistry", s.claimTopicsRegistry);
        vm.serializeAddress(o, "trustedIssuersRegistry", s.trustedIssuersRegistry);
        vm.serializeAddress(o, "compliance", s.compliance);
        vm.serializeAddress(o, "issuerIdentity", s.issuerIdentity);
        string memory json = vm.serializeAddress(o, "buyerIdentity", s.buyerIdentity);
        vm.writeJson(json, "./deployments/bot-mainnet-demo.json");
        console.log("TDA token      ", s.token);
        console.log("Identity reg   ", s.identityRegistry);
        console.log("TestUSD        ", tusd);
    }
}
