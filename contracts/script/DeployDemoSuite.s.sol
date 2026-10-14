// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import {Script, console} from "forge-std/Script.sol";
import {DemoSuite} from "./DemoSuite.sol";

/// Deploys Truva's demo ERC-3643 suite to Bohr testnet (chain 968 only).
/// Keys come from contracts/.env: PRIVATE_KEY (issuer: owner, agent, inventory and treasury),
/// CLAIM_SIGNER_KEY (signs KYC claims) and BUYER_KEY (the test buyer). Writes deployments/bohr-demo-suite.json.
contract DeployDemoSuite is Script, DemoSuite {
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

    function run() external returns (Suite memory s) {
        require(block.chainid == 968, "The Truva demo suite is for Bohr testnet only");
        uint256 issuerPk = _key("PRIVATE_KEY");
        uint256 signerPk = _key("CLAIM_SIGNER_KEY");
        uint256 buyerPk = _key("BUYER_KEY");

        s = _deploySuite(issuerPk, signerPk, buyerPk);

        string memory o = "suite";
        vm.serializeUint(o, "chainId", block.chainid);
        vm.serializeAddress(o, "issuer", vm.addr(issuerPk));
        vm.serializeAddress(o, "claimSigner", vm.addr(signerPk));
        vm.serializeAddress(o, "buyer", vm.addr(buyerPk));
        vm.serializeAddress(o, "token", s.token);
        vm.serializeAddress(o, "identityRegistry", s.identityRegistry);
        vm.serializeAddress(o, "identityRegistryStorage", s.identityRegistryStorage);
        vm.serializeAddress(o, "claimTopicsRegistry", s.claimTopicsRegistry);
        vm.serializeAddress(o, "trustedIssuersRegistry", s.trustedIssuersRegistry);
        vm.serializeAddress(o, "compliance", s.compliance);
        vm.serializeAddress(o, "claimIssuer", s.claimIssuer);
        vm.serializeAddress(o, "issuerIdentity", s.issuerIdentity);
        string memory json = vm.serializeAddress(o, "buyerIdentity", s.buyerIdentity);
        vm.writeJson(json, "./deployments/bohr-demo-suite.json");

        console.log("Token (TDA)       ", s.token);
        console.log("IdentityRegistry  ", s.identityRegistry);
        console.log("ModularCompliance ", s.compliance);
    }
}
