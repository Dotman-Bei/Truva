// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import {Token} from "@tokenysolutions/t-rex/contracts/token/Token.sol";
import {IdentityRegistry} from "@tokenysolutions/t-rex/contracts/registry/implementation/IdentityRegistry.sol";
import {IdentityRegistryStorage} from "@tokenysolutions/t-rex/contracts/registry/implementation/IdentityRegistryStorage.sol";
import {ClaimTopicsRegistry} from "@tokenysolutions/t-rex/contracts/registry/implementation/ClaimTopicsRegistry.sol";
import {TrustedIssuersRegistry} from "@tokenysolutions/t-rex/contracts/registry/implementation/TrustedIssuersRegistry.sol";
import {ModularCompliance} from "@tokenysolutions/t-rex/contracts/compliance/modular/ModularCompliance.sol";
import {Identity} from "@onchain-id/solidity/contracts/Identity.sol";
import {ClaimIssuer} from "@onchain-id/solidity/contracts/ClaimIssuer.sol";
import {IClaimIssuer} from "@onchain-id/solidity/contracts/interface/IClaimIssuer.sol";
import {IIdentity} from "@onchain-id/solidity/contracts/interface/IIdentity.sol";

/// @notice Builds Truva's demo ERC-3643 suite from the unmodified Tokeny T-REX 4.1.6 and ONCHAINID 2.2.1
///         contracts: token, IdentityRegistry (+ storage), ClaimTopicsRegistry, TrustedIssuersRegistry,
///         ModularCompliance, a ClaimIssuer, and an ONCHAINID per verified wallet holding a signed KYC claim.
///         Eligibility uses BOT Chain's KYC_APPROVED topic. The issuer is token owner and agent.
/// @dev    Shared by the deploy script and its test; signing and sender switching are hooks.
abstract contract DemoSuite {
    uint256 internal constant KYC_APPROVED = uint256(keccak256("KYC_APPROVED"));
    uint16 internal constant COUNTRY = 702; // Singapore, one of the codes BOT Chain's demo suite allows
    uint256 internal constant INVENTORY = 1_000 * 10 ** 6; // 1,000 demo tokens, 6 decimals
    uint256 internal constant BUYER_GAS = 0.3 ether; // test BOT so the buyer can sign its own claim and payment

    struct Suite {
        address token;
        address identityRegistry;
        address identityRegistryStorage;
        address claimTopicsRegistry;
        address trustedIssuersRegistry;
        address compliance;
        address claimIssuer;
        address issuerIdentity;
        address buyerIdentity;
    }

    function _start(uint256 pk) internal virtual;
    function _stop() internal virtual;
    function _sign(uint256 pk, bytes32 digest) internal virtual returns (bytes memory);
    function _addr(uint256 pk) internal virtual returns (address);

    function _claimSignature(uint256 signerPk, address identity) internal returns (bytes memory sig, bytes memory data) {
        data = bytes("KYC approved: Truva demo suite on Bohr testnet");
        bytes32 dataHash = keccak256(abi.encode(identity, KYC_APPROVED, data));
        bytes32 prefixed = keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", dataHash));
        sig = _sign(signerPk, prefixed);
    }

    uint256 internal constant TESTER_GAS = 0.05 ether; // enough test BOT for a faucet draw and a payment

    /// @notice Makes `tester` eligible: an ONCHAINID holding a signed KYC claim, registered in the
    ///         IdentityRegistry, plus a little test BOT for gas. Skips wallets that are already verified.
    /// @dev    Demo shortcut: the issuer manages the tester's ONCHAINID so testers never sign anything to be
    ///         onboarded. In production the investor holds their own identity's management key.
    function _onboardTester(
        address identityRegistry,
        address claimIssuer,
        uint256 issuerPk,
        uint256 signerPk,
        address tester
    ) internal returns (address identity, bool skipped) {
        IdentityRegistry ir = IdentityRegistry(identityRegistry);
        if (ir.isVerified(tester)) return (address(ir.identity(tester)), true);

        _start(issuerPk);
        Identity id = new Identity(_addr(issuerPk), false);
        (bytes memory sig, bytes memory data) = _claimSignature(signerPk, address(id));
        id.addClaim(KYC_APPROVED, 1, claimIssuer, sig, data, "");
        ir.registerIdentity(tester, IIdentity(address(id)), COUNTRY);
        if (tester.balance < TESTER_GAS) payable(tester).transfer(TESTER_GAS - tester.balance);
        _stop();
        return (address(id), false);
    }

    function _deploySuite(uint256 issuerPk, uint256 signerPk, uint256 buyerPk) internal returns (Suite memory s) {
        _start(issuerPk);
        _deployRegistries(s, _addr(issuerPk), _addr(signerPk));
        _deployToken(s, _addr(issuerPk));
        s.issuerIdentity = _onboard(s, _addr(issuerPk), signerPk);
        s.buyerIdentity = address(new Identity(_addr(buyerPk), false));
        payable(_addr(buyerPk)).transfer(BUYER_GAS);
        _stop();

        // The buyer manages its own ONCHAINID, so it adds its KYC claim itself.
        _start(buyerPk);
        (bytes memory sig, bytes memory data) = _claimSignature(signerPk, s.buyerIdentity);
        Identity(s.buyerIdentity).addClaim(KYC_APPROVED, 1, s.claimIssuer, sig, data, "");
        _stop();

        _start(issuerPk);
        IdentityRegistry(s.identityRegistry).registerIdentity(_addr(buyerPk), IIdentity(s.buyerIdentity), COUNTRY);
        Token(s.token).mint(_addr(issuerPk), INVENTORY);
        Token(s.token).unpause();
        _stop();
    }

    function _deployRegistries(Suite memory s, address issuer, address signer) private {
        IdentityRegistryStorage irs = new IdentityRegistryStorage();
        irs.init();
        ClaimTopicsRegistry ctr = new ClaimTopicsRegistry();
        ctr.init();
        ctr.addClaimTopic(KYC_APPROVED);
        TrustedIssuersRegistry tir = new TrustedIssuersRegistry();
        tir.init();

        // Claim issuer whose CLAIM key (purpose 3) is the signer wallet.
        ClaimIssuer claimIssuer = new ClaimIssuer(issuer);
        claimIssuer.addKey(keccak256(abi.encode(signer)), 3, 1);
        uint256[] memory topics = new uint256[](1);
        topics[0] = KYC_APPROVED;
        tir.addTrustedIssuer(IClaimIssuer(address(claimIssuer)), topics);

        IdentityRegistry ir = new IdentityRegistry();
        ir.init(address(tir), address(ctr), address(irs));
        irs.bindIdentityRegistry(address(ir));
        ir.addAgent(issuer);

        s.identityRegistryStorage = address(irs);
        s.claimTopicsRegistry = address(ctr);
        s.trustedIssuersRegistry = address(tir);
        s.claimIssuer = address(claimIssuer);
        s.identityRegistry = address(ir);
    }

    function _deployToken(Suite memory s, address issuer) private {
        // Compliance with no modules: eligibility is enforced by the IdentityRegistry on every transfer.
        ModularCompliance mc = new ModularCompliance();
        mc.init();
        Token token = new Token();
        token.init(s.identityRegistry, address(mc), "Truva Demo Asset", "TDA", 6, address(0));
        token.addAgent(issuer);
        s.compliance = address(mc);
        s.token = address(token);
    }

    /// The issuer's own ONCHAINID with a signed KYC claim, registered so it can hold inventory.
    function _onboard(Suite memory s, address issuer, uint256 signerPk) private returns (address id) {
        Identity identity = new Identity(issuer, false);
        (bytes memory sig, bytes memory data) = _claimSignature(signerPk, address(identity));
        identity.addClaim(KYC_APPROVED, 1, s.claimIssuer, sig, data, "");
        IdentityRegistry(s.identityRegistry).registerIdentity(issuer, IIdentity(address(identity)), COUNTRY);
        id = address(identity);
    }
}
