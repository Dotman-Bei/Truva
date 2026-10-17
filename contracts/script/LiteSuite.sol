// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import {TokenProxy} from "@tokenysolutions/t-rex/contracts/proxy/TokenProxy.sol";
import {IdentityRegistryProxy} from "@tokenysolutions/t-rex/contracts/proxy/IdentityRegistryProxy.sol";
import {IdentityRegistryStorageProxy} from "@tokenysolutions/t-rex/contracts/proxy/IdentityRegistryStorageProxy.sol";
import {ClaimTopicsRegistryProxy} from "@tokenysolutions/t-rex/contracts/proxy/ClaimTopicsRegistryProxy.sol";
import {TrustedIssuersRegistryProxy} from "@tokenysolutions/t-rex/contracts/proxy/TrustedIssuersRegistryProxy.sol";
import {ModularComplianceProxy} from "@tokenysolutions/t-rex/contracts/proxy/ModularComplianceProxy.sol";
import {IdentityProxy} from "@onchain-id/solidity/contracts/proxy/IdentityProxy.sol";
import {IToken} from "@tokenysolutions/t-rex/contracts/token/IToken.sol";
import {IIdentityRegistry} from "@tokenysolutions/t-rex/contracts/registry/interface/IIdentityRegistry.sol";
import {IIdentityRegistryStorage} from "@tokenysolutions/t-rex/contracts/registry/interface/IIdentityRegistryStorage.sol";
import {IIdentity} from "@onchain-id/solidity/contracts/interface/IIdentity.sol";

interface IAgentRole {
    function addAgent(address agent) external;
}

/// @notice Low-gas Truva demo suite: proxies only, pointing at BOT Chain's published T-REX and ONCHAINID
///         implementation authorities on mainnet. No logic contracts are deployed. Eligibility here means
///         "registered by the issuer's agent in the IdentityRegistry" (no required claim topics), which the
///         token enforces on every transfer. The issuer manages the demo identities.
/// @dev    BOT Chain owns those implementation authorities and could upgrade the logic behind these proxies.
abstract contract LiteSuite {
    uint16 internal constant COUNTRY = 702;
    uint256 internal constant INVENTORY = 1_000 * 10 ** 6;
    uint256 internal constant BUYER_GAS = 0.004 ether; // a faucet draw plus one payment at 20 gwei

    struct Lite {
        address token;
        address identityRegistry;
        address identityRegistryStorage;
        address claimTopicsRegistry;
        address trustedIssuersRegistry;
        address compliance;
        address issuerIdentity;
        address buyerIdentity;
    }

    function _deployLite(address trexIA, address idIA, address issuer, address buyer) internal returns (Lite memory s) {
        s.identityRegistryStorage = address(new IdentityRegistryStorageProxy(trexIA));
        s.claimTopicsRegistry = address(new ClaimTopicsRegistryProxy(trexIA));
        s.trustedIssuersRegistry = address(new TrustedIssuersRegistryProxy(trexIA));
        s.identityRegistry = address(
            new IdentityRegistryProxy(trexIA, s.trustedIssuersRegistry, s.claimTopicsRegistry, s.identityRegistryStorage)
        );
        IIdentityRegistryStorage(s.identityRegistryStorage).bindIdentityRegistry(s.identityRegistry);
        IAgentRole(s.identityRegistry).addAgent(issuer);

        s.compliance = address(new ModularComplianceProxy(trexIA));
        s.token = address(new TokenProxy(trexIA, s.identityRegistry, s.compliance, "Truva Demo Asset", "TDA", 6, address(0)));
        IAgentRole(s.token).addAgent(issuer);

        s.issuerIdentity = address(new IdentityProxy(idIA, issuer));
        s.buyerIdentity = address(new IdentityProxy(idIA, issuer));
        IIdentityRegistry(s.identityRegistry).registerIdentity(issuer, IIdentity(s.issuerIdentity), COUNTRY);
        IIdentityRegistry(s.identityRegistry).registerIdentity(buyer, IIdentity(s.buyerIdentity), COUNTRY);

        IToken(s.token).mint(issuer, INVENTORY);
        IToken(s.token).unpause();
        if (buyer.balance < BUYER_GAS) payable(buyer).transfer(BUYER_GAS - buyer.balance);
    }
}
